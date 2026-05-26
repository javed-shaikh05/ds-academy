"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Database,
  BarChart3,
  Brain,
  Zap,
  Network,
  Rocket,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Sparkles,
  Database,
  BarChart3,
  Brain,
  Zap,
  Network,
  Rocket,
};

const PHASE_COLORS: Record<
  string,
  { ring: string; glow: string; text: string }
> = {
  cyan: {
    ring: "border-cyan-400/50",
    glow: "shadow-cyan-500/20",
    text: "text-cyan-400",
  },
  violet: {
    ring: "border-violet-400/50",
    glow: "shadow-violet-500/20",
    text: "text-violet-400",
  },
  pink: {
    ring: "border-pink-400/50",
    glow: "shadow-pink-500/20",
    text: "text-pink-400",
  },
  green: {
    ring: "border-green-400/50",
    glow: "shadow-green-500/20",
    text: "text-green-400",
  },
  yellow: {
    ring: "border-yellow-400/50",
    glow: "shadow-yellow-500/20",
    text: "text-yellow-400",
  },
  orange: {
    ring: "border-orange-400/50",
    glow: "shadow-orange-500/20",
    text: "text-orange-400",
  },
  red: {
    ring: "border-red-400/50",
    glow: "shadow-red-500/20",
    text: "text-red-400",
  },
};

export default function SkillTreeView() {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skilltree")
      .then((r) => r.json())
      .then((d) => {
        setTree(d.tree || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-1.5">Skill Tree</h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6">
        Your path from beginner to expert. Phases unlock as you progress.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Done
        </span>
        <span className="flex items-center gap-1">
          <PlayCircle className="w-3.5 h-3.5 text-cyan-400" /> In progress
        </span>
        <span className="flex items-center gap-1">
          <Circle className="w-3.5 h-3.5 text-gray-500" /> Not started
        </span>
        <span className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-gray-600" /> Locked
        </span>
      </div>

      {/* Tree */}
      <div className="relative">
        {tree.map((phase, pi) => {
          const Icon = ICONS[phase.icon] || Sparkles;
          const colors = PHASE_COLORS[phase.color] || PHASE_COLORS.cyan;
          const isLocked = !phase.unlocked;

          return (
            <div key={phase.id} className="relative">
              {/* Connector line to next phase */}
              {pi < tree.length - 1 && (
                <div className="absolute left-6 sm:left-7 top-14 bottom-0 w-0.5 bg-linear-to-b from-white/20 to-white/5" />
              )}

              {/* Phase node */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4 relative">
                <div
                  className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-lg ${
                    isLocked
                      ? "bg-white/5 border-white/10"
                      : `bg-white/10 ${colors.ring} ${colors.glow}`
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Phase {phase.order}
                      </p>
                      <h2
                        className={`text-base sm:text-lg font-bold truncate ${isLocked ? "text-gray-500" : ""}`}
                      >
                        {phase.title}
                      </h2>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ${isLocked ? "text-gray-600" : colors.text}`}
                    >
                      {phase.pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  {!isLocked && (
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5 mb-3">
                      <div
                        className={`h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all`}
                        style={{ width: `${phase.pct}%` }}
                      />
                    </div>
                  )}

                  {isLocked ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Complete 60% of the previous phase to unlock
                    </p>
                  ) : (
                    /* Subtopic nodes grouped by topic */
                    <div className="space-y-3 mt-2">
                      {phase.topics.map((topic: any) => (
                        <div key={topic.id}>
                          <p className="text-[11px] sm:text-xs font-medium text-gray-400 mb-1.5">
                            {topic.title}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {topic.subtopics.map((sub: any) => {
                              const StatusIcon =
                                sub.status === "completed"
                                  ? CheckCircle2
                                  : sub.status === "in_progress"
                                    ? PlayCircle
                                    : Circle;
                              const statusColor =
                                sub.status === "completed"
                                  ? "text-green-400 border-green-400/30 bg-green-500/5"
                                  : sub.status === "in_progress"
                                    ? "text-cyan-400 border-cyan-400/30 bg-cyan-500/5"
                                    : "text-gray-400 border-white/10 bg-white/5";
                              return (
                                <Link
                                  key={sub.id}
                                  href={`/learn/${sub.id}`}
                                  title={sub.title}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs transition hover:scale-105 hover:bg-white/10 ${statusColor}`}
                                >
                                  <StatusIcon className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                    {sub.title}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
