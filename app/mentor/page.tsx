"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MENTORS, MentorId } from "@/lib/ai/personalities";
import {
  Send,
  Loader2,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  Square,
} from "lucide-react";
import { showXP } from "@/components/XPToast";
import MentorAvatar from "@/components/MentorAvatar";
import {
  speak,
  stopSpeaking,
  pickVoice,
  isSpeechSupported,
  getVoices,
} from "@/lib/voice/speech";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ source: string; similarity: number; preview: string }>;
}

// Voice flavor + avatar color per mentor
const VOICE: Record<string, { color: string; rate: number; pitch: number }> = {
  friendly_teacher: { color: "#22d3ee", rate: 1.0, pitch: 1.05 },
  faang_interviewer: { color: "#f472b6", rate: 1.05, pitch: 0.9 },
  strict_professor: { color: "#a78bfa", rate: 0.95, pitch: 0.9 },
  startup_mentor: { color: "#fb923c", rate: 1.1, pitch: 1.0 },
  ml_researcher: { color: "#34d399", rate: 0.98, pitch: 1.0 },
  motivational_coach: { color: "#facc15", rate: 1.12, pitch: 1.1 },
};

export default function MentorPage() {
  const [mentorId, setMentorId] = useState<MentorId>("friendly_teacher");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const mentor = MENTORS[mentorId];
  const voiceCfg = VOICE[mentorId];

  // Load chat history on mount
  useEffect(() => {
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) setMessages(d.messages);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, []);

  // Preload voices (they load async)
  useEffect(() => {
    if (isSpeechSupported()) {
      getVoices();
      window.speechSynthesis.onvoiceschanged = () => getVoices();
    }
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const speakReply = (text: string) => {
    if (!voiceOn) return;
    speak(
      text,
      { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) },
      { voice: pickVoice(), rate: voiceCfg.rate, pitch: voiceCfg.pitch },
    );
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    stopSpeaking();
    setSpeaking(false);
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setPickerOpen(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mentorId,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply, sources: data.sources },
        ]);
        speakReply(data.reply);

        fetch("/api/xp/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "mentor_chat" }),
        })
          .then((r) => r.json())
          .then((xp) => xp.xp_earned && showXP(xp));

        fetch("/api/missions/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionType: "chat_with_mentor" }),
        });
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (voiceOn) {
      stopSpeaking();
      setSpeaking(false);
    }
    setVoiceOn(!voiceOn);
  };

  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        "Voice input isn't supported in this browser. Try Chrome on desktop or Android.",
      );
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setListening(false);
      send(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const clearHistory = async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    await fetch("/api/chat/history", { method: "DELETE" });
    setMessages([]);
  };

  return (
    <main className="flex flex-col h-dvh max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/5 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <h1 className="text-base sm:text-xl font-semibold">AI Mentor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded-lg transition ${voiceOn ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white"}`}
            aria-label="Toggle voice"
            title={voiceOn ? "Voice on" : "Voice off"}
          >
            {voiceOn ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1.5 text-gray-400 hover:text-red-400 transition"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mentor pill with avatar */}
      <div className="px-3 sm:px-4 pt-3 shrink-0">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="glass glass-hover w-full p-3 flex items-center justify-between text-left transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MentorAvatar
              speaking={speaking}
              color={voiceCfg.color}
              size={44}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {mentor.emoji} {mentor.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {mentor.tagline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
            <span className="hidden sm:inline">Switch</span>
            {pickerOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {pickerOpen && (
          <div className="glass mt-2 p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(MENTORS)
              .filter((m) => m.id !== mentorId)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMentorId(m.id);
                    setPickerOpen(false);
                    stopSpeaking();
                    setSpeaking(false);
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2.5 text-left transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {m.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2">
                    {m.tagline}
                  </p>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 min-h-0"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center mt-12 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8 sm:mt-12 px-4">
            <div className="flex justify-center mb-3">
              <MentorAvatar
                speaking={speaking}
                color={voiceCfg.color}
                size={72}
              />
            </div>
            <p className="text-base sm:text-lg mb-1">
              Ask me anything about Data Science
            </p>
            <p className="text-[11px] sm:text-xs">
              {voiceOn
                ? "Voice on — I'll talk back"
                : "Tap the speaker icon to hear me talk"}
            </p>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] ${m.role === "user" ? "order-2" : ""}`}
            >
              <div
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl overflow-hidden ${
                  m.role === "user"
                    ? "bg-linear-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/20"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.content}
                  </p>
                ) : (
                  <div className="text-sm leading-relaxed prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.sources.map((s: any, j: number) => (
                    <span
                      key={j}
                      title={s.preview}
                      className="text-[10px] sm:text-xs bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-2 py-1 rounded-md flex items-center gap-1 cursor-help"
                    >
                      <BookOpen className="w-3 h-3" /> {s.source} ·{" "}
                      {s.similarity}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {mentor.name} is
            thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 sm:px-4 py-3 border-t border-white/5 shrink-0 bg-black/20 backdrop-blur-sm">
        <button
          onClick={listening ? stopListening : startListening}
          className={`px-3 rounded-xl shrink-0 transition ${
            listening
              ? "bg-red-500/20 border border-red-400/40 text-red-300 animate-pulse"
              : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
          }`}
          aria-label="Voice input"
          title="Speak your question"
        >
          {listening ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={listening ? "Listening..." : `Ask ${mentor.name}...`}
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-cyan-400/50 transition"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 sm:px-5 rounded-xl disabled:opacity-50 transition hover:opacity-90 shrink-0"
          aria-label="Send"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </main>
  );
}
