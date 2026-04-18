# Setup Instructions

## Complete Installation Guide

### Requirements
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher  
- **Python**: 3.8 or higher
- **pip**: Latest version
- **Git** (optional but recommended)

### Step 1: Clone/Download Project

If you haven't already, extract the project folder.

### Step 2: Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server (will run on `http://localhost:5173`):

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

### Step 3: Backend Setup

**Option A: On Windows (Command Prompt)**

Navigate to backend directory:

```bash
cd backend
```

Create Python virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run Flask server:

```bash
python app.py
```

**Option B: On macOS/Linux**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

### Step 4: Access Application

Open your browser and go to: `http://localhost:5173`

You should see the Quantum Logic Gate Simulator interface.

---

## Verification Checklist

- [ ] Frontend server running on `http://localhost:5173`
- [ ] Backend server running on `http://localhost:5000`
- [ ] No console errors in browser DevTools
- [ ] Can drag gates from palette to grid
- [ ] Simulation button works (shows results)
- [ ] No CORS errors

---

## Troubleshooting

### Issue: "npm not found"
**Solution**: Install Node.js from https://nodejs.org

### Issue: "python not found"
**Solution**: Install Python from https://www.python.org

### Issue: Port 5173 already in use
**Solution**: 
```bash
# Change port in frontend/vite.config.js
# Or kill process using the port
# Windows: netstat -ano | findstr :5173
```

### Issue: CORS errors
**Solution**: Ensure backend is running and vite.config.js proxy is correct

### Issue: Qiskit installation fails
**Solution**: 
```bash
pip install --upgrade pip
pip install qiskit qiskit-aer numpy
```

### Issue: "ModuleNotFoundError"
**Solution**: Ensure venv is activated and requirements.txt installed

---

## Project Structure

```
quantum-circuit-simulator/
│
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── store/           # Zustand state management
│   │   ├── styles/          # Tailwind CSS styles
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── package.json         # npm dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── index.html           # HTML template
│
├── backend/                 # Python Flask API
│   ├── app.py               # Flask application
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment
│
├── README.md                # Full documentation
├── SETUP.md                 # This file
└── SAMPLE_CIRCUITS.json     # Example circuits
```

---

## Development Commands

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend

```bash
# Run development server (with auto-reload)
python app.py

# Check if running
curl http://localhost:5000/api/health

# Test simulation endpoint
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"qubits": 2, "gates": [{"type": "H", "target": 0, "step": 0}]}'
```

---

## API Endpoints

### Health Check
```
GET /api/health
Response: {"status": "ok", "service": "quantum-simulator"}
```

### Get Available Gates
```
GET /api/gates
Response: [{"type": "H", "name": "Hadamard", ...}, ...]
```

### Simulate Circuit
```
POST /api/simulate
Content-Type: application/json

Body:
{
  "qubits": 2,
  "gates": [
    {"type": "H", "target": 0, "step": 0},
    {"type": "CNOT", "control": 0, "target": 1, "step": 1}
  ],
  "shots": 1024
}

Response:
{
  "success": true,
  "statevector": [...],
  "probabilities": {...},
  "counts": {...}
}
```

---

## Environment Variables

### Frontend
No env variables needed (proxy configured in vite.config.js)

### Backend
Create `.env` file (optional):
```
FLASK_ENV=development
FLASK_DEBUG=True
QISKIT_SIMULATOR=qasm
```

---

## Performance Tips

1. **Limit qubits to 5** for best performance
2. **Use 1024 shots** for accurate probabilities
3. **Close browser tabs** to free up memory
4. **Restart servers** if experiencing slow performance
5. **Clear browser cache** if UI looks outdated

---

## Running Sample Circuits

1. Load SAMPLE_CIRCUITS.json through the UI
2. Or manually recreate using the description

Example circuits included:
- Bell State (entanglement)
- Superposition
- GHZ State
- Deutsch Algorithm

---

## Production Deployment

### Frontend
```bash
npm run build
# Deploy 'dist' folder to static hosting (Vercel, Netlify, AWS S3, etc)
```

### Backend
```bash
# Use gunicorn for production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Check backend logs
3. Refer to README.md for detailed documentation
4. Review SAMPLE_CIRCUITS.json for usage examples

---

## Next Steps

1. ✅ Follow setup steps above
2. ✅ Run both frontend and backend
3. ✅ Create a simple circuit (H gate)
4. ✅ Run simulation
5. ✅ Explore visualizations
6. ✅ Try sample circuits
7. ✅ Save and load circuits

Happy quantum computing! 🚀⚛️
