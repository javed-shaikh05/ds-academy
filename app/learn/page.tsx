import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
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

const COLOR_MAP: Record<string, string> = {
  cyan: "from-cyan-500/20 border-cyan-400/30",
  violet: "from-violet-500/20 border-violet-400/30",
  pink: "from-pink-500/20 border-pink-400/30",
  green: "from-green-500/20 border-green-400/30",
  yellow: "from-yellow-500/20 border-yellow-400/30",
  orange: "from-orange-500/20 border-orange-400/30",
  red: "from-red-500/20 border-red-400/30",
};

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: phases } = await supabase
    .from("phases")
    .select("*, topics(*, subtopics(*))")
    .order("order_index");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("subtopic_id, status")
    .eq("user_id", user.id);

  const progressMap = new Map(
    progress?.map((p) => [p.subtopic_id, p.status]) || [],
  );

  phases?.forEach((phase: any) => {
    phase.topics.sort((a: any, b: any) => a.order_index - b.order_index);
    phase.topics.forEach((t: any) =>
      t.subtopics.sort((a: any, b: any) => a.order_index - b.order_index),
    );
  });

  const totalSubtopics =
    phases?.reduce(
      (sum: number, p: any) =>
        sum + p.topics.reduce((s: number, t: any) => s + t.subtopics.length, 0),
      0,
    ) || 0;
  const completedCount = Array.from(progressMap.values()).filter(
    (s) => s === "completed",
  ).length;
  const progressPct =
    totalSubtopics > 0
      ? Math.round((completedCount / totalSubtopics) * 100)
      : 0;

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      {/* Overview */}
      <div className="glass p-4 sm:p-6 mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold mb-1.5 sm:mb-2">
          Your Learning Path
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
          7 phases · {totalSubtopics} lessons · From Python basics to
          Transformers
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-medium tabular-nums shrink-0">
            {completedCount}/{totalSubtopics}
          </span>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4 sm:space-y-6">
        {phases?.map((phase: any) => {
          const Icon = ICONS[phase.icon] || Sparkles;
          const phaseSubtopics = phase.topics.flatMap((t: any) => t.subtopics);
          const phaseCompleted = phaseSubtopics.filter(
            (s: any) => progressMap.get(s.id) === "completed",
          ).length;
          const phaseTotal = phaseSubtopics.length;
          const phasePct =
            phaseTotal > 0
              ? Math.round((phaseCompleted / phaseTotal) * 100)
              : 0;

          return (
            <div
              key={phase.id}
              className={`glass bg-linear-to-br ${COLOR_MAP[phase.color] || ""} to-transparent p-4 sm:p-6`}
            >
              <div className="flex items-start gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-white/10 rounded-xl shrink-0">
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                    Phase {phase.order_index}
                  </p>
                  <h2 className="text-base sm:text-xl font-bold leading-tight">
                    {phase.title}
                  </h2>
                  <p className="text-[11px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1 line-clamp-2">
                    {phase.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    Progress
                  </p>
                  <p className="text-sm sm:text-base font-semibold">
                    {phasePct}%
                  </p>
                </div>
              </div>

              {/* Phase progress bar */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4 sm:mb-5">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
                  style={{ width: `${phasePct}%` }}
                />
              </div>

              {/* Topics */}
              <div className="space-y-3 sm:space-y-4">
                {phase.topics.map((topic: any) => (
                  <div key={topic.id}>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 px-0.5">
                      {topic.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                      {topic.subtopics.map((sub: any) => {
                        const status = progressMap.get(sub.id) || "not_started";
                        return (
                          <Link
                            key={sub.id}
                            href={`/learn/${sub.id}`}
                            className="glass glass-hover p-2.5 sm:p-3 flex items-center gap-2 text-xs sm:text-sm transition group"
                          >
                            {status === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : status === "in_progress" ? (
                              <PlayCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-500 shrink-0" />
                            )}
                            <span className="truncate group-hover:text-white">
                              {sub.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
