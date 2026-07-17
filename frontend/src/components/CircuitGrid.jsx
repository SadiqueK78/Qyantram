import React, { useEffect, useRef, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { useAutoSimulate } from '../hooks/useAutoSimulate'
import { useAI } from '../hooks/useAI'
import { GRID, CIRCUIT_CONFIG } from '../config/constants'
import CircuitCell from './CircuitCell'

// Small icon button used across the editor toolbar row.
function ToolBtn({ onClick, disabled, title, children, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] transition-colors
        ${active ? 'text-[color:rgb(var(--accent))]' : 'text-muted hover:text-ink'}
        ${disabled ? 'cursor-not-allowed opacity-40 hover:text-muted' : ''}`}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="h-4 w-px bg-line" />

function CircuitGrid() {
  const {
    qubits, steps, gates, setQubits, setSteps, resetCircuit,
    undo, redo, historyIndex, history,
    circuitName, setCircuitName, debugMode, toggleDebug,
    saveCircuit, loadCircuit, isAILoading,
  } = useCircuitStore()
  const { isSimulating, error } = useAutoSimulate()
  const { handleExplainCircuit } = useAI()
  const [hoveredCell, setHoveredCell] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const manageRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (manageRef.current && !manageRef.current.contains(e.target)) setManageOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLoadFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        loadCircuit(JSON.parse(ev.target.result))
      } catch {
        window.alert('Invalid circuit file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setManageOpen(false)
  }

  // Render exactly as many step columns as the user selected, so the sequence
  // numbers (1..N) always match the "Steps" control — but never fewer than the
  // gates actually occupy.
  const usedMax = gates.reduce((m, g) => Math.max(m, g.step), -1)
  const visibleSteps = Math.max(steps, usedMax + 1)

  return (
    <section className={`panel p-5 ${expanded ? 'fixed inset-4 z-[80] overflow-auto shadow-2xl' : ''}`}>
      {/* Editor toolbar row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgb(var(--ink)/0.05)] font-mono text-[13px] text-muted">
          {'</>'}
        </span>
        <input
          value={circuitName}
          onChange={(e) => setCircuitName(e.target.value)}
          spellCheck={false}
          className="w-44 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-[rgb(var(--accent))]"
        />

        <Sep />
        <div ref={manageRef} className="relative">
          <ToolBtn onClick={() => setManageOpen((v) => !v)} title="Manage circuit">
            Manage <span className="text-[9px]">▾</span>
          </ToolBtn>
          {manageOpen && (
            <div className="absolute left-0 top-9 z-40 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl">
              <button onClick={() => { saveCircuit(); setManageOpen(false) }} className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]">Save Circuit</button>
              <button onClick={() => fileRef.current?.click()} className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]">Load Circuit</button>
              <button onClick={() => { resetCircuit(); setManageOpen(false) }} className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]">Reset Circuit</button>
            </div>
          )}
        </div>

        <Sep />
        <ToolBtn onClick={undo} disabled={historyIndex <= 0} title="Undo">
          <span>↶</span> Undo
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
          <span>↷</span> Redo
        </ToolBtn>
        <ToolBtn onClick={resetCircuit} title="Clear circuit">
          <span>⌫</span> Clear
        </ToolBtn>

        <Sep />
        <button
          onClick={toggleDebug}
          title="Toggle debug"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors
            ${debugMode
              ? 'border-[rgb(var(--accent))] text-[color:rgb(var(--accent))]'
              : 'border-line text-muted hover:text-ink'}`}
        >
          <span className={`h-2 w-2 rounded-full ${debugMode ? 'bg-[color:rgb(var(--accent))]' : 'bg-faint'}`} />
          Debug
        </button>

        <button
          onClick={handleExplainCircuit}
          disabled={isAILoading || gates.length === 0}
          title={gates.length === 0 ? 'Add gates to the circuit first' : 'Get an AI explanation of this circuit'}
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.08)]
            px-3 py-1 text-[12px] font-medium text-[color:rgb(var(--accent))] transition-colors
            hover:bg-[rgb(var(--accent)/0.16)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAILoading ? 'Explaining…' : '✦ Explain Circuit'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            {isSimulating ? (
              <>
                <span className="spin h-3 w-3 rounded-full border-2 border-[color:rgb(var(--accent))] border-t-transparent" />
                Simulating…
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[color:rgb(var(--accent))]" /> Live
              </>
            )}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-[rgb(var(--ink)/0.06)] hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-[rgb(220_60_60/0.4)] bg-[rgb(220_60_60/0.08)] px-3 py-2 text-[13px] text-[rgb(200_50_50)]">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-full">
          {/* Step numbers (1-based) */}
          <div className="flex" style={{ paddingLeft: GRID.LABEL_WIDTH }}>
            {Array.from({ length: visibleSteps }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 text-center text-[11px] font-medium text-faint"
                style={{ width: GRID.COL_WIDTH }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Quantum wires */}
          {Array.from({ length: qubits }).map((_, q) => (
            <div key={q} className="flex w-full items-center">
              <div
                className="flex shrink-0 items-center justify-end gap-1.5 pr-3 font-mono text-[12px]"
                style={{ width: GRID.LABEL_WIDTH, height: GRID.ROW_PITCH }}
              >
                <span className="text-muted">q{q}</span>
              </div>

              <div className="relative flex flex-1 items-center">
                <div
                  className="pointer-events-none absolute left-0 right-0"
                  style={{ top: '50%', height: 1, background: 'rgb(var(--grid-wire))', transform: 'translateY(-50%)' }}
                />
                {Array.from({ length: visibleSteps }).map((_, s) => (
                  <CircuitCell
                    key={`${q}-${s}`}
                    qubit={q}
                    step={s}
                    isHovered={hoveredCell?.q === q && hoveredCell?.s === s}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Classical registers — one red double-line per qubit (c0..cN) */}
          {Array.from({ length: qubits }).map((_, c) => (
            <div key={`c${c}`} className="flex w-full items-center">
              <div
                className="flex shrink-0 items-center justify-end pr-3 font-mono text-[12px]"
                style={{ width: GRID.LABEL_WIDTH, height: 40, color: 'rgb(var(--grid-classical))' }}
              >
                c{c}
              </div>
              <div className="relative flex flex-1 items-center" style={{ height: 40 }}>
                <div className="absolute left-0 right-0" style={{ top: 'calc(50% - 2px)', height: 1, background: 'rgb(var(--grid-classical))' }} />
                <div className="absolute left-0 right-0" style={{ top: 'calc(50% + 2px)', height: 1, background: 'rgb(var(--grid-classical))' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact wire/step controls */}
      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-line pt-3 text-[12px] text-muted">
        <div className="flex items-center gap-2">
          <span>Qubits</span>
          <button
            className="h-6 w-6 rounded border border-line hover:bg-[rgb(var(--ink)/0.05)] disabled:opacity-40"
            onClick={() => qubits > CIRCUIT_CONFIG.MIN_QUBITS && setQubits(qubits - 1)}
            disabled={qubits <= CIRCUIT_CONFIG.MIN_QUBITS}
          >
            −
          </button>
          <span className="w-4 text-center font-mono text-ink">{qubits}</span>
          <button
            className="h-6 w-6 rounded border border-line hover:bg-[rgb(var(--ink)/0.05)] disabled:opacity-40"
            onClick={() => qubits < CIRCUIT_CONFIG.MAX_QUBITS && setQubits(qubits + 1)}
            disabled={qubits >= CIRCUIT_CONFIG.MAX_QUBITS}
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span>Steps</span>
          <input
            type="range"
            min={CIRCUIT_CONFIG.MIN_STEPS}
            max={CIRCUIT_CONFIG.MAX_STEPS}
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value))}
            className="accent-[color:rgb(var(--accent))]"
          />
          <span className="w-4 font-mono text-ink">{steps}</span>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json" onChange={handleLoadFile} className="hidden" />
    </section>
  )
}

export default CircuitGrid
