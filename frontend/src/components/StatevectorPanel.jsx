import React, { useMemo } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { amplitudeRows } from '../utils/quantum'
import CardHeader from './CardHeader'

// The ground state |0...0⟩ for a given qubit count — same fallback used by
// BlochPanel, so an empty circuit reads consistently across every panel
// instead of only the Q-sphere reflecting the current qubit count.
function groundStateVector(qubits) {
  const n = Math.max(1, qubits || 1)
  const dim = 1 << n
  return Array.from({ length: dim }, (_, i) => ({ real: i === 0 ? 1 : 0, imag: 0 }))
}

function StatevectorPanel() {
  const { simulationResult, qubits, gates } = useCircuitStore()

  // An empty circuit has no round-trip to wait on — its statevector is
  // known instantly (|0...0⟩ at the current qubit count), so show that
  // instead of a stale/absent simulationResult from before a Reset or a
  // qubit-count change.
  const displayedStatevector = useMemo(() => {
    if (gates.length === 0) return groundStateVector(qubits)
    return simulationResult?.statevector || []
  }, [gates.length, qubits, simulationResult])

  const rows = amplitudeRows(displayedStatevector)

  return (
    <section className="panel flex flex-col p-6">
      <CardHeader title="Statevector" info="Complex amplitudes of each basis state (magnitude shown)." />

      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">Run a simulation to view amplitudes</p>
      ) : (
        /* Absolute-fill list: the card adopts the neighbouring Circuit Details
           height and the amplitudes scroll inside it rather than growing the
           card. min-h keeps a sensible floor when the row is short. */
        <div className="relative min-h-[200px] flex-1">
          <div className="absolute inset-0 space-y-1 overflow-y-auto pr-1">
            {rows.map((r) => (
              <div key={r.index} className="flex items-center gap-3">
                <span className="w-16 font-mono text-[12px] text-ink">|{r.bitstring}⟩</span>
                <span className="w-12 text-right font-mono text-[12px] text-muted">{r.mag.toFixed(3)}</span>
                <div className="amp-track h-1.5 flex-1">
                  <div
                    className={`amp-fill ${r.prob < 0.02 ? 'faded' : ''}`}
                    style={{ width: `${Math.min(100, r.mag * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default StatevectorPanel