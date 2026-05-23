// Browser text-to-speech using the free, built-in Web Speech API.

type Callbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: () => void;
};

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

// Pick a decent English voice
export function pickVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.startsWith("en"));
  const pool = en.length ? en : voices;
  // Prefer higher-quality "Google"/"Natural" voices when available
  return (
    pool.find((v) => /google/i.test(v.name)) ||
    pool.find((v) => /natural/i.test(v.name)) ||
    pool[0]
  );
}

// Strip markdown so it reads cleanly
function clean(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " (code example shown on screen) ") // skip code blocks
    .replace(/[#*`_>~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(
  text: string,
  cb: Callbacks = {},
  opts: {
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    pitch?: number;
  } = {},
) {
  if (!isSpeechSupported()) return;
  stopSpeaking();

  const u = new SpeechSynthesisUtterance(clean(text));
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  if (opts.voice) u.voice = opts.voice;
  u.onstart = () => cb.onStart?.();
  u.onend = () => cb.onEnd?.();
  u.onboundary = () => cb.onBoundary?.();

  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
