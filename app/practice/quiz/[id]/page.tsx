import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import QuizView from "./QuizView";

export default async function QuizPage({
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

  const { data: subtopic } = (await supabase
    .from("subtopics")
    .select("id, title, topics(title)")
    .eq("id", id)
    .single()) as any;

  if (!subtopic) notFound();

  return (
    <QuizView
      subtopicId={id}
      title={subtopic.title}
      topicTitle={subtopic.topics?.title || ""}
    />
  );
}
