import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Session, User } from "@supabase/supabase-js";

type Student = { id: string; user_id: string; name: string | null; email: string | null; google_id: string | null };

type AuthCtx = {
  session: Session | null;
  user: User | null;
  student: Student | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) setTimeout(() => ensureStudent(s.user), 0);
      else setStudent(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) ensureStudent(data.session.user).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function ensureStudent(user: User) {
    const meta: any = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email || "Student";
    const email = user.email || meta.email || null;
    const google_id = meta.sub || meta.provider_id || user.id;

    const { data: existing } = await supabase.from("students").select("*").eq("user_id", user.id).maybeSingle();
    if (existing) {
      setStudent(existing as Student);
      return;
    }
    const { data: inserted } = await supabase
      .from("students")
      .insert({ user_id: user.id, name, email, google_id })
      .select()
      .single();
    if (inserted) setStudent(inserted as Student);
  }

  const signIn = async () => {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setStudent(null);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, student, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
