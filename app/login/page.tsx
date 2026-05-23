"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass glow-cyan p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          {isSignUp ? "Start your DS journey" : "Continue your learning"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-cyan-400/50 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-cyan-400/50 transition"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-cyan-500 to-violet-500 font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
          className="w-full mt-6 text-sm text-gray-400 hover:text-white transition"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create account"}
        </button>
      </div>
    </main>
  );
}
