"use client";

import { useEffect, useState } from "react";
import { Target, CheckCircle2, Sparkles } from "lucide-react";

interface Mission {
  id: number;
  mission_type: string;
  target: number;
  progress: number;
  xp_reward: number;
  completed: boolean;
  metadata: { title: string; emoji: string };
}

export default function DailyMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((d) => {
        setMissions(d.missions || []);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  const allDone = missions.length > 0 && missions.every((m) => m.completed);

  return (
    <div className="glass p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold truncate">
            Daily Missions
          </h2>
          {allDone && (
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-gray-400 shrink-0">
          Resets at midnight
        </p>
      </div>

      <div className="space-y-2">
        {missions.map((m) => {
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          return (
            <div
              key={m.id}
              className={`p-2.5 sm:p-3 rounded-xl border ${
                m.completed
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="text-lg sm:text-xl shrink-0">
                  {m.metadata?.emoji || "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {m.metadata?.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-cyan-400 shrink-0">
                      +{m.xp_reward}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          m.completed
                            ? "bg-green-400"
                            : "bg-linear-to-r from-cyan-500 to-violet-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-400 tabular-nums">
                      {m.progress}/{m.target}
                    </span>
                  </div>
                </div>
                {m.completed && (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
