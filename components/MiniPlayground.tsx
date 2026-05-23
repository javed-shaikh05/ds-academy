'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Loader2, Code2 } from 'lucide-react'

declare global { interface Window { loadPyodide: any } }

// Shared loader so multiple instances don't reload Pyodide
let pyodidePromise: Promise<any> | null = null

function getPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js'
          s.onload = () => res()
          s.onerror = () => rej(new Error('Failed to load Pyodide'))
          document.body.appendChild(s)
        })
      }
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' })
      await py.loadPackage(['numpy'])
      resolve(py)
    } catch (e) {
      reject(e)
    }
  })
  return pyodidePromise
}

export default function MiniPlayground({ starterCode }: { starterCode: string }) {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState('')
  const [ready, setReady] = useState(false)
  const [running, setRunning] = useState(false)
  const [activated, setActivated] = useState(false)
  const pyRef = useRef<any>(null)

  // Only load Pyodide when user activates (saves bandwidth)
  const activate = async () => {
    setActivated(true)
    try {
      pyRef.current = await getPyodide()
      setReady(true)
    } catch (e: any) {
      setOutput(`Failed to load Python: ${e.message}`)
    }
  }

  const run = async () => {
    if (!pyRef.current || running) return
    setRunning(true)
    setOutput('')
    try {
      const py = pyRef.current
      py.runPython(`import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = io.StringIO()`)
      const pkgs: string[] = []
      if (/\bpandas\b/.test(code)) pkgs.push('pandas')
      if (/\b(sklearn|scikit)\b/.test(code)) pkgs.push('scikit-learn')
      if (pkgs.length) await py.loadPackage(pkgs)
      await py.runPythonAsync(code)
      const out = py.runPython('sys.stdout.getvalue()')
      const err = py.runPython('sys.stderr.getvalue()')
      setOutput((out || '') + (err ? `\n⚠️ ${err}` : '') || '(no output)')
    } catch (err: any) {
      setOutput(`❌ ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  if (!activated) {
    return (
      <button
        onClick={activate}
        className="w-full glass glass-hover p-4 flex items-center justify-center gap-2 text-sm font-medium transition"
      >
        <Code2 className="w-4 h-4 text-violet-400" />
        Try it yourself — run Python code
      </button>
    )
  }

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs text-gray-400">practice.py</span>
        {!ready && (
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading Python...
          </span>
        )}
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="w-full bg-transparent p-3 font-mono text-xs leading-relaxed focus:outline-none resize-y min-h-40"
        style={{ tabSize: 4 }}
      />
      <div className="px-3 py-2 border-t border-white/5">
        <button
          onClick={run}
          disabled={!ready || running}
          className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Running...' : 'Run'}
        </button>
        {output && (
          <pre className="mt-3 font-mono text-xs whitespace-pre-wrap text-green-300 bg-black/30 p-3 rounded-lg overflow-x-auto">
            {output}
          </pre>
        )}
      </div>
    </div>
  )
}