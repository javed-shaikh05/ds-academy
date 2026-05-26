import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Preferences
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const goal = prefs?.goal || "faang";

    // 2. All subtopics with phase/topic info, ordered
    const { data: phases } = await supabase
      .from("phases")
      .select(
        "id, order_index, title, topics(id, order_index, title, subtopics(id, order_index, title, difficulty))",
      )
      .order("order_index");

    // 3. User progress
    const { data: progress } = await supabase
      .from("user_progress")
      .select("subtopic_id, status")
      .eq("user_id", user.id);

    const statusMap = new Map(
      progress?.map((p) => [p.subtopic_id, p.status]) || [],
    );

    // Flatten subtopics in curriculum order
    const ordered: any[] = [];
    (phases || []).forEach((ph: any) => {
      ph.topics.sort((a: any, b: any) => a.order_index - b.order_index);
      ph.topics.forEach((t: any) => {
        t.subtopics.sort((a: any, b: any) => a.order_index - b.order_index);
        t.subtopics.forEach((s: any) => {
          ordered.push({ ...s, topicTitle: t.title, phaseTitle: ph.title });
        });
      });
    });

    // 4. Next lessons to learn (first 2 not-completed in order)
    const nextLessons = ordered
      .filter((s) => statusMap.get(s.id) !== "completed")
      .slice(0, 2);

    // 5. Spaced-repetition reviews due today
    const today = new Date().toISOString().split("T")[0];
    const { data: dueReviews } = await supabase
      .from("mcq_reviews")
      .select("mcq_id")
      .eq("user_id", user.id)
      .lte("due_date", today);

    const reviewsDue = dueReviews?.length || 0;

    // 6. Weak topics (low quiz accuracy)
    const { data: reviews } = await supabase
      .from("mcq_reviews")
      .select(
        "total_attempts, correct_attempts, mcqs(subtopic_id, subtopics(title))",
      )
      .eq("user_id", user.id);

    const topicAcc: Record<
      string,
      { id: string; title: string; correct: number; total: number }
    > = {};
    (reviews || []).forEach((r: any) => {
      const sid = r.mcqs?.subtopic_id;
      const title = r.mcqs?.subtopics?.title;
      if (!sid || !title) return;
      if (!topicAcc[sid])
        topicAcc[sid] = { id: sid, title, correct: 0, total: 0 };
      topicAcc[sid].correct += r.correct_attempts;
      topicAcc[sid].total += r.total_attempts;
    });

    const weakTopic = Object.values(topicAcc)
      .filter((t) => t.total >= 2)
      .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
      .filter((t) => t.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)[0]; // worst one

    // 7. Build the plan as a list of actionable cards
    const plan: any[] = [];

    // Card: review due (highest priority — retention)
    if (reviewsDue > 0) {
      plan.push({
        type: "review",
        priority: 1,
        title: "Daily Review",
        desc: `${reviewsDue} question${reviewsDue > 1 ? "s" : ""} due for spaced-repetition`,
        action: "Start review",
        href: "/practice/review",
        icon: "Calendar",
        minutes: Math.min(15, reviewsDue * 1.5),
      });
    }

    // Card: strengthen weak topic
    if (weakTopic) {
      plan.push({
        type: "weak",
        priority: 2,
        title: "Strengthen a weak spot",
        desc: `"${weakTopic.title}" — your accuracy is ${weakTopic.accuracy}%. Re-quiz it.`,
        action: "Practice now",
        href: `/practice/quiz/${weakTopic.id}`,
        icon: "AlertTriangle",
        minutes: 8,
      });
    }

    // Card: next lessons
    nextLessons.forEach((lesson, i) => {
      plan.push({
        type: "lesson",
        priority: 3 + i,
        title: i === 0 ? "Continue learning" : "Then learn",
        desc: `${lesson.title} (${lesson.phaseTitle} → ${lesson.topicTitle})`,
        action: "Open lesson",
        href: `/learn/${lesson.id}`,
        icon: "BookOpen",
        minutes: 12,
      });
    });

    // Card: FAANG goal → suggest a mock interview occasionally
    const completedCount = Array.from(statusMap.values()).filter(
      (s) => s === "completed",
    ).length;
    if (
      (goal === "faang" || goal === "both") &&
      completedCount >= 3 &&
      completedCount % 5 === 0
    ) {
      plan.push({
        type: "interview",
        priority: 6,
        title: "Test your readiness",
        desc: "You've learned a lot — try a mock interview to apply it.",
        action: "Start interview",
        href: "/interview",
        icon: "Trophy",
        minutes: 15,
      });
    }

    plan.sort((a, b) => a.priority - b.priority);

    // Motivational headline based on state
    let headline = "Ready to learn?";
    if (reviewsDue > 0) headline = "Let's lock in what you learned";
    else if (weakTopic) headline = "Time to turn a weakness into a strength";
    else if (completedCount === 0) headline = "Your journey starts now";
    else headline = "Keep the momentum going";

    return NextResponse.json({
      headline,
      goal,
      plan: plan.slice(0, 4), // max 4 items so it's not overwhelming
      stats: {
        completedCount,
        totalCount: ordered.length,
        reviewsDue,
      },
    });
  } catch (err: any) {
    console.error("Plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
