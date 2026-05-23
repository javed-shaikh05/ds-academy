"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { showXP } from "@/components/XPToast";

interface MCQ {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function QuizView({
  subtopicId,
  title,
  topicTitle,
}: {
  subtopicId: string;
  title: string;
  topicTitle: string;
}) {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/mcq/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtopicId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setMcqs(d.mcqs || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [subtopicId]);

  const current = mcqs[idx];

  const choose = async (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    const correct = optIdx === current.correct_index;
    if (correct) setScore((s) => s + 1);

    const res = await fetch("/api/mcq/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mcqId: current.id, correct }),
    });
    const data = await res.json();
    if (data.xp_earned) showXP({ xp_earned: data.xp_earned });
  };

  const nextQuestion = () => {
    if (idx + 1 >= mcqs.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
  };

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/practice"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Practice
      </Link>

      <div className="mb-5">
        <p className="text-[10px] sm:text-xs text-gray-400">{topicTitle}</p>
        <h1 className="text-lg sm:text-2xl font-bold">{title} — Quiz</h1>
      </div>

      {loading ? (
        <div className="glass p-8 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mb-3" />
          <p className="text-sm">Generating quiz from your books...</p>
        </div>
      ) : error ? (
        <div className="glass p-6 text-red-400 text-sm">Error: {error}</div>
      ) : done ? (
        <div className="glass p-8 text-center">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {score}/{mcqs.length}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {score === mcqs.length
              ? "Perfect! 🎯"
              : score >= mcqs.length * 0.6
                ? "Good work! 💪"
                : "Keep practicing 📚"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={restart}
              className="glass glass-hover px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <Link
              href="/practice"
              className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm"
            >
              Done
            </Link>
          </div>
        </div>
      ) : current ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
                style={{ width: `${(idx / mcqs.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 tabular-nums">
              {idx + 1}/{mcqs.length}
            </span>
          </div>

          {/* Question */}
          <div className="glass p-5 sm:p-6 mb-4">
            <p className="text-base sm:text-lg font-medium mb-5">
              {current.question}
            </p>
            <div className="space-y-2">
              {current.options.map((opt, i) => {
                const isCorrect = i === current.correct_index;
                const isSelected = i === selected;
                let cls = "bg-white/5 border-white/10 hover:bg-white/10";
                if (answered) {
                  if (isCorrect) cls = "bg-green-500/15 border-green-400/40";
                  else if (isSelected) cls = "bg-red-500/15 border-red-400/40";
                  else cls = "bg-white/5 border-white/10 opacity-50";
                }
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={answered}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border text-sm transition flex items-center justify-between gap-3 ${cls}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    {answered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-300">
                  <span className="text-cyan-400 font-medium">Why: </span>
                  {current.explanation}
                </p>
              </div>
            )}
          </div>

          {answered && (
            <button
              onClick={nextQuestion}
              className="w-full bg-linear-to-r from-cyan-500 to-violet-500 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition"
            >
              {idx + 1 >= mcqs.length ? "See results" : "Next question →"}
            </button>
          )}
        </>
      ) : (
        <div className="glass p-6 text-gray-400 text-sm">
          No questions available.
        </div>
      )}
    </main>
  );
}
