# 🚀 Quick Start Guide

Get the Quantum Logic Gate Simulator running in 5 minutes!

## TL;DR

```bash
# Terminal 1 - Frontend
cd frontend
npm install
npm run dev

# Terminal 2 - Backend (Python required)
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py

# Open browser to http://localhost:5173
```

---

## What You Get

✅ **Interactive Quantum Circuit Builder**
- Drag & drop gate placement
- Visual circuit grid
- Real-time editing

✅ **Quantum Simulation Engine**
- Powered by Qiskit
- Statevector simulation
- Measurement probabilities

✅ **Advanced Visualizations**
- 3D Bloch sphere (Three.js)
- Probability histograms (Chart.js)
- State vector display

✅ **Professional UI**
- Dark glassmorphism theme
- Smooth animations (Framer Motion)
- Responsive design

---

## File Structure

```
quantum-circuit-simulator/
├── frontend/                    # React Vite app
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── App.jsx
│   │   │   ├── CircuitGrid.jsx
│   │   │   ├── CircuitCell.jsx
│   │   │   ├── GatePalette.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   ├── VisualizationPanel.jsx
│   │   │   ├── BlochSphere.jsx
│   │   │   └── Histogram.jsx
│   │   ├── store/
│   │   │   └── useCircuitStore.js    # Zustand state
│   │   ├── config/
│   │   │   └── constants.js          # Constants
│   │   ├── api/
│   │   │   └── client.js             # API calls
│   │   ├── styles/
│   │   │   └── index.css             # Tailwind + custom CSS
│   │   └── main.jsx
│   └── vite.config.js
│
├── backend/                     # Flask API
│   ├── app.py                   # Main Flask app
│   └── requirements.txt         # Python dependencies
│
├── README.md                    # Full documentation
├── SETUP.md                     # Detailed setup
├── API_DOCUMENTATION.md         # API reference
├── TESTING.md                   # Testing guide
├── SAMPLE_CIRCUITS.json         # Example circuits
└── QUICK_START.md              # This file
```

---

## Core Technologies

### Frontend Stack
- **React 18**: UI framework
- **Vite**: Build tool & dev server
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **React DnD**: Drag & drop
- **Framer Motion**: Animations
- **Three.js**: 3D Bloch sphere
- **Chart.js**: Data visualization

### Backend Stack
- **Flask**: Python web framework
- **Qiskit**: Quantum computing framework
- **Qiskit Aer**: Quantum simulator
- **NumPy**: Numerical computing
- **CORS**: Cross-origin support

---

## Key Features

### 1. Circuit Grid
```
q0: ─[H]─────●──
q1: ───────[X]─┴─
      0   1   2   (steps)
```

### 2. Supported Gates
- **H** (Hadamard): Superposition
- **X** (Pauli X): NOT gate
- **Y** (Pauli Y): Y-axis rotation
- **Z** (Pauli Z): Z-axis rotation
- **CNOT**: Entanglement
- **Measure**: Measurement

### 3. Visualizations
- **Bloch Sphere**: Individual qubit state
- **Histogram**: Measurement probabilities
- **State Vector**: Amplitude display

### 4. Controls
- Run simulation
- Add/remove qubits
- Adjust steps
- Undo/Redo
- Save/Load circuits

---

## Common Circuits

### Bell State (Entanglement)
```
Input: 2 qubits
Step 0: H on qubit 0
Step 1: CNOT (control=0, target=1)
Output: 50% |00⟩, 50% |11⟩
```

### Superposition
```
Input: 1 qubit
Step 0: H gate
Output: 50% |0⟩, 50% |1⟩
```

### NOT (X) Gate
```
Input: 1 qubit
Step 0: X gate
Output: 100% |1⟩
```

---

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Gates
```
GET /api/gates
```

### Simulate Circuit
```
POST /api/simulate
{
  "qubits": 2,
  "gates": [
    {"type": "H", "target": 0, "step": 0},
    {"type": "CNOT", "control": 0, "target": 1, "step": 1}
  ]
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend won't start | `cd frontend && npm install && npm run dev` |
| Backend won't start | Ensure Python 3.8+ and `pip install -r requirements.txt` |
| CORS errors | Check backend is running on `localhost:5000` |
| Drag & drop not working | Clear browser cache, restart dev server |
| Port 5173 in use | Change port in `vite.config.js` |
| Port 5000 in use | Kill Flask process or change in `app.py` |
| Qiskit errors | `pip install --upgrade qiskit qiskit-aer` |

---

## Performance Tips

⚡ **Best Performance**
- Keep qubits ≤ 5
- Use 1024 shots
- Limit gates < 50
- Close other tabs
- Use modern browser

---

## Customization

### Change Colors
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  quantum: {
    blue: "#your-color",
    purple: "#your-color",
    pink: "#your-color"
  }
}
```

### Change Default Settings
Edit `frontend/src/config/constants.js`:
```javascript
CIRCUIT_CONFIG = {
  DEFAULT_QUBITS: 3,
  DEFAULT_STEPS: 15,
  MAX_QUBITS: 8,
}
```

### Add Custom Gates
Edit `backend/app.py` in `QuantumCircuitBuilder.build_circuit()`:
```python
elif gate_type == 'S':
    qc.s(target)
```

---

## Development Workflow

### Start Development
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && python app.py
```

### Make Changes
- Frontend: Changes auto-reload via Vite
- Backend: Restart Flask (debug mode auto-reloads on save)

### Test
- Frontend: Open `http://localhost:5173`
- Backend: Check console logs
- API: Use curl or Postman

### Build for Production
```bash
# Frontend
cd frontend && npm run build
# Deploy 'dist' folder

# Backend
# Use gunicorn: gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Next Steps

1. ✅ Complete setup (5 mins)
2. ✅ Drag a gate and place it (1 min)
3. ✅ Click "Run Simulation" (30 secs)
4. ✅ View Bloch sphere & histogram (1 min)
5. ✅ Try sample circuits (5 mins)
6. ✅ Read full docs (10 mins)

---

## Resources

📚 **Documentation**
- [README.md](README.md) - Full overview
- [SETUP.md](SETUP.md) - Detailed setup
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [TESTING.md](TESTING.md) - Testing guide

🔗 **External Resources**
- [Qiskit Documentation](https://qiskit.org/documentation/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Three.js Guide](https://threejs.org/manual/)

---

## Support

Having issues?
1. Check browser console (F12)
2. Check Flask logs
3. Review TESTING.md
4. Check API_DOCUMENTATION.md

---

## Keyboard Shortcuts (Future Feature)

```
Ctrl+Z      Undo
Ctrl+Shift+Z Redo
Ctrl+S      Save
Ctrl+L      Load
Delete      Remove gate
Ctrl+A      Select all
```

---

## License

MIT - Feel free to use and modify!

---

**Happy Quantum Computing! 🚀⚛️**

Questions? Check the full docs or start experimenting!
