import React, { useRef } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import QSphere from './QSphere'

// The ground state |0...0⟩ for a given qubit count — what an empty circuit
// (or a circuit that hasn't been run yet) actually represents. Showing this
// by default means the sphere always reflects the current qubit count, even
// before "Run Simulation" has been pressed, instead of an empty placeholder.
function groundStateVector(qubits) {
  const n = Math.max(1, qubits || 1)
  const dim = 1 << n
  return Array.from({ length: dim }, (_, i) => ({ real: i === 0 ? 1 : 0, imag: 0 }))
}

function BlochPanel() {
  const { simulationResult, qubits, gates } = useCircuitStore()

  // What's actually on screen, held in a ref and resolved synchronously on
  // every render (no useEffect involved). A qubit-count change makes the
  // previous result's dimension stale instantly, but the new, correctly-
  // dimensioned result only arrives after the debounced auto-simulate
  // round-trip. Snapping straight to the ground state the moment it goes
  // stale, then snapping again once the real result lands, reads as the
  // sphere "resetting" mid-edit — so instead: hold the last known-good
  // state until the next correct one is ready, and only jump straight to
  // ground state when that's the genuinely correct instant answer (an
  // empty circuit, which needs no round-trip at all).
  const lastGoodRef = useRef({ statevector: groundStateVector(qubits), qubits })

  if (gates.length === 0) {
    lastGoodRef.current = { statevector: groundStateVector(qubits), qubits }
  } else {
    const sv = simulationResult?.statevector
    const expectedDim = 1 << Math.max(1, qubits || 1)
    if (Array.isArray(sv) && sv.length === expectedDim) {
      lastGoodRef.current = { statevector: sv, qubits }
    }
    // else: a re-simulation for the current edit is still in flight — keep
    // whatever lastGoodRef already holds rather than resetting.
  }

  const displayed = lastGoodRef.current
  const hasResult = Array.isArray(displayed.statevector) && displayed.statevector.length >= 2

  return (
    <section className="panel p-6">
      <div className="mb-4">
        <div className="eyebrow mb-1">Q-Sphere</div>
        <div className="text-[13px] text-muted">
          Joint {displayed.qubits}-qubit statevector · one point per basis state
        </div>
      </div>

      {hasResult ? (
        <QSphere statevector={displayed.statevector} qubits={displayed.qubits} />
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