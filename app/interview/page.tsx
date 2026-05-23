import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Brain,
  BarChart3,
  Users,
  Trophy,
} from "lucide-react";

const TRACKS = [
  {
    id: "technical",
    title: "Technical / Coding",
    desc: "Python, SQL, data manipulation",
    icon: "Code2",
    color: "from-cyan-500/20",
  },
  {
    id: "ml_concepts",
    title: "ML Concepts",
    desc: "Algorithms, evaluation, theory",
    icon: "Brain",
    color: "from-violet-500/20",
  },
  {
    id: "stats",
    title: "Statistics",
    desc: "Probability, testing, A/B",
    icon: "BarChart3",
    color: "from-pink-500/20",
  },
  {
    id: "behavioral",
    title: "Behavioral",
    desc: "Projects, teamwork, communication",
    icon: "Users",
    color: "from-green-500/20",
  },
];

const ICONS: Record<string, any> = { Code2, Brain, BarChart3, Users };

export default async function InterviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Past interviews
  const { data: past } = await supabase
    .from("interviews")
    .select("id, track, overall_score, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-1.5">Mock Interview</h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6">
        Practice with an AI FAANG interviewer. Get scored, get feedback, get
        hired.
      </p>

      {/* Tracks */}
      <h2 className="text-base sm:text-lg font-semibold mb-3">
        Choose a track
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
        {TRACKS.map((t) => {
          const Icon = ICONS[t.icon];
          return (
            <Link
              key={t.id}
              href={`/interview/session?track=${t.id}`}
              className={`glass glass-hover p-5 bg-linear-to-br ${t.color} to-transparent transition block`}
            >
              <Icon className="w-7 h-7 text-white mb-3" />
              <h3 className="font-semibold mb-1">{t.title}</h3>
              <p className="text-xs sm:text-sm text-gray-400">{t.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Past results */}
      {past && past.length > 0 && (
        <>
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            Recent interviews
          </h2>
          <div className="space-y-2">
            {past.map((iv) => (
              <div
                key={iv.id}
                className="glass p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {iv.track.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(iv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {iv.overall_score}
                    <span className="text-xs text-gray-400">/100</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
