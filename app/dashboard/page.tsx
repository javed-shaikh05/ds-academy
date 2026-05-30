import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import DailyMissions from "./DailyMissions";
import Link from "next/link";
import TodaysPlan from "./TodaysPlan";
import NotificationSettings from "@/components/NotificationSettings";
import DailyReminderCheck from "@/components/DailyReminderCheck";
import OnboardingModal from "@/components/OnboardingModal";
import {
  BookOpen,
  Brain,
  Code2,
  Trophy,
  Flame,
  Award,
  Zap,
  TrendingUp,
  FileCode,
  FileText,
  Network,
} from "lucide-react";
import { getRank, progressToNextLevel } from "@/lib/gamification/levels";
import { BADGES } from "@/lib/gamification/badges";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const xp = stats?.total_xp || 0;
  const streak = stats?.current_streak || 0;
  const rank = getRank(xp);
  const progress = progressToNextLevel(xp);

  const { count: completedCount } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: totalSubtopics } = await supabase
    .from("subtopics")
    .select("*", { count: "exact", head: true });

  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const today = new Date().toISOString().split("T")[0];
  const { count: reviewsDue } = await supabase
    .from("mcq_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_date", today);

  const earnedIds = new Set(earnedBadges?.map((b) => b.badge_id) || []);
  const recentBadges = BADGES.filter((b) => earnedIds.has(b.id)).slice(0, 4);

  const name = user.email?.split("@")[0] ?? "Learner";

  return (
    <main className="min-h-screen pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8 gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">Welcome back,</p>
            <h1 className="text-xl sm:text-3xl font-bold capitalize truncate">
              {name} <span className="inline-block">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/revision"
              className="glass glass-hover px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
              <span className="hidden sm:inline">Revise</span>
            </Link>
            <Link
              href="/pulse"
              className="glass glass-hover px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
              <span className="hidden sm:inline">Pulse</span>
            </Link>
            <Link
              href="/skilltree"
              className="glass glass-hover px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="hidden sm:inline">Tree</span>
            </Link>
            <Link
              href="/analytics"
              className="glass glass-hover px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
            >
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Personalized plan */}
        <TodaysPlan />

        {/* Rank card */}
        <div className="glass p-4 sm:p-6 mb-4 sm:mb-6 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-3xl sm:text-5xl shrink-0">{rank.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
                Level {rank.level}
              </p>
              <h2 className="text-base sm:text-2xl font-bold gradient-text truncate leading-tight">
                {rank.name}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] sm:text-xs text-gray-400">XP</p>
              <p className="text-base sm:text-2xl font-bold tabular-nums">
                {xp.toLocaleString()}
              </p>
            </div>
          </div>
          {progress.xpNeeded && progress.xpNeeded > 0 ? (
            <>
              <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">
                {progress.xpNeeded} XP to next rank
              </p>
            </>
          ) : (
            <p className="text-xs text-yellow-400">🏆 Max rank achieved!</p>
          )}
        </div>

        {/* Stats — 2x2 always on mobile, 4-wide on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            icon={Flame}
            color="text-orange-400"
            label="Streak"
            value={`${streak}d`}
          />
          <StatCard
            icon={Trophy}
            color="text-yellow-400"
            label="Lessons"
            value={`${completedCount ?? 0}/${totalSubtopics ?? 0}`}
          />
          <StatCard
            icon={Award}
            color="text-violet-400"
            label="Badges"
            value={`${earnedIds.size}/${BADGES.length}`}
          />
          <StatCard
            icon={Zap}
            color="text-cyan-400"
            label="Best"
            value={`${stats?.longest_streak || 0}d`}
          />
        </div>

        {/* Missions */}
        <DailyMissions />

        {/* Quick actions */}
        <h2 className="text-base sm:text-xl font-semibold mb-3 mt-6 sm:mt-8">
          Continue your journey
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
          <ActionCard
            href="/learn"
            icon={BookOpen}
            title="Learn"
            desc="Lessons"
            gradient="from-cyan-500/20"
            ready
          />
          <ActionCard
            href="/mentor"
            icon={Brain}
            title="AI Mentor"
            desc="Ask anything"
            gradient="from-pink-500/20"
            ready
          />
          <ActionCard
            href="/practice"
            icon={Code2}
            title="Practice"
            desc="Quizzes & Python"
            gradient="from-violet-500/20"
            ready
          />
          <ActionCard
            href="/interview"
            icon={Trophy}
            title="Interview"
            desc="Mock FAANG rounds"
            gradient="from-pink-500/20"
            ready
          />
          <ActionCard
            href="/project"
            icon={FileCode}
            title="Project Lab"
            desc="Review & viva"
            gradient="from-green-500/20"
            ready
          />
        </div>

        {/* Recent badges */}
        {recentBadges.length > 0 && (
          <>
            <h2 className="text-base sm:text-xl font-semibold mb-3">
              Recent badges
            </h2>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-6">
              {recentBadges.map((b) => (
                <div key={b.id} className="glass p-3 sm:p-4 text-center">
                  <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-2">
                    {b.emoji}
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">
                    {b.name}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notification settings */}
        <NotificationSettings />
      </div>
      <OnboardingModal />
      <DailyReminderCheck streak={streak} reviewsDue={reviewsDue ?? 0} />
    </main>
  );
}

function StatCard({ icon: Icon, color, label, value }: any) {
  return (
    <div className="glass p-3 sm:p-5">
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color} mb-1.5 sm:mb-2`} />
      <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm sm:text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, desc, gradient, ready }: any) {
  const content = (
    <>
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-2 sm:mb-4" />
      <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">
        {title}
      </h3>
      <p className="text-[11px] sm:text-sm text-gray-400">{desc}</p>
      <p
        className={`text-[10px] sm:text-xs mt-2 sm:mt-3 ${ready ? "text-cyan-400" : "text-gray-500"}`}
      >
        {ready ? "Ready →" : "Coming soon"}
      </p>
    </>
  );

  const baseClasses = `glass p-4 sm:p-6 bg-linear-to-br ${gradient} to-transparent block h-full`;

  if (!ready) {
    return (
      <div className={`${baseClasses} cursor-not-allowed opacity-60`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} glass-hover cursor-pointer transition-all`}
    >
      {content}
    </Link>
  );
}