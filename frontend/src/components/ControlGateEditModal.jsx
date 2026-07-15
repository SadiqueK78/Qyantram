import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * "Edit Gate" modal for CNOT/CCNOT — unlike QFT's modal (pick a contiguous
 * range), here the target and control(s) play different roles and can be
 * any distinct wires, so this asks for them separately: one radio group for
 * the target, then checkboxes for the control(s) (1 for CNOT, 2 for CCNOT),
 * with the current target disabled as a control choice.
 */
function ControlGateEditModal({ type, qubits, currentTarget, currentControls, onClose, onSave }) {
  const [target, setTarget] = useState(currentTarget)
  const [controls, setControls] = useState(() => new Set(currentControls))

  const neededControls = type === 'CCNOT' ? 2 : 1
  const controlList = [...controls].filter((c) => c !== target)
  const valid = controlList.length === neededControls && Number.isInteger(target)

  const setTargetAndClean = (q) => {
    setTarget(q)
    setControls((prev) => {
      const next = new Set(prev)
      next.delete(q)
      return next
    })
  }

  const toggleControl = (q) => {
    if (q === target) return
    setControls((prev) => {
      const next = new Set(prev)
      if (next.has(q)) {
        next.delete(q)
      } else if (next.size < neededControls) {
        next.add(q)
      }
      return next
    })
  }

  const errorMessage =
    controlList.length === 0
      ? null
      : controlList.length < neededControls
      ? `Select ${neededControls} control qubit${neededControls > 1 ? 's' : ''}.`
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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {type === 'CCNOT' ? 'Toffoli' : 'CNOT'} — target qubit :
            </p>
            <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
              {Array.from({ length: qubits }, (_, q) => (
                <label key={q} className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
                  <input
                    type="radio"
                    name="target-qubit"
                    checked={target === q}
                    onChange={() => setTargetAndClean(q)}
                    className="h-4 w-4 accent-[color:rgb(var(--accent))]"
                  />
                  q{q}
                </label>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Control qubit{neededControls > 1 ? 's' : ''} :
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {Array.from({ length: qubits }, (_, q) => (
                <label
                  key={q}
                  className={`flex items-center gap-2 text-[14px] ${
                    q === target ? 'cursor-not-allowed text-faint opacity-40' : 'cursor-pointer text-ink'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={q === target}
                    checked={controls.has(q) && q !== target}
                    onChange={() => toggleControl(q)}
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
              onClick={() => valid && onSave({ target, controls: controlList })}
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

export default ControlGateEditModal
