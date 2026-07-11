import React from 'react'
import { useDrag } from 'react-dnd'
import { useCircuitStore } from '../store/useCircuitStore'
import { GATES, GATE_GROUPS, CIRCUIT_CONFIG } from '../config/constants'

// A single draggable gate row: colored tile + name + "N qubit".
function GateRow({ type }) {
  const gate = GATES[type]
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GATE',
    item: { type },
    collect: (m) => ({ isDragging: !!m.isDragging() }),
  }))

  return (
    <div
      ref={drag}
      title={gate.desc}
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing
        hover:bg-[rgb(var(--ink)/0.04)] transition-colors ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className={`gate-tile w-8 h-8 text-[13px] ${`gate-${gate.tone}`}`}>{gate.symbol}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink leading-tight truncate">
          {gate.label}
        </span>
        <span className="block text-[11px] text-faint leading-tight">
          {gate.qubits} qubit{gate.qubits > 1 ? 's' : ''}
        </span>
      </span>
    </div>
  )
}

function SidebarSection({ label, children }) {
  return (
    <div className="mb-6">
      <div className="eyebrow mb-2.5">{label}</div>
      {children}
    </div>
  )
}

function Sidebar() {
  const { qubits, setQubits, undo, resetCircuit, historyIndex, isSimulating, simulationResult, shots } =
    useCircuitStore()

  const status = isSimulating ? 'Running' : simulationResult ? 'Completed' : 'Idle'
  const statusColor = isSimulating ? '#d9a406' : simulationResult ? '#2f9e56' : 'rgb(var(--faint))'

  return (
    <aside className="flex h-full flex-col border-r border-line bg-surface px-5 py-6">
      {/* Wordmark */}
      <div className="mb-8">
        <h1 className="display-serif text-[26px] font-semibold leading-[1.05] text-ink">
          Qyantram
        </h1>
        <div className="mt-1 flex items-center justify-between">
          <span className="eyebrow">Simulator</span>
          <span className="text-[11px] text-faint">v1.0</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {GATE_GROUPS.map((group) => (
          <SidebarSection key={group.title} label={group.title}>
            <div className="space-y-0.5">
              {group.gates.map((t) => (
                <GateRow key={t} type={t} />
              ))}
            </div>
          </SidebarSection>
        ))}

        <SidebarSection label="Wires">
          <button
            onClick={() => qubits < CIRCUIT_CONFIG.MAX_QUBITS && setQubits(qubits + 1)}
            disabled={qubits >= CIRCUIT_CONFIG.MAX_QUBITS}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left
              hover:bg-[rgb(var(--ink)/0.04)] transition-colors disabled:opacity-40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-line text-ink">
              ＋
            </span>
            <span className="text-[13px] font-semibold text-ink">Add Wire</span>
          </button>
        </SidebarSection>

        <SidebarSection label="Operations">
          <div className="space-y-0.5">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px]
                text-ink hover:bg-[rgb(var(--ink)/0.04)] transition-colors disabled:opacity-40"
            >
              <span className="w-8 text-center text-muted">↶</span> Undo
            </button>
            <button
              onClick={resetCircuit}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px]
                text-ink hover:bg-[rgb(var(--ink)/0.04)] transition-colors"
            >
              <span className="w-8 text-center text-muted">🗑</span> Clear Circuit
            </button>
          </div>
        </SidebarSection>
      </div>

      <SidebarSection label="Simulation Status">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-[13px] text-ink">{status}</span>
        </div>
        <div className="mt-1 text-[11px] text-faint">{shots} shots</div>
      </SidebarSection>
    </aside>
  )
}

export default Sidebar
