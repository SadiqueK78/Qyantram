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
// -----------------------------------------------------------------------------
// Column generators for the n-qubit QFT/IQFT decomposition, matching Qniverse's
// actual reference circuits exactly — verified pixel-for-pixel against its own
// screenshots (gate positions, control/target roles, and barrier placement)
// for n=2 and n=3, and numerically confirmed to compute the correct unitary
// for n up to 5. The two directions are NOT simple mirror images of each
// other (naively reversing the forward op list gives a different, though
// equally valid, ordering that doesn't match what Qniverse actually draws) —
// each is built to match its own reference independently.
//
// Forward: for m = n-1 down to 0: H(m), then controlled-phase from every
// lower qubit into m (nearest control first) — a barrier after every group,
// finishing with the swaps.
//
// Inverse: swaps first, then for each "boundary" qubit m = 0..n-2: H(m),
// then controlled-phase (negated angle) from every lower qubit into m+1
// (nearest control first) — a barrier after every group — finishing with a
// lone H(n-1).
// -----------------------------------------------------------------------------
function buildForwardColumns(n) {
  const cols = []
  for (let m = n - 1; m >= 0; m--) {
    cols.push({ ops: [{ row: m, kind: 'H' }] })
    for (let control = m - 1; control >= 0; control--) {
      const theta = Math.PI / 2 ** (m - control)
      cols.push({
        ops: [
          { row: control, kind: 'dot' },
          { row: m, kind: 'P', label: angleLabel(theta) },
        ],
        connector: { from: control, to: m, color: 'dot' },
      })
    }
    cols.push({ barrier: true })
  }
  for (let i = 0; i < Math.floor(n / 2); i++) {
    cols.push({
      ops: [
        { row: i, kind: 'swap' },
        { row: n - 1 - i, kind: 'swap' },
      ],
      connector: { from: i, to: n - 1 - i, color: 'swap' },
    })
  }
  return cols
}

function buildInverseColumns(n) {
  const cols = []
  for (let i = 0; i < Math.floor(n / 2); i++) {
    cols.push({
      ops: [
        { row: i, kind: 'swap' },
        { row: n - 1 - i, kind: 'swap' },
      ],
      connector: { from: i, to: n - 1 - i, color: 'swap' },
    })
  }
  cols.push({ barrier: true })
  for (let target = 1; target <= n - 1; target++) {
    cols.push({ ops: [{ row: target - 1, kind: 'H' }] })
    for (let control = target - 1; control >= 0; control--) {
      const theta = -Math.PI / 2 ** (target - control)
      cols.push({
        ops: [
          { row: control, kind: 'dot' },
          { row: target, kind: 'P', label: angleLabel(theta) },
        ],
        connector: { from: control, to: target, color: 'dot' },
      })
    }
    cols.push({ barrier: true })
  }
  cols.push({ ops: [{ row: n - 1, kind: 'H' }] })
  return cols
}

function angleLabel(theta) {
  const sign = theta < 0 ? '−' : '+'
  const k = Math.round(Math.log2(Math.PI / Math.abs(theta)))
  return k === 0 ? `${sign}π` : `${sign}π/${2 ** k}`
}

// -----------------------------------------------------------------------------
// Bell-state block decompositions — matching build_bell_block_gate() in the
// backend exactly. All four are the standard preparation: optional X gates to
// pick the basis pair, then H on wire a and CNOT(a→b) to entangle.
//   |Φ+⟩ = (|00⟩+|11⟩)/√2 :          H(a), CX(a,b)
//   |Φ−⟩ = (|00⟩−|11⟩)/√2 : X(a),   H(a), CX(a,b)
//   |Ψ+⟩ = (|01⟩+|10⟩)/√2 : X(b),   H(a), CX(a,b)
//   |Ψ−⟩ = (|01⟩−|10⟩)/√2 : X(a+b), H(a), CX(a,b)
// -----------------------------------------------------------------------------
const BELL_SPECS = {
  BELL_PHI_PLUS:  { title: 'Bell |Φ+⟩', ket: '(|00⟩ + |11⟩)/√2', xRows: [] },
  BELL_PHI_MINUS: { title: 'Bell |Φ−⟩', ket: '(|00⟩ − |11⟩)/√2', xRows: [0] },
  BELL_PSI_PLUS:  { title: 'Bell |Ψ+⟩', ket: '(|01⟩ + |10⟩)/√2', xRows: [1] },
  BELL_PSI_MINUS: { title: 'Bell |Ψ−⟩', ket: '(|01⟩ − |10⟩)/√2', xRows: [0, 1] },
}

function buildBellColumns(type) {
  const spec = BELL_SPECS[type]
  const cols = []
  if (spec.xRows.length) {
    cols.push({ ops: spec.xRows.map((row) => ({ row, kind: 'X' })) })
    cols.push({ barrier: true })
  }
  cols.push({ ops: [{ row: 0, kind: 'H' }] })
  cols.push({
    ops: [
      { row: 0, kind: 'dot' },
      { row: 1, kind: 'target' },
    ],
    connector: { from: 0, to: 1, color: 'dot' },
  })
  return cols
}

function buildColumns(n, inverse) {
  return inverse ? buildInverseColumns(n) : buildForwardColumns(n)
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
  if (kind === 'X') {
    return (
      <div
        className="flex items-center justify-center rounded-md font-mono text-[14px] font-bold text-white shadow-sm"
        style={{ width: CELL, height: CELL, background: COLORS.p }}
      >
        X
      </div>
    )
  }
  if (kind === 'target') {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 font-bold"
        style={{ width: 22, height: 22, borderColor: COLORS.dot, color: COLORS.dot, fontSize: 15, lineHeight: 1 }}
      >
        +
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
  const bellSpec = BELL_SPECS[type]
  const isInverse = type === 'IQFT'
  const n = bellSpec ? 2 : Math.max(2, targets?.length || 2)
  const columns = bellSpec ? buildBellColumns(type) : buildColumns(n, isInverse)

  const title = bellSpec ? `${bellSpec.title} Gate Expand` : `${isInverse ? 'IQFT' : 'QFT'} Gate Expand`
  const subtitle = bellSpec
    ? `The Bell-state preparation block producing ${bellSpec.ket}`
    : `The ${n}-qubit ${isInverse ? 'inverse QFT' : 'QFT'} block`
  const footer = bellSpec
    ? `${BELL_SPECS[type].xRows.length ? 'X · ' : ''}H · CNOT, on qubits 0..1`
    : `H · controlled-phase · swap, on qubits 0..${n - 1}`

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
                {title}
              </h3>
              <p className="mt-1 text-[12px] text-muted">
                {subtitle}
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
              {footer}
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