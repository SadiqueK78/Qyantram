import React from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import QSphere from './QSphere'

function BlochPanel() {
  const { simulationResult, qubits } = useCircuitStore()
  const statevector = simulationResult?.statevector
  const hasResult = Array.isArray(statevector) && statevector.length >= 2

  return (
    <section className="panel p-6">
      <div className="mb-4">
        <div className="eyebrow mb-1">Q-Sphere</div>
        <div className="text-[13px] text-muted">
          Joint {qubits}-qubit statevector · one point per basis state
        </div>
      </div>

      {hasResult ? (
        <QSphere statevector={statevector} qubits={qubits} />
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-2 text-4xl opacity-30">◍</div>
          <p className="text-[13px] text-muted">Run a simulation to plot the state</p>
        </div>
      )}
    </section>
  )
}

export default BlochPanel