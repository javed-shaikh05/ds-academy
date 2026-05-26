"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Send,
  MessageSquare,
  FileCode,
  FileText,
} from "lucide-react";
import { showXP } from "@/components/XPToast";

export default function ProjectView() {
  const [stage, setStage] = useState<"input" | "review" | "viva">("input");
  const [title, setTitle] = useState("");
  const [inputType, setInputType] = useState<"code" | "description">("code");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  // Viva state
  const [vivaEntries, setVivaEntries] = useState<
    { type: string; content: string }[]
  >([]);
  const [vivaQuestion, setVivaQuestion] = useState("");
  const [vivaAnswer, setVivaAnswer] = useState("");
  const [vivaLoading, setVivaLoading] = useState(false);
  const [vivaDone, setVivaDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [vivaEntries]);

  const submitReview = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", title, inputType, content }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setReview(data.review);
      setReviewId(data.reviewId);
      setStage("review");
      showXP({ xp_earned: 60 });
    } finally {
      setLoading(false);
    }
  };

  const startViva = async () => {
    setStage("viva");
    setVivaLoading(true);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "viva_start", reviewId }),
      });
      const data = await res.json();
      setVivaQuestion(data.question);
      setVivaEntries([{ type: "question", content: data.question }]);
    } finally {
      setVivaLoading(false);
    }
  };

  const submitVivaAnswer = async () => {
    if (!vivaAnswer.trim() || vivaLoading) return;
    const myAnswer = vivaAnswer.trim();
    setVivaEntries((e) => [...e, { type: "answer", content: myAnswer }]);
    setVivaAnswer("");
    setVivaLoading(true);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "viva_answer",
          reviewId,
          answer: myAnswer,
        }),
      });
      const data = await res.json();
      setVivaEntries((e) => [
        ...e,
        { type: "feedback", content: data.feedback },
      ]);
      if (data.isLast) {
        setVivaDone(true);
      } else {
        setVivaQuestion(data.nextQuestion);
        setVivaEntries((e) => [
          ...e,
          { type: "question", content: data.nextQuestion },
        ]);
      }
    } finally {
      setVivaLoading(false);
    }
  };

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-1.5">
        Project Review & Viva
      </h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6">
        Get senior-level feedback on your code or project, then defend it in a
        viva.
      </p>

      {/* INPUT STAGE */}
      {stage === "input" && (
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title (e.g. Fraud Detection Model)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setInputType("code")}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm transition ${
                inputType === "code"
                  ? "bg-cyan-500/15 border-cyan-400/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <FileCode className="w-4 h-4" /> Code
            </button>
            <button
              onClick={() => setInputType("description")}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm transition ${
                inputType === "description"
                  ? "bg-cyan-500/15 border-cyan-400/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <FileText className="w-4 h-4" /> Description
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              inputType === "code"
                ? "Paste your Python/SQL code here..."
                : "Describe your project: problem, data, approach, model, results..."
            }
            rows={12}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-400/50 resize-y"
          />

          <button
            onClick={submitReview}
            disabled={loading || !content.trim()}
            className="w-full bg-linear-to-r from-cyan-500 to-violet-500 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Reviewing..." : "Review my project"}
          </button>
        </div>
      )}

      {/* REVIEW STAGE */}
      {stage === "review" && review && (
        <div className="space-y-4">
          {/* Score */}
          <div className="glass p-5 text-center bg-linear-to-br from-cyan-500/10 to-violet-500/10">
            <p className="text-4xl font-bold mb-1">
              {review.score}
              <span className="text-base text-gray-400">/100</span>
            </p>
            <p className="text-sm text-gray-400">{title || "Your project"}</p>
          </div>

          {review.strengths?.length > 0 && (
            <div className="glass p-4">
              <p className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Strengths
              </p>
              <ul className="space-y-1">
                {review.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.issues?.length > 0 && (
            <div className="glass p-4">
              <p className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Issues
              </p>
              <ul className="space-y-1">
                {review.issues.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.suggestions?.length > 0 && (
            <div className="glass p-4">
              <p className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Suggestions
              </p>
              <ul className="space-y-1">
                {review.suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.interview_angle && (
            <div className="glass p-4 bg-pink-500/5 border border-pink-400/20">
              <p className="text-xs text-pink-300 uppercase tracking-wider mb-1">
                Interview angle
              </p>
              <p className="text-sm text-gray-300">{review.interview_angle}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStage("input");
                setContent("");
                setReview(null);
              }}
              className="glass glass-hover px-4 py-3 rounded-xl text-sm flex-1"
            >
              Review another
            </button>
            <button
              onClick={startViva}
              className="bg-linear-to-r from-pink-500 to-violet-500 px-4 py-3 rounded-xl text-sm flex-1 flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <MessageSquare className="w-4 h-4" /> Start Viva
            </button>
          </div>
        </div>
      )}

      {/* VIVA STAGE */}
      {stage === "viva" && (
        <div>
          <div
            ref={scrollRef}
            className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto"
          >
            {vivaEntries.map((e, i) => (
              <div key={i}>
                {e.type === "question" && (
                  <div className="bg-pink-500/10 border border-pink-400/20 rounded-2xl px-4 py-3">
                    <p className="text-[10px] text-pink-300 uppercase tracking-wider mb-1">
                      Examiner
                    </p>
                    <p className="text-sm">{e.content}</p>
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
                    <p className="text-[10px] text-cyan-300 uppercase tracking-wider mb-1">
                      Feedback
                    </p>
                    <p className="text-sm text-gray-300">{e.content}</p>
                  </div>
                )}
              </div>
            ))}
            {vivaLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            )}
          </div>

          {vivaDone ? (
            <div className="glass p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="font-semibold mb-1">Viva complete! 🎓</p>
              <p className="text-sm text-gray-400 mb-4">
                You defended your project. Review the feedback above.
              </p>
              <Link
                href="/dashboard"
                className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm inline-block"
              >
                Done
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={vivaAnswer}
                onChange={(e) => setVivaAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitVivaAnswer();
                  }
                }}
                placeholder="Your answer..."
                rows={2}
                disabled={vivaLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 resize-none"
              />
              <button
                onClick={submitVivaAnswer}
                disabled={vivaLoading || !vivaAnswer.trim()}
                className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 rounded-xl disabled:opacity-50 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
