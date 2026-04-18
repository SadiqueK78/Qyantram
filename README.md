# Quantum Logic Gate Simulator

A full-stack web application for building, simulating, and analyzing quantum circuits with an interactive drag-and-drop interface.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + React DnD
- **Backend**: Python Flask + Qiskit + Qiskit Aer
- **Communication**: REST API with JSON

## Features

✨ **Quantum Circuit Builder**
- Grid-based circuit layout (qubits × time steps)
- Drag-and-drop gate placement
- Expanded gate library:
  - Single-qubit: H, I, X, Y, Z, S, Sdg, T, Tdg, SX, SXdg
  - Parameterized: RX, RY, RZ, P (angle prompt in radians)
  - Multi-qubit: CNOT, CCNOT (Toffoli), SWAP
  - Utility: Measure, Reset, Barrier (`|`)
- Undo/Redo functionality
- Gate parameter and control-qubit prompts for advanced operations

🎨 **Advanced Visualizations**
- Q-sphere style 3D state/phase visualization with Three.js
- Probability histograms with Chart.js
- State vector display
- Exact probabilities from simulated statevector
- Sampled measurement results (`counts` + `sampled_probabilities`)

🎮 **Interactive Controls**
- Add/remove qubits
- Adjust circuit depth
- Save/Load circuits (JSON)
- Real-time simulation
- Multi-circuit JSON collection loader with:
  - Previous/Next navigation
  - Circuit tabs/chips
  - Active circuit metadata panel

🧠 **Algorithm Template Marketplace**
- One-click template loading for:
  - Grover Search
  - QFT (native approximation)
  - Quantum Teleportation
  - Superdense Coding
  - 3-qubit Bit-Flip Code
  - Deutsch-Jozsa
- Load one template or load all as a browsable pack

🚀 **Startup Prompt Experience**
- Full-screen welcome prompt on first open
- Animated quantum-themed 3D visualization panel
- Advanced feature spotlight cards
- "Do not show again" preference (persisted in localStorage)

🌙 **Modern UI/UX**
- Dark theme with glassmorphism
- Smooth animations
- Responsive design
- Professional gradient styling

## Quick Start

### Prerequisites
- Node.js 16+ 
- Python 3.8+
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5000`

## Project Structure

```
quantum-circuit-simulator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WelcomePrompt.jsx
│   │   │   ├── CircuitGrid.jsx
│   │   │   ├── CircuitCell.jsx
│   │   │   ├── GatePalette.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   ├── VisualizationPanel.jsx
│   │   │   ├── BlochSphere.jsx
│   │   │   └── Histogram.jsx
│   │   ├── store/
│   │   │   └── useCircuitStore.js (Zustand)
│   │   ├── styles/
│   │   │   └── index.css (Tailwind + custom)
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── venv/
└── README.md
```

## Key Components

### Frontend Components

**CircuitGrid.jsx**
- Renders the quantum circuit as a grid
- Grid rows = qubits, columns = time steps
- Displays wires connecting qubits
- Integrates with React DnD

**GatePalette.jsx**
- Displays grouped composer-style quantum gates
- Provides draggable gate items
- Shows gate descriptions and tips

**ControlPanel.jsx**
- Simulation button
- Qubit/step controls
- Reset, Undo/Redo, Save/Load
- Error handling and status messages
- Algorithm template marketplace (one-click circuit loading)
- Multi-circuit pack navigation (tabs + previous/next)

**WelcomePrompt.jsx**
- Startup onboarding screen
- Feature highlights and animated quantum intro scene
- One-click entry into simulator with dismiss preference

**VisualizationPanel.jsx**
- Displays simulation results
- Qubit selector for multi-qubit systems
- Integrates Bloch sphere and histogram

**BlochSphere.jsx**
- Three.js powered 3D visualization
- Q-sphere style phase and probability view
- State labels with optional phase visibility
- Interactive display controls

**Histogram.jsx**
- Chart.js bar chart
- Shows measurement probabilities
- Displays top results
- Interactive tooltips

### State Management (Zustand)

`useCircuitStore.js` manages:
- Qubit count and circuit depth
- Circuit grid state
- Gate positions and types
- Simulation results
- Undo/Redo history
- Save/Load functionality
- Circuit collections and active template metadata

### Backend API

**POST /api/simulate** (proxied to backend `/simulate`)
- Builds quantum circuit from gates
- Simulates using Qiskit
- Returns statevector, exact probabilities, sampled probabilities, and counts

Request:
```json
{
  "qubits": 2,
  "gates": [
    {"type": "H", "target": 0, "step": 0},
    {"type": "CNOT", "control": 0, "target": 1, "step": 1}
  ]
}
```

Response:
```json
{
  "success": true,
  "statevector": [...],
  "probabilities": {...},
  "counts": {...}
}
```

**GET /api/gates**
- Returns available quantum gates with descriptions
- Useful for dynamic UI updates

**GET /api/health**
- Health check endpoint

## Sample Circuits and Template Packs

Use the built-in loader with [SAMPLE_CIRCUITS.json](SAMPLE_CIRCUITS.json), which now includes:
- Bell State with Phase Twist
- Toffoli (CCNOT) demos
- SWAP-based layouts
- Reset/Barrier workflows
- Application-style examples (teleportation skeleton, superdense coding, bit-flip code)

You can also use the in-app Algorithm Template Marketplace for one-click loading.

### Bell State (Entanglement)
1. Add 2 qubits
2. Place H gate on qubit 0, step 0
3. Place CNOT gate (control=0, target=1) on step 1
4. Run simulation → 50% |00⟩, 50% |11⟩

### Superposition
1. Add 1 qubit
2. Place H gate on step 0
3. Run simulation → 50% |0⟩, 50% |1⟩

### X Gate Test
1. Add 1 qubit
2. Place X gate on step 0
3. Run simulation → 100% |1⟩

## Technologies Deep Dive

### Qiskit
- Industry-standard quantum computing framework
- Supports multiple simulators and hardware
- Comprehensive gate library
- Used for circuit construction and simulation

### Framer Motion
- Declarative animations for React
- Smooth transitions and interactions
- GPU-accelerated performance

### React DnD
- Drag and drop system
- Item drag preview
- Drop zone detection and validation
- Smooth animations

### Three.js
- 3D visualization library
- WebGL rendering
- Real-time performance
- Orbital visualization of Bloch sphere

### Chart.js
- Responsive data visualization
- Bar, line, and pie charts
- Interactive tooltips
- Small bundle size

## API Integration Flow

1. **User builds circuit** → Zustand store updated
2. **User clicks "Run Simulation"** → Circuit converted to API format
3. **POST /api/simulate** → Backend receives circuit
4. **Qiskit processes** → Creates circuit, applies gates, simulates
5. **Results returned** → Statevector + probabilities
6. **Visualizations update** → Bloch sphere and histogram rendered
7. **Results stored** → Can be saved to JSON

## Performance Optimizations

- ✅ React.memo on frequently rendered components
- ✅ Zustand for efficient state management
- ✅ Lazy loading of visualization components
- ✅ Efficient circuit grid rendering
- ✅ GPU-accelerated animations with Framer Motion
- ✅ Three.js WebGL rendering for Bloch sphere
- ✅ Debounced API calls

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (macOS 11+)
- Mobile browsers: ⚠️ Limited (drag-drop may be difficult)

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend connection error
- Check backend is running: `http://localhost:5000/api/health`
- Verify proxy in `vite.config.js`
- Check CORS headers in Flask

### Simulation fails
- Check console for errors
- Verify gate configuration
- Ensure qubits ≤ 5 for performance

## Implemented Advanced Features

- ✅ Parameterized rotation and phase gates (RX/RY/RZ/P)
- ✅ Advanced gate operations (CCNOT, SWAP, Reset, Barrier)
- ✅ Q-sphere style 3D phase/probability visualization
- ✅ Algorithm Template Marketplace
- ✅ Multi-circuit JSON pack loading and navigation
- ✅ Startup onboarding prompt with animated quantum intro



## Contributing

Contributions welcome! Please feel free to submit PRs or issues.

## Author

Built with ❤️ for quantum computing enthusiasts
