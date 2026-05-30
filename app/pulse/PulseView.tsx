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
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-start justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-1">DS Pulse</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            What&apos;s trending in Data Science right now
          </p>
        </div>
        {updated && (
          <span className="text-[11px] text-gray-500 shrink-0 mt-1">
            Updated {updated}
          </span>
        )}
      </div>

      {/* Advice banner */}
      {data.advice && (
        <div className="glass p-4 sm:p-5 mb-5 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-200 leading-relaxed">{data.advice}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Hot skills */}
        <Section icon={Flame} color="text-orange-400" title="Hot Skills">
          {data.hot_skills?.map((s: any, i: number) => (
            <Item key={i} label={s.skill} desc={s.why} labelColor="text-orange-300" />
          ))}
        </Section>

        {/* Trending tools */}
        <Section icon={Wrench} color="text-violet-400" title="Trending Tools">
          {data.trending_tools?.map((t: any, i: number) => (
            <Item key={i} label={t.tool} desc={t.use} labelColor="text-violet-300" />
          ))}
        </Section>

        {/* Interview trends */}
        <Section icon={Target} color="text-pink-400" title="Interview Trends">
          {data.interview_trends?.map((t: string, i: number) => (
            <div key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
              <span className="text-pink-400 shrink-0 mt-0.5">•</span>
              <span>{t}</span>
            </div>
          ))}
        </Section>

        {/* Emerging topics */}
        <Section icon={Rocket} color="text-cyan-400" title="Emerging Topics">
          {data.emerging_topics?.map((t: any, i: number) => (
            <Item key={i} label={t.topic} desc={t.note} labelColor="text-cyan-300" />
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
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        <h2 className="font-semibold text-sm sm:text-base">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function Item({ label, desc, labelColor }: { label: string; desc: string; labelColor: string }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <span className={`text-xs font-semibold uppercase tracking-wide ${labelColor} block mb-0.5`}>
        {label}
      </span>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
