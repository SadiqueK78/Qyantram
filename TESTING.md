# Testing & Quality Assurance

## Manual Testing Checklist

### Frontend Functionality

#### Circuit Building
- [ ] Drag H gate from palette to grid cell
- [ ] Gate appears with correct color and icon
- [ ] Can drag gate to different cell
- [ ] Click gate to remove it
- [ ] Can add multiple gates

#### Controls
- [ ] "Run Simulation" button shows loading state
- [ ] "Reset Circuit" clears all gates
- [ ] Add/Remove qubit buttons work
- [ ] Steps slider updates circuit width
- [ ] Undo/Redo buttons work
- [ ] Save circuit downloads JSON file
- [ ] Load circuit opens file picker
- [ ] Load circuit restores saved state

#### Visualization
- [ ] Results panel hidden when no simulation
- [ ] After simulation, shows Bloch sphere
- [ ] Bloch sphere animates
- [ ] Histogram displays probabilities
- [ ] Qubit selector appears for multi-qubit circuits
- [ ] Selecting different qubit updates visualization

#### UI/UX
- [ ] Dark theme renders correctly
- [ ] Glassmorphism effect visible
- [ ] Gradient highlights appear
- [ ] Hover effects work
- [ ] Click animations smooth
- [ ] Drag preview shows shadow
- [ ] Responsive on mobile

### Backend Functionality

#### API Endpoints
- [ ] GET /api/health returns 200
- [ ] GET /api/gates returns gate list
- [ ] POST /api/simulate returns results

#### Bell State (2 qubits)
```json
{
  "qubits": 2,
  "gates": [
    {"type": "H", "target": 0, "step": 0},
    {"type": "CNOT", "control": 0, "target": 1, "step": 1}
  ]
}
```
Expected: ~50% |00⟩, ~50% |11⟩

#### Superposition (1 qubit)
```json
{
  "qubits": 1,
  "gates": [{"type": "H", "target": 0, "step": 0}]
}
```
Expected: ~50% |0⟩, ~50% |1⟩

#### X Gate (Flip)
```json
{
  "qubits": 1,
  "gates": [{"type": "X", "target": 0, "step": 0}]
}
```
Expected: 100% |1⟩

### Error Handling

- [ ] Empty circuit shows warning
- [ ] Invalid file load shows error
- [ ] Network error displays message
- [ ] Backend down shows error
- [ ] Invalid parameters rejected

---

## Performance Testing

### Metrics

1. **Frontend Performance**
   - Initial load time: < 3s
   - Drag interaction: 60 fps
   - Simulation button response: < 100ms

2. **Backend Performance**
   - Health check: < 50ms
   - Simulate 2 qubits: < 1s
   - Simulate 5 qubits: < 5s

### Load Testing

```bash
# Simple load test with Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/health

# For simulation endpoint:
# Create test.json with request body
ab -n 50 -c 5 -p test.json -T application/json \
  http://localhost:5000/api/simulate
```

---

## Browser Testing

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS 11+)

### Features on Each
- [ ] Drag & drop works
- [ ] Animations smooth
- [ ] Canvas renders (Bloch sphere)
- [ ] Chart renders
- [ ] No console errors

### Mobile Testing
- [ ] Layout responsive
- [ ] Touch interactions (limited)
- [ ] Panel visibility
- [ ] Performance acceptable

---

## Code Quality

### Linting

```bash
# Frontend
cd frontend
npm run lint

# Backend
pip install pylint
pylint backend/app.py
```

### Type Checking (Frontend)

```bash
# Add JSDoc type hints
# Or use TypeScript equivalent (optional)
```

---

## Common Issues & Fixes

### Issue: Drag & Drop Not Working
- [ ] Browser supports HTML5 DnD
- [ ] React DnD installed
- [ ] Backend connected

### Issue: Simulation Takes Too Long
- [ ] Too many qubits (> 5)
- [ ] Too many gates
- [ ] Network latency
- [ ] Solution: Reduce complexity

### Issue: Visualization Missing
- [ ] Three.js loaded
- [ ] Chart.js loaded
- [ ] Browser supports WebGL
- [ ] No console errors

---

## Sample Test Data

### Test Cases

1. **Basic Hadamard**
   - Input: 1 qubit, 1 H gate
   - Expected: 50/50 probability

2. **Bell Pair**
   - Input: 2 qubits, H + CNOT
   - Expected: 50% |00⟩, 50% |11⟩

3. **GHZ State**
   - Input: 3 qubits, H + 2 CNOTs
   - Expected: 50% |000⟩, 50% |111⟩

4. **X Gate**
   - Input: 1 qubit, X gate
   - Expected: 100% |1⟩

5. **Complex Circuit**
   - Input: 3 qubits, 5 gates
   - Expected: Various probabilities

---

## Continuous Integration (Optional)

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install && npm run lint
  
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: |
          pip install -r requirements.txt
          pylint app.py
```

---

## Performance Optimization

### Frontend Optimizations
- [ ] React.memo on components
- [ ] Lazy load visualizations
- [ ] Virtualize long lists
- [ ] Debounce handlers
- [ ] Cache API responses

### Backend Optimizations
- [ ] Cache gate configurations
- [ ] Optimize Qiskit calls
- [ ] Database caching (future)
- [ ] Circuit optimization (future)

---

## Security Checklist

- [ ] Input validation (qubits, gates)
- [ ] SQL injection prevention (future)
- [ ] Rate limiting (production)
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] Error messages safe

---

## Accessibility

- [ ] Color contrast sufficient
- [ ] Keyboard navigation
- [ ] Screen reader friendly
- [ ] Focus indicators
- [ ] ARIA labels

---

## Documentation

- [ ] README complete
- [ ] API docs comprehensive
- [ ] Code comments clear
- [ ] Sample circuits provided
- [ ] Setup guide step-by-step

---
