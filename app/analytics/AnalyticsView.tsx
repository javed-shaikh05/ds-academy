"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
} from "lucide-react";

interface SkillPhase {
  phase: string;
  completed: number;
  total: number;
  pct: number;
}

interface WeakTopic {
  title: string;
  accuracy: number;
}

interface AnalyticsData {
  xpByDay: Record<string, number>;
  readiness: number;
  stats: {
    lessonsCompleted: number;
    totalLessons: number;
    interviewsTaken: number;
    avgInterviewScore: number;
  };
  skillGraph: SkillPhase[];
  weakTopics: WeakTopic[];
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
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

  if (!data) {
    return (
      <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-400 text-sm">Could not load analytics.</p>
      </main>
    );
  }

  const xpDays = Object.entries(data.xpByDay) as [string, number][];
  const maxXp = Math.max(...xpDays.map(([, v]) => v), 1);

  const readinessColor =
    data.readiness >= 70
      ? "text-green-400"
      : data.readiness >= 40
        ? "text-yellow-400"
        : "text-orange-400";

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-6">Your Analytics</h1>

      {/* Interview readiness — hero metric */}
      <div className="glass p-5 sm:p-6 mb-4 sm:mb-6 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold">Interview Readiness</h2>
        </div>
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-4xl sm:text-5xl font-bold ${readinessColor}`}>
            {data.readiness}
          </span>
          <span className="text-gray-400 mb-1.5">/ 100</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
            style={{ width: `${data.readiness}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Based on lessons completed, quiz accuracy & interview scores
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1">
            Lessons done
          </p>
          <p className="text-lg sm:text-2xl font-bold">
            {data.stats.lessonsCompleted}/{data.stats.totalLessons}
          </p>
        </div>
        <div className="glass p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1">
            Interviews
          </p>
          <p className="text-lg sm:text-2xl font-bold">
            {data.stats.interviewsTaken}
          </p>
        </div>
        <div className="glass p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1">
            Avg interview
          </p>
          <p className="text-lg sm:text-2xl font-bold">
            {data.stats.avgInterviewScore}
          </p>
        </div>
        <div className="glass p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1">14-day XP</p>
          <p className="text-lg sm:text-2xl font-bold">
            {xpDays.reduce((s, [, v]) => s + v, 0)}
          </p>
        </div>
      </div>

      {/* XP chart */}
      <div className="glass p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold">XP — Last 14 days</h2>
        </div>
        <div className="flex items-end justify-between gap-1 h-32">
          {xpDays.map(([day, xp]) => (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div
                className="w-full bg-linear-to-t from-cyan-500 to-violet-500 rounded-t transition-all hover:opacity-80 relative"
                style={{
                  height: `${(xp / maxXp) * 100}%`,
                  minHeight: xp > 0 ? "4px" : "0",
                }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {xp}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-500">
                {day.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill graph */}
      <div className="glass p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-violet-400" />
          <h2 className="font-semibold">Skill Progress by Phase</h2>
        </div>
        <div className="space-y-3">
          {data.skillGraph.map((s) => (
            <div key={s.phase}>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-300 truncate">{s.phase}</span>
                <span className="text-gray-400 tabular-nums shrink-0 ml-2">
                  {s.completed}/{s.total}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak topics */}
      <div className="glass p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h2 className="font-semibold">Topics to Strengthen</h2>
        </div>
        {data.weakTopics.length === 0 ? (
          <p className="text-sm text-gray-400">
            Take some quizzes to see which topics need work.
          </p>
        ) : (
          <div className="space-y-2">
            {data.weakTopics.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300 truncate">
                  {t.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.accuracy >= 60 ? "bg-green-400" : t.accuracy >= 40 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums w-9 text-right">
                    {t.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
