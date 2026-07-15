import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GATES, gateSymbol } from '../config/constants'

const ROW_H = 60
const CELL = 34
const COL_W = 56

const DOT_COLOR = '#2f6fb8'
const TARGET_COLOR = '#c13e76'
const WIRE = 'rgb(var(--grid-wire, 210 210 210))'

function Dot() {
  return <div className="rounded-full" style={{ width: 11, height: 11, background: DOT_COLOR }} />
}

function TargetRing() {
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: CELL, height: CELL, background: TARGET_COLOR, fontSize: 18 }}
    >
      ⊕
    </div>
  )
}

// Shared scaffolding: n real qubit rows (labeled with their actual qubit
// numbers), one or more columns of {row, node} placements plus optional
// connector lines between rows in the same column.
function Diagram({ rowQubits, columns }) {
  const n = rowQubits.length
  const width = columns.length * COL_W
  const height = ROW_H * n

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: width + 8, height }}>
        {rowQubits.map((q, row) => (
          <div key={row} className="absolute left-0 right-0" style={{ top: ROW_H * row + ROW_H / 2, height: 1, background: WIRE }} />
        ))}
        {rowQubits.map((q, row) => (
          <span key={row} className="absolute font-mono text-[11px] text-faint" style={{ left: -24, top: ROW_H * row + ROW_H / 2 - 7 }}>
            q{q}
          </span>
        ))}
        {columns.map((col, i) => {
          const cx = i * COL_W + COL_W / 2
          const rows = col.nodes.map((nd) => nd.row)
          return (
            <React.Fragment key={i}>
              {rows.length > 1 && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: cx,
                    top: ROW_H * Math.min(...rows) + ROW_H / 2,
                    width: 2,
                    height: (Math.max(...rows) - Math.min(...rows)) * ROW_H,
                    background: DOT_COLOR,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              {col.nodes.map((nd, j) => (
                <div
                  key={j}
                  className="absolute flex items-center justify-center"
                  style={{ left: cx, top: ROW_H * nd.row + ROW_H / 2, transform: 'translate(-50%, -50%)', zIndex: 2 }}
                >
                  {nd.node}
                </div>
              ))}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// SWAP = CNOT(a,b) · CNOT(b,a) · CNOT(a,b) — the standard decomposition,
// verified numerically equal to the SWAP gate.
function buildSwapColumns(topRow, bottomRow) {
  return [
    { nodes: [{ row: topRow, node: <Dot /> }, { row: bottomRow, node: <TargetRing /> }] },
    { nodes: [{ row: bottomRow, node: <Dot /> }, { row: topRow, node: <TargetRing /> }] },
    { nodes: [{ row: topRow, node: <Dot /> }, { row: bottomRow, node: <TargetRing /> }] },
  ]
}

function GateExpandModal({ type, gate, anchorQubit, onClose, onRemove, onEdit }) {
  const meta = GATES[type]

  let rowQubits = [anchorQubit]
  let columns = null
  let hasBreakdown = false
  let note = 'This gate has no internal gate arrangement — shown as itself.'

  if (type === 'SWAP' && Number.isInteger(gate?.swapQubit)) {
    rowQubits = [anchorQubit, gate.swapQubit].sort((a, b) => a - b)
    const topRow = rowQubits.indexOf(anchorQubit)
    const bottomRow = rowQubits.indexOf(gate.swapQubit)
    columns = buildSwapColumns(topRow, bottomRow)
    hasBreakdown = true
    note = 'Unrolled into elementary gates.'
  } else if (type === 'CNOT' && Number.isInteger(gate?.controlQubit)) {
    rowQubits = [anchorQubit, gate.controlQubit].sort((a, b) => a - b)
    const targetRow = rowQubits.indexOf(anchorQubit)
    const controlRow = rowQubits.indexOf(gate.controlQubit)
    columns = [{ nodes: [{ row: controlRow, node: <Dot /> }, { row: targetRow, node: <TargetRing /> }] }]
  } else if (type === 'CCNOT' && Number.isInteger(gate?.controlQubit) && Number.isInteger(gate?.controlQubit2)) {
    rowQubits = [anchorQubit, gate.controlQubit, gate.controlQubit2].sort((a, b) => a - b)
    const targetRow = rowQubits.indexOf(anchorQubit)
    const c1Row = rowQubits.indexOf(gate.controlQubit)
    const c2Row = rowQubits.indexOf(gate.controlQubit2)
    columns = [
      {
        nodes: [
          { row: c1Row, node: <Dot /> },
          { row: c2Row, node: <Dot /> },
          { row: targetRow, node: <TargetRing /> },
        ],
      },
    ]
  } else {
    columns = [{ nodes: [{ row: 0, node: (
      <div className={`gate-tile gate-${meta?.tone || 'slate'} flex items-center justify-center`} style={{ width: CELL, height: CELL, fontSize: 13 }}>
        {gateSymbol(type)}
      </div>
    ) }] }]
  }

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
              <h3 className="display-serif text-xl font-semibold text-ink">{meta?.label || type} Gate Expand</h3>
              <p className="mt-1 text-[12px] text-muted">{note}</p>
            </div>
            <button onClick={onClose} className="text-xl leading-none text-faint transition hover:text-ink" aria-label="Close">
              ×
            </button>
          </div>

          <div className="rounded-xl border border-line bg-panel px-6 py-8 pl-9">
            <Diagram rowQubits={rowQubits} columns={columns} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="font-mono text-[11px] text-faint">{meta?.desc}</span>
            <div className="flex shrink-0 gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-[rgb(var(--accent))] hover:text-ink"
                >
                  Edit
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

export default GateExpandModal