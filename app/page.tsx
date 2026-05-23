import Link from "next/link";
import { Sparkles, Brain, Trophy, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl w-full text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 mb-8 text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>AI-Powered Data Science Mastery</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Become an Elite <span className="gradient-text">Data Scientist</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto">
          A gamified learning platform that transforms you from beginner to
          FAANG-ready — with AI mentors, real projects, and interview
          domination.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/login"
            className="glass glass-hover glow-cyan px-8 py-4 font-semibold transition-all"
          >
            Start Learning →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Brain,
              title: "AI Mentors",
              desc: "Friendly Teacher to FAANG Interviewer",
            },
            {
              icon: Trophy,
              title: "Gamified",
              desc: "XP, streaks, levels & boss battles",
            },
            {
              icon: Zap,
              title: "Real Projects",
              desc: "Build production-ready DS systems",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="glass glass-hover p-6 text-left transition-all"
            >
              <f.icon className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
