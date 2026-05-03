import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  u.pitch = 1;
  currentUtterance = u;
  u.onend = () => {
    if (currentUtterance === u) currentUtterance = null;
    onEnd?.();
  };
  u.onerror = () => {
    if (currentUtterance === u) currentUtterance = null;
    onEnd?.();
  };
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

interface Props {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const SpeakButton = ({ text, label, className = "", size = "sm" }: Props) => {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      // don't auto-stop on unmount of the button (page nav handles it)
    };
  }, []);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakText(text, () => setSpeaking(false));
  };

  const supported = typeof window !== "undefined" && !!window.speechSynthesis;
  if (!supported) return null;

  const padding = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2 py-1 text-[11px]";

  return (
    <button
      type="button"
      onClick={onClick}
      title={speaking ? "Stop reading" : "Read aloud"}
      className={`inline-flex items-center gap-1 rounded-md border border-gold/60 bg-white text-navy hover:bg-gold/10 transition-colors ${padding} ${className}`}
    >
      {speaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
      <span className="font-bold uppercase tracking-wide">{label ?? (speaking ? "Stop" : "Listen")}</span>
    </button>
  );
};
