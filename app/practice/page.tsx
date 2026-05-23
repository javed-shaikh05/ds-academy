import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Brain, Code2, Target } from "lucide-react";

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Topics that have lessons started/completed (good candidates for quizzing)
  const { data: phases } = await supabase
    .from("phases")
    .select("id, title, topics(id, title, subtopics(id, title))")
    .order("order_index");

  phases?.forEach((p: any) => {
    p.topics.sort((a: any, b: any) => (a.id > b.id ? 1 : -1));
  });

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-1.5">Practice Arena</h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6">
        Test yourself with quizzes & run real Python code
      </p>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
        <Link
          href="/practice/review"
          className="glass glass-hover p-5 sm:p-6 bg-linear-to-br from-cyan-500/20 to-transparent transition block"
        >
          <Target className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 mb-3" />
          <h2 className="font-semibold text-base sm:text-lg mb-1">
            Daily Review
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Spaced-repetition questions due today
          </p>
        </Link>

        <Link
          href="/practice/playground"
          className="glass glass-hover p-5 sm:p-6 bg-linear-to-br from-violet-500/20 to-transparent transition block"
        >
          <Code2 className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400 mb-3" />
          <h2 className="font-semibold text-base sm:text-lg mb-1">
            Python Playground
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Write & run Python in your browser
          </p>
        </Link>
      </div>

      {/* Quiz by topic */}
      <h2 className="text-base sm:text-xl font-semibold mb-3">Quiz by topic</h2>
      <div className="space-y-4">
        {phases?.map((phase: any) => (
          <div key={phase.id} className="glass p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {phase.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {phase.topics.map((topic: any) =>
                topic.subtopics.slice(0, 100).map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/practice/quiz/${sub.id}`}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Brain className="w-3 h-3 text-cyan-400" />
                    {sub.title}
                  </Link>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
