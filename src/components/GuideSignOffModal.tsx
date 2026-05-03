import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GUIDE_PIN } from "@/config";
import { toast } from "sonner";

type Item = string;

export const GuideSignOffModal = ({
  open,
  onOpenChange,
  title,
  intro,
  summary,
  checklist,
  onPass,
  showFail = false,
  onFail,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  title: string;
  intro: string;
  summary: React.ReactNode;
  checklist: Item[];
  onPass: () => void | Promise<void>;
  showFail?: boolean;
  onFail?: () => void | Promise<void>;
}) => {
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false));
  const [pin, setPin] = useState("");

  const allChecked = checks.every(Boolean);

  const submitPass = () => {
    if (!allChecked) {
      toast("Please review all items before signing off.");
      return;
    }
    if (pin !== GUIDE_PIN) {
      toast("That PIN is not right — try again.");
      return;
    }
    onPass();
    setPin("");
    setChecks(checklist.map(() => false));
  };

  const submitFail = () => {
    if (pin !== GUIDE_PIN) {
      toast("That PIN is not right — try again.");
      return;
    }
    onFail?.();
    setPin("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-navy">{title}</DialogTitle>
          <DialogDescription>{intro}</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-secondary text-[13px] space-y-2">{summary}</div>

        <div className="check-box">
          <div className="check-box-title">Guide checklist</div>
          <ul className="space-y-2">
            {checklist.map((it, i) => (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 accent-[hsl(var(--navy))]"
                  checked={checks[i]}
                  onChange={() =>
                    setChecks((c) => {
                      const n = [...c];
                      n[i] = !n[i];
                      return n;
                    })
                  }
                />
                <span className="text-[14px]">{it}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-bold text-navy">Guide PIN</label>
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end">
          {showFail && (
            <Button variant="outline" onClick={submitFail}>
              Fail
            </Button>
          )}
          <Button
            className="bg-navy text-white hover:bg-navy/90"
            onClick={submitPass}
            disabled={!allChecked || pin.length === 0}
          >
            {showFail ? "Pass" : "Sign Off"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
