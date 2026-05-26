"use client";

import { useState, useEffect } from "react";
import { Target, GraduationCap, Sparkles } from "lucide-react";

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [goal, setGoal] = useState("faang");
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (!d.preferences || !d.preferences.onboarded) setShow(true);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal,
        daily_minutes: minutes,
        learning_style: "balanced",
      }),
    });
    setShow(false);
    window.location.reload(); // refresh dashboard with personalized plan
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass glow-cyan p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            Let's personalize your journey
          </h2>
          <p className="text-sm text-gray-400">
            Two quick questions to tailor your daily plan
          </p>
        </div>

        {/* Goal */}
        <p className="text-sm font-medium mb-2">What's your main goal?</p>
        <div className="grid grid-cols-1 gap-2 mb-6">
          {[
            { id: "faang", label: "Crack FAANG interviews", icon: Target },
            {
              id: "academic",
              label: "Excel in academics / exams",
              icon: GraduationCap,
            },
            { id: "both", label: "Both", icon: Sparkles },
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition text-left ${
                goal === g.id
                  ? "bg-linear-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <g.icon className="w-5 h-5 text-cyan-400 shrink-0" />
              {g.label}
            </button>
          ))}
        </div>

        {/* Daily time */}
        <p className="text-sm font-medium mb-2">Daily study target?</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`p-3 rounded-xl border text-sm transition ${
                minutes === m
                  ? "bg-linear-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-linear-to-r from-cyan-500 to-violet-500 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Start learning →"}
        </button>
      </div>
    </div>
  );
}
