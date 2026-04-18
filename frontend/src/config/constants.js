// Gate types and configurations
export const GATE_TYPES = {
  H: {
    type: 'H',
    label: 'Hadamard',
    description: 'Creates superposition (H|0⟩ = (|0⟩+|1⟩)/√2)',
    color: 'blue',
    icon: 'H',
    single_qubit: true,
  },
  X: {
    type: 'X',
    label: 'Pauli X',
    description: 'Quantum NOT gate (flips |0⟩ to |1⟩)',
    color: 'red',
    icon: 'X',
    single_qubit: true,
  },
  Y: {
    type: 'Y',
    label: 'Pauli Y',
    description: 'Rotation around Y-axis',
    color: 'purple',
    icon: 'Y',
    single_qubit: true,
  },
  Z: {
    type: 'Z',
    label: 'Pauli Z',
    description: 'Rotation around Z-axis',
    color: 'yellow',
    icon: 'Z',
    single_qubit: true,
  },
  CNOT: {
    type: 'CNOT',
    label: 'CNOT',
    description: 'Controlled NOT gate (applies X if control is |1⟩)',
    color: 'pink',
    icon: '◎⊕',
    single_qubit: false,
    control_qubit: true,
  },
  Measure: {
    type: 'Measure',
    label: 'Measure',
    description: 'Measurement gate (collapses qubit state)',
    color: 'green',
    icon: '⌚',
    single_qubit: true,
  },
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    SIMULATE: '/simulate',
    GATES: '/gates',
    HEALTH: '/health',
  },
  TIMEOUT: 30000,
}

// Circuit Configuration
export const CIRCUIT_CONFIG = {
  MAX_QUBITS: 5,
  MIN_QUBITS: 1,
  MAX_STEPS: 20,
  MIN_STEPS: 5,
  DEFAULT_QUBITS: 2,
  DEFAULT_STEPS: 10,
  DEFAULT_SHOTS: 1024,
}

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 0.3,
  CELL_SIZE: 48,
  GRID_GAP: 4,
  COLORS: {
    PRIMARY: '#00d9ff',
    SECONDARY: '#7c3aed',
    ACCENT: '#ec4899',
    DARK_BG: '#0f0f23',
  },
}
