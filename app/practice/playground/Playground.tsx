"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Loader2, Trash2 } from "lucide-react";

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const STARTER = `# Python runs entirely in your browser!
import numpy as np

data = [12, 45, 23, 67, 34, 89, 21]
arr = np.array(data)

print("Mean:", arr.mean())
print("Max:", arr.max())
print("Std dev:", round(arr.std(), 2))
`;

export default function Playground() {
  const [code, setCode] = useState(STARTER);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      // Load Pyodide from CDN
      if (!window.loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        script.onload = init;
        document.body.appendChild(script);
      } else {
        init();
      }
    };

    const init = async () => {
      try {
        pyodideRef.current = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
        });
        // Preload numpy (most common)
        await pyodideRef.current.loadPackage(["numpy"]);
        setLoading(false);
      } catch (e: any) {
        setOutput(`Failed to load Python: ${e.message}`);
        setLoading(false);
      }
    };

    load();
  }, []);

  const run = async () => {
    if (!pyodideRef.current || running) return;
    setRunning(true);
    setOutput("");

    try {
      const pyodide = pyodideRef.current;
      // Capture print output
      pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
      // Auto-load common packages if mentioned
      const pkgs = [];
      if (/\bpandas\b/.test(code)) pkgs.push("pandas");
      if (/\bnumpy\b/.test(code)) pkgs.push("numpy");
      if (/\b(sklearn|scikit)\b/.test(code)) pkgs.push("scikit-learn");
      if (pkgs.length) await pyodide.loadPackage(pkgs);

      await pyodide.runPythonAsync(code);
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      const stderr = pyodide.runPython("sys.stderr.getvalue()");
      setOutput(
        (stdout || "") + (stderr ? `\n⚠️ ${stderr}` : "") || "(no output)",
      );
    } catch (err: any) {
      setOutput(`❌ ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
      <Link
        href="/practice"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Practice
      </Link>

      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-lg sm:text-2xl font-bold">Python Playground</h1>
        {loading && (
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading Python...
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="glass overflow-hidden mb-3">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <span className="text-xs text-gray-400">main.py</span>
          <button
            onClick={() => setCode("")}
            className="text-gray-400 hover:text-white"
            aria-label="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full bg-transparent p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y min-h-60"
          style={{ tabSize: 4 }}
        />
      </div>

      {/* Run button */}
      <button
        onClick={run}
        disabled={loading || running}
        className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-violet-500 px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition mb-3"
      >
        {running ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {running ? "Running..." : "Run code"}
      </button>

      {/* Output */}
      <div className="glass p-3 sm:p-4">
        <p className="text-xs text-gray-400 mb-2">Output</p>
        <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap text-green-300 min-h-15 overflow-x-auto">
          {output || "(run your code to see output)"}
        </pre>
      </div>

      <p className="text-[11px] text-gray-500 mt-3">
        Supports numpy, pandas, scikit-learn & more — runs 100% in your browser,
        no server.
      </p>
    </main>
  );
}
