import React, { useMemo, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { blochVector } from '../utils/quantum'
import BlochSphere from './BlochSphere'

// Same palette used inside BlochSphere so the legend swatches match the vectors exactly.
const VECTOR_PALETTE = ['#c13e76', '#2f7de1', '#2f9e56', '#d9a406', '#7b5ce8', '#e2622b', '#0f9aa8', '#a83f9e']
function vectorColor(i) {
  return VECTOR_PALETTE[i % VECTOR_PALETTE.length]
}

function StateInfoRow({ symbol, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="font-mono text-[12px] text-muted">{symbol}</span>
      <span className="font-mono text-[12px] text-ink">{value}</span>
    </div>
  )
}

function BlochPanel() {
  const { simulationResult, selectedQubit, qubits, setSelectedQubit } = useCircuitStore()
  const [mode, setMode] = useState('2D')
  const [showAll, setShowAll] = useState(false)

  const statevector = simulationResult?.statevector
  const bloch = useMemo(() => {
    const b = blochVector(statevector || [], selectedQubit)
    return { ...b, qubit: selectedQubit }
  }, [statevector, selectedQubit])

  const hasResult = Array.isArray(statevector) && statevector.length >= 2
  const c0 = Math.cos(bloch.theta / 2)
  const c1 = Math.sin(bloch.theta / 2)

  // Per-qubit Bloch vectors, computed only when the "All" tab is active.
  const allBloch = useMemo(() => {
    if (!showAll || !hasResult) return []
    return Array.from({ length: qubits }, (_, i) => ({ qubit: i, ...blochVector(statevector, i) }))
  }, [showAll, hasResult, statevector, qubits])

  const selectQubit = (i) => {
    setSelectedQubit(i)
    setShowAll(false)
  }

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="eyebrow mb-1">Bloch Sphere</div>
          <div className="text-[13px] text-muted">
            {showAll ? `All ${qubits} qubits` : `Qubit ${selectedQubit} state`}
          </div>
        </div>

        {/* State Info box (single-qubit view only) */}
        {!showAll && (
          <div className="min-w-[150px] rounded-lg border border-line bg-panel px-3 py-2">
            <div className="eyebrow mb-1.5 text-[10px]">State Info</div>
            <StateInfoRow symbol="θ" value={hasResult ? `${bloch.theta.toFixed(3)} rad` : '—'} />
            <StateInfoRow symbol="φ" value={hasResult ? `${bloch.phi.toFixed(3)} rad` : '—'} />
            <StateInfoRow
              symbol="|ψ⟩"
              value={hasResult ? `${c0.toFixed(3)}|0⟩` : '—'}
            />
            {hasResult && (
              <div className="text-right font-mono text-[12px] text-ink">
                + {c1.toFixed(3)}|1⟩
              </div>
            )}
          </div>
        )}
      </div>

      {/* Qubit selector, with an "All" tab to view every qubit at once */}
      {qubits > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setShowAll(true)}
            className={`rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors ${
              showAll
                ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.1)] text-[color:rgb(var(--accent))]'
                : 'border-line text-muted hover:border-[rgb(var(--ink)/0.3)]'
            }`}
          >
            All
          </button>
          {Array.from({ length: qubits }).map((_, i) => (
            <button
              key={i}
              onClick={() => selectQubit(i)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors ${
                !showAll && selectedQubit === i
                  ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.1)] text-[color:rgb(var(--accent))]'
                  : 'border-line text-muted hover:border-[rgb(var(--ink)/0.3)]'
              }`}
            >
              q{i}
            </button>
          ))}
        </div>
      )}

      {/* Sphere(s) */}
      {hasResult ? (
        showAll ? (
          <>
            <BlochSphere vectors={allBloch} mode={mode} />
            {/* legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-line bg-panel px-3 py-2">
              {allBloch.map((b) => (
                <button
                  key={b.qubit}
                  onClick={() => selectQubit(b.qubit)}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-muted hover:text-ink"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: vectorColor(b.qubit) }}
                  />
                  q{b.qubit}
                  <span className="text-faint">
                    θ{b.theta.toFixed(2)} φ{b.phi.toFixed(2)}
                  </span>
                  {!b.pure && <span className="text-faint">(mixed)</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <BlochSphere bloch={bloch} mode={mode} />
        )
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-2 text-4xl opacity-30">◍</div>
          <p className="text-[13px] text-muted">Run a simulation to plot the state</p>
        </div>
      )}

      {/* View toggle */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
        <span className="eyebrow text-[10px]">View</span>
        <div className="flex gap-1">
          {['2D', '3D'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                mode === m ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {!showAll && hasResult && !bloch.pure && (
        <p className="mt-2 text-[11px] leading-snug text-faint">
          This qubit is entangled/mixed — its reduced state sits inside the sphere (|r| = {bloch.r.toFixed(2)}).
        </p>
      )}
    </section>
  )
}

export default BlochPanel