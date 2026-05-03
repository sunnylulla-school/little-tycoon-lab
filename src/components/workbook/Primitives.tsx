import { ReactNode, useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

export const Overline = ({ children }: { children: ReactNode }) => (
  <div className="overline">{children}</div>
);

export const SectionHeading = ({ children }: { children: ReactNode }) => (
  <>
    <h2 className="section-heading mt-1">{children}</h2>
    <hr className="gold-rule mt-2 mb-4" />
  </>
);

export const ActivityHeading = ({ children }: { children: ReactNode }) => (
  <div className="mt-6">
    <div className="activity-heading">{children}</div>
    <hr className="gold-rule mt-1 mb-4" />
  </div>
);

export const StepBar = ({ step, title }: { step: number; title: string }) => (
  <div className="step-bar rounded-md mb-6">
    <span className="step-badge">STEP / {step}</span>
    <span className="step-title">{title}</span>
  </div>
);

export const SidebarBox = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="sidebar-box my-4">
    <div className="sidebar-box-title">{title}</div>
    <div className="text-[14px] leading-relaxed text-[#222]">{children}</div>
  </div>
);

export const ExampleBox = ({
  label,
  name,
  children,
  defaultOpen = true,
}: {
  label: string;
  name: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="example-box my-4">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="w-4 h-4 text-gold" /> : <ChevronRight className="w-4 h-4 text-gold" />}
        <span className="example-label">{label}</span>
      </button>
      {open && (
        <div className="mt-3">
          <div className="example-name mb-1">{name}</div>
          <div className="example-content">{children}</div>
        </div>
      )}
    </div>
  );
};

export const NowYouTry = () => (
  <div className="now-you-try mt-6 mb-2">NOW YOU TRY IT.</div>
);

export const FieldCheck = ({ ok }: { ok: boolean }) =>
  ok ? <Check className="w-4 h-4 text-[hsl(var(--success))] inline ml-2" /> : null;

export const CheckBox = ({
  title = "Check before moving on",
  items,
  checked,
  onToggle,
}: {
  title?: string;
  items: string[];
  checked: boolean[];
  onToggle: (i: number) => void;
}) => (
  <div className="check-box my-6">
    <div className="check-box-title">{title}</div>
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 accent-[hsl(var(--navy))]"
            checked={checked[i] || false}
            onChange={() => onToggle(i)}
          />
          <span className="text-[14px]">{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const MathRow = ({ label, value, result }: { label: string; value: string; result?: boolean }) => (
  <div className={`math-row ${result ? "math-row-result rounded-md" : ""}`}>
    <span>{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);
