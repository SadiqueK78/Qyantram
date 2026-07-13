import { create } from 'zustand'
import { DEFAULT_SHOTS } from '../config/constants'

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
  const steps = Math.max(10, maxStep + 1)

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
      ...(g.partnerQubit !== undefined && { partnerQubit: Number(g.partnerQubit) }),
      ...(g.qftQubit !== undefined && { partnerQubit: Number(g.qftQubit) }),
      ...(Array.isArray(g.targets) && g.targets.length > 1 && {
        partnerQubit: Number(g.targets.find((t) => Number(t) !== qubit) ?? g.targets[1]),
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

    if (
      (gate.type === 'QFT' || gate.type === 'IQFT') &&
      (!Number.isInteger(gate.partnerQubit) || gate.partnerQubit === qubit || gate.partnerQubit < 0 || gate.partnerQubit >= parsedCircuit.qubits)
    ) {
      return
    }

    newCircuit[qubit][step] = gate
    gates.push({ id: g.id || `loaded-${idx}`, qubit, step, ...gate })
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
  steps: 10,
  shots: DEFAULT_SHOTS,
  circuit: createEmptyCircuit(2, 10),
  gates: [],
  simulationResult: null,
  isSimulating: false,
  selectedQubit: 0,

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

      if ((gate.type === 'QFT' || gate.type === 'IQFT') && state.qubits < 2) {
        return state
      }

      const newCircuit = state.circuit.map((row) => [...row])

      let normalizedGate = { ...gate }
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
      } else if (gate.type === 'QFT' || gate.type === 'IQFT') {
        const fallbackPartner = qubit > 0 ? qubit - 1 : 1
        const partnerQubit = Number.isInteger(gate.partnerQubit) ? gate.partnerQubit : fallbackPartner

        if (partnerQubit < 0 || partnerQubit >= state.qubits || partnerQubit === qubit) {
          return state
        }

        normalizedGate = { ...gate, partnerQubit }
      }

      newCircuit[qubit][step] = normalizedGate

      // Add to gates array
      const filteredExisting = state.gates.filter((g) => !(g.qubit === qubit && g.step === step))
      const newGates = [
        ...filteredExisting,
        { id: `${qubit}-${step}-${Date.now()}`, qubit, step, ...normalizedGate },
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

      const fieldByRole = { control: 'controlQubit', control2: 'controlQubit2', swap: 'swapQubit', partner: 'partnerQubit' }
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