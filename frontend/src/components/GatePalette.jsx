import React from 'react'
import { useDrag } from 'react-dnd'
import { motion } from 'framer-motion'

const GATE_GROUPS = [
  {
    title: 'Single-Qubit',
    gates: [
      { type: 'H', label: 'Hadamard', symbol: 'H', description: 'Hadamard gate' },
      { type: 'I', label: 'Identity', symbol: 'I', description: 'Identity gate' },
      { type: 'X', label: 'Pauli X', symbol: 'X', description: 'NOT gate' },
      { type: 'Y', label: 'Pauli Y', symbol: 'Y', description: 'Y gate' },
      { type: 'Z', label: 'Pauli Z', symbol: 'Z', description: 'Z gate' },
      { type: 'SX', label: 'Sqrt X', symbol: '√X', description: 'Square-root X gate' },
      { type: 'SXdg', label: 'Sqrt X†', symbol: '√X†', description: 'Square-root X dagger gate' },
    ],
  },
  {
    title: 'Phase',
    gates: [
      { type: 'S', label: 'S', symbol: 'S', description: 'Phase gate S' },
      { type: 'Sdg', label: 'S†', symbol: 'S†', description: 'S dagger gate' },
      { type: 'T', label: 'T', symbol: 'T', description: 'T gate' },
      { type: 'Tdg', label: 'T†', symbol: 'T†', description: 'T dagger gate' },
      { type: 'P', label: 'Phase', symbol: 'P(θ)', description: 'Phase rotation (angle)' },
    ],
  },
  {
    title: 'Rotations',
    gates: [
      { type: 'RX', label: 'RX', symbol: 'Rx', description: 'X-axis rotation (angle)' },
      { type: 'RY', label: 'RY', symbol: 'Ry', description: 'Y-axis rotation (angle)' },
      { type: 'RZ', label: 'RZ', symbol: 'Rz', description: 'Z-axis rotation (angle)' },
    ],
  },
  {
    title: 'Control & Utility',
    gates: [
      { type: 'CNOT', label: 'CNOT', symbol: '◎⊕', description: 'Controlled NOT' },
      { type: 'CCNOT', label: 'CCNOT', symbol: '◎◎⊕', description: 'Double-controlled NOT (Toffoli)' },
      { type: 'SWAP', label: 'SWAP', symbol: '××', description: 'Swap two qubits' },
      { type: 'Measure', label: 'Measure', symbol: 'M', description: 'Measurement' },
      { type: 'Reset', label: 'Reset', symbol: '|0⟩', description: 'Reset to |0⟩' },
      { type: 'Barrier', label: 'Barrier', symbol: '|', description: 'Barrier separator' },
    ],
  },
]

function DraggableGate({ gate }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GATE',
    item: { type: gate.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`composer-gate-tile ${isDragging ? 'opacity-50' : ''}`}
      title={gate.description}
    >
      <div className={`gate-icon ${gate.type.toLowerCase()} cursor-grab active:cursor-grabbing`}>
        {gate.symbol}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white truncate">{gate.label}</p>
      </div>
    </motion.div>
  )
}

function GatePalette() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h2 className="text-xl font-bold mb-4 gradient-text">Gate Palette</h2>
      <p className="text-white/50 text-sm mb-4">
        Drag gates to the circuit
      </p>

      <div className="space-y-4">
        {GATE_GROUPS.map((group) => (
          <section key={group.title} className="composer-gate-section">
            <div className="composer-gate-header">{group.title}</div>
            <div className="composer-gate-grid">
              {group.gates.map((gate) => (
                <DraggableGate key={gate.type} gate={gate} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-3 bg-quantum-blue/5 border border-quantum-blue/20 rounded-lg"
      >
        <p className="text-xs text-quantum-blue">
          Tip: CNOT/CCNOT ask for control qubits, SWAP asks for partner qubit, and rotation/phase gates ask for angle.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default GatePalette
