"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  Send,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Trophy,
  CheckCircle2,
  AlertCircle,
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

interface Entry {
  type: "question" | "answer" | "feedback";
  content: string;
  score?: number;
}

export default function SessionView({ track }: { track: string }) {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNum, setQuestionNum] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Start interview on mount
  useEffect(() => {
    if (isSpeechSupported()) getVoices();
    startInterview();
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries, report]);

  const maybeSpeak = (text: string) => {
    if (!voiceOn) return;
    speak(
      text,
      { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) },
      { voice: pickVoice(), rate: 1.0, pitch: 0.92 },
    );
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", track, difficulty: "medium" }),
      });
      const data = await res.json();
      if (data.error) {
        setEntries([{ type: "feedback", content: `Error: ${data.error}` }]);
        return;
      }
      setInterviewId(data.interviewId);
      setCurrentQuestion(data.question);
      setQuestionNum(data.questionNumber);
      setEntries([{ type: "question", content: data.question }]);
      maybeSpeak(data.question);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    stopSpeaking();
    setSpeaking(false);
    const myAnswer = answer.trim();
    setEntries((e) => [...e, { type: "answer", content: myAnswer }]);
    setAnswer("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          interviewId,
          answer: myAnswer,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setEntries((e) => [
          ...e,
          { type: "feedback", content: `Error: ${data.error}` },
        ]);
        return;
      }

      setEntries((e) => [
        ...e,
        { type: "feedback", content: data.feedback, score: data.score },
      ]);

      if (data.isLast) {
        // small delay so the last feedback renders before report
        setTimeout(() => finishInterview(), 600);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setQuestionNum(data.questionNumber);
        setEntries((e) => [
          ...e,
          { type: "question", content: data.nextQuestion },
        ]);
        maybeSpeak(data.nextQuestion);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const finishInterview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", interviewId }),
      });
      const data = await res.json();
      if (data.error) {
        setEntries((e) => [
          ...e,
          {
            type: "feedback",
            content: `Report failed: ${data.error}. Tap "New interview" to retry.`,
          },
        ]);
      } else {
        setReport(data);
        setFinished(true);
        showXP({ xp_earned: 100 });
      }
    } catch (err: any) {
      setEntries((e) => [
        ...e,
        { type: "feedback", content: `Report error: ${err.message}` },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input needs Chrome desktop or Android.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = true;
    let transcript = "";
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal)
          transcript += e.results[i][0].transcript + " ";
      }
      setAnswer(transcript.trim());
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

  const verdictColor = (v: string) =>
    v?.includes("Strong")
      ? "text-green-400"
      : v?.includes("No")
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <main className="flex flex-col h-dvh max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/5 shrink-0">
        <Link
          href="/interview"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </Link>
        <h1 className="text-sm sm:text-lg font-semibold capitalize">
          {track.replace("_", " ")} Interview
        </h1>
        <button
          onClick={() => {
            if (voiceOn) {
              stopSpeaking();
              setSpeaking(false);
              setVoiceOn(false);
            } else {
              setVoiceOn(true);
              // Re-speak the current unanswered question
              if (currentQuestion) maybeSpeak(currentQuestion);
            }
          }}
          className={`p-1.5 rounded-lg transition ${voiceOn ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400"}`}
          aria-label="Toggle voice"
        >
          {voiceOn ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Progress */}
      {!finished && (
        <div className="px-3 sm:px-4 pt-3 shrink-0">
          <div className="flex items-center gap-2">
            <MentorAvatar speaking={speaking} color="#f472b6" size={36} />
            <div className="flex-1">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-pink-500 to-violet-500 transition-all"
                  style={{
                    width: `${Math.min(100, ((questionNum - 1) / 5) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              Q{Math.min(questionNum, 5)}/5
            </span>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 min-h-0"
      >
        {loading ? (
          <div className="flex items-center justify-center mt-12 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Interviewer is
            preparing...
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={i}>
              {e.type === "question" && (
                <div className="bg-pink-500/10 border border-pink-400/20 rounded-2xl px-4 py-3">
                  <p className="text-[10px] text-pink-300 uppercase tracking-wider mb-1">
                    Interviewer
                  </p>
                  <div className="prose-chat text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {e.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              {e.type === "answer" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 ml-6">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    You
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{e.content}</p>
                </div>
              )}
              {e.type === "feedback" && (
                <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-cyan-300 uppercase tracking-wider">
                      Feedback
                    </p>
                    {e.score !== undefined && (
                      <span
                        className={`text-xs font-bold ${e.score >= 7 ? "text-green-400" : e.score >= 4 ? "text-yellow-400" : "text-red-400"}`}
                      >
                        {e.score}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">{e.content}</p>
                </div>
              )}
            </div>
          ))
        )}

        {submitting && !finished && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
          </div>
        )}

        {/* Final report */}
        {finished && report && (
          <div className="glass p-5 sm:p-6 mt-2">
            <div className="text-center mb-5">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-3xl font-bold">
                {report.overall_score}
                <span className="text-base text-gray-400">/100</span>
              </p>
              <p
                className={`text-sm font-semibold mt-1 ${verdictColor(report.summary?.hire_verdict)}`}
              >
                {report.summary?.hire_verdict}
              </p>
            </div>

            {report.summary?.strengths?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strengths
                </p>
                <ul className="space-y-1">
                  {report.summary.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 pl-4">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.summary?.weaknesses?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> To improve
                </p>
                <ul className="space-y-1">
                  {report.summary.weaknesses.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 pl-4">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.summary?.advice && (
              <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-300">
                  <span className="text-cyan-400 font-medium">Advice: </span>
                  {report.summary.advice}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/interview"
                className="glass glass-hover px-4 py-2 rounded-xl text-sm flex-1 text-center"
              >
                New interview
              </Link>
              <Link
                href="/dashboard"
                className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm flex-1 text-center"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Answer input */}
      {!finished && !loading && (
        <div className="px-3 sm:px-4 py-3 border-t border-white/5 shrink-0 bg-black/20 backdrop-blur-sm">
          <div className="flex gap-2 items-end">
            <button
              onClick={listening ? stopListening : startListening}
              className={`px-3 py-2.5 rounded-xl shrink-0 transition ${
                listening
                  ? "bg-red-500/20 border border-red-400/40 text-red-300 animate-pulse"
                  : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
              }`}
              aria-label="Voice answer"
            >
              {listening ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              placeholder={
                listening
                  ? "Listening... speak your answer"
                  : "Type or speak your answer..."
              }
              rows={2}
              disabled={submitting}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 transition resize-none"
            />
            <button
              onClick={submitAnswer}
              disabled={submitting || !answer.trim()}
              className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2.5 rounded-xl disabled:opacity-50 transition hover:opacity-90 shrink-0"
              aria-label="Submit answer"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
