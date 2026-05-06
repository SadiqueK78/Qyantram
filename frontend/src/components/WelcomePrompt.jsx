import React from 'react'
import { motion } from 'framer-motion'

const ADVANCED_FEATURES = [
  {
    title: 'Algorithm Marketplace',
    detail: 'One-click Grover, QFT, teleportation, superdense coding, bit-flip, and Deutsch-Jozsa templates.',
  },
  {
    title: '3D Quantum Visuals',
    detail: 'Interactive Bloch and Q-sphere style visualizations with live probability feedback.',
  },
  {
    title: 'Multi-Circuit Workflow',
    detail: 'Load a full circuit pack, switch tabs fast, and compare outcomes in one session.',
  },
  {
    title: 'Advanced Gate Composer',
    detail: 'CCNOT, SWAP, barriers, resets, parameterized rotations, and controlled operations.',
  },
]

function WelcomePrompt({ onStart }) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false)

  const handleStart = () => {
    onStart(dontShowAgain)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="welcome-prompt-panel w-full max-w-6xl rounded-3xl border border-white/15 bg-slate-900/70 p-5 shadow-2xl md:p-8"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
                Quantum Startup Experience
              </span>

              <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
                <span className="gradient-text">Welcome to Qyantram</span>
              </h2>
              <p className="text-lg text-white/70">Quantum Logic Gate Simulator</p>

              <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base">
                Design and simulate quantum circuits in a production-grade interface. Start with curated algorithms
                or build your own workflow from scratch.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ADVANCED_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-white/10 bg-slate-800/45 p-3"
                  >
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-xs text-slate-300">{feature.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900"
                />
                Do not show this prompt again
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStart}
                  className="rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30"
                >
                  Enter Simulator
                </button>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-slate-900/65 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">3D Quantum Visualization</h3>
              <span className="rounded-full border border-purple-300/35 bg-purple-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-200">
                Live
              </span>
            </div>

            <div className="quantum-scene-wrap">
              <div className="quantum-scene-core" />
              <div className="quantum-ring quantum-ring-a" />
              <div className="quantum-ring quantum-ring-b" />
              <div className="quantum-ring quantum-ring-c" />
              <div className="quantum-orbit-dot quantum-dot-a" />
              <div className="quantum-orbit-dot quantum-dot-b" />
              <div className="quantum-orbit-dot quantum-dot-c" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-300">
              <div className="rounded-lg border border-white/10 bg-slate-800/45 p-2">
                <p className="text-[10px] uppercase text-white/55">Qubits</p>
                <p className="mt-1 font-semibold text-cyan-200">1-5</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/45 p-2">
                <p className="text-[10px] uppercase text-white/55">Gate Set</p>
                <p className="mt-1 font-semibold text-fuchsia-200">Advanced</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/45 p-2">
                <p className="text-[10px] uppercase text-white/55">Templates</p>
                <p className="mt-1 font-semibold text-indigo-200">Algorithmic</p>
              </div>
            </div>

            {/* Quick Start & Highlights Section */}
            <div className="mt-5 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Quick Start Challenges</p>
              <div className="grid grid-cols-2 gap-2">
                <motion.div
                  whileHover={{ scale: 1.03, borderColor: 'rgba(34, 211, 238, 0.6)' }}
                  className="rounded-lg border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-2.5 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  <p className="text-xs font-semibold text-cyan-200">🔔 Bell State</p>
                  <p className="text-[9px] text-white/60 mt-0.5">Create entanglement</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03, borderColor: 'rgba(99, 102, 241, 0.6)' }}
                  className="rounded-lg border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-2.5 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  <p className="text-xs font-semibold text-indigo-200">📊 Learn Gates</p>
                  <p className="text-[9px] text-white/60 mt-0.5">AI-guided tutorial</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 rounded-lg border border-purple-400/20 bg-gradient-to-r from-purple-500/8 to-pink-500/8 p-2.5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">✨</span>
                  <div>
                    <p className="text-xs font-semibold text-white">Ready to explore quantum?</p>
                    <p className="text-[9px] text-white/60 mt-0.5">Start with algorithms • or build from scratch</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-lg border border-white/15 bg-slate-900/60 p-4 text-center text-[11px] text-white/70"
        >
          <p className="font-semibold text-white mb-2">Developed by</p>
          <p>Sadique Khatib, Sharyu Kekane, Akshada Kale, Abhushan Bokade</p>
          <p className="mt-2 font-semibold text-white/80">K K WAGH INSTITUTE OF ENGINEERING EDUCATION AND RESEARCH, NASHIK</p>
          <p className="mt-2">Guided by Dr Uday Wad and Dr S M Kamalapur</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default WelcomePrompt
