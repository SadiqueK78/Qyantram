# API Documentation

## Quantum Circuit Simulator - REST API

Base URL: `http://localhost:5000/api`

---

## Endpoints

### 1. Health Check

Check if the backend service is up and running.

**Request:**
```
GET /api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "quantum-simulator"
}
```

---

### 2. Get Available Gates

Retrieve list of supported quantum gates.

**Request:**
```
GET /api/gates
```

**Response:** `200 OK`
```json
[
  {
    "type": "H",
    "name": "Hadamard",
    "description": "Creates superposition",
    "qubits_required": 1
  },
  {
    "type": "X",
    "name": "Pauli X",
    "description": "Quantum NOT gate",
    "qubits_required": 1
  },
  {
    "type": "Y",
    "name": "Pauli Y",
    "description": "Rotation around Y-axis",
    "qubits_required": 1
  },
  {
    "type": "Z",
    "name": "Pauli Z",
    "description": "Rotation around Z-axis",
    "qubits_required": 1
  },
  {
    "type": "CNOT",
    "name": "CNOT",
    "description": "Controlled NOT gate",
    "qubits_required": 2
  },
  {
    "type": "Measure",
    "name": "Measurement",
    "description": "Measure qubit state",
    "qubits_required": 1
  }
]
```

---

### 3. Simulate Circuit

Execute a quantum circuit simulation.

**Request:**
```
POST /api/simulate
Content-Type: application/json
```

**Request Body:**
```json
{
  "qubits": 2,
  "gates": [
    {
      "type": "H",
      "target": 0,
      "step": 0
    },
    {
      "type": "CNOT",
      "control": 0,
      "target": 1,
      "step": 1
    }
  ],
  "shots": 1024
}
```

**Parameters:**
- `qubits` (integer, required): Number of qubits (1-10)
- `gates` (array, required): Array of gate operations
- `shots` (integer, optional): Number of measurement shots (default: 1024)

**Gate Object:**
```json
{
  "type": "H|X|Y|Z|CNOT|Measure",
  "target": <qubit_index>,
  "step": <time_step>,
  "control": <control_qubit_index> // Only for CNOT
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "statevector": [
    { "real": 0.707, "imag": 0.0 },
    { "real": 0.0, "imag": 0.0 },
    { "real": 0.0, "imag": 0.0 },
    { "real": 0.707, "imag": 0.0 }
  ],
  "probabilities": {
    "00": 0.5,
    "11": 0.5
  },
  "counts": {
    "00": 512,
    "11": 512
  },
  "num_qubits": 2
}
```

**Response Fields:**
- `success` (boolean): Operation succeeded
- `statevector` (array): Complex amplitudes for each basis state
- `probabilities` (object): Probability for each measured state
- `counts` (object): Measurement counts for each state
- `num_qubits` (integer): Number of qubits in circuit

**Error Response:** `400/500 Error`
```json
{
  "error": "Error description"
}
```

---

## Error Handling

### Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid JSON, wrong parameters |
| 400 | Qubits must be between 1 and 10 | Invalid qubit count |
| 400 | Gates must be a list | Invalid gate array |
| 404 | Endpoint not found | Unknown route |
| 500 | Simulation failed | Backend error |
| 500 | Internal server error | Unexpected error |

---

## Usage Examples

### Example 1: Simple Hadamard Gate

**Request:**
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "qubits": 1,
    "gates": [
      {"type": "H", "target": 0, "step": 0}
    ]
  }'
```

**Result:** 50% |0⟩, 50% |1⟩

### Example 2: Bell State (Entanglement)

**Request:**
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "qubits": 2,
    "gates": [
      {"type": "H", "target": 0, "step": 0},
      {"type": "CNOT", "control": 0, "target": 1, "step": 1}
    ]
  }'
```

**Result:** 50% |00⟩, 50% |11⟩

### Example 3: X Gate (Flip)

**Request:**
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "qubits": 1,
    "gates": [
      {"type": "X", "target": 0, "step": 0}
    ]
  }'
```

**Result:** 100% |1⟩

---

## JavaScript Client Examples

### Using Axios

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// Simulate circuit
const response = await api.post('/simulate', {
  qubits: 2,
  gates: [
    { type: 'H', target: 0, step: 0 },
    { type: 'CNOT', control: 0, target: 1, step: 1 }
  ]
})

console.log(response.data.probabilities)
// { "00": 0.5, "11": 0.5 }
```

### Using Fetch

```javascript
const response = await fetch('http://localhost:5000/api/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qubits: 2,
    gates: [
      { type: 'H', target: 0, step: 0 }
    ]
  })
})

const data = await response.json()
console.log(data.probabilities)
```

---

## Rate Limiting

No rate limiting is currently implemented. For production, implement:
- IP-based rate limiting
- Per-user quota
- Circuit complexity limits

---

## CORS

CORS is enabled on all endpoints. Allowed origins: `*`

For production, restrict to specific domains in `app.py`:
```python
CORS(app, origins=['https://yourdomain.com'])
```

---

## Performance Tips

1. **Circuit Size**: Keep qubits ≤ 5 for faster simulation
2. **Shot Count**: Use 1024 shots for good accuracy with reasonable time
3. **Gate Count**: Limit gates to < 50 for quick response
4. **Caching**: Implement client-side caching for identical circuits

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial release with H, X, Y, Z, CNOT, Measure gates |

---

## Support

For issues or questions about the API:
1. Check server logs
2. Verify request format
3. Check gate validity
4. Ensure qubits < 10

---
