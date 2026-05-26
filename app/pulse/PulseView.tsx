"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Flame,
  Wrench,
  Target,
  Rocket,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

export default function PulseView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/pulse")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mb-3" />
        <p className="text-sm">Gathering industry intelligence...</p>
      </main>
    );
  }

  if (!data || data.error) {
    return (
      <main className="min-h-screen max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-400 text-sm">
          Couldn&apos;t load the briefing.{" "}
          <button onClick={load} className="text-cyan-400 underline">
            Retry
          </button>
        </p>
      </main>
    );
  }

  const updated = data.generated_at
    ? new Date(data.generated_at).toLocaleDateString()
    : "";

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-end justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-1">DS Pulse</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            What's trending in Data Science right now
          </p>
        </div>
        {updated && (
          <span className="text-[11px] text-gray-500 shrink-0">
            Updated {updated}
          </span>
        )}
      </div>

      {/* Advice banner */}
      {data.advice && (
        <div className="glass p-4 sm:p-5 mb-5 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-200">{data.advice}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Hot skills */}
        <Section icon={Flame} color="text-orange-400" title="Hot Skills">
          {data.hot_skills?.map((s: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-sm font-medium text-white shrink-0">
                {s.skill}
              </span>
              <span className="text-sm text-gray-400">— {s.why}</span>
            </div>
          ))}
        </Section>

        {/* Trending tools */}
        <Section icon={Wrench} color="text-violet-400" title="Trending Tools">
          {data.trending_tools?.map((t: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-sm font-medium text-white shrink-0">
                {t.tool}
              </span>
              <span className="text-sm text-gray-400">— {t.use}</span>
            </div>
          ))}
        </Section>

        {/* Interview trends */}
        <Section icon={Target} color="text-pink-400" title="Interview Trends">
          {data.interview_trends?.map((t: string, i: number) => (
            <p key={i} className="text-sm text-gray-300">
              • {t}
            </p>
          ))}
        </Section>

        {/* Emerging topics */}
        <Section icon={Rocket} color="text-cyan-400" title="Emerging Topics">
          {data.emerging_topics?.map((t: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-sm font-medium text-white shrink-0">
                {t.topic}
              </span>
              <span className="text-sm text-gray-400">— {t.note}</span>
            </div>
          ))}
        </Section>
      </div>

      <p className="text-[11px] text-gray-500 mt-6 text-center">
        AI-generated industry briefing · refreshed weekly
      </p>
    </main>
  );
}

function Section({ icon: Icon, color, title, children }: any) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
