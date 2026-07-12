import React, { useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { useAutoSimulate } from '../hooks/useAutoSimulate'
import { GRID, CIRCUIT_CONFIG } from '../config/constants'
import CircuitCell from './CircuitCell'

function CircuitGrid() {
  const { qubits, steps, circuit, gates, setQubits, setSteps, resetCircuit } = useCircuitStore()
  const { isSimulating, error } = useAutoSimulate()
  const [hoveredCell, setHoveredCell] = useState(null)

  const gateCount = gates.length
  // Only render columns up to a little past the last used step to keep it tidy.
  const usedMax = gates.reduce((m, g) => Math.max(m, g.step), -1)
  const visibleSteps = Math.min(steps, Math.max(8, usedMax + 2))

  return (
    <section className="panel p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">Circuit Editor</div>
          <div className="text-[13px] text-muted">
            {qubits} qubit{qubits > 1 ? 's' : ''} · {gateCount} gate{gateCount === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live status indicator — replaces the old manual Run button. The
              circuit now re-simulates automatically on any edit (gate
              add/remove/move, qubit count change), so there's nothing left
              to click; this just reflects current status. */}
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            {isSimulating ? (
              <>
                <span className="spin h-3 w-3 rounded-full border-2 border-[color:rgb(var(--accent))] border-t-transparent" />
                <span>Simulating…</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[color:rgb(var(--accent))]" />
                <span>Live</span>
              </>
            )}
          </div>
          <button className="btn-ghost" onClick={resetCircuit}>
            Reset
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
        <div className="inline-block min-w-full">
          {/* Step numbers (1-based) */}
          <div className="flex" style={{ paddingLeft: GRID.LABEL_WIDTH }}>
            {Array.from({ length: visibleSteps }).map((_, i) => (
              <div
                key={i}
                className="text-center text-[11px] font-medium text-faint"
                style={{ width: GRID.COL_WIDTH }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Wires */}
          {Array.from({ length: qubits }).map((_, q) => (
            <div key={q} className="flex items-center">
              <div
                className="flex items-center justify-end gap-1.5 pr-3 font-mono text-[12px]"
                style={{ width: GRID.LABEL_WIDTH, height: GRID.ROW_PITCH }}
              >
                <span className="text-muted">q{q}</span>
                <span className="text-faint">|0⟩</span>
              </div>

              <div className="relative flex items-center">
                {/* continuous wire */}
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

          {/* Classical register (double line) */}
          <div className="flex items-center">
            <div
              className="flex items-center justify-end pr-3 font-mono text-[12px] text-faint"
              style={{ width: GRID.LABEL_WIDTH, height: 28 }}
            >
              c
            </div>
            <div className="relative flex items-center" style={{ height: 28, width: visibleSteps * GRID.COL_WIDTH }}>
              <div className="absolute left-0 right-0" style={{ top: 'calc(50% - 2px)', height: 1, background: 'rgb(var(--grid-wire))' }} />
              <div className="absolute left-0 right-0" style={{ top: 'calc(50% + 2px)', height: 1, background: 'rgb(var(--grid-wire))' }} />
              <span className="absolute font-mono text-[10px] text-faint" style={{ left: 6, top: '55%' }}>
                {qubits}
              </span>
            </div>
          </div>
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
    </section>
  )
}

export default CircuitGrid