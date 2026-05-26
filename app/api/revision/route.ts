import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Completed subtopics, with topic/phase info
  const { data: progress } = await supabase
    .from("user_progress")
    .select(
      "subtopic_id, completed_at, subtopics(id, title, topics(title, phases(title)))",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const items = (progress || [])
    .map((p: any) => ({
      id: p.subtopics?.id,
      title: p.subtopics?.title,
      topic: p.subtopics?.topics?.title,
      phase: p.subtopics?.topics?.phases?.title,
    }))
    .filter((i: any) => i.id);

  return NextResponse.json({ items });
}
