import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// -----------------------------------------------------------------------------
// Static decomposition data for the 2-qubit QFT / IQFT block, matching the
// backend's build_qft_block_gate() exactly:
//   QFT  = h(b); cp(+pi/2, a, b); h(a); swap(a, b)
//   IQFT = swap(a, b); h(a); cp(-pi/2, a, b); h(b)
// (a = top wire / q0, b = bottom wire / q1). Barriers below are purely
// visual stage separators, mirroring how Qniverse groups the steps.
// -----------------------------------------------------------------------------
const QFT_STEPS = [
  { q0: null, q1: { kind: 'H' } },
  { q0: { kind: 'dot' }, q1: { kind: 'P', label: '+π/2' } },
  { barrier: true },
  { q0: { kind: 'H' }, q1: null },
  { barrier: true },
  { q0: { kind: 'swap' }, q1: { kind: 'swap' } },
]

const IQFT_STEPS = [
  { q0: { kind: 'swap' }, q1: { kind: 'swap' } },
  { barrier: true },
  { q0: { kind: 'H' }, q1: null },
  { q0: { kind: 'dot' }, q1: { kind: 'P', label: '−π/2' } },
  { barrier: true },
  { q0: null, q1: { kind: 'H' } },
]

const COL_W = 60
const BARRIER_W = 26
const ROW_H = 64
const CELL = 34

const COLORS = {
  h: '#e15c5c',
  p: '#3f8fd1',
  dot: '#2f6fb8',
  swap: '#4a90d9',
  wire: 'rgb(var(--grid-wire, 210 210 210))',
  barrier: 'rgb(var(--faint, 160 160 160))',
}

function colWidth(step) {
  return step.barrier ? BARRIER_W : COL_W
}

function Tile({ kind, label }) {
  if (kind === 'H') {
    return (
      <div
        className="flex items-center justify-center rounded-md font-mono text-[15px] font-bold text-white shadow-sm"
        style={{ width: CELL, height: CELL, background: COLORS.h }}
      >
        H
      </div>
    )
  }
  if (kind === 'P') {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-md text-center font-mono font-bold text-white shadow-sm leading-none"
        style={{ width: CELL, height: CELL, background: COLORS.p, fontSize: 11 }}
      >
        <span>P</span>
        <span style={{ fontSize: 8, fontWeight: 600 }}>({label})</span>
      </div>
    )
  }
  if (kind === 'dot') {
    return <div className="rounded-full" style={{ width: 12, height: 12, background: COLORS.dot }} />
  }
  if (kind === 'swap') {
    return (
      <div className="flex items-center justify-center font-bold" style={{ width: CELL, height: CELL, color: COLORS.swap, fontSize: 22 }}>
        ×
      </div>
    )
  }
  return null
}

function MiniCircuit({ steps }) {
  const width = steps.reduce((w, s) => w + colWidth(s), 0)
  const height = ROW_H * 2

  let left = 0
  const columns = steps.map((step, i) => {
    const w = colWidth(step)
    const x = left
    left += w
    return { step, x, w, i }
  })

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: width + 8, height }}>
        {/* wires */}
        {[0, 1].map((row) => (
          <div
            key={row}
            className="absolute left-0 right-0"
            style={{ top: ROW_H * row + ROW_H / 2, height: 1, background: COLORS.wire }}
          />
        ))}

        {/* row labels */}
        <span className="absolute font-mono text-[11px] text-faint" style={{ left: -22, top: ROW_H * 0 + ROW_H / 2 - 7 }}>
          q0
        </span>
        <span className="absolute font-mono text-[11px] text-faint" style={{ left: -22, top: ROW_H * 1 + ROW_H / 2 - 7 }}>
          q1
        </span>

        {columns.map(({ step, x, w, i }) => {
          if (step.barrier) {
            return (
              <div
                key={i}
                className="absolute top-0"
                style={{ left: x + w / 2, width: 0, height, borderLeft: `2px dashed ${COLORS.barrier}` }}
              />
            )
          }

          const cx = x + w / 2
          const isControlledP = step.q0?.kind === 'dot' && step.q1?.kind === 'P'
          const isSwapPair = step.q0?.kind === 'swap' && step.q1?.kind === 'swap'

          return (
            <React.Fragment key={i}>
              {(isControlledP || isSwapPair) && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: cx,
                    top: ROW_H / 2,
                    width: 2,
                    height: ROW_H,
                    background: isControlledP ? COLORS.dot : COLORS.swap,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              {[0, 1].map((row) => {
                const cell = row === 0 ? step.q0 : step.q1
                if (!cell) return null
                return (
                  <div
                    key={row}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: cx,
                      top: ROW_H * row + ROW_H / 2,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 2,
                    }}
                  >
                    <Tile kind={cell.kind} label={cell.label} />
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

function QFTExpandModal({ type, onClose, onRemove }) {
  const isInverse = type === 'IQFT'
  const steps = isInverse ? IQFT_STEPS : QFT_STEPS

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgb(var(--ink)/0.35)] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="display-serif text-xl font-semibold text-ink">
                {isInverse ? 'IQFT' : 'QFT'} Gate Expand
              </h3>
              <p className="mt-1 text-[12px] text-muted">
                The 2-qubit {isInverse ? 'inverse QFT' : 'QFT'} block, unrolled into elementary gates.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-xl leading-none text-faint transition hover:text-ink"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="rounded-xl border border-line bg-panel px-6 py-8">
            <MiniCircuit steps={steps} />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="font-mono text-[11px] text-faint">
              {isInverse
                ? 'swap(a,b) · h(a) · cp(−π/2, a, b) · h(b)'
                : 'h(b) · cp(+π/2, a, b) · h(a) · swap(a,b)'}
            </span>
            {onRemove && (
              <button
                onClick={onRemove}
                className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-[rgb(220_60_60/0.4)] hover:text-[rgb(200_50_50)]"
              >
                Remove gate
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default QFTExpandModal