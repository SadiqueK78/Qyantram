import React, { useMemo, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import Histogram from './Histogram'
import CardHeader from './CardHeader'

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
    <section className="panel flex flex-col p-6">
      <CardHeader
        title={mode === 'counts' ? 'Measurement Counts' : 'Probability Distribution'}
        options={['Probability Distribution', 'Measurement Counts']}
        onSelect={(opt) => setMode(opt === 'Measurement Counts' ? 'counts' : 'probability')}
        info={`Outcome distribution over ${shots} shots — the chance of measuring each computational basis state.`}
        menu={[{ label: 'Export Results ↧', onClick: exportResults }]}
      />

      {hasResult ? (
        /* The chart lives in an absolute-fill wrapper so this card doesn't
           drive the grid row's height — it adopts the Q-sphere's height and
           the chart stretches to fill it exactly. */
        <div className="relative min-h-[280px] flex-1">
          <div className="absolute inset-0 flex flex-col">
            <div className="min-h-0 flex-1">
              <Histogram result={displayedResult} mode={mode} />
            </div>
            {caption && (
              <p className="mt-3 border-t border-line pt-3 font-serif text-[13px] italic leading-relaxed text-muted">
                {caption}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-[13px] text-muted">Run a simulation to see statistics</div>
      )}
    </section>
  )
}

export default MeasurementStats