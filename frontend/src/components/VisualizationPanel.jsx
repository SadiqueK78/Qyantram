import React from 'react'
import { motion } from 'framer-motion'
import { useCircuitStore } from '../store/useCircuitStore'
import BlochSphere from './BlochSphere'
import Histogram from './Histogram'

function VisualizationPanel() {
  const { simulationResult, selectedQubit, qubits, setSelectedQubit } = useCircuitStore()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h2 className="text-xl font-bold mb-4 gradient-text">Visualization</h2>

      {!simulationResult ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl mb-4"
          >
            ⛓️
          </motion.div>
          <p className="text-white/60 text-sm mb-2">No simulation results</p>
          <p className="text-white/40 text-xs">Run a simulation to see results</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Qubit selector */}
          {qubits > 1 && (
            <div className="p-3 bg-dark-700/50 rounded-lg">
              <label className="text-xs text-white/60 mb-2 block">Select Qubit</label>
              <div className="flex gap-2 flex-wrap">
                {Array(qubits)
                  .fill(null)
                  .map((_, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedQubit(i)}
                      className={`
                        px-3 py-1 rounded-lg text-sm font-semibold transition-all
                        ${
                          selectedQubit === i
                            ? 'bg-quantum-blue/50 border border-quantum-blue text-quantum-blue'
                            : 'bg-dark-700 border border-white/10 text-white/70 hover:border-quantum-blue/50'
                        }
                      `}
                    >
                      q{i}
                    </motion.button>
                  ))}
              </div>
            </div>
          )}

          {/* Bloch Sphere */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-700/50 rounded-lg overflow-hidden"
          >
            <BlochSphere result={simulationResult} qubit={selectedQubit} />
          </motion.div>

          {/* Histogram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-700/50 rounded-lg p-3"
          >
            <Histogram result={simulationResult} />
          </motion.div>

          {/* State Info */}
          {simulationResult?.statevector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-3 bg-quantum-blue/10 border border-quantum-blue/20 rounded-lg text-xs max-h-32 overflow-y-auto"
            >
              <p className="font-mono text-white/70 break-all">
                {simulationResult.statevector
                  .slice(0, 4)
                  .map((v, i) => {
                    const amp = Math.sqrt(v.real * v.real + v.imag * v.imag)
                    return `|${i}⟩: ${amp.toFixed(4)}`
                  })
                  .join('\n')}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default VisualizationPanel
