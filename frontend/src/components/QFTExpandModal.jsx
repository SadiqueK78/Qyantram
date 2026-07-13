import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// -----------------------------------------------------------------------------
// Generates the elementary-gate decomposition for an n-qubit QFT/IQFT block,
// matching build_qft_block_gate() in the backend exactly:
//
//   for m in reversed(range(n)):
//       h(m)
//       for control in range(m):
//           cp(pi / 2**(m-control), control, m)
//   for i in range(n // 2):
//       swap(i, n-1-i)
//
// (verified against Qiskit's QFT(n, do_swaps=True) reference for n=2..5).
// IQFT reverses the whole op list and negates every CP angle (H and SWAP are
// self-inverse) — exactly what Gate.inverse() does to this same circuit on
// the backend.
// -----------------------------------------------------------------------------
function buildOps(n) {
  const rotation = []
  for (let m = n - 1; m >= 0; m--) {
    rotation.push({ kind: 'H', row: m })
    for (let control = 0; control < m; control++) {
      rotation.push({ kind: 'CP', control, target: m, theta: Math.PI / 2 ** (m - control) })
    }
  }
  const swaps = []
  for (let i = 0; i < Math.floor(n / 2); i++) {
    swaps.push({ kind: 'SWAP', a: i, b: n - 1 - i })
  }
  return { rotation, swaps }
}

function angleLabel(theta) {
  const sign = theta < 0 ? '−' : '+'
  const k = Math.round(Math.log2(Math.PI / Math.abs(theta)))
  return k === 0 ? `${sign}π` : `${sign}π/${2 ** k}`
}

function buildColumns(n, inverse) {
  const { rotation, swaps } = buildOps(n)
  const opsInOrder = inverse
    ? [
        ...swaps.slice().reverse(),
        { barrier: true },
        ...rotation
          .slice()
          .reverse()
          .map((op) => (op.kind === 'CP' ? { ...op, theta: -op.theta } : op)),
      ]
    : [...rotation, { barrier: true }, ...swaps]

  return opsInOrder.map((op) => {
    if (op.barrier) return { barrier: true }
    if (op.kind === 'H') return { ops: [{ row: op.row, kind: 'H' }] }
    if (op.kind === 'CP') {
      return {
        ops: [
          { row: op.control, kind: 'dot' },
          { row: op.target, kind: 'P', label: angleLabel(op.theta) },
        ],
        connector: { from: op.control, to: op.target, color: 'dot' },
      }
    }
    // SWAP
    return {
      ops: [
        { row: op.a, kind: 'swap' },
        { row: op.b, kind: 'swap' },
      ],
      connector: { from: op.a, to: op.b, color: 'swap' },
    }
  })
}

const COL_W = 56
const BARRIER_W = 26
const ROW_H = 60
const CELL = 32

const COLORS = {
  h: '#e15c5c',
  p: '#3f8fd1',
  dot: '#2f6fb8',
  swap: '#4a90d9',
  wire: 'rgb(var(--grid-wire, 210 210 210))',
  barrier: 'rgb(var(--faint, 160 160 160))',
}

function colWidth(col) {
  return col.barrier ? BARRIER_W : COL_W
}

function Tile({ kind, label }) {
  if (kind === 'H') {
    return (
      <div
        className="flex items-center justify-center rounded-md font-mono text-[14px] font-bold text-white shadow-sm"
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
        style={{ width: CELL, height: CELL, background: COLORS.p, fontSize: 10 }}
      >
        <span>P</span>
        <span style={{ fontSize: 7, fontWeight: 600 }}>({label})</span>
      </div>
    )
  }
  if (kind === 'dot') {
    return <div className="rounded-full" style={{ width: 11, height: 11, background: COLORS.dot }} />
  }
  if (kind === 'swap') {
    return (
      <div className="flex items-center justify-center font-bold" style={{ width: CELL, height: CELL, color: COLORS.swap, fontSize: 20 }}>
        ×
      </div>
    )
  }
  return null
}

function MiniCircuit({ n, columns }) {
  const width = columns.reduce((w, c) => w + colWidth(c), 0)
  const height = ROW_H * n

  let left = 0
  const positioned = columns.map((col) => {
    const w = colWidth(col)
    const x = left
    left += w
    return { col, x, w }
  })

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: width + 8, height }}>
        {/* wires */}
        {Array.from({ length: n }, (_, row) => (
          <div
            key={row}
            className="absolute left-0 right-0"
            style={{ top: ROW_H * row + ROW_H / 2, height: 1, background: COLORS.wire }}
          />
        ))}

        {/* row labels */}
        {Array.from({ length: n }, (_, row) => (
          <span
            key={row}
            className="absolute font-mono text-[11px] text-faint"
            style={{ left: -24, top: ROW_H * row + ROW_H / 2 - 7 }}
          >
            q{row}
          </span>
        ))}

        {positioned.map(({ col, x, w }, i) => {
          if (col.barrier) {
            return (
              <div
                key={i}
                className="absolute top-0"
                style={{ left: x + w / 2, width: 0, height, borderLeft: `2px dashed ${COLORS.barrier}` }}
              />
            )
          }

          const cx = x + w / 2
          return (
            <React.Fragment key={i}>
              {col.connector && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: cx,
                    top: ROW_H * Math.min(col.connector.from, col.connector.to) + ROW_H / 2,
                    width: 2,
                    height: Math.abs(col.connector.to - col.connector.from) * ROW_H,
                    background: col.connector.color === 'swap' ? COLORS.swap : COLORS.dot,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              {col.ops.map((op, j) => (
                <div
                  key={j}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: cx,
                    top: ROW_H * op.row + ROW_H / 2,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                  }}
                >
                  <Tile kind={op.kind} label={op.label} />
                </div>
              ))}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

function QFTExpandModal({ type, targets, onClose, onRemove, onEdit }) {
  const isInverse = type === 'IQFT'
  const n = Math.max(2, targets?.length || 2)
  const columns = buildColumns(n, isInverse)

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
          className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="display-serif text-xl font-semibold text-ink">
                {isInverse ? 'IQFT' : 'QFT'} Gate Expand
              </h3>
              <p className="mt-1 text-[12px] text-muted">
                The {n}-qubit {isInverse ? 'inverse QFT' : 'QFT'} block
                {targets ? ` (q${targets[0]}–q${targets[targets.length - 1]})` : ''}, unrolled into elementary gates.
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

          <div className="rounded-xl border border-line bg-panel px-6 py-8 pl-9">
            <MiniCircuit n={n} columns={columns} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="font-mono text-[11px] text-faint">
              H · controlled-phase · swap, on qubits 0..{n - 1}
            </span>
            <div className="flex shrink-0 gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-[rgb(var(--accent))] hover:text-ink"
                >
                  Edit qubits
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-[rgb(220_60_60/0.4)] hover:text-[rgb(200_50_50)]"
                >
                  Remove gate
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default QFTExpandModal