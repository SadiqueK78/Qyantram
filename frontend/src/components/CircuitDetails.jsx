import React from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import CardHeader from './CardHeader'

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-mono text-[13px] text-ink">{value}</span>
    </div>
  )
}

function CircuitDetails() {
  const { qubits, gates, shots } = useCircuitStore()

  const usedSteps = new Set(gates.map((g) => g.step))
  const depth = usedSteps.size
  const twoQubit = gates.filter((g) => ['CNOT', 'SWAP', 'CCNOT'].includes(g.type)).length

  return (
    <section className="panel p-6">
      <CardHeader title="Circuit Details" info="Structural metrics for the current circuit." />
      <Row label="Depth" value={depth} />
      <Row label="Width" value={qubits} />
      <Row label="Gate Count" value={gates.length} />
      <Row label="Two-Qubit Gates" value={twoQubit} />
      <Row label="Simulation Method" value="Statevector" />
      <Row label="Shots" value={shots} />
    </section>
  )
}

export default CircuitDetails
