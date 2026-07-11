import React from 'react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    title: 'Algorithm Templates',
    detail: 'One-click Bell, Grover, QFT, teleportation, superdense coding, and Deutsch-Jozsa circuits.',
  },
  {
    title: 'True Bloch Sphere',
    detail: 'Per-qubit state visualization from the reduced density matrix, in 2D and interactive 3D.',
  },
  {
    title: 'Composer-Style Editing',
    detail: 'Drag gates onto wires and drag control points across qubits — no dialogs.',
  },
  {
    title: 'Live Statistics',
    detail: 'Statevector amplitudes and measurement histograms update on every run.',
  },
]

function WelcomePrompt({ onStart }) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(var(--ink)/0.35)] p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-8 shadow-2xl md:p-10"
      >
        <div className="eyebrow mb-3">Quantum Simulator · v1.0</div>
        <h2 className="display-serif text-4xl font-semibold leading-[1.02] text-ink md:text-5xl">
          Welcome to Qyantram
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Design and simulate quantum circuits in a clean, editorial interface. Start from a curated
          algorithm or build your own from scratch, then watch the state evolve.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-panel p-4">
              <h3 className="text-[14px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{f.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 accent-[color:rgb(var(--accent))]"
            />
            Do not show this again
          </label>
          <button className="btn-solid" onClick={() => onStart(dontShowAgain)}>
            Enter Simulator →
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
          Developed by Sadique Khatib, Sharyu Kekane, Akshada Kale, Abhushan Bokade · K. K. Wagh
          Institute of Engineering Education and Research, Nashik
        </p>
      </motion.div>
    </motion.div>
  )
}

export default WelcomePrompt
