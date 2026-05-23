"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { showXP } from "@/components/XPToast";
import InlineQuiz from '@/components/InlineQuiz'
import MiniPlayground from '@/components/MiniPlayground'
import { Dumbbell } from 'lucide-react'

interface Props {
  subtopic: any;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  initialStatus: string;
}

export default function LessonView({
  subtopic,
  prev,
  next,
  initialStatus,
}: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [exercise, setExercise] = useState('')
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(initialStatus);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (status === "not_started") {
      updateProgress("in_progress", false);
    }
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtopic.id]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicId: subtopic.id }),
      });
      const data = await res.json();
      if (data.error) {
        setContent(`Error: ${data.error}`);
      } else {
        setContent(data.content)
setSources(data.sources || [])
setExercise(data.exercise || '')
      }
    } catch (err: any) {
      setContent(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newStatus: string, awardXp = true) => {
    setMarking(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicId: subtopic.id, status: newStatus }),
      });
      setStatus(newStatus);

      if (newStatus === "completed" && awardXp) {
        const xpRes = await fetch("/api/xp/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "lesson_complete",
            metadata: { subtopic_id: subtopic.id },
          }),
        });
        const xpData = await xpRes.json();
        if (xpData.xp_earned) showXP(xpData);

        fetch("/api/missions/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionType: "complete_lessons" }),
        });
      }
    } finally {
      setMarking(false);
    }
  };

  const difficulty = subtopic.difficulty || "beginner";
  const diffColor =
    difficulty === "beginner"
      ? "text-green-400 bg-green-500/10 border-green-500/20"
      : difficulty === "intermediate"
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        : "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <main className="min-h-screen w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 min-w-0">
      <Link
        href="/learn"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All Lessons
      </Link>

      {/* Header */}
      <div className="mb-4 sm:mb-8 px-1">
        <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
          {subtopic.topics?.phases?.title} → {subtopic.topics?.title}
        </p>
        <h1 className="text-lg sm:text-3xl font-bold mb-2 sm:mb-3 leading-tight">
          {subtopic.title}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-md border ${diffColor}`}
          >
            {difficulty}
          </span>
          {sources.length > 0 && !loading && (
            <span className="text-[10px] sm:text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {sources.length} sources
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="glass p-4 sm:p-8 mb-4 sm:mb-6 overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 sm:py-12 text-gray-400">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
            <span className="text-xs sm:text-sm">Loading lesson...</span>
          </div>
        ) : content ? (
          <div className="prose-chat text-sm sm:text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : null}
      </div>

      {/* PRACTICE SECTION */}
{!loading && content && (
  <div className="mb-4 sm:mb-6">
    <div className="flex items-center gap-2 mb-3 px-1">
      <Dumbbell className="w-5 h-5 text-cyan-400" />
      <h2 className="text-base sm:text-lg font-semibold">Practice what you learned</h2>
    </div>

    <div className="space-y-3">
      {/* Inline quiz — always available */}
      <InlineQuiz subtopicId={subtopic.id} />

      {/* Python exercise — only if the topic generated one */}
      {exercise && <MiniPlayground starterCode={exercise} />}
    </div>
  </div>
)}

      {/* Mark complete */}
      {!loading && content && (
        <div className="glass p-3 sm:p-5 mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {status === "completed" ? (
              <>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                <span className="text-xs sm:text-sm">Completed</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">
                  Finished reading?
                </span>
              </>
            )}
          </div>
          <button
            onClick={() =>
              updateProgress(
                status === "completed" ? "in_progress" : "completed",
              )
            }
            disabled={marking}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50 ${
              status === "completed"
                ? "bg-white/5 hover:bg-white/10 border border-white/10"
                : "bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90"
            }`}
          >
            {marking
              ? "..."
              : status === "completed"
                ? "Mark incomplete"
                : "Mark complete"}
          </button>
        </div>
      )}

      {/* Prev / Next */}
      <div className="flex gap-2 sm:gap-3">
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="glass glass-hover p-2.5 sm:p-4 flex-1 min-w-0 transition"
          >
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
              ← Previous
            </p>
            <p className="text-xs sm:text-sm font-medium truncate">
              {prev.title}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next && (
          <Link
            href={`/learn/${next.id}`}
            className="glass glass-hover p-2.5 sm:p-4 flex-1 min-w-0 text-right transition"
          >
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
              Next →
            </p>
            <p className="text-xs sm:text-sm font-medium truncate">
              {next.title}
            </p>
          </Link>
        )}
      </div>
    </main>
  );
}
