import React, { useState, useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useCircuitStore } from '../store/useCircuitStore'
import { useAI } from '../hooks/useAI'
import { GATES, GRID, gateSymbol } from '../config/constants'
import { formatAngle } from '../utils/formatAngle'
import QFTExpandModal from './QFTExpandModal'
import QFTEditGateModal from './QFTEditGateModal'

const ANGLE_GATES = ['RX', 'RY', 'RZ', 'P']

// A draggable control/target node that sits on another wire and can be dragged
// to reassign which qubit it connects to (IBM-Composer-style).
function ControlNode({ target, step, role, offsetRows, kind }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'CONTROL',
      item: { target, step, role },
      collect: (m) => ({ isDragging: !!m.isDragging() }),
    }),
    [target, step, role]
  )

  const top = `calc(50% + ${offsetRows * GRID.ROW_PITCH}px)`
  const common = { top, opacity: isDragging ? 0.4 : 1 }

  if (kind === 'swap') {
    return (
      <div
        ref={drag}
        className="control-node flex items-center justify-center text-[color:rgb(var(--g-fg,#c13e76))]"
        style={{ ...common, width: 18, height: 18, fontSize: 16, fontWeight: 700 }}
      >
        ×
      </div>
    )
  }
  // control dot
  return (
    <div
      ref={drag}
      className="control-node"
      style={{ ...common, width: 11, height: 11, background: 'currentColor' }}
    />
  )
}

function CircuitCell({ qubit, step, isHovered }) {
  const { circuit, qubits, addGate, removeGate, setGateControl, setGateTheta, setGateTargets, highlightedStep, beginnerMode } =
    useCircuitStore()
  const { handleExplainGate } = useAI()
  const gate = circuit[qubit]?.[step]
  const meta = gate ? GATES[gate.type] : null
  const isHighlighted = highlightedStep === step

  const [anglePopover, setAnglePopover] = useState(false)
  const [angleDraft, setAngleDraft] = useState('1.5708')
  const [qftExpandOpen, setQftExpandOpen] = useState(false)
  const [qftEditOpen, setQftEditOpen] = useState(false)

  // Default partner wire for a freshly dropped multi-qubit gate (no prompts).
  const defaultPartner = qubit === 0 ? 1 : qubit - 1

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['GATE', 'CONTROL'],
      canDrop: (item, monitor) => {
        if (monitor.getItemType() === 'CONTROL') {
          // A control node may only be re-homed onto a different wire.
          return item.target !== qubit
        }
        return true
      },
      drop: (item, monitor) => {
        if (monitor.getItemType() === 'CONTROL') {
          setGateControl(item.target, item.step, item.role, qubit)
          return
        }

        const type = item.type
        if (type === 'CNOT') {
          if (qubits < 2) return
          addGate(qubit, step, { type: 'CNOT', controlQubit: defaultPartner })
          return
        }
        if (type === 'CCNOT') {
          if (qubits < 3) return
          const cands = Array.from({ length: qubits }, (_, i) => i).filter((i) => i !== qubit)
          addGate(qubit, step, { type: 'CCNOT', controlQubit: cands[0], controlQubit2: cands[1] })
          return
        }
        if (type === 'SWAP') {
          if (qubits < 2) return
          addGate(qubit, step, { type: 'SWAP', swapQubit: defaultPartner })
          return
        }
        if (type === 'QFT' || type === 'IQFT') {
          if (qubits < 2) return
          addGate(qubit, step, { type, targets: [qubit, defaultPartner] })
          return
        }
        if (ANGLE_GATES.includes(type)) {
          addGate(qubit, step, { type, theta: 1.5708 })
          setAngleDraft('1.5708')
          setAnglePopover(true)
          return
        }
        addGate(qubit, step, { type })
      },
      collect: (m) => ({ isOver: !!m.isOver(), canDrop: !!m.canDrop() }),
    }),
    [qubit, step, qubits, defaultPartner, addGate, setGateControl]
  )

  const handleContextMenu = useCallback(
    (e) => {
      if (!gate) return
      e.preventDefault()
      e.stopPropagation()
      handleExplainGate({ type: gate.type, qubit, step, ...gate })
    },
    [gate, qubit, step, handleExplainGate]
  )

  const commitAngle = () => {
    const t = Number(angleDraft)
    if (Number.isFinite(t)) setGateTheta(qubit, step, t)
    setAnglePopover(false)
  }

  // --- connectors for multi-qubit gates (rendered from the target cell) ---
  const connectors = []
  if (gate) {
    const partners = []
    if (gate.type === 'CNOT' && Number.isInteger(gate.controlQubit)) {
      partners.push({ wire: gate.controlQubit, role: 'control', kind: 'dot' })
    } else if (gate.type === 'CCNOT') {
      if (Number.isInteger(gate.controlQubit)) partners.push({ wire: gate.controlQubit, role: 'control', kind: 'dot' })
      if (Number.isInteger(gate.controlQubit2)) partners.push({ wire: gate.controlQubit2, role: 'control2', kind: 'dot' })
    } else if (gate.type === 'SWAP' && Number.isInteger(gate.swapQubit)) {
      partners.push({ wire: gate.swapQubit, role: 'swap', kind: 'swap' })
    }

    partners.forEach((p) => {
      if (p.wire === qubit) return
      const delta = p.wire - qubit // rows away (negative = up)
      connectors.push(
        <React.Fragment key={p.role}>
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              width: 2,
              background: 'currentColor',
              top: delta < 0 ? `calc(50% + ${delta * GRID.ROW_PITCH}px)` : '50%',
              height: `${Math.abs(delta) * GRID.ROW_PITCH}px`,
            }}
          />
          <ControlNode target={qubit} step={step} role={p.role} offsetRows={delta} kind={p.kind === 'swap' ? 'swap' : 'dot'} />
        </React.Fragment>
      )
    })
  }

  const showSwapX = gate?.type === 'SWAP'
  const tileTone = meta ? `gate-${meta.tone}` : ''
  const isBarrier = gate?.type === 'Barrier'
  const isMeasure = gate?.type === 'Measure'

  // QFT/IQFT render as a single box spanning every wire it acts on
  // (Qniverse-style "qft2 a, b" block), rather than a per-cell tile. The
  // gate object always lives at the topmost target row (store invariant),
  // so this cell — when it holds one — is always the box's top edge.
  const isQFTBlock =
    !!gate && (gate.type === 'QFT' || gate.type === 'IQFT') && Array.isArray(gate.targets) && gate.targets.length >= 2
  const qftTargets = isQFTBlock ? gate.targets : []
  const qftSpanHeight = isQFTBlock ? GRID.CELL + (qftTargets.length - 1) * GRID.ROW_PITCH : 0
  const qftSpanTop = `calc(50% - ${GRID.CELL / 2}px)`

  const removeThis = (e) => {
    e.stopPropagation()
    removeGate(qubit, step)
  }

  const tileTitle = isMeasure
    ? 'Measure — collapses this qubit onto its classical bit (click to remove)'
    : isBarrier
    ? 'Barrier — separates compilation stages, no operation (click to remove)'
    : gate?.theta !== undefined
    ? `${gate.type} (θ=${formatAngle(Number(gate.theta))}) — click to remove, double-click to edit`
    : `${gate?.type} — click to remove`

  return (
    <div
      ref={drop}
      onContextMenu={handleContextMenu}
      className={`circuit-cell ${isOver && canDrop ? 'valid-drop' : ''} ${isOver && !canDrop ? 'invalid-drop' : ''} ${isHighlighted ? 'step-highlighted' : ''}`}
      style={{ width: GRID.COL_WIDTH, height: GRID.ROW_PITCH, color: meta ? 'var(--g-fg)' : 'inherit' }}
    >
      {/* multi-qubit connectors + draggable nodes */}
      {connectors}

      {/* IBM-style barrier: full-height dashed vertical band, no colored box */}
      {isBarrier && (
        <div
          onClick={removeThis}
          title={tileTitle}
          className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 cursor-pointer items-stretch"
          style={{ zIndex: 5 }}
        >
          <span
            className="my-0.5 block"
            style={{ width: 0, borderLeft: '2px dashed rgb(var(--faint))', height: '100%' }}
          />
        </div>
      )}

      {/* IBM-style measurement: meter glyph + dashed tick down toward the classical register.
          Anchored to the wire's true center line (top: 50% of this cell), matching how the
          other multi-qubit connectors are positioned, so it can't drift from the tile above it. */}
      {isMeasure && (() => {
        // Distance from this wire's centerline down to the classical rail's centerline:
        // full rows below this one, plus the remaining half of this row, plus half of the
        // classical row's own (smaller, fixed 28px) height.
        const toClassical = (qubits - qubit - 0.5) * GRID.ROW_PITCH + 14
        return (
          <>
            <div
              onClick={removeThis}
              title={tileTitle}
              className="relative flex cursor-pointer items-center justify-center"
              style={{ width: GRID.COL_WIDTH, height: GRID.CELL, zIndex: 5 }}
            >
              <div
                className={`gate-tile ${tileTone} flex items-center justify-center`}
                style={{ width: GRID.CELL, height: GRID.CELL }}
              >
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                  <path d="M2 14 A9 9 0 0 1 20 14" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  <line x1="11" y1="14" x2="17" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* dashed connector + arrowhead, drawn as one continuous SVG so there's no seam,
                positioned from the wire's centerline down to the classical rail's centerline */}
            <svg
              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
              width="12"
              height={toClassical}
              style={{ top: '50%' }}
              viewBox={`0 0 12 ${toClassical}`}
            >
              <line
                x1="6"
                y1="0"
                x2="6"
                y2={toClassical - 6}
                stroke="rgb(var(--grid-wire))"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <path
                d={`M0 ${toClassical - 6} L12 ${toClassical - 6} L6 ${toClassical} Z`}
                fill="rgb(var(--grid-wire))"
              />
            </svg>
            <span
              className="pointer-events-none absolute font-mono text-[10px] text-faint"
              style={{ left: 'calc(50% + 9px)', top: `calc(50% + ${toClassical - 15}px)` }}
            >
              {qubit}
            </span>
          </>
        )
      })()}

      {/* QFT/IQFT block: one solid box spanning every wire it acts on, with
          each wire labeled a/b/c/... top to bottom — matching the Qniverse
          "qft2 a, b" block, generalized to any contiguous qubit range. */}
      {isQFTBlock && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setQftExpandOpen(true)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setQftEditOpen(true)
          }}
          title={`${gate.type === 'IQFT' ? 'Inverse QFT' : 'QFT'} block on q${qftTargets[0]}–q${qftTargets[qftTargets.length - 1]} — click to expand, double-click to edit qubits`}
          className={`gate-tile ${tileTone} absolute left-1/2 -translate-x-1/2 cursor-pointer`}
          style={{ width: GRID.CELL, top: qftSpanTop, height: qftSpanHeight, zIndex: 5 }}
        >
          {/* Each label sits exactly on its wire's crossing point — the same
              GRID.CELL/2 offset a normal single-cell tile uses to center on
              its own wire — regardless of how many rows the block spans. */}
          {qftTargets.map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] leading-none opacity-80"
              style={{ top: i * GRID.ROW_PITCH + GRID.CELL / 2 }}
            >
              {String.fromCharCode(97 + i)}
            </span>
          ))}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold leading-none">
            {gate.type === 'IQFT' ? 'QFT†' : 'QFT'}
          </span>
        </div>
      )}

      {isQFTBlock && qftExpandOpen && (
        <QFTExpandModal
          type={gate.type}
          targets={qftTargets}
          onClose={() => setQftExpandOpen(false)}
          onEdit={() => {
            setQftExpandOpen(false)
            setQftEditOpen(true)
          }}
          onRemove={() => {
            setQftExpandOpen(false)
            removeGate(qubit, step)
          }}
        />
      )}

      {isQFTBlock && qftEditOpen && (
        <QFTEditGateModal
          type={gate.type}
          qubits={qubits}
          currentTargets={qftTargets}
          onClose={() => setQftEditOpen(false)}
          onSave={(newTargets) => {
            setGateTargets(qubit, step, newTargets)
            setQftEditOpen(false)
          }}
        />
      )}

      {gate && !isBarrier && !isMeasure && !isQFTBlock && (
        <div
          onClick={removeThis}
          onDoubleClick={(e) => {
            if (ANGLE_GATES.includes(gate.type)) {
              e.stopPropagation()
              setAngleDraft(String(gate.theta ?? 1.5708))
              setAnglePopover(true)
            }
          }}
          title={tileTitle}
          className={`gate-tile ${tileTone} cursor-pointer`}
          style={{ width: GRID.CELL, height: GRID.CELL, fontSize: gate.type.length > 2 ? 10 : 13, zIndex: 5 }}
        >
          {showSwapX ? '×' : gateSymbol(gate.type)}
        </div>
      )}

      {/* angle popover */}
      {anglePopover && (
        <div
          className="absolute left-1/2 top-full z-30 mt-1 w-40 -translate-x-1/2 rounded-lg border border-line bg-surface p-2 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">
            {gate?.type} angle (rad)
          </div>
          <input
            autoFocus
            value={angleDraft}
            onChange={(e) => setAngleDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitAngle()}
            className="w-full rounded border border-line bg-panel px-2 py-1 text-[12px] text-ink outline-none"
          />
          {Number.isFinite(Number(angleDraft)) && (
            <div className="mt-1 font-mono text-[10px] text-faint">
              = {formatAngle(Number(angleDraft))}
            </div>
          )}
          <div className="mt-1.5 flex justify-end gap-1">
            <button className="rounded px-2 py-0.5 text-[11px] text-faint" onClick={() => setAnglePopover(false)}>
              Cancel
            </button>
            <button className="rounded bg-ink px-2 py-0.5 text-[11px] text-paper" onClick={commitAngle}>
              Set
            </button>
          </div>
        </div>
      )}

      {/* hover tooltip in beginner mode */}
      {beginnerMode && isHovered && gate && (
        <div className="pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[10px] text-ink shadow">
          {GATES[gate.type]?.desc || gate.type}
        </div>
      )}
    </div>
  )
}

export default CircuitCell