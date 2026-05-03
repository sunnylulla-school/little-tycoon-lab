import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";

let queue: SpeechSynthesisUtterance[] = [];
let activeOnAllEnd: (() => void) | null = null;

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefs = [
    /Google US English/i,
    /Microsoft .* Natural/i,
    /Samantha/i,
    /Google UK English Female/i,
    /Microsoft Aria/i,
    /Microsoft Jenny/i,
    /en-US.*Female/i,
  ];
  for (const re of prefs) {
    const v = voices.find((v) => re.test(v.name));
    if (v) return v;
  }
  return voices.find((v) => v.lang?.startsWith("en")) || voices[0];
}

// Ensure voices are loaded
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function splitIntoChunks(text: string): string[] {
  // Split on sentence-ending punctuation, keep the punctuation with the chunk.
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (parts || [text]).map((s) => s.trim()).filter(Boolean);
}

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  stopSpeaking();
  const voice = pickBestVoice();
  const chunks = splitIntoChunks(text);
  queue = chunks.map((chunk) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "en-US";
    u.rate = 0.92;
    u.pitch = 1.05;
    u.volume = 1;
    if (voice) u.voice = voice;
    return u;
  });
  activeOnAllEnd = onEnd || null;
  let i = 0;
  const speakNext = () => {
    if (i >= queue.length) {
      const cb = activeOnAllEnd;
      activeOnAllEnd = null;
      queue = [];
      cb?.();
      return;
    }
    const u = queue[i++];
    u.onend = () => {
      // small natural gap between sentences
      setTimeout(speakNext, 180);
    };
    u.onerror = () => setTimeout(speakNext, 50);
    window.speechSynthesis.speak(u);
  };
  speakNext();
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  queue = [];
  activeOnAllEnd = null;
}

interface Props {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const SpeakButton = ({ text, label, className = "", size = "sm" }: Props) => {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {}, []);

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
