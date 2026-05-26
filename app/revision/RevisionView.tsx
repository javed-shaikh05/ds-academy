"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  FileText,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";

export default function RevisionView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [sheet, setSheet] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    fetch("/api/revision")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openSheet = async (item: any) => {
    setActive(item);
    setSheet("");
    setSheetLoading(true);
    try {
      const res = await fetch("/api/cheatsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicId: item.id }),
      });
      const data = await res.json();
      setSheet(data.content || "Could not load.");
    } finally {
      setSheetLoading(false);
    }
  };

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-xl sm:text-3xl font-bold mb-1.5">Revision Mode</h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6">
        Quick cheat sheets for everything you&apos;ve completed
      </p>

      {loading ? (
        <div className="glass p-8 flex justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass p-8 text-center">
          <BookOpen className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">
            Complete some lessons first — they&apos;ll show here for fast
            revision.
          </p>
          <Link
            href="/learn"
            className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm inline-block"
          >
            Start learning
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => openSheet(item)}
              className="glass glass-hover w-full p-3 sm:p-4 flex items-center gap-3 text-left transition group"
            >
              <FileText className="w-5 h-5 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {item.phase} → {item.topic}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Cheat sheet modal */}
      {active && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="glass glow-cyan p-5 sm:p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-violet-400 shrink-0" />
                <h3 className="font-semibold truncate">{active.title}</h3>
              </div>
              <button
                onClick={() => setActive(null)}
                className="text-gray-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sheetLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Building cheat
                sheet...
              </div>
            ) : (
              <div className="prose-chat text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sheet}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
