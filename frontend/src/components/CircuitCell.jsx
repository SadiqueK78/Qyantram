import React, { useState, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { useCircuitStore } from '../store/useCircuitStore'
import { useAI } from '../hooks/useAI'

function CircuitCell({ qubit, step, isHovered }) {
  const { circuit, qubits, addGate, removeGate, highlightedStep, beginnerMode } = useCircuitStore()
  const { handleExplainGate } = useAI()
  const [showTooltip, setShowTooltip] = useState(false)
  const gate = circuit[qubit]?.[step]
  const isHighlighted = highlightedStep === step
  const angleGates = ['RX', 'RY', 'RZ', 'P']

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'GATE',
    drop: (item) => {
      if (item.type === 'CNOT') {
        if (qubits < 2) {
          window.alert('CNOT requires at least 2 qubits')
          return
        }

        const defaultControl = qubit === 0 ? 1 : qubit - 1
        const controlInput = window.prompt(
          `CNOT target is q${qubit}. Enter control qubit (0-${qubits - 1}, not ${qubit}):`,
          String(defaultControl)
        )

        if (controlInput === null) {
          return
        }

        const controlQubit = Number(controlInput)
        if (
          !Number.isInteger(controlQubit) ||
          controlQubit < 0 ||
          controlQubit >= qubits ||
          controlQubit === qubit
        ) {
          window.alert('Invalid control qubit selection for CNOT')
          return
        }

        addGate(qubit, step, { type: 'CNOT', controlQubit })
        return
      }

      if (item.type === 'CCNOT') {
        if (qubits < 3) {
          window.alert('CCNOT requires at least 3 qubits')
          return
        }

        const candidates = Array.from({ length: qubits }, (_, i) => i).filter((i) => i !== qubit)
        const defaultControl1 = candidates[0]
        const defaultControl2 = candidates[1]

        const controlInput1 = window.prompt(
          `CCNOT target is q${qubit}. Enter first control qubit (0-${qubits - 1}, not ${qubit}):`,
          String(defaultControl1)
        )
        if (controlInput1 === null) {
          return
        }

        const controlQubit = Number(controlInput1)
        if (
          !Number.isInteger(controlQubit) ||
          controlQubit < 0 ||
          controlQubit >= qubits ||
          controlQubit === qubit
        ) {
          window.alert('Invalid first control qubit for CCNOT')
          return
        }

        const controlInput2 = window.prompt(
          `Enter second control qubit (0-${qubits - 1}, not ${qubit} and not ${controlQubit}):`,
          String(defaultControl2 === controlQubit ? candidates[2] ?? candidates[0] : defaultControl2)
        )
        if (controlInput2 === null) {
          return
        }

        const controlQubit2 = Number(controlInput2)
        if (
          !Number.isInteger(controlQubit2) ||
          controlQubit2 < 0 ||
          controlQubit2 >= qubits ||
          controlQubit2 === qubit ||
          controlQubit2 === controlQubit
        ) {
          window.alert('Invalid second control qubit for CCNOT')
          return
        }

        addGate(qubit, step, { type: 'CCNOT', controlQubit, controlQubit2 })
        return
      }

      if (item.type === 'SWAP') {
        if (qubits < 2) {
          window.alert('SWAP requires at least 2 qubits')
          return
        }

        const defaultSwap = qubit === 0 ? 1 : qubit - 1
        const swapInput = window.prompt(
          `SWAP source is q${qubit}. Enter partner qubit (0-${qubits - 1}, not ${qubit}):`,
          String(defaultSwap)
        )

        if (swapInput === null) {
          return
        }

        const swapQubit = Number(swapInput)
        if (
          !Number.isInteger(swapQubit) ||
          swapQubit < 0 ||
          swapQubit >= qubits ||
          swapQubit === qubit
        ) {
          window.alert('Invalid partner qubit for SWAP')
          return
        }

        addGate(qubit, step, { type: 'SWAP', swapQubit })
        return
      }

      if (angleGates.includes(item.type)) {
        const raw = window.prompt(
          `${item.type} angle in radians (example: 1.5708 for pi/2):`,
          '1.5708'
        )

        if (raw === null) {
          return
        }

        const theta = Number(raw)
        if (!Number.isFinite(theta)) {
          window.alert('Invalid angle value')
          return
        }

        addGate(qubit, step, { type: item.type, theta })
        return
      }

      addGate(qubit, step, { type: item.type })
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  const getGateDisplay = () => {
    if (!gate) return null
    switch (gate.type) {
      case 'H':
        return 'H'
      case 'X':
        return 'X'
      case 'Z':
        return 'Z'
      case 'Y':
        return 'Y'
      case 'I':
        return 'I'
      case 'S':
        return 'S'
      case 'Sdg':
        return 'S†'
      case 'T':
        return 'T'
      case 'Tdg':
        return 'T†'
      case 'SX':
        return '√X'
      case 'SXdg':
        return '√X†'
      case 'RX':
        return 'RX'
      case 'RY':
        return 'RY'
      case 'RZ':
        return 'RZ'
      case 'P':
        return 'P'
      case 'CNOT':
        return '⊕'
      case 'CCNOT':
        return '⊕'
      case 'SWAP':
        return '×'
      case 'Measure':
        return '⌚'
      case 'Reset':
        return '|0⟩'
      case 'Barrier':
        return '|'
      default:
        return gate.type
    }
  }

  const extraTitle =
    gate?.type === 'CNOT' && Number.isInteger(gate.controlQubit)
      ? ` (control=q${gate.controlQubit})`
      : gate?.type === 'CCNOT' && Number.isInteger(gate.controlQubit) && Number.isInteger(gate.controlQubit2)
      ? ` (controls=q${gate.controlQubit},q${gate.controlQubit2})`
      : gate?.type === 'SWAP' && Number.isInteger(gate.swapQubit)
      ? ` (with=q${gate.swapQubit})`
      : gate?.theta !== undefined
      ? ` (theta=${Number(gate.theta).toFixed(4)} rad)`
      : ''

  const title = gate ? `${gate.type}${extraTitle} - Click to remove` : ''

  // Right-click handler to explain gate via AI
  const handleContextMenu = useCallback(
    (e) => {
      if (!gate) return
      e.preventDefault()
      e.stopPropagation()
      handleExplainGate({
        type: gate.type,
        qubit,
        step,
        ...(gate.controlQubit !== undefined && { controlQubit: gate.controlQubit }),
        ...(gate.controlQubit2 !== undefined && { controlQubit2: gate.controlQubit2 }),
        ...(gate.swapQubit !== undefined && { swapQubit: gate.swapQubit }),
        ...(gate.theta !== undefined && { theta: gate.theta }),
      })
    },
    [gate, qubit, step, handleExplainGate]
  )

  // Tooltip text for hover
  const tooltipText = gate
    ? `${gate.type}${gate.controlQubit !== undefined ? ` ctrl=q${gate.controlQubit}` : ''}${gate.theta !== undefined ? ` θ=${Number(gate.theta).toFixed(2)}` : ''} — Right-click to explain`
    : 'Drop a gate here'

  return (
    <motion.div
      ref={drop}
      className={`
        circuit-cell w-12 h-12 m-1 relative group
        ${isOver && canDrop ? 'valid-drop' : ''}
        ${isOver && !canDrop ? 'invalid-drop' : ''}
        ${isHighlighted ? 'ring-2 ring-quantum-purple/60 bg-quantum-purple/10' : ''}
      `}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Hover tooltip */}
      <AnimatePresence>
        {showTooltip && gate && beginnerMode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50
              px-2.5 py-1.5 rounded-lg bg-dark-800/95 backdrop-blur-md
              border border-white/15 shadow-xl shadow-black/40
              text-[10px] text-white/80 whitespace-nowrap pointer-events-none"
          >
            {tooltipText}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
              border-l-4 border-r-4 border-t-4
              border-l-transparent border-r-transparent border-t-white/15" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gate && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`
              absolute inset-0 rounded-md flex items-center justify-center
              font-bold text-white text-sm cursor-pointer
              gate-icon ${gate.type.toLowerCase()}
              group-hover:shadow-lg group-hover:scale-110
            `}
            onClick={(e) => {
              e.stopPropagation()
              removeGate(qubit, step)
            }}
            title={title}
          >
            {getGateDisplay()}
          </motion.div>
        )}
      </AnimatePresence>

      {gate?.type === 'CNOT' && Number.isInteger(gate.controlQubit) && gate.controlQubit !== qubit && (
        <>
          <div
            className="pointer-events-none absolute left-1/2 w-[2px] -translate-x-1/2 bg-quantum-pink/80"
            style={{
              top: gate.controlQubit < qubit ? `calc(50% - ${Math.abs(gate.controlQubit - qubit) * 64}px)` : '50%',
              height: `${Math.abs(gate.controlQubit - qubit) * 64}px`,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-quantum-pink ring-2 ring-quantum-pink/30"
            style={{
              top: gate.controlQubit < qubit ? `calc(50% - ${Math.abs(gate.controlQubit - qubit) * 64}px)` : `calc(50% + ${Math.abs(gate.controlQubit - qubit) * 64}px)`,
            }}
          />
        </>
      )}

      {gate?.type === 'CCNOT' &&
        [gate.controlQubit, gate.controlQubit2]
          .filter((control) => Number.isInteger(control) && control !== qubit)
          .map((control) => {
            const distance = Math.abs(control - qubit)
            const upwards = control < qubit
            return (
              <React.Fragment key={`ccnot-${control}`}>
                <div
                  className="pointer-events-none absolute left-1/2 w-[2px] -translate-x-1/2 bg-quantum-pink/80"
                  style={{
                    top: upwards ? `calc(50% - ${distance * 64}px)` : '50%',
                    height: `${distance * 64}px`,
                  }}
                />
                <div
                  className="pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-quantum-pink ring-2 ring-quantum-pink/30"
                  style={{
                    top: upwards ? `calc(50% - ${distance * 64}px)` : `calc(50% + ${distance * 64}px)`,
                  }}
                />
              </React.Fragment>
            )
          })}

      {gate?.type === 'SWAP' && Number.isInteger(gate.swapQubit) && gate.swapQubit !== qubit && (
        <>
          <div
            className="pointer-events-none absolute left-1/2 w-[2px] -translate-x-1/2 bg-fuchsia-300/70"
            style={{
              top: gate.swapQubit < qubit ? `calc(50% - ${Math.abs(gate.swapQubit - qubit) * 64}px)` : '50%',
              height: `${Math.abs(gate.swapQubit - qubit) * 64}px`,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-fuchsia-200 text-lg font-bold"
            style={{
              top: gate.swapQubit < qubit ? `calc(50% - ${Math.abs(gate.swapQubit - qubit) * 64}px)` : `calc(50% + ${Math.abs(gate.swapQubit - qubit) * 64}px)`,
            }}
          >
            ×
          </div>
        </>
      )}

      {/* Hover indicator */}
      {isHovered && !gate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-quantum-blue/10 rounded-md"
          pointer-events="none"
        />
      )}

      {/* Drop preview */}
      {isOver && canDrop && !gate && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 border-2 border-dashed border-quantum-blue rounded-md"
          pointer-events="none"
        />
      )}
    </motion.div>
  )
}

export default CircuitCell
