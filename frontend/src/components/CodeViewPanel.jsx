import React, { useMemo, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { toOpenQASM, toQiskit } from '../utils/exportCode'

const FORMATS = [
  { id: 'qasm', label: 'OpenQASM2.0', info: 'OpenQASM 2.0 — the gate-level instruction format most quantum hardware and simulators accept directly.' },
  { id: 'qiskit', label: 'Qiskit(v1.1.1)', info: 'Python source using Qiskit — runnable as-is against Aer or a real IBM backend.' },
]

// -----------------------------------------------------------------------------
// Lightweight regex-based syntax highlighter — no external dependency. Good
// enough to distinguish comments / strings / numbers / keywords / calls
// without pulling in a full highlighter library for two output formats.
// -----------------------------------------------------------------------------
const TOKEN_PATTERNS = {
  qasm: new RegExp(
    [
      '(?<comment>//.*$)',
      '(?<string>"(?:[^"\\\\]|\\\\.)*")',
      '(?<number>\\b\\d+\\.?\\d*\\b)',
      '(?<keyword>\\b(?:OPENQASM|include|qreg|creg|gate|measure|reset|barrier|if|opaque)\\b)',
      '(?<call>\\b(?:h|x|y|z|s|sdg|t|tdg|sx|sxdg|id|p|u1|u2|u3|rx|ry|rz|cx|ccx|cu1|cu3|swap)\\b)',
    ].join('|'),
    'gm'
  ),
  qiskit: new RegExp(
    [
      '(?<comment>#.*$)',
      "(?<string>\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')",
      '(?<number>\\b\\d+\\.?\\d*\\b)',
      '(?<keyword>\\b(?:from|import|as|def|return|print|class|for|in|range|True|False|None)\\b)',
      '(?<call>\\bqc\\.\\w+|\\bnp\\.\\w+|\\bQuantumCircuit\\b|\\bQuantumRegister\\b|\\bClassicalRegister\\b|\\bAerSimulator\\b)',
    ].join('|'),
    'gm'
  ),
}

const TOKEN_COLORS = {
  comment: '#6b8a5e',
  string: '#b5622a',
  number: '#1c6fae',
  keyword: '#9333c9',
  call: '#2464b4',
}

function highlightLine(line, lang) {
  const regex = TOKEN_PATTERNS[lang]
  regex.lastIndex = 0
  const parts = []
  let last = 0
  let m
  while ((m = regex.exec(line))) {
    if (m.index > last) parts.push({ text: line.slice(last, m.index) })
    const kind = Object.entries(m.groups).find(([, v]) => v !== undefined)?.[0]
    parts.push({ text: m[0], color: TOKEN_COLORS[kind] })
    last = m.index + m[0].length
    if (m.index === regex.lastIndex) regex.lastIndex++ // guard against zero-width matches
  }
  if (last < line.length) parts.push({ text: line.slice(last) })
  return parts
}

function CodeViewPanel({ height }) {
  const { qubits, circuit, steps, shots } = useCircuitStore()
  const [format, setFormat] = useState('qasm')
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const code = useMemo(() => {
    return format === 'qasm' ? toOpenQASM(qubits, circuit, steps) : toQiskit(qubits, circuit, steps, shots)
  }, [format, qubits, circuit, steps, shots])

  const lines = code.split('\n')
  const activeFormat = FORMATS.find((f) => f.id === format)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // clipboard API unavailable — silently ignore, nothing else to fall back to here
    }
    setMenuOpen(false)
  }

  const downloadCode = () => {
    const ext = format === 'qasm' ? 'qasm' : 'py'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `circuit-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  return (
    <section
      className="panel flex flex-col overflow-hidden p-0"
      style={{ height: height ? `${height}px` : undefined }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line p-4">
        <div className="relative">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="cursor-pointer rounded-lg border border-[rgb(var(--accent))] bg-surface px-3 py-1.5 text-[13px] font-medium text-ink outline-none"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setInfoOpen((v) => !v)}
            title="About this format"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-[rgb(var(--ink)/0.06)] hover:text-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="11.5" />
              <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="More"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-[rgb(var(--ink)/0.06)] hover:text-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>

          {infoOpen && (
            <div className="absolute right-9 top-full z-20 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-[12px] leading-relaxed text-muted shadow-xl">
              {activeFormat.info}
            </div>
          )}
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
              <button onClick={copyCode} className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]">
                Copy code
              </button>
              <button onClick={downloadCode} className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]">
                Download file
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto bg-panel">
        <pre className="min-w-full font-mono text-[13px] leading-6">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-10 shrink-0 select-none border-r border-line px-2 text-right text-faint">{i + 1}</span>
              <span className="whitespace-pre px-3">
                {highlightLine(line, format).map((tok, j) =>
                  tok.color ? (
                    <span key={j} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  ) : (
                    <span key={j} className="text-ink">
                      {tok.text}
                    </span>
                  )
                )}
                {line.length === 0 ? '\u00A0' : null}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </section>
  )
}

export default CodeViewPanel