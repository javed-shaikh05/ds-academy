import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MISSION_TEMPLATES = [
  {
    type: "complete_lessons",
    target: 2,
    xp_reward: 50,
    title: "Complete 2 lessons",
    emoji: "📚",
  },
  {
    type: "complete_lessons",
    target: 3,
    xp_reward: 80,
    title: "Complete 3 lessons",
    emoji: "🔥",
  },
  {
    type: "chat_with_mentor",
    target: 3,
    xp_reward: 30,
    title: "Ask 3 questions to AI mentor",
    emoji: "🧠",
  },
  {
    type: "chat_with_mentor",
    target: 5,
    xp_reward: 50,
    title: "Have a deep convo (5 questions)",
    emoji: "💬",
  },
  {
    type: "visit_phase",
    target: 1,
    xp_reward: 25,
    title: "Visit any phase you haven't started",
    emoji: "🗺️",
  },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    // Get today's missions
    let { data: missions } = await supabase
      .from("daily_missions")
      .select("*")
      .eq("user_id", user.id)
      .eq("mission_date", today);

    // Generate 3 missions if none exist for today
    if (!missions || missions.length === 0) {
      const shuffled = [...MISSION_TEMPLATES]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const newMissions = shuffled.map((m) => ({
        user_id: user.id,
        mission_date: today,
        mission_type: m.type,
        target: m.target,
        xp_reward: m.xp_reward,
        metadata: { title: m.title, emoji: m.emoji },
      }));
      await supabase.from("daily_missions").insert(newMissions);
      missions =
        (
          await supabase
            .from("daily_missions")
            .select("*")
            .eq("user_id", user.id)
            .eq("mission_date", today)
        ).data || [];
    }

    return NextResponse.json({ missions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
