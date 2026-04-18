import React, { useState } from 'react'
import { useDrop } from 'react-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { useCircuitStore } from '../store/useCircuitStore'
import CircuitCell from './CircuitCell'

function CircuitGrid() {
  const { qubits, steps, circuit } = useCircuitStore()
  const [hoveredCell, setHoveredCell] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h2 className="text-xl font-bold mb-4 gradient-text">Quantum Circuit</h2>

      {/* Circuit info */}
      <div className="flex justify-between items-center mb-4 text-sm text-white/60">
        <span>{qubits} qubits × {steps} steps</span>
        <span className="text-quantum-blue">
          {circuit.flat().filter((x) => x !== null).length} gates
        </span>
      </div>

      {/* Grid with wire overlay */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Qubit labels and circuit */}
          {Array(qubits)
            .fill(null)
            .map((_, qubitIdx) => (
              <motion.div
                key={`qubit-${qubitIdx}`}
                className="flex items-stretch mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05, delay: qubitIdx * 0.05 }}
              >
                {/* Qubit label */}
                <div className="w-12 flex items-center justify-center font-bold text-quantum-blue text-sm">
                  q{qubitIdx}
                </div>

                {/* Wire and cells */}
                <div className="flex items-center">
                  {Array(steps)
                    .fill(null)
                    .map((_, stepIdx) => (
                      <div key={`cell-${qubitIdx}-${stepIdx}`} className="relative">
                        {/* Connecting wire */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-quantum-blue/30 to-quantum-blue/10 transform -translate-y-1/2 -z-10"></div>

                        {/* Cell */}
                        <CircuitCell
                          qubit={qubitIdx}
                          step={stepIdx}
                          onHover={(isHovered) =>
                            setHoveredCell(
                              isHovered ? { qubit: qubitIdx, step: stepIdx } : null
                            )
                          }
                          isHovered={
                            hoveredCell?.qubit === qubitIdx &&
                            hoveredCell?.step === stepIdx
                          }
                        />
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Step numbers */}
      <div className="flex mt-4 ml-12">
        {Array(Math.min(steps, 10))
          .fill(null)
          .map((_, i) => (
            <div
              key={`step-${i}`}
              className="w-12 h-12 flex items-center justify-center text-xs text-white/40 font-mono"
            >
              {i}
            </div>
          ))}
        {steps > 10 && (
          <div className="px-2 text-white/40 text-xs">
            ... +{steps - 10} more
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CircuitGrid
