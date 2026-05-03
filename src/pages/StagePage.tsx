import { useParams, Navigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { StageWorkbook } from "@/components/workbook/StageWorkbook";
import { useUnlocks } from "@/hooks/useProgress";

export default function StagePage() {
  const { stage } = useParams();
  const s = parseInt(stage || "1", 10) as 1 | 2 | 3;
  const { unlocked, loaded } = useUnlocks();

  if (!loaded) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (![1, 2, 3].includes(s)) return <Navigate to="/" replace />;
  if (!unlocked.includes(s)) return <Navigate to="/" replace />;

  return (
    <>
      <TopNav />
      <StageWorkbook stage={s} mode={s === 1 ? "guided" : "blank"} />
    </>
  );
}
