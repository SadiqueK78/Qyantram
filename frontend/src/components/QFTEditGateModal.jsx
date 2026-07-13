import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * "Edit Gate" modal for QFT/IQFT blocks — lets the user pick which qubits
 * the block spans (2 or more), matching the reference checkbox UI. Only
 * consecutive selections are accepted, since the block renders (and the
 * backend applies it) as one contiguous span — same constraint that already
 * governs how the block is dropped/rendered in the circuit editor.
 */
function QFTEditGateModal({ type, qubits, currentTargets, onClose, onSave }) {
  const [selected, setSelected] = useState(() => new Set(currentTargets))

  const sorted = [...selected].sort((a, b) => a - b)
  const contiguous = sorted.length >= 2 && sorted.every((t, i) => i === 0 || t === sorted[i - 1] + 1)
  const valid = sorted.length >= 2 && contiguous

  const toggle = (q) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(q)) next.delete(q)
      else next.add(q)
      return next
    })
  }

  const errorMessage =
    sorted.length === 0
      ? null
      : sorted.length < 2
      ? 'Select at least 2 qubits.'
      : !contiguous
      ? 'Selected qubits must be consecutive (e.g. q0, q1, q2).'
      : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[85] flex items-center justify-center bg-[rgb(var(--ink)/0.35)] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="display-serif text-xl font-semibold text-ink">Edit Gate</h3>
            <button onClick={onClose} className="text-xl leading-none text-faint transition hover:text-ink" aria-label="Close">
              ×
            </button>
          </div>

          <div className="px-6 py-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {type === 'IQFT' ? 'Inverse QFT' : 'QFT'} — select qubits :
            </p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
              {Array.from({ length: qubits }, (_, q) => (
                <label key={q} className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
                  <input
                    type="checkbox"
                    checked={selected.has(q)}
                    onChange={() => toggle(q)}
                    className="h-4 w-4 accent-[color:rgb(var(--accent))]"
                  />
                  q{q}
                </label>
              ))}
            </div>
            {errorMessage && <p className="mt-3 text-[12px] text-[rgb(200_50_50)]">{errorMessage}</p>}
          </div>

          <div className="flex">
            <button
              onClick={onClose}
              className="flex-1 bg-[rgb(110_110_115)] py-3 text-[14px] font-medium text-white transition hover:opacity-90"
            >
              Close
            </button>
            <button
              onClick={() => valid && onSave(sorted)}
              disabled={!valid}
              className="flex-1 bg-[rgb(30_100_240)] py-3 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default QFTEditGateModal