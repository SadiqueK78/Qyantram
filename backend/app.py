from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np
from typing import List, Dict, Any
import logging
import os
import requests as http_requests

# Setup
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv is optional, env vars can be set directly

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# The line above sets the ROOT logger to INFO, which every library's logger
# inherits unless told otherwise — that's what was printing Qiskit's
# per-transpiler-pass timings and werkzeug's per-request lines on every
# /simulate call. Silence those specifically; keep this app's own INFO logs.
for noisy in ("werkzeug", "qiskit", "qiskit.transpiler", "qiskit.compiler", "stevedore"):
    logging.getLogger(noisy).setLevel(logging.WARNING)

def build_qft_block_gate(n: int, inverse: bool = False):
    """
    Build an n-qubit QFT (or inverse QFT) as a self-contained gate, using the
    same decomposition Qniverse shows for its 2-qubit `qft2` block:

        gate qft2 a, b {
            h b;
            cu1(pi/2) a, b;
            h a;
            swap a, b;
        }

    which is one valid ordering of the standard QFT circuit: Hadamards
    interleaved with controlled-phase rotations, finished by a reversal
    swap. This builds that same shape for any n, on a small local
    sub-circuit, so it can be appended onto exactly the qubits the user
    dropped the block on — never the whole register.

    The rotation cascade must run from the HIGHEST-indexed target down to
    the lowest (m = n-1 .. 0), each H followed by controlled-phase rotations
    from every lower qubit into it — not ascending. Verified numerically
    against Qiskit's QFT(n, do_swaps=True) reference for n=2..5; ascending
    order looks superficially fine (uniform |QFT|00..0>| probabilities,
    self-inverse round-trips) but produces the wrong relative phases, which
    only shows up once you check the actual unitary, not just probabilities.

    Within a single H's cascade, the controls are applied nearest-qubit-first
    (descending), matching Qniverse's own qft2/qft3 circuits exactly — pixel-
    verified against its reference screenshots. This particular ordering is
    cosmetic (any two controlled-phase gates sharing a target are diagonal
    and commute, so ascending vs. descending controls give the identical
    unitary either way), but keeping it matched means the actual circuit
    built here is the same one the Gate Expand modal describes, not just an
    equivalent one.
    """
    sub = QuantumCircuit(n, name=('IQFT' if inverse else 'QFT'))
    for m in reversed(range(n)):
        sub.h(m)
        for control in range(m - 1, -1, -1):
            angle = np.pi / (2 ** (m - control))
            sub.cp(angle, control, m)
    for i in range(n // 2):
        sub.swap(i, n - 1 - i)

    gate = sub.to_gate(label=('IQFT' if inverse else 'QFT'))
    return gate.inverse() if inverse else gate


# Which X gates precede the H+CNOT core for each Bell block. Wire 0 is the
# block's top target ("a"), wire 1 the bottom ("b"). Standard preparation:
# X gates select the basis pair, then H(a) + CNOT(a->b) entangle it.
#   |Phi+> = (|00>+|11>)/sqrt(2) : no X
#   |Phi-> = (|00>-|11>)/sqrt(2) : X(a)
#   |Psi+> = (|01>+|10>)/sqrt(2) : X(b)
#   |Psi-> = (|01>-|10>)/sqrt(2) : X(a), X(b)
BELL_BLOCK_X = {
    'BELL_PHI_PLUS': (),
    'BELL_PHI_MINUS': (0,),
    'BELL_PSI_PLUS': (1,),
    'BELL_PSI_MINUS': (0, 1),
}


def build_bell_block_gate(bell_type: str):
    """
    Build a 2-qubit Bell-state preparation block as a self-contained gate,
    the same way build_qft_block_gate scopes a QFT to the wires it was
    dropped on. Applied to |00> it produces the corresponding Bell state.
    """
    sub = QuantumCircuit(2, name=bell_type)
    for wire in BELL_BLOCK_X[bell_type]:
        sub.x(wire)
    sub.h(0)
    sub.cx(0, 1)
    return sub.to_gate(label=bell_type)


# =============================================================================
# Classical -> quantum data encoding.
#
# Three standard schemes for loading classical data into a quantum state,
# each returned as a list of gates in the SAME editor format /simulate consumes
# ({"type", "target", "step", optional "control"/"theta"}). That means an
# encoding circuit can be visualized here AND loaded straight into the circuit
# editor, where every existing panel (statevector, Q-sphere, histogram) works
# on it unchanged.
# =============================================================================

# Keep encoding circuits inside the same size envelope the rest of the app
# uses. Amplitude encoding grows a circuit as log2(len(data)); basis/angle grow
# it linearly, one qubit per value — so cap the qubit count, not the data length.
MAX_ENCODING_QUBITS = 8


def _parse_bits(data):
    """Coerce basis-encoding input into a list of 0/1 ints.

    Accepts a bitstring ("1011"), a list of numbers/bools, or a comma/space
    separated string ("1, 0, 1"). Any nonzero value counts as 1.
    """
    if isinstance(data, str):
        cleaned = data.strip()
        if all(c in '01' for c in cleaned) and cleaned:
            tokens = list(cleaned)
        else:
            tokens = [t for t in cleaned.replace(',', ' ').split() if t != '']
    elif isinstance(data, (list, tuple)):
        tokens = list(data)
    else:
        raise ValueError('Basis encoding needs a bitstring or a list of bits')

    if not tokens:
        raise ValueError('No data provided to encode')

    bits = []
    for tok in tokens:
        try:
            bits.append(1 if float(tok) != 0 else 0)
        except (TypeError, ValueError):
            raise ValueError(f'Invalid bit value: {tok!r}')
    return bits


def _parse_numbers(data):
    """Coerce amplitude/angle input into a list of floats."""
    if isinstance(data, str):
        tokens = [t for t in data.replace(',', ' ').split() if t != '']
    elif isinstance(data, (list, tuple)):
        tokens = list(data)
    else:
        raise ValueError('Encoding needs a list of numbers')

    if not tokens:
        raise ValueError('No data provided to encode')

    values = []
    for tok in tokens:
        try:
            values.append(float(tok))
        except (TypeError, ValueError):
            raise ValueError(f'Invalid number: {tok!r}')
    return values


def _circuit_to_editor_gates(qc: QuantumCircuit):
    """Flatten a Qiskit circuit into editor-format gates (one per time step).

    Used by amplitude encoding, whose state-preparation circuit is produced by
    the transpiler rather than hand-built. Only the gate set amplitude encoding
    transpiles to (ry, rz, rx, x, h, cx) is mapped; anything else is skipped.
    """
    editor_gates = []
    step = 0
    single = {'ry': 'RY', 'rz': 'RZ', 'rx': 'RX', 'x': 'X', 'h': 'H'}
    for instruction in qc.data:
        op = instruction.operation
        qubits = [qc.find_bit(q).index for q in instruction.qubits]
        name = op.name
        if name in single:
            gate = {'type': single[name], 'target': qubits[0], 'step': step}
            if name in ('ry', 'rz', 'rx'):
                gate['theta'] = float(op.params[0])
            editor_gates.append(gate)
        elif name == 'cx':
            editor_gates.append({
                'type': 'CNOT', 'target': qubits[1], 'control': qubits[0], 'step': step,
            })
        elif name in ('barrier', 'id'):
            continue
        else:
            # global phase / unmapped op — irrelevant to the visualized state
            continue
        step += 1
    return editor_gates


def _basis_encoding(data):
    """|b_0 b_1 ... > : one qubit per bit, an X gate wherever the bit is 1."""
    bits = _parse_bits(data)
    n = len(bits)
    if n > MAX_ENCODING_QUBITS:
        raise ValueError(f'Basis encoding is limited to {MAX_ENCODING_QUBITS} bits')

    gates = [
        {'type': 'X', 'target': i, 'step': i}
        for i, b in enumerate(bits) if b
    ]
    meta = {
        'bits': bits,
        'basis_state': ''.join(str(b) for b in bits),
        'formula': '|' + ''.join(str(b) for b in bits) + '⟩',
    }
    return n, gates, meta


def _angle_encoding(data, axis='RY', scale=1.0):
    """One rotation per feature: R_axis(scale · x_i) on qubit i, from |0...0>."""
    axis = str(axis).upper()
    if axis not in ('RX', 'RY', 'RZ'):
        raise ValueError('Angle encoding axis must be RX, RY or RZ')
    values = _parse_numbers(data)
    n = len(values)
    if n > MAX_ENCODING_QUBITS:
        raise ValueError(f'Angle encoding is limited to {MAX_ENCODING_QUBITS} features')
    try:
        scale = float(scale)
    except (TypeError, ValueError):
        scale = 1.0

    angles = [scale * v for v in values]
    gates = [
        {'type': axis, 'target': i, 'theta': angles[i], 'step': 0}
        for i in range(n)
    ]
    meta = {
        'values': values,
        'axis': axis,
        'scale': scale,
        'angles': angles,
    }
    return n, gates, meta


def _amplitude_encoding(data):
    """Encode a normalized vector as the amplitudes of the state.

    len(data) values -> ceil(log2(len)) qubits. The vector is padded to the
    next power of two, L2-normalized, and prepared with Qiskit's initialize,
    then transpiled to a basic gate set so it maps to editor gates.
    """
    values = _parse_numbers(data)
    length = len(values)
    if length < 2:
        raise ValueError('Amplitude encoding needs at least 2 values')

    n = int(np.ceil(np.log2(length)))
    if n > MAX_ENCODING_QUBITS:
        raise ValueError(f'Amplitude encoding is limited to {2 ** MAX_ENCODING_QUBITS} values')

    dim = 1 << n
    vec = np.zeros(dim, dtype=float)
    vec[:length] = values

    norm = float(np.linalg.norm(vec))
    if norm < 1e-12:
        raise ValueError('Amplitude encoding needs a non-zero vector')
    vec = vec / norm

    qc = QuantumCircuit(n)
    qc.initialize(vec, range(n))
    # Decompose the opaque initialize instruction into gates the editor knows.
    tqc = transpile(qc, basis_gates=['ry', 'rz', 'cx'], optimization_level=1)
    gates = _circuit_to_editor_gates(tqc)

    meta = {
        'input': values,
        'padded_length': dim,
        'norm': norm,
        'normalized': [float(x) for x in vec],
    }
    return n, gates, meta


ENCODERS = {
    'basis': _basis_encoding,
    'amplitude': _amplitude_encoding,
    'angle': _angle_encoding,
}


# Quantum circuit builder and simulator
class QuantumCircuitBuilder:
    """Helper class to build and simulate quantum circuits"""
    
    @staticmethod
    def build_circuit(qubits: int, gates: List[Dict[str, Any]]) -> QuantumCircuit:
        """
        Build a quantum circuit from a list of gates
        
        Args:
            qubits: Number of qubits
            gates: List of gate dictionaries with structure:
                {
                    "type": "H" | "X" | "Y" | "Z" | "CNOT" | "Measure",
                    "target": qubit_index,
                    "control": control_qubit_index (for CNOT),
                    "step": time_step
                }
        
        Returns:
            QuantumCircuit object
        """
        qc = QuantumCircuit(qubits, qubits)
        
        # Sort gates by step to apply them in order
        sorted_gates = sorted(gates, key=lambda g: g.get('step', 0))
        
        for gate in sorted_gates:
            gate_type = gate.get('type', '').upper()
            target = gate.get('target', 0)
            
            try:
                if gate_type == 'H':
                    qc.h(target)
                elif gate_type == 'X':
                    qc.x(target)
                elif gate_type == 'Z':
                    qc.z(target)
                elif gate_type == 'Y':
                    qc.y(target)
                elif gate_type == 'I':
                    qc.id(target)
                elif gate_type == 'S':
                    qc.s(target)
                elif gate_type == 'SDG':
                    qc.sdg(target)
                elif gate_type == 'T':
                    qc.t(target)
                elif gate_type == 'TDG':
                    qc.tdg(target)
                elif gate_type == 'SX':
                    qc.sx(target)
                elif gate_type == 'SXDG':
                    qc.sxdg(target)
                elif gate_type == 'RX':
                    theta = float(gate.get('theta', np.pi / 2))
                    qc.rx(theta, target)
                elif gate_type == 'RY':
                    theta = float(gate.get('theta', np.pi / 2))
                    qc.ry(theta, target)
                elif gate_type == 'RZ':
                    theta = float(gate.get('theta', np.pi / 2))
                    qc.rz(theta, target)
                elif gate_type == 'P':
                    theta = float(gate.get('theta', np.pi / 2))
                    qc.p(theta, target)
                elif gate_type == 'CNOT':
                    control = gate.get('control', 0)
                    qc.cx(control, target)
                elif gate_type == 'CCNOT' or gate_type == 'TOFFOLI':
                    control = gate.get('control', 0)
                    control2 = gate.get('control2', 1)
                    qc.ccx(control, control2, target)
                elif gate_type == 'SWAP':
                    swap_with = gate.get('swap_with')
                    if swap_with is None:
                        raise ValueError('SWAP requires swap_with qubit index')
                    qc.swap(target, int(swap_with))
                elif gate_type == 'BARRIER' or gate_type == '|':
                    if gate.get('target') is None:
                        qc.barrier()
                    else:
                        qc.barrier(target)
                elif gate_type == 'RESET':
                    qc.reset(target)
                elif gate_type in ('QFT', 'IQFT'):
                    # A QFT/IQFT block scoped to the specific qubits it was
                    # dropped across — matches the Qniverse "qft2 a, b" block
                    # (a = top wire, b = bottom wire), not the whole register.
                    targets = gate.get('targets')
                    if not targets:
                        a = gate.get('target')
                        b = gate.get('qftQubit', gate.get('partnerQubit', gate.get('partner')))
                        targets = [a, b]
                    targets = [int(t) for t in targets if t is not None]

                    if len(targets) < 2:
                        raise ValueError(f'{gate_type} requires at least 2 target qubits')
                    if len(set(targets)) != len(targets):
                        raise ValueError(f'{gate_type} target qubits must be distinct')
                    if any(t < 0 or t >= qc.num_qubits for t in targets):
                        raise ValueError(f'{gate_type} target qubit out of range')

                    qft_gate = build_qft_block_gate(len(targets), inverse=(gate_type == 'IQFT'))
                    qc.append(qft_gate, targets)
                elif gate_type in BELL_BLOCK_X:
                    # A Bell-state block scoped to the two qubits it was
                    # dropped across — targets[0] is the top wire (H +
                    # control), targets[1] the bottom (CNOT target).
                    targets = gate.get('targets')
                    if not targets:
                        a = gate.get('target')
                        b = gate.get('partnerQubit', gate.get('partner'))
                        targets = [a, b]
                    targets = [int(t) for t in targets if t is not None]

                    if len(targets) != 2:
                        raise ValueError(f'{gate_type} requires exactly 2 target qubits')
                    if targets[0] == targets[1]:
                        raise ValueError(f'{gate_type} target qubits must be distinct')
                    if any(t < 0 or t >= qc.num_qubits for t in targets):
                        raise ValueError(f'{gate_type} target qubit out of range')

                    qc.append(build_bell_block_gate(gate_type), targets)
                elif gate_type == 'MEASURE':
                    pass  # Measurement will be added after all gates
                else:
                    logger.warning(f"Unknown gate type: {gate_type}")
            except Exception as e:
                logger.error(f"Error applying gate {gate_type}: {e}")
                raise ValueError(f"Invalid gate configuration: {e}")
        
        # Add measurements
        qc.measure(range(qubits), range(qubits))
        
        return qc
    
    @staticmethod
    def simulate(qc: QuantumCircuit, shots: int = 1024) -> Dict[str, Any]:
        """
        Simulate the quantum circuit
        
        Args:
            qc: QuantumCircuit to simulate
            shots: Number of measurement shots
        
        Returns:
            Dictionary with simulation results
        """
        try:
            # Create a circuit copy for statevector (without measurements)
            qc_statevector = qc.copy()
            qc_statevector.remove_final_measurements(inplace=True)
            # Save the statevector as the final instruction
            qc_statevector.save_statevector()
            
            # Simulate statevector
            simulator_sv = AerSimulator(method='statevector')
            # Composite gates (e.g. the QFT/IQFT block, built via to_gate())
            # are opaque instructions to Aer until transpiled down to its
            # basis gate set — run() does not do this implicitly.
            tqc_statevector = transpile(qc_statevector, simulator_sv)
            job_sv = simulator_sv.run(tqc_statevector)
            result_sv = job_sv.result()
            
            # Get statevector
            try:
                statevector_data = result_sv.get_statevector(0).data
            except:
                # Fallback if indexing doesn't work
                statevector_data = result_sv.data(0)['statevector']
            
            # Simulate measurement probabilities using automatic method
            simulator_qasm = AerSimulator(method='automatic')
            tqc_qasm = transpile(qc, simulator_qasm)
            job_qasm = simulator_qasm.run(tqc_qasm, shots=shots)
            result_qasm = job_qasm.result()
            counts = result_qasm.get_counts(0)
            
            # Exact probabilities from statevector (deterministic and ideal)
            num_qubits = qc.num_qubits
            probabilities = {}
            for idx, amp in enumerate(statevector_data):
                prob = float((amp.real * amp.real) + (amp.imag * amp.imag))
                if prob > 1e-12:
                    bitstring = format(idx, f'0{num_qubits}b')
                    probabilities[bitstring] = prob

            # Keep sampled probabilities as additional debug output.
            sampled_probabilities = {
                bitstring: count / shots for bitstring, count in counts.items()
            }
            
            return {
                'success': True,
                'statevector': [
                    {'real': float(v.real), 'imag': float(v.imag)} 
                    for v in statevector_data
                ],
                'probabilities': probabilities,
                'sampled_probabilities': sampled_probabilities,
                'counts': counts,
                'num_qubits': qc.num_qubits,
            }
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'quantum-simulator'})


@app.route('/simulate', methods=['POST'])
def simulate_circuit():
    """
    Main endpoint for circuit simulation
    
    Expected JSON body:
    {
        "qubits": 2,
        "gates": [
            {"type": "H", "target": 0, "step": 0},
            {"type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        qubits = data.get('qubits', 2)
        gates = data.get('gates', [])
        shots = data.get('shots', 1024)
        
        # Validation
        if qubits < 1 or qubits > 10:
            return jsonify({'error': 'Qubits must be between 1 and 10'}), 400
        
        if not isinstance(gates, list):
            return jsonify({'error': 'Gates must be a list'}), 400
        
        logger.info(f"Building circuit with {qubits} qubits and {len(gates)} gates")
        
        # Build circuit
        qc = QuantumCircuitBuilder.build_circuit(qubits, gates)
        
        # Simulate
        result = QuantumCircuitBuilder.simulate(qc, shots=shots)
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Simulation failed')}), 500
        
        return jsonify(result), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/encode', methods=['POST'])
def encode_data():
    """
    Encode classical data into a quantum state-preparation circuit.

    Expected JSON body:
    {
        "encoding": "basis" | "amplitude" | "angle",
        "data": "1011"  |  [0.5, 0.5, ...]  |  [0.1, 0.9],
        "axis": "RY",    (angle encoding only, default RY)
        "scale": 1.0,    (angle encoding only, default 1.0)
        "shots": 1024    (optional)
    }

    Returns the generated gates (editor format), qubit count, the resulting
    statevector / probabilities, and encoding-specific metadata.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        encoding = str(data.get('encoding', 'basis')).lower()
        encoder = ENCODERS.get(encoding)
        if encoder is None:
            return jsonify({'error': f'Unknown encoding: {encoding}'}), 400

        payload = data.get('data')
        shots = data.get('shots', 1024)

        if encoding == 'angle':
            qubits, gates, meta = encoder(
                payload, axis=data.get('axis', 'RY'), scale=data.get('scale', 1.0)
            )
        else:
            qubits, gates, meta = encoder(payload)

        if qubits < 1:
            return jsonify({'error': 'Encoding produced no qubits'}), 400

        logger.info(f"Encoding '{encoding}' -> {qubits} qubits, {len(gates)} gates")

        qc = QuantumCircuitBuilder.build_circuit(qubits, gates)
        result = QuantumCircuitBuilder.simulate(qc, shots=shots)

        if not result['success']:
            return jsonify({'error': result.get('error', 'Simulation failed')}), 500

        result.update({
            'encoding': encoding,
            'qubits': qubits,
            'gates': gates,
            'meta': meta,
        })
        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"Encoding validation error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected encoding error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/gates', methods=['GET'])
def get_available_gates():
    """Return available gates"""
    gates = [
        {
            'type': 'H',
            'name': 'Hadamard',
            'description': 'Creates superposition',
            'qubits_required': 1
        },
        {
            'type': 'X',
            'name': 'Pauli X',
            'description': 'Quantum NOT gate',
            'qubits_required': 1
        },
        {
            'type': 'I',
            'name': 'Identity',
            'description': 'Identity gate',
            'qubits_required': 1
        },
        {
            'type': 'Y',
            'name': 'Pauli Y',
            'description': 'Rotation around Y-axis',
            'qubits_required': 1
        },
        {
            'type': 'Z',
            'name': 'Pauli Z',
            'description': 'Rotation around Z-axis',
            'qubits_required': 1
        },
        {
            'type': 'S',
            'name': 'S',
            'description': 'Phase gate S',
            'qubits_required': 1
        },
        {
            'type': 'Sdg',
            'name': 'S dagger',
            'description': 'S dagger gate',
            'qubits_required': 1
        },
        {
            'type': 'T',
            'name': 'T',
            'description': 'T gate',
            'qubits_required': 1
        },
        {
            'type': 'Tdg',
            'name': 'T dagger',
            'description': 'T dagger gate',
            'qubits_required': 1
        },
        {
            'type': 'SX',
            'name': 'Sqrt X',
            'description': 'Square-root X gate',
            'qubits_required': 1
        },
        {
            'type': 'SXdg',
            'name': 'Sqrt X dagger',
            'description': 'Square-root X dagger gate',
            'qubits_required': 1
        },
        {
            'type': 'RX',
            'name': 'RX(theta)',
            'description': 'X-axis rotation gate',
            'qubits_required': 1
        },
        {
            'type': 'RY',
            'name': 'RY(theta)',
            'description': 'Y-axis rotation gate',
            'qubits_required': 1
        },
        {
            'type': 'RZ',
            'name': 'RZ(theta)',
            'description': 'Z-axis rotation gate',
            'qubits_required': 1
        },
        {
            'type': 'P',
            'name': 'P(theta)',
            'description': 'Phase rotation gate',
            'qubits_required': 1
        },
        {
            'type': 'CNOT',
            'name': 'CNOT',
            'description': 'Controlled NOT gate',
            'qubits_required': 2
        },
        {
            'type': 'CCNOT',
            'name': 'CCNOT (Toffoli)',
            'description': 'Double-controlled NOT gate',
            'qubits_required': 3
        },
        {
            'type': 'SWAP',
            'name': 'SWAP',
            'description': 'Swap states of two qubits',
            'qubits_required': 2
        },
        {
            'type': 'QFT',
            'name': 'QFT',
            'description': 'Quantum Fourier Transform block (H, controlled-phase, swap) across the target qubits',
            'qubits_required': 2
        },
        {
            'type': 'IQFT',
            'name': 'Inverse QFT',
            'description': 'Inverse Quantum Fourier Transform block across the target qubits',
            'qubits_required': 2
        },
        {
            'type': 'BELL_PHI_PLUS',
            'name': 'Bell |Phi+>',
            'description': 'Bell-state block preparing (|00>+|11>)/sqrt(2) — H then CNOT',
            'qubits_required': 2
        },
        {
            'type': 'BELL_PHI_MINUS',
            'name': 'Bell |Phi->',
            'description': 'Bell-state block preparing (|00>-|11>)/sqrt(2) — X, H then CNOT',
            'qubits_required': 2
        },
        {
            'type': 'BELL_PSI_PLUS',
            'name': 'Bell |Psi+>',
            'description': 'Bell-state block preparing (|01>+|10>)/sqrt(2) — X on target, H then CNOT',
            'qubits_required': 2
        },
        {
            'type': 'BELL_PSI_MINUS',
            'name': 'Bell |Psi->',
            'description': 'Singlet Bell-state block preparing (|01>-|10>)/sqrt(2) — X on both, H then CNOT',
            'qubits_required': 2
        },
        {
            'type': 'Measure',
            'name': 'Measurement',
            'description': 'Measure qubit state',
            'qubits_required': 1
        },
        {
            'type': 'Reset',
            'name': 'Reset',
            'description': 'Reset qubit to |0>',
            'qubits_required': 1
        },
        {
            'type': 'Barrier',
            'name': 'Barrier |',
            'description': 'Circuit barrier separator',
            'qubits_required': 1
        },
    ]
    return jsonify(gates), 200


@app.route('/ai-explain', methods=['POST'])
def ai_explain():
    """
    AI explanation endpoint — proxies requests to OpenRouter API.
    Keeps the API key securely on the server.

    Expected JSON body:
    {
        "prompt": "User prompt text",
        "model": "openai/gpt-4o-mini"  (optional)
    }
    """
    try:
        data = request.get_json()
        if not data or not data.get('prompt'):
            return jsonify({'error': 'No prompt provided'}), 400

        api_key = os.environ.get('OPENROUTER_API_KEY', '')
        if not api_key:
            return jsonify({
                'error': 'OpenRouter API key not configured. '
                         'Set OPENROUTER_API_KEY in backend .env file.'
            }), 503

        model = data.get('model', 'openai/gpt-4o-mini')
        user_prompt = data['prompt']

        system_prompt = (
            'You are a quantum computing tutor designed for beginners. '
            'Follow these rules strictly:\n'
            '1. **Simple Explanation First**: Start with a plain-English analogy '
            'that a non-technical person can understand.\n'
            '2. **Technical Explanation**: Follow with a precise technical '
            'description using Dirac notation and matrix representations.\n'
            '3. **Step Insight**: If the user is asking about a specific step, '
            'explain what happens to the quantum state at that step.\n'
            '4. **Final Output Explanation**: Summarize what the circuit produces '
            'and what measurement outcomes mean.\n'
            '5. Keep answers concise but informative — 150-300 words.\n'
            '6. Use markdown formatting (bold, bullets) and USE LaTeX for math formulas using `$ ... $` (inline) and `$$ ... $$` (block).\n'
            '7. Be encouraging and supportive.'
        )

        logger.info(f'AI explain request — model={model}, prompt_len={len(user_prompt)}')

        response = http_requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Quantum Logic Gate Simulator',
            },
            json={
                'model': model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt},
                ],
                'max_tokens': 1024,
                'temperature': 0.7,
            },
            timeout=30,
        )

        if response.status_code != 200:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('error', {}).get('message', f'OpenRouter returned {response.status_code}')
            logger.error(f'OpenRouter error: {error_msg}')
            return jsonify({'error': error_msg}), response.status_code

        result = response.json()
        explanation = result.get('choices', [{}])[0].get('message', {}).get('content', '')

        if not explanation:
            return jsonify({'error': 'No explanation returned from AI'}), 502

        return jsonify({
            'explanation': explanation,
            'model': model,
        }), 200

    except http_requests.exceptions.Timeout:
        logger.error('OpenRouter request timed out')
        return jsonify({'error': 'AI request timed out. Please try again.'}), 504
    except http_requests.exceptions.ConnectionError:
        logger.error('Cannot connect to OpenRouter')
        return jsonify({'error': 'Cannot connect to AI service. Check your internet connection.'}), 503
    except Exception as e:
        logger.error(f'AI explain error: {e}')
        return jsonify({'error': f'AI service error: {str(e)}'}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)