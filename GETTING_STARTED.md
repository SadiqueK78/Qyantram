# ✅ Getting Started Checklist

## Phase 1: Setup & Installation (15 minutes)

### Prerequisites
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 8+ installed (`npm --version`)
- [ ] Python 3.8+ installed (`python --version`)
- [ ] pip installed (`pip --version`)
- [ ] Git installed (optional)

### Frontend Setup
- [ ] Navigate to `frontend` folder
- [ ] Run `npm install` (wait for completion)
- [ ] Verify installation: `npm list` shows dependencies
- [ ] Check `node_modules` folder exists

### Backend Setup
- [ ] Navigate to `backend` folder
- [ ] Create venv: `python -m venv venv`
- [ ] Activate venv (see SETUP.md for your OS)
- [ ] Run `pip install -r requirements.txt` (takes 2-3 minutes)
- [ ] Verify: `pip list` shows Qiskit installed

---

## Phase 2: Start Services (10 minutes)

### Frontend Server
- [ ] Terminal 1: `cd frontend`
- [ ] Run: `npm run dev`
- [ ] Wait for: "Local: http://localhost:5173"
- [ ] ✅ **Don't close this terminal**

### Backend Server
- [ ] Terminal 2: `cd backend`
- [ ] Activate venv (Windows: `venv\Scripts\activate`, Mac/Linux: `source venv/bin/activate`)
- [ ] Run: `python app.py`
- [ ] Wait for: "Running on http://localhost:5000"
- [ ] ✅ **Don't close this terminal**

### Browser
- [ ] Open: `http://localhost:5173`
- [ ] You should see the Quantum Logic Gate Simulator

---

## Phase 3: Verify Everything Works (5 minutes)

### Check Console
- [ ] Open DevTools: `F12` or `Right Click → Inspect`
- [ ] Go to Console tab
- [ ] Should see no RED error messages
- [ ] May see blue CORS warnings - that's OK

### Test UI Components
- [ ] Gate palette visible on left
- [ ] Circuit grid in center with 2 qubits × 10 steps
- [ ] Control panel on left
- [ ] Visualization panel on right
- [ ] Dark theme with blue/purple accents

### Drag & Drop Test
- [ ] Click and drag H gate from palette
- [ ] Try to drop it on grid cell [qubits 0, step 0]
- [ ] Gates should snap into position
- [ ] Click gate to remove it

### Backend Test
- [ ] In Terminal 2, you should see: `POST /api/health`
- [ ] This means React is connecting to backend
- [ ] ✅ Connection successful!

---

## Phase 4: Run Your First Simulation

### Create Bell State (Entanglement)
1. [ ] Circuit: 2 qubits (already set)
2. [ ] Drag H gate → grid[qubit 0, step 0]
3. [ ] Drag CNOT gate → grid[qubit 1, step 1]
   - This creates entanglement
4. [ ] Click **"▶️ Run Simulation"** button
5. [ ] Wait for simulation to complete
6. [ ] ✅ See results: ~50% |00⟩, ~50% |11⟩

### Check Visualizations
- [ ] Bloch sphere appears (rotating sphere)
- [ ] Histogram shows bar chart
- [ ] State info displayed
- [ ] Results show probabilities

### Try Other Circuits
- [ ] Simple Hadamard (1 qubit, 1 H gate)
- [ ] X Gate flip (1 qubit, 1 X gate)
- [ ] Superposition (1 qubit, 1 H gate)

---

## Phase 5: Explore Features

### Circuit Management
- [ ] [ ] Save circuit: Click "💾 Save"
  - File downloads: `quantum-circuit-*.json`
- [ ] [ ] Load circuit: Click "📂 Load"
  - Select the saved JSON file
  - Circuit restores
- [ ] [ ] Reset circuit: Click "🔄 Reset"
  - All gates cleared
- [ ] [ ] Undo: Click "↶"
  - Last action reversed
- [ ] [ ] Redo: Click "↷"
  - Undo reversed

### Circuit Modifications
- [ ] Add qubit: Click "+" button
  - New qubit row appears
  - Max 5 qubits
- [ ] Remove qubit: Click "−" button
  - Last qubit removed
  - Min 1 qubit
- [ ] Adjust steps: Move slider
  - Circuit width changes
  - Max 20 steps

### Gate Palette
- [ ] Hover over each gate
  - See description popup
  - Read gate info
- [ ] Try each gate type:
  - [ ] H (Hadamard)
  - [ ] X (Pauli X)
  - [ ] Z (Pauli Z)
  - [ ] Y (Pauli Y)
  - [ ] CNOT (Control + Target)
  - [ ] Measure

---

## Phase 6: Learn the Interface

### Left Panel: Gate Palette
- Draggable gate items
- Each gate has color (type indicator)
- Tips at bottom

### Center: Circuit & Controls
- **Top**: Circuit grid
  - Rows = qubits
  - Columns = time steps
  - Horizontal lines = qubit wires
- **Bottom**: Control buttons
  - Simulation
  - Reset
  - Add/Remove qubits
  - Save/Load
  - Undo/Redo

### Right Panel: Visualizations
- Bloch sphere (when results available)
- Probability histogram
- State vector info
- Qubit selector

---

## Phase 7: Try Sample Circuits

See [SAMPLE_CIRCUITS.json](SAMPLE_CIRCUITS.json) for these circuits:

1. [ ] **Bell State** - Two entangled qubits
2. [ ] **Superposition** - Single qubit in superposition
3. [ ] **GHZ State** - Three entangled qubits
4. [ ] **Deutsch Algorithm** - Quantum algorithm

---

## Phase 8: Review Documentation

Essential reading:
- [ ] [QUICK_START.md](QUICK_START.md) - Overview
- [ ] [README.md](README.md) - Full documentation
- [ ] [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - How backend works

Optional deep-dive:
- [ ] [SETUP.md](SETUP.md) - Detailed setup
- [ ] [TESTING.md](TESTING.md) - QA procedures
- [ ] [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What's included

---

## 🎯 Common Tasks

### I want to...

**🔧 Fix Drag & Drop**
- [ ] Clear browser cache
- [ ] Hard refresh: `Ctrl+Shift+R`
- [ ] Restart both servers
- [ ] Check console for errors

**💾 Save My Circuit**
- [ ] Click "💾 Save"
- [ ] File downloads automatically
- [ ] Store in safe location

**📂 Load Saved Circuit**
- [ ] Click "📂 Load"
- [ ] Select JSON file
- [ ] Circuit appears in grid

**⚡ Make Simulation Faster**
- [ ] Reduce qubits (< 5)
- [ ] Reduce gates (< 20)
- [ ] Clear browser cache

**🎨 Explore More Gates**
- [ ] Currently: H, X, Y, Z, CNOT, Measure
- [ ] Future: RX, RY, RZ, SWAP

**📊 See Different Visualizations**
- [ ] Multi-qubit: Select which qubit to view
- [ ] Histogram shows top 8 results
- [ ] Bloch sphere rotates

---

## 🐛 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Frontend won't start | [SETUP.md](SETUP.md) → Frontend Setup |
| Backend won't start | [SETUP.md](SETUP.md) → Backend Setup |
| Drag & drop broken | [TESTING.md](TESTING.md) → Common Issues |
| Simulation slow | [README.md](README.md) → Performance |
| CORS errors | Restart backend, check console |
| Port already in use | [SETUP.md](SETUP.md) → Troubleshooting |

---

## ✨ Quick Reference

### Keyboard Shortcuts (Future)
```
Ctrl+S     Save circuit
Ctrl+O     Open/Load circuit
Ctrl+Z     Undo
Ctrl+Shift+Z  Redo
Delete     Remove selected gate
```

### API Quick Test
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Simulate simple circuit
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"qubits": 1, "gates": [{"type": "H", "target": 0, "step": 0}]}'
```

### File Locations
```
Frontend: c:\Users\khati\Downloads\quntum project\frontend
Backend:  c:\Users\khati\Downloads\quntum project\backend
Docs:     c:\Users\khati\Downloads\quntum project\*.md
```

---

## 🎓 Learning Resources

### Quantum Computing Basics
1. Visit [Qiskit.org](https://qiskit.org/)
2. Watch intro videos
3. Read quantum gate explanations

### This Simulator
1. Read [README.md](README.md) architecture
2. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Explore code in `frontend/src/components/`

### Build Skills
1. Start with simple gates
2. Combine gates into circuits
3. Observe measurement results
4. Create your own algorithms

---

## 🚀 Next Steps

1. ✅ Complete this checklist
2. ✅ Understand the interface
3. ✅ Build some circuits
4. ✅ Save and load circuits
5. ✅ Explore visualizations
6. ✅ Try all gate types
7. ✅ Read documentation
8. ✅ Modify code (optional)
9. ✅ Deploy (optional)

---

## 📋 Daily Usage Checklist

**Every Time You Use the Simulator:**
- [ ] Start frontend: `npm run dev` (terminal 1)
- [ ] Start backend: `python app.py` (terminal 2)
- [ ] Open: `http://localhost:5173`
- [ ] Check console (F12) - no red errors
- [ ] Create circuit
- [ ] Run simulation
- [ ] View results
- [ ] Save if needed

---

## ✅ Success Criteria

You successfully set up the simulator when:
- ✅ Both frontend and backend servers running
- ✅ Can see the UI with all panels
- ✅ Can drag gates onto circuit grid
- ✅ Can simulate circuit
- ✅ See Bloch sphere and histogram
- ✅ No error messages in console
- ✅ Can save and load circuits

---

## 🎉 Congratulations!

You now have a fully functional **Quantum Logic Gate Simulator**!

**Next:** Read [QUICK_START.md](QUICK_START.md) for deeper understanding.

**Questions?** Check [SETUP.md](SETUP.md) or [README.md](README.md).

**Ready to explore?** Build your first quantum circuit now! 🚀⚛️

---

**Happy Quantum Computing!** 😊
