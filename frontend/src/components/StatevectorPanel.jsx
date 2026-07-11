import React from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { amplitudeRows } from '../utils/quantum'

function StatevectorPanel() {
  const { simulationResult } = useCircuitStore()
  const rows = amplitudeRows(simulationResult?.statevector || [])

  return (
    <section className="panel p-6">
      <div className="eyebrow mb-3">
        Statevector <span className="text-faint">(amplitudes)</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">Run a simulation to view amplitudes</p>
      ) : (
        <div className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
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
      )}
    </section>
  )
}

export default StatevectorPanel
