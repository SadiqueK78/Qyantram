import { create } from 'zustand'
import { DEFAULT_SHOTS, isBlockType, blockExactTargets } from '../config/constants'

// Initialize empty circuit
const createEmptyCircuit = (qubits, steps) => {
  return Array(qubits).fill(null).map(() => Array(steps).fill(null))
}

// -------- Theme helpers (light editorial default, persisted) --------
const THEME_KEY = 'qyantram-theme'

const readInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Apply immediately on module load so there is no flash of the wrong theme.
const INITIAL_THEME = readInitialTheme()
applyTheme(INITIAL_THEME)

const canonicalGateType = (rawType) => {
  const gateType = String(rawType || '').toUpperCase()
  const gateMap = {
    H: 'H',
    X: 'X',
    Y: 'Y',
    Z: 'Z',
    I: 'I',
    S: 'S',
    SDG: 'Sdg',
    T: 'T',
    TDG: 'Tdg',
    SX: 'SX',
    SXDG: 'SXdg',
    P: 'P',
    RX: 'RX',
    RY: 'RY',
    RZ: 'RZ',
    CNOT: 'CNOT',
    CCNOT: 'CCNOT',
    TOFFOLI: 'CCNOT',
    SWAP: 'SWAP',
    QFT: 'QFT',
    IQFT: 'IQFT',
    BELL_PHI_PLUS: 'BELL_PHI_PLUS',
    BELL_PHI_MINUS: 'BELL_PHI_MINUS',
    BELL_PSI_PLUS: 'BELL_PSI_PLUS',
    BELL_PSI_MINUS: 'BELL_PSI_MINUS',
    MEASURE: 'Measure',
    RESET: 'Reset',
    BARRIER: 'Barrier',
    '|': 'Barrier',
  }
  return gateMap[gateType] || gateType
}

const normalizeSingleCircuit = (payload) => {
  if (!payload) {
    throw new Error('No circuit data found')
  }

  // Supports wrapper: { data: { qubits, gates } }
  if (payload.data && typeof payload.data === 'object') {
    return normalizeSingleCircuit(payload.data)
  }

  const qubits = Number(payload.qubits)
  const gates = Array.isArray(payload.gates) ? payload.gates : []

  if (!Number.isInteger(qubits) || qubits < 1) {
    throw new Error('Invalid qubit count in circuit file')
  }

  return { qubits, gates }
}

const normalizeCircuitCollection = (payload) => {
  if (!payload) {
    throw new Error('No circuit data found')
  }

  if (Array.isArray(payload.circuits) && payload.circuits.length > 0) {
    return payload.circuits.map((entry, index) => {
      const normalized = normalizeSingleCircuit(entry?.data || entry)
      return {
        name: entry?.name || `Circuit ${index + 1}`,
        description: entry?.description || '',
        ...normalized,
      }
    })
  }

  const normalized = normalizeSingleCircuit(payload)
  return [
    {
      name: payload.name || 'Loaded Circuit',
      description: payload.description || '',
      ...normalized,
    },
  ]
}

const buildCircuitState = (parsedCircuit) => {
  const maxStep = parsedCircuit.gates.reduce((max, g) => Math.max(max, Number(g.step ?? 0)), 0)
  const steps = Math.max(14, maxStep + 1)

  const newCircuit = createEmptyCircuit(parsedCircuit.qubits, steps)
  const gates = []

  parsedCircuit.gates.forEach((g, idx) => {
    const qubit = Number.isInteger(g.qubit) ? g.qubit : Number(g.target)
    const step = Number(g.step ?? 0)

    if (!Number.isInteger(qubit) || qubit < 0 || qubit >= parsedCircuit.qubits) {
      return
    }

    if (!Number.isInteger(step) || step < 0 || step >= steps) {
      return
    }

    const gateType = canonicalGateType(g.type)
    if (!gateType) {
      return
    }

    const gate = {
      type: gateType,
      ...(g.controlQubit !== undefined && { controlQubit: Number(g.controlQubit) }),
      ...(g.control !== undefined && { controlQubit: Number(g.control) }),
      ...(g.controlQubit2 !== undefined && { controlQubit2: Number(g.controlQubit2) }),
      ...(g.control2 !== undefined && { controlQubit2: Number(g.control2) }),
      ...(g.swapQubit !== undefined && { swapQubit: Number(g.swapQubit) }),
      ...(g.swap_with !== undefined && { swapQubit: Number(g.swap_with) }),
      ...(Array.isArray(g.targets) && g.targets.length >= 2 && {
        targets: [...new Set(g.targets.map(Number))].sort((a, b) => a - b),
      }),
      ...(!Array.isArray(g.targets) && (g.partnerQubit !== undefined || g.qftQubit !== undefined) && {
        targets: [qubit, Number(g.partnerQubit ?? g.qftQubit)].sort((a, b) => a - b),
      }),
      ...(g.theta !== undefined && { theta: Number(g.theta) }),
      ...(g.angle !== undefined && { theta: Number(g.angle) }),
      ...(g.phase !== undefined && { theta: Number(g.phase) }),
    }

    if (gate.type === 'CNOT' && (!Number.isInteger(gate.controlQubit) || gate.controlQubit === qubit)) {
      return
    }

    if (
      gate.type === 'CCNOT' &&
      (!Number.isInteger(gate.controlQubit) ||
        !Number.isInteger(gate.controlQubit2) ||
        gate.controlQubit === qubit ||
        gate.controlQubit2 === qubit ||
        gate.controlQubit === gate.controlQubit2)
    ) {
      return
    }

    if (gate.type === 'SWAP' && (!Number.isInteger(gate.swapQubit) || gate.swapQubit === qubit)) {
      return
    }

    let anchorQubit = qubit
    if (isBlockType(gate.type)) {
      const targets = gate.targets
      const exact = blockExactTargets(gate.type)
      const contiguous = Array.isArray(targets) && targets.every((t, i) => i === 0 || t === targets[i - 1] + 1)
      const inRange =
        Array.isArray(targets) && targets.every((t) => Number.isInteger(t) && t >= 0 && t < parsedCircuit.qubits)
      const rightCount = Array.isArray(targets) && (exact ? targets.length === exact : targets.length >= 2)
      if (!Array.isArray(targets) || !rightCount || !contiguous || !inRange || !targets.includes(qubit)) {
        return
      }
      anchorQubit = targets[0]
    }

    newCircuit[anchorQubit][step] = gate
    gates.push({ id: g.id || `loaded-${idx}`, qubit: anchorQubit, step, ...gate })
  })

  return {
    qubits: parsedCircuit.qubits,
    steps,
    circuit: newCircuit,
    gates,
    simulationResult: null,
    history: [{ circuit: newCircuit, gates }],
    historyIndex: 0,
  }
}

export const useCircuitStore = create((set, get) => ({
  // State
  qubits: 2,
  steps: 14,
  shots: DEFAULT_SHOTS,
  circuit: createEmptyCircuit(2, 14),
  gates: [],
  simulationResult: null,
  isSimulating: false,
  selectedQubit: 0,

  // Editor chrome
  circuitName: 'unnamed-Circuit',
  setCircuitName: (name) => set({ circuitName: name }),
  debugMode: false,
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),

  // Top-level view: 'editor' (main simulation page) | 'templates' (gallery)
  view: 'editor',
  setView: (view) => set({ view }),

  // Theme
  theme: INITIAL_THEME,
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(theme)
      if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme)
      return { theme }
    }),
  setTheme: (theme) =>
    set(() => {
      applyTheme(theme)
      if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme)
      return { theme }
    }),
  history: [],
  historyIndex: -1,
  circuitCollection: [],
  circuitCollectionIndex: 0,
  activeCircuitMeta: null,

  // AI Assistant state
  aiResponse: null,
  isAILoading: false,
  selectedGateForAI: null,
  explanationMode: null, // 'gate' | 'circuit' | 'step'
  isAIPanelOpen: false,
  aiError: null,
  beginnerMode: false,
  stepExplainMode: false,
  highlightedStep: null,

  // Actions
  setQubits: (qubits) =>
    set((state) => {
      const newCircuit = createEmptyCircuit(qubits, state.steps)
      // Copy existing gates where they fit
      for (let i = 0; i < Math.min(qubits, state.qubits); i++) {
        for (let j = 0; j < state.steps; j++) {
          if (state.circuit[i] && state.circuit[i][j]) {
            newCircuit[i][j] = state.circuit[i][j]
          }
        }
      }
      return { qubits, circuit: newCircuit }
    }),

  setSteps: (steps) =>
    set((state) => {
      const newCircuit = state.circuit.map((row) => [
        ...row,
        ...Array(Math.max(0, steps - row.length)).fill(null),
      ])
      return { steps, circuit: newCircuit.map((row) => row.slice(0, steps)) }
    }),

  addGate: (qubit, step, gate) => {
    set((state) => {
      if (gate.type === 'CNOT' && state.qubits < 2) {
        return state
      }

      if (gate.type === 'CCNOT' && state.qubits < 3) {
        return state
      }

      if (gate.type === 'SWAP' && state.qubits < 2) {
        return state
      }

      if (isBlockType(gate.type) && state.qubits < 2) {
        return state
      }

      const newCircuit = state.circuit.map((row) => [...row])

      let normalizedGate = { ...gate }
      let anchorQubit = qubit
      if (gate.type === 'CNOT') {
        const fallbackControl = qubit > 0 ? qubit - 1 : 1
        const controlQubit = Number.isInteger(gate.controlQubit)
          ? gate.controlQubit
          : fallbackControl

        if (controlQubit === qubit || controlQubit < 0 || controlQubit >= state.qubits) {
          return state
        }

        normalizedGate = { ...gate, controlQubit }
      } else if (gate.type === 'CCNOT') {
        const candidates = Array.from({ length: state.qubits }, (_, i) => i).filter((i) => i !== qubit)
        const controlQubit = Number.isInteger(gate.controlQubit) ? gate.controlQubit : candidates[0]
        const controlQubit2 = Number.isInteger(gate.controlQubit2) ? gate.controlQubit2 : candidates[1]

        if (
          !Number.isInteger(controlQubit) ||
          !Number.isInteger(controlQubit2) ||
          controlQubit < 0 ||
          controlQubit >= state.qubits ||
          controlQubit2 < 0 ||
          controlQubit2 >= state.qubits ||
          controlQubit === qubit ||
          controlQubit2 === qubit ||
          controlQubit === controlQubit2
        ) {
          return state
        }

        normalizedGate = { ...gate, controlQubit, controlQubit2 }
      } else if (gate.type === 'SWAP') {
        const fallbackSwap = qubit > 0 ? qubit - 1 : 1
        const swapQubit = Number.isInteger(gate.swapQubit) ? gate.swapQubit : fallbackSwap

        if (swapQubit < 0 || swapQubit >= state.qubits || swapQubit === qubit) {
          return state
        }

        normalizedGate = { ...gate, swapQubit }
      } else if (isBlockType(gate.type)) {
        const fallbackPartner = qubit > 0 ? qubit - 1 : 1
        const rawTargets =
          Array.isArray(gate.targets) && gate.targets.length >= 2
            ? gate.targets
            : [qubit, Number.isInteger(gate.partnerQubit) ? gate.partnerQubit : fallbackPartner]

        const targets = [...new Set(rawTargets.map(Number))].sort((a, b) => a - b)
        const exact = blockExactTargets(gate.type)
        const inRange = targets.every((t) => Number.isInteger(t) && t >= 0 && t < state.qubits)
        const contiguous = targets.every((t, i) => i === 0 || t === targets[i - 1] + 1)
        const rightCount = exact ? targets.length === exact : targets.length >= 2

        if (!rightCount || !inRange || !contiguous || !targets.includes(qubit)) {
          return state
        }

        normalizedGate = { type: gate.type, targets }
        anchorQubit = targets[0]
      }

      newCircuit[anchorQubit][step] = normalizedGate

      // Add to gates array
      const filteredExisting = state.gates.filter((g) => !(g.qubit === anchorQubit && g.step === step))
      const newGates = [
        ...filteredExisting,
        { id: `${anchorQubit}-${step}-${Date.now()}`, qubit: anchorQubit, step, ...normalizedGate },
      ]

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  removeGate: (qubit, step) => {
    set((state) => {
      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[qubit][step] = null

      const newGates = state.gates.filter((g) => !(g.qubit === qubit && g.step === step))

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  moveGate: (fromQubit, fromStep, toQubit, toStep) => {
    set((state) => {
      const gate = state.circuit[fromQubit][fromStep]
      if (!gate) return state

      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[fromQubit][fromStep] = null
      
      // Handle CNOT specially
      if (gate.type === 'CNOT') {
        const controlOffset = gate.controlQubit - fromQubit
        newCircuit[toQubit][toStep] = {
          ...gate,
          controlQubit: toQubit + controlOffset,
        }
      } else {
        newCircuit[toQubit][toStep] = { ...gate }
      }

      const newGates = state.gates.map((g) => {
        if (g.qubit === fromQubit && g.step === fromStep) {
          return { ...g, qubit: toQubit, step: toStep }
        }
        return g
      })

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  // Reassign a multi-qubit gate's control/partner wire (drag-control-point UX).
  // role: 'control' -> controlQubit, 'control2' -> controlQubit2, 'swap' -> swapQubit
  setGateControl: (target, step, role, newWire) => {
    set((state) => {
      const gate = state.circuit[target]?.[step]
      if (!gate) return state
      if (!Number.isInteger(newWire) || newWire < 0 || newWire >= state.qubits || newWire === target) {
        return state
      }

      const fieldByRole = { control: 'controlQubit', control2: 'controlQubit2', swap: 'swapQubit' }
      const field = fieldByRole[role]
      if (!field) return state

      // Prevent the two controls of a Toffoli from colliding.
      if (role === 'control' && gate.controlQubit2 === newWire) return state
      if (role === 'control2' && gate.controlQubit === newWire) return state

      const updatedGate = { ...gate, [field]: newWire }
      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[target][step] = updatedGate

      const newGates = state.gates.map((g) =>
        g.qubit === target && g.step === step ? { ...g, [field]: newWire } : g
      )

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  // Replace a block gate's (QFT/IQFT/Bell) target qubits (Edit Gate modal).
  // `anchorQubit` is wherever the gate currently lives; newTargets must be
  // distinct, in-range, contiguous, and match the block's required count
  // (exactly 2 for Bell, 2+ for QFT) — the gate is re-anchored at the lowest.
  setGateTargets: (anchorQubit, step, newTargets) => {
    set((state) => {
      const gate = state.circuit[anchorQubit]?.[step]
      if (!gate || !isBlockType(gate.type)) return state

      const targets = [...new Set((newTargets || []).map(Number))].sort((a, b) => a - b)
      const exact = blockExactTargets(gate.type)
      const inRange = targets.every((t) => Number.isInteger(t) && t >= 0 && t < state.qubits)
      const contiguous = targets.every((t, i) => i === 0 || t === targets[i - 1] + 1)
      const rightCount = exact ? targets.length === exact : targets.length >= 2

      if (!rightCount || !inRange || !contiguous) {
        return state
      }

      const newAnchor = targets[0]
      const updatedGate = { type: gate.type, targets }
      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[anchorQubit][step] = null
      newCircuit[newAnchor][step] = updatedGate

      const newGates = [
        ...state.gates.filter((g) => !(g.qubit === anchorQubit && g.step === step)),
        { id: `${newAnchor}-${step}-${Date.now()}`, qubit: newAnchor, step, ...updatedGate },
      ]

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  // Replace a CNOT/CCNOT's target qubit and control qubit(s) (Edit Gate
  // modal). `anchorQubit` is wherever the gate currently lives (its target
  // row); the gate is re-anchored at the new target.
  setControlGateConfig: (anchorQubit, step, { target, controls }) => {
    set((state) => {
      const gate = state.circuit[anchorQubit]?.[step]
      if (!gate || (gate.type !== 'CNOT' && gate.type !== 'CCNOT')) return state

      const needed = gate.type === 'CCNOT' ? 2 : 1
      const ctrls = [...new Set((controls || []).map(Number))]
      const t = Number(target)

      const inRange = Number.isInteger(t) && t >= 0 && t < state.qubits
      const ctrlsValid =
        ctrls.length === needed && ctrls.every((c) => Number.isInteger(c) && c >= 0 && c < state.qubits && c !== t)

      if (!inRange || !ctrlsValid) return state

      const updatedGate =
        gate.type === 'CCNOT'
          ? { type: 'CCNOT', controlQubit: ctrls[0], controlQubit2: ctrls[1] }
          : { type: 'CNOT', controlQubit: ctrls[0] }

      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[anchorQubit][step] = null
      newCircuit[t][step] = updatedGate

      const newGates = [
        ...state.gates.filter((g) => !(g.qubit === anchorQubit && g.step === step)),
        { id: `${t}-${step}-${Date.now()}`, qubit: t, step, ...updatedGate },
      ]

      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  // Duplicate a placed gate (toolbar copy action) into the next step where
  // every wire it touches is free — keeps the same role fields (controls,
  // swap partner, QFT targets, theta, ...) exactly as-is, just moved later
  // in time. No-ops if no free slot is found within the visible grid.
  duplicateGate: (qubit, step) => {
    set((state) => {
      const gate = state.circuit[qubit]?.[step]
      if (!gate) return state

      const rows =
        gate.type === 'CCNOT'
          ? [qubit, gate.controlQubit, gate.controlQubit2]
          : gate.type === 'CNOT'
          ? [qubit, gate.controlQubit]
          : gate.type === 'SWAP'
          ? [qubit, gate.swapQubit]
          : isBlockType(gate.type)
          ? gate.targets
          : [qubit]

      if (rows.some((r) => !Number.isInteger(r) || r < 0 || r >= state.qubits)) return state

      const maxStep = state.steps + rows.length + 5
      let targetStep = null
      for (let s = step + 1; s <= maxStep; s++) {
        if (rows.every((r) => !state.circuit[r][s])) {
          targetStep = s
          break
        }
      }
      if (targetStep === null) return state

      const newCircuit = state.circuit.map((row) => {
        const copy = [...row]
        while (copy.length <= targetStep) copy.push(null)
        return copy
      })
      const anchorRow = isBlockType(gate.type) ? Math.min(...rows) : qubit
      newCircuit[anchorRow][targetStep] = { ...gate }

      const newGates = [
        ...state.gates,
        { id: `${anchorRow}-${targetStep}-${Date.now()}`, qubit: anchorRow, step: targetStep, ...gate },
      ]

      return {
        circuit: newCircuit,
        steps: Math.max(state.steps, targetStep + 1),
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  // Update an angle-gate's theta in place (inline popover UX).
  setGateTheta: (target, step, theta) => {
    set((state) => {
      const gate = state.circuit[target]?.[step]
      if (!gate || !Number.isFinite(theta)) return state
      const updatedGate = { ...gate, theta }
      const newCircuit = state.circuit.map((row) => [...row])
      newCircuit[target][step] = updatedGate
      const newGates = state.gates.map((g) =>
        g.qubit === target && g.step === step ? { ...g, theta } : g
      )
      return {
        circuit: newCircuit,
        gates: newGates,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { circuit: newCircuit, gates: newGates },
        ],
        historyIndex: state.historyIndex + 1,
      }
    })
  },

  setShots: (shots) => set({ shots }),
  setSimulationResult: (result) => set({ simulationResult: result, isSimulating: false }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setSelectedQubit: (qubit) => set({ selectedQubit: qubit }),

  resetCircuit: () => {
    set((state) => {
      const newCircuit = createEmptyCircuit(state.qubits, state.steps)
      return {
        circuit: newCircuit,
        gates: [],
        simulationResult: null,
        history: [{ circuit: newCircuit, gates: [] }],
        historyIndex: 0,
      }
    })
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1
        const { circuit, gates } = state.history[newIndex]
        return {
          circuit,
          gates,
          historyIndex: newIndex,
        }
      }
      return state
    })
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1
        const { circuit, gates } = state.history[newIndex]
        return {
          circuit,
          gates,
          historyIndex: newIndex,
        }
      }
      return state
    })
  },

  saveCircuit: () => {
    const state = get()
    const data = {
      qubits: state.qubits,
      gates: state.gates,
      timestamp: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quantum-circuit-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  loadCircuit: (data) => {
    set(() => {
      const collection = normalizeCircuitCollection(data)
      const first = collection[0]
      const firstState = buildCircuitState(first)

      return {
        ...firstState,
        circuitCollection: collection,
        circuitCollectionIndex: 0,
        activeCircuitMeta: {
          name: first.name,
          description: first.description,
        },
      }
    })
  },

  goToLoadedCircuitIndex: (index) => {
    set((state) => {
      if (!state.circuitCollection.length) {
        return state
      }

      const safeIndex = Math.max(0, Math.min(index, state.circuitCollection.length - 1))
      const selected = state.circuitCollection[safeIndex]
      const selectedState = buildCircuitState(selected)

      return {
        ...selectedState,
        circuitCollectionIndex: safeIndex,
        activeCircuitMeta: {
          name: selected.name,
          description: selected.description,
        },
      }
    })
  },

  goToNextLoadedCircuit: () => {
    const state = get()
    if (state.circuitCollectionIndex < state.circuitCollection.length - 1) {
      state.goToLoadedCircuitIndex(state.circuitCollectionIndex + 1)
    }
  },

  goToPreviousLoadedCircuit: () => {
    const state = get()
    if (state.circuitCollectionIndex > 0) {
      state.goToLoadedCircuitIndex(state.circuitCollectionIndex - 1)
    }
  },

  // -------------------------------------------------------------------------
  // AI Assistant actions
  // -------------------------------------------------------------------------

  setAIResponse: (response) => set({ aiResponse: response }),
  setAILoading: (loading) => set({ isAILoading: loading }),
  setAIError: (error) => set({ aiError: error }),

  setSelectedGateForAI: (gate) => set({ selectedGateForAI: gate }),
  setExplanationMode: (mode) => set({ explanationMode: mode }),

  setAIPanelOpen: (open) => set({ isAIPanelOpen: open }),
  toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),

  toggleBeginnerMode: () => set((state) => ({ beginnerMode: !state.beginnerMode })),
  setBeginnerMode: (on) => set({ beginnerMode: on }),

  setStepExplainMode: (on) => set({ stepExplainMode: on }),
  toggleStepExplainMode: () => set((state) => ({ stepExplainMode: !state.stepExplainMode })),

  setHighlightedStep: (step) => set({ highlightedStep: step }),

  clearAIResponse: () =>
    set({
      aiResponse: null,
      aiError: null,
      selectedGateForAI: null,
      explanationMode: null,
      highlightedStep: null,
    }),
}))