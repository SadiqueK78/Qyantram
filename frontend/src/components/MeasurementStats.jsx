import React, { useMemo, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import Histogram from './Histogram'

// A short natural-language summary of the outcome distribution.
function buildCaption(result) {
  const probs = result?.probabilities
  if (!probs) return null
  const entries = Object.entries(probs).filter(([, p]) => p > 1e-6)
  if (entries.length === 0) return null
  if (entries.length === 1) {
    return `The circuit produces a definite outcome |${entries[0][0]}⟩ with certainty.`
  }
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 2)
  const even = Math.abs(top[0][1] - top[1][1]) < 0.02
  if (entries.length === 2 && even) {
    return `The circuit generates an equal superposition of |${top[0][0]}⟩ and |${top[1][0]}⟩, giving correlated measurement outcomes.`
  }
  return `Measurement is spread across ${entries.length} basis states, peaking at |${top[0][0]}⟩ (${(top[0][1] * 100).toFixed(1)}%).`
}

// An empty circuit deterministically measures |0...0⟩ every shot at the
// current qubit count — no round-trip needed, so build that result locally
// instead of falling back to "no data" (which is what simulationResult
// being null would otherwise show).
function groundResult(qubits, shots) {
  const bitstring = '0'.repeat(Math.max(1, qubits || 1))
  return {
    probabilities: { [bitstring]: 1 },
    counts: { [bitstring]: shots },
  }
}

function MeasurementStats() {
  const { simulationResult, shots, qubits, gates } = useCircuitStore()
  const [mode, setMode] = useState('probability')

  const displayedResult = useMemo(
    () => (gates.length === 0 ? groundResult(qubits, shots) : simulationResult),
    [gates.length, qubits, shots, simulationResult]
  )

  const hasResult = !!displayedResult?.probabilities
  const caption = hasResult ? buildCaption(displayedResult) : null

  const exportResults = () => {
    if (!displayedResult) return
    const blob = new Blob([JSON.stringify(displayedResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qyantram-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="eyebrow mb-1">Measurement Statistics</div>
          <div className="text-[13px] text-muted">{shots} shots</div>
        </div>
        <div className="relative">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none"
          >
            <option value="probability">View: Probability</option>
            <option value="counts">View: Counts</option>
          </select>
        </div>
      </div>

      {hasResult ? (
        <>
          <Histogram result={displayedResult} mode={mode} />
          {caption && (
            <p className="mt-4 border-t border-line pt-3 font-serif text-[13px] italic leading-relaxed text-muted">
              {caption}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button className="btn-ghost" onClick={exportResults}>
              Export Results ↧
            </button>
          </div>
        </>
      ) : (
        <div className="py-10 text-center text-[13px] text-muted">Run a simulation to see statistics</div>
      )}
    </section>
  )
}

export default MeasurementStats