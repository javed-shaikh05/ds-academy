"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  BookOpen,
  Trophy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Calendar,
  AlertTriangle,
  BookOpen,
  Trophy,
};

export default function TodaysPlan() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass p-5 sm:p-6 mb-4 sm:mb-6 flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!data || data.error) return null;

  const totalMinutes = data.plan.reduce(
    (s: number, p: any) => s + Math.round(p.minutes),
    0,
  );

  return (
    <div className="glass p-5 sm:p-6 mb-4 sm:mb-6 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              Today's Plan
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400">
              {data.headline}
            </p>
          </div>
        </div>
        {totalMinutes > 0 && (
          <span className="text-xs text-gray-400 shrink-0 bg-white/5 px-2.5 py-1 rounded-lg">
            ~{totalMinutes} min
          </span>
        )}
      </div>

      {data.plan.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">You're all caught up! 🎉</p>
          <p className="text-xs text-gray-400 mt-1">
            Explore new lessons or take a mock interview.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.plan.map((item: any, i: number) => {
            const Icon = ICONS[item.icon] || BookOpen;
            return (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group"
              >
                <div className="p-2 bg-white/10 rounded-lg shrink-0">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
