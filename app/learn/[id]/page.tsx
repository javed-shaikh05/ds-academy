import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import LessonView from "./LessonView";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch subtopic + neighbors for navigation
  const { data: subtopic } = (await supabase
    .from("subtopics")
    .select("*, topics(title, phase_id, phases(title, color))")
    .eq("id", id)
    .single()) as any;

  if (!subtopic) notFound();

  // Find next/prev within the same topic
  const { data: siblings } = await supabase
    .from("subtopics")
    .select("id, title, order_index")
    .eq("topic_id", subtopic.topic_id)
    .order("order_index");

  const currentIdx = siblings?.findIndex((s) => s.id === id) ?? -1;
  const prev = currentIdx > 0 ? siblings![currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < (siblings?.length ?? 0) - 1
      ? siblings![currentIdx + 1]
      : null;

  // Fetch existing progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("subtopic_id", id)
    .single();

  return (
    <LessonView
      subtopic={subtopic}
      prev={prev}
      next={next}
      initialStatus={progress?.status || "not_started"}
    />
  );
}
