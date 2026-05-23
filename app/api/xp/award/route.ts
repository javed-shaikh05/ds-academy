import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRank, XP_REWARDS } from "@/lib/gamification/levels";
import { BADGES } from "@/lib/gamification/badges";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reason, metadata } = await req.json();
    const amount = XP_REWARDS[reason as keyof typeof XP_REWARDS];

    if (!amount) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    // 1. Log the XP event
    await supabase.from("xp_events").insert({
      user_id: user.id,
      amount,
      reason,
      metadata,
    });

    // 2. Get current stats (or create if first time)
    let { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!stats) {
      await supabase.from("user_stats").insert({ user_id: user.id });
      stats = {
        user_id: user.id,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        level: 1,
        rank_name: "Beginner",
      } as any;
    }

    // 3. Streak logic
    const today = new Date().toISOString().split("T")[0];
    const lastActive = stats!.last_active_date;
    let newStreak = stats!.current_streak;
    let streakBonus = 0;

    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      if (lastActive === yesterday) {
        newStreak = stats!.current_streak + 1;
        streakBonus = XP_REWARDS.streak_day;
        if (newStreak % 7 === 0) streakBonus += XP_REWARDS.streak_milestone;
      } else if (!lastActive || lastActive < yesterday) {
        newStreak = 1;
        streakBonus = XP_REWARDS.streak_day;
      }
    }

    // 4. Update totals
    const newXP = stats!.total_xp + amount + streakBonus;
    const newRank = getRank(newXP);
    const leveledUp = newRank.level > stats!.level;

    await supabase
      .from("user_stats")
      .update({
        total_xp: newXP,
        current_streak: newStreak,
        longest_streak: Math.max(stats!.longest_streak, newStreak),
        last_active_date: today,
        level: newRank.level,
        rank_name: newRank.name,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // 5. Log streak bonus separately if earned
    if (streakBonus > 0) {
      await supabase.from("xp_events").insert({
        user_id: user.id,
        amount: streakBonus,
        reason: "streak_day",
        metadata: { streak: newStreak },
      });
    }

    // 6. Check badges
    const newBadges = await checkBadges(supabase, user.id, {
      ...stats,
      total_xp: newXP,
      current_streak: newStreak,
      level: newRank.level,
    });

    return NextResponse.json({
      xp_earned: amount + streakBonus,
      total_xp: newXP,
      streak: newStreak,
      streak_bonus: streakBonus,
      leveled_up: leveledUp,
      new_rank: leveledUp ? newRank : null,
      new_badges: newBadges,
    });
  } catch (err: any) {
    console.error("XP error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function checkBadges(supabase: any, userId: string, stats: any) {
  // Get current counts
  const { count: lessonsCompleted } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { count: mentorChats } = await supabase
    .from("xp_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reason", "mentor_chat");

  // Check Phase 1 completion
  const { data: phase1Subs } = await supabase
    .from("subtopics")
    .select("id, topics!inner(phase_id)")
    .eq("topics.phase_id", "p1");

  const phase1Ids = phase1Subs?.map((s: any) => s.id) || [];
  const { count: phase1Done } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("subtopic_id", phase1Ids);

  const checkData = {
    ...stats,
    lessons_completed: lessonsCompleted || 0,
    mentor_chats: mentorChats || 0,
    phase_1_complete: phase1Ids.length > 0 && phase1Done === phase1Ids.length,
  };

  // Get already-earned badges
  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const existingIds = new Set(existing?.map((b: any) => b.badge_id) || []);

  // Find newly-earned ones
  const newBadges = [];
  for (const badge of BADGES) {
    if (!existingIds.has(badge.id) && badge.check(checkData)) {
      await supabase
        .from("user_badges")
        .insert({ user_id: userId, badge_id: badge.id });
      newBadges.push(badge);
    }
  }

  return newBadges;
}
