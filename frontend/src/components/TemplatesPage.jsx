import React from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { ALGORITHM_TEMPLATES } from '../data/templates'
import { GATES } from '../config/constants'

// A tiny preview of the gates an algorithm uses, shown as colored chips.
function GatePreview({ gates }) {
  const types = [...new Set(gates.map((g) => g.type))].slice(0, 8)
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => {
        const meta = GATES[t]
        if (!meta) return null
        return (
          <span key={t} className={`gate-tile h-7 w-7 text-[11px] gate-${meta.tone}`}>
            {meta.symbol}
          </span>
        )
      })}
    </div>
  )
}

// Full-page algorithm gallery. Each card names an algorithm and offers a
// "Run Simulation" action that loads it into the circuit store and redirects
// to the main editor (view -> 'editor'), where auto-simulate takes over.
function TemplatesPage() {
  const { loadCircuit, setView } = useCircuitStore()

  const runTemplate = (t) => {
    loadCircuit({ name: t.name, description: t.description, qubits: t.qubits, gates: t.gates })
    setView('editor')
  }

  return (
    <main className="mx-auto w-full max-w-[1560px] flex-1 px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="display-serif text-3xl font-semibold text-ink">Algorithm Templates</h2>
          <p className="mt-1 text-[14px] text-muted">
            Pick a ready-made circuit to load into the editor and simulate.
          </p>
        </div>
        <button
          onClick={() => setView('editor')}
          className="btn-ghost"
        >
          ← Back to Editor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ALGORITHM_TEMPLATES.map((t) => (
          <div key={t.id} className="panel flex flex-col p-5">
            <h3 className="text-[16px] font-semibold text-ink">{t.name}</h3>
            <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted">{t.description}</p>

            <div className="mt-4 flex items-center justify-between gap-2 text-[12px] text-faint">
              <span>{t.qubits} qubits</span>
              <span>{t.gates.length} gates</span>
            </div>

            <div className="mt-3">
              <GatePreview gates={t.gates} />
            </div>

            <button onClick={() => runTemplate(t)} className="run-btn mt-5 w-full justify-center">
              Run Simulation
              <span className="text-[11px]">›</span>
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

export default TemplatesPage
