import { useAuth } from "@/contexts/AuthContext";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { useUnlocks } from "@/hooks/useProgress";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function Index() {
  const { user, student, loading, signIn } = useAuth();
  const { unlocked } = useUnlocks();
  const nav = useNavigate();

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full text-center">
          <div className="overline">3RD GRADE</div>
          <h1 className="section-heading mt-1">Entrepreneurship Check</h1>
          <hr className="gold-rule mt-2 mb-6" />
          <p className="body-text mb-6">
            Sign in with your Google account to start. Your work saves automatically every step of the way.
          </p>
          <Button className="bg-navy text-white hover:bg-navy/90 w-full" onClick={signIn}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="overline">WELCOME{student?.name ? `, ${student.name.toUpperCase()}` : ""}</div>
        <h1 className="section-heading mt-1">Pick a stage to keep going</h1>
        <hr className="gold-rule mt-2 mb-6" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((s) => {
            const isUnlocked = unlocked.includes(s);
            return (
              <button
                key={s}
                disabled={!isUnlocked}
                onClick={() => nav(`/stage/${s}`)}
                className={`p-6 rounded-lg border text-left transition-colors ${
                  isUnlocked ? "bg-white hover:border-gold" : "bg-muted opacity-70"
                }`}
              >
                <div className="overline">STAGE {s}</div>
                <div className="text-[18px] font-bold text-navy mt-1 flex items-center gap-2">
                  {!isUnlocked && <Lock className="w-4 h-4" />}
                  {s === 1 ? "Guide and Planner" : s === 2 ? "Independent Reflection" : "Demonstration"}
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">
                  {isUnlocked
                    ? "Open"
                    : `Complete Stage ${s - 1} and get your guide to sign off first.`}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
