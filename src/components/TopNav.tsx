import { Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnlocks } from "@/hooks/useProgress";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const TopNav = () => {
  const { student, signOut } = useAuth();
  const { unlocked } = useUnlocks();
  const nav = useNavigate();
  const loc = useLocation();

  const stages = [1, 2, 3];

  const goto = (s: number) => {
    if (unlocked.includes(s)) nav(`/stage/${s}`);
    else toast(`Complete Stage ${s - 1} and get your guide to sign off first.`);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <button onClick={() => nav("/")} className="flex flex-col items-start">
          <span className="overline">3RD GRADE</span>
          <span className="text-[16px] font-bold text-navy leading-tight">Entrepreneurship Check</span>
        </button>
        <nav className="flex gap-2">
          {stages.map((s) => {
            const isUnlocked = unlocked.includes(s);
            const active = loc.pathname.startsWith(`/stage/${s}`);
            return (
              <button
                key={s}
                onClick={() => goto(s)}
                className={`px-3 py-2 rounded-md text-[13px] font-bold transition-colors flex items-center gap-2 ${
                  active
                    ? "bg-navy text-white"
                    : isUnlocked
                    ? "text-navy hover:bg-secondary"
                    : "text-navy/50 cursor-not-allowed"
                }`}
              >
                {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
                Stage {s}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground hidden sm:block">{student?.name}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};
