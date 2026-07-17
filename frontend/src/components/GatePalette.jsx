import React from 'react'
import { useDrag } from 'react-dnd'
import { GATES } from '../config/constants'

// A single draggable gate tile (symbol only) for the horizontal palette.
// Reuses the exact same drag contract the grid already listens for
// (type: 'GATE', item: { type }) so drop behaviour is unchanged.
function GateTile({ type }) {
  const gate = GATES[type]
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GATE',
    item: { type },
    collect: (m) => ({ isDragging: !!m.isDragging() }),
  }))

  if (!gate) return null

  return (
    <span
      ref={drag}
      title={`${gate.label} — ${gate.desc}`}
      className={`gate-tile h-9 w-9 cursor-grab text-[13px] active:cursor-grabbing gate-${gate.tone} ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {gate.symbol}
    </span>
  )
}

// One rounded card holding a labelled cluster of gate tiles.
function GroupCard({ label, gates }) {
  return (
    <div className="gate-group-card">
      <div className="eyebrow mb-2.5 text-center text-[10px]">{label}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {gates.map((t) => (
          <GateTile key={t} type={t} />
        ))}
      </div>
    </div>
  )
}

// Palette clusters — grouped to mirror the reference's three toolbars
// (single-qubit family, multi-qubit + operations, transforms + Bell states).
const PALETTE_GROUPS = [
  {
    label: 'Single-Qubit Gates',
    gates: ['H', 'X', 'Y', 'Z', 'I', 'S', 'Sdg', 'T', 'Tdg', 'SX', 'SXdg', 'P', 'RX', 'RY', 'RZ'],
  },
  {
    label: 'Multi-Qubit & Operations',
    gates: ['CNOT', 'CCNOT', 'SWAP', 'Measure', 'Reset', 'Barrier'],
  },
  {
    label: 'Transforms & Bell States',
    gates: ['QFT', 'IQFT', 'BELL_PHI_PLUS', 'BELL_PHI_MINUS', 'BELL_PSI_PLUS', 'BELL_PSI_MINUS'],
  },
]

function GatePalette() {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr_1fr]">
      {PALETTE_GROUPS.map((g) => (
        <GroupCard key={g.label} label={g.label} gates={g.gates} />
      ))}
    </section>
  )
}

export default GatePalette
