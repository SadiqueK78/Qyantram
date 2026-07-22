import React, { useMemo, useState } from 'react'
import axios from 'axios'
import { useCircuitStore } from '../store/useCircuitStore'
import { API_ENDPOINTS } from '../config/api'
import { GATES } from '../config/constants'
import { amplitudeRows } from '../utils/quantum'

// -----------------------------------------------------------------------------
// Classical -> quantum data encoding. Three standard schemes for loading a
// vector of classical numbers into a quantum state, each visualized here and
// loadable straight into the circuit editor. Talks to the backend /encode
// endpoint, which returns the generated gates + resulting statevector.
// -----------------------------------------------------------------------------

const ENCODINGS = [
  {
    id: 'basis',
    name: 'Basis Encoding',
    tag: 'Bits → |b⟩',
    blurb:
      'Each classical bit maps to one qubit. The bitstring becomes a single computational basis state — an X gate flips every qubit whose bit is 1.',
    formula: 'x = b₀b₁…bₙ  ↦  |b₀b₁…bₙ⟩',
    placeholder: '1 0 1 1',
    example: '1011',
    inputLabel: 'Bitstring (0/1 values)',
    how: {
      idea:
        'The most literal encoding: a classical bitstring is read straight into the matching computational basis state. No superposition is created — the state is a single definite outcome that mirrors the input bit-for-bit.',
      steps: [
        'Start from the ground state |00…0⟩, one qubit per classical bit.',
        'For every bit bᵢ = 1, apply an X (NOT) gate to qubit i, flipping |0⟩ → |1⟩.',
        'Bits equal to 0 are left untouched, so the final state is exactly |b₀b₁…bₙ⟩.',
      ],
      cost: 'n qubits for n bits (1 qubit per bit).',
      example: '1011 → apply X to qubits 0, 2, 3 → the state |1011⟩ with 100% probability.',
      pros: ['Exact and fully interpretable', 'Trivial, shallow circuit (one layer of X gates)'],
      cons: ['Uses one qubit per bit — no compression', 'Stores a single value, never a superposition of data'],
    },
  },
  {
    id: 'amplitude',
    name: 'Amplitude Encoding',
    tag: 'Vector → amplitudes',
    blurb:
      'A length-N vector is normalized and loaded as the amplitudes of the state, using only ⌈log₂N⌉ qubits. Compact, but needs a state-preparation circuit.',
    formula: '|ψ⟩ = (1/‖x‖) Σᵢ xᵢ |i⟩',
    placeholder: '1, 2, 3, 4',
    example: '1, 2, 3, 4',
    inputLabel: 'Feature vector (numbers)',
    how: {
      idea:
        'The whole data vector is packed into the amplitudes of one superposition. Because n qubits have 2ⁿ amplitudes, this stores N numbers in only ⌈log₂N⌉ qubits — an exponential compression, at the price of a non-trivial preparation circuit.',
      steps: [
        'Pad the vector to the next power of two (2ⁿ entries) with zeros.',
        'Normalize it to unit length, xᵢ → xᵢ / ‖x‖, so the amplitudes form a valid quantum state.',
        'Prepare |ψ⟩ = Σᵢ xᵢ|i⟩ with a state-preparation circuit (here Qiskit’s initialize, decomposed into RY / RZ / CNOT gates).',
      ],
      cost: '⌈log₂N⌉ qubits for N values (exponentially compact).',
      example:
        '[1, 2, 3, 4] → ‖x‖ = √30 → amplitudes [0.183, 0.365, 0.548, 0.730]; measuring gives probabilities xᵢ²/‖x‖² = 3.3%, 13.3%, 30%, 53.3%.',
      pros: ['Exponentially fewer qubits than basis/angle', 'Represents rich, continuous-valued vectors'],
      cons: [
        'State-preparation circuit depth grows quickly — costly to build',
        'Global normalization discards the vector’s overall magnitude',
      ],
    },
  },
  {
    id: 'angle',
    name: 'Angle / Rotation Encoding',
    tag: 'Feature → rotation',
    blurb:
      'Each feature becomes a rotation angle on its own qubit. One qubit per feature, a single layer of rotations — the workhorse of quantum machine learning.',
    formula: '|ψ⟩ = ⊗ᵢ R(scale·xᵢ)|0⟩',
    placeholder: '0.5, 1.2, 0.785',
    example: '0.5, 1.2, 0.785',
    inputLabel: 'Feature vector (numbers)',
    how: {
      idea:
        'Each feature is turned into a rotation angle on its own qubit. A single layer of rotations makes it very shallow, and — because rotation angles are smooth, differentiable parameters — it is the standard feature map for variational quantum machine learning and quantum kernels.',
      steps: [
        'Assign one qubit per feature, each starting in |0⟩.',
        'Rotate qubit i by an angle proportional to its feature: apply R_axis(scale · xᵢ) (RX, RY, or RZ).',
        'For RY, the qubit becomes cos(θ/2)|0⟩ + sin(θ/2)|1⟩ with θ = scale · xᵢ, so the feature sets the |1⟩ probability.',
      ],
      cost: 'n qubits for n features (1 qubit per feature), circuit depth 1.',
      example: '0.5 → RY(0.5)|0⟩ = cos(0.25)|0⟩ + sin(0.25)|1⟩ ≈ 0.969|0⟩ + 0.247|1⟩ (≈ 6.1% chance of |1⟩).',
      pros: ['Very shallow — a single layer of rotations', 'Smooth, differentiable angles suit variational / QML models'],
      cons: [
        'One qubit per feature — no compression',
        'Rotations are 2π-periodic, so features must be scaled sensibly',
      ],
    },
  },
]

// Little colored gate chip, reusing the palette tones from the gate catalog.
function GateChip({ gate }) {
  const meta = GATES[gate.type]
  const tone = meta?.tone || 'slate'
  const symbol = meta?.symbol || gate.type
  const hasTheta = typeof gate.theta === 'number'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-[11px]">
      <span className={`gate-tile h-6 w-6 text-[11px] gate-${tone}`}>{symbol}</span>
      <span className="font-mono text-muted">
        q{gate.type === 'CNOT' ? `${gate.control}→${gate.target}` : gate.target}
        {hasTheta ? ` · ${gate.theta.toFixed(2)}` : ''}
      </span>
    </span>
  )
}

function EncodePage() {
  const { loadCircuit, setView } = useCircuitStore()

  const [encoding, setEncoding] = useState('basis')
  const [inputs, setInputs] = useState({ basis: '1011', amplitude: '1, 2, 3, 4', angle: '0.5, 1.2, 0.785' })
  const [axis, setAxis] = useState('RY')
  const [scale, setScale] = useState('1')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const active = ENCODINGS.find((e) => e.id === encoding)
  const dataValue = inputs[encoding]
  const setDataValue = (v) => setInputs((prev) => ({ ...prev, [encoding]: v }))

  const rows = useMemo(() => amplitudeRows(result?.statevector || []), [result])

  const probs = useMemo(() => {
    const p = result?.probabilities || {}
    return Object.entries(p)
      .map(([bitstring, prob]) => ({ bitstring, prob }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 16)
  }, [result])

  const runEncode = async () => {
    setLoading(true)
    setError(null)
    try {
      const body = { encoding, data: dataValue }
      if (encoding === 'angle') {
        body.axis = axis
        body.scale = Number(scale) || 0
      }
      const res = await axios.post(API_ENDPOINTS.ENCODE, body)
      setResult(res.data)
    } catch (err) {
      setResult(null)
      setError(err.response?.data?.error || err.message || 'Encoding failed')
    } finally {
      setLoading(false)
    }
  }

  const loadIntoEditor = () => {
    if (!result?.gates) return
    loadCircuit({
      name: `${active.name}: ${dataValue}`,
      description: active.blurb,
      qubits: result.qubits,
      gates: result.gates,
    })
    setView('editor')
  }

  return (
    <main className="mx-auto w-full max-w-[1560px] flex-1 px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="display-serif text-3xl font-semibold text-ink">Data Encoding</h2>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Convert classical data into a quantum state and visualize the result. Pick a scheme,
            enter your data, then load the generated circuit into the editor.
          </p>
        </div>
        <button onClick={() => setView('editor')} className="btn-ghost shrink-0">
          ← Back to Editor
        </button>
      </div>

      {/* Encoding scheme selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ENCODINGS.map((e) => {
          const selected = e.id === encoding
          return (
            <button
              key={e.id}
              onClick={() => { setEncoding(e.id); setResult(null); setError(null) }}
              className={`panel flex flex-col p-5 text-left transition-all ${
                selected
                  ? 'ring-2 ring-[rgb(var(--accent))] ring-offset-2 ring-offset-[rgb(var(--paper))]'
                  : 'opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-ink">{e.name}</h3>
                {selected && <span className="text-[color:rgb(var(--accent))] text-[13px]">●</span>}
              </div>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-faint">{e.tag}</span>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted">{e.blurb}</p>
              <code className="mt-3 block rounded-lg bg-[rgb(var(--ink)/0.04)] px-2 py-1.5 font-mono text-[11.5px] text-ink">
                {e.formula}
              </code>
            </button>
          )
        })}
      </div>

      {/* Input controls */}
      <div className="panel mt-6 p-6">
        <label className="mb-2 block text-[13px] font-medium text-ink">{active.inputLabel}</label>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <input
            type="text"
            value={dataValue}
            onChange={(e) => setDataValue(e.target.value)}
            placeholder={active.placeholder}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[14px] text-ink outline-none focus:border-[rgb(var(--accent))]"
          />

          {encoding === 'angle' && (
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-faint">Axis</label>
                <select
                  value={axis}
                  onChange={(e) => setAxis(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-[rgb(var(--accent))]"
                >
                  <option value="RX">RX</option>
                  <option value="RY">RY</option>
                  <option value="RZ">RZ</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-faint">Scale</label>
                <input
                  type="number"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="w-24 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[14px] text-ink outline-none focus:border-[rgb(var(--accent))]"
                />
              </div>
            </div>
          )}

          <button onClick={runEncode} disabled={loading} className="run-btn shrink-0 justify-center">
            {loading ? 'Encoding…' : 'Encode & Visualize'}
            <span className="text-[11px]">›</span>
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[12px] text-faint">
          <span>Try:</span>
          <button
            onClick={() => setDataValue(active.example)}
            className="font-mono text-[color:rgb(var(--accent))] hover:underline"
          >
            {active.example}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-500">
            {error}
          </p>
        )}
      </div>

      {/* How the selected encoding works */}
      <HowItWorks encoding={active} />

      {/* Results */}
      {result && (
        <>
          {/* Summary + generated circuit */}
          <div className="panel mt-6 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgb(var(--accent)/0.12)] px-3 py-1 text-[12px] font-medium text-[color:rgb(var(--accent))]">
                {active.name}
              </span>
              <span className="text-[13px] text-muted">
                {result.qubits} qubit{result.qubits === 1 ? '' : 's'}
              </span>
              <span className="text-faint">·</span>
              <span className="text-[13px] text-muted">{result.gates.length} gate{result.gates.length === 1 ? '' : 's'}</span>
              <button onClick={loadIntoEditor} className="run-btn ml-auto justify-center">
                Load into Circuit Editor
                <span className="text-[11px]">›</span>
              </button>
            </div>

            <EncodingMeta encoding={encoding} meta={result.meta} />

            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-faint">Generated circuit</p>
              {result.gates.length === 0 ? (
                <p className="text-[13px] text-muted">
                  No gates — the data encodes to the ground state |{'0'.repeat(result.qubits)}⟩.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.gates.map((g, i) => (
                    <GateChip key={i} gate={g} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Statevector + probability visualization */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Statevector amplitudes */}
            <section className="panel p-6">
              <h3 className="text-[15px] font-semibold text-ink">Statevector amplitudes</h3>
              <p className="mb-4 mt-0.5 text-[12px] text-muted">Magnitude of each basis-state amplitude.</p>
              <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                {rows.map((r) => (
                  <div key={r.index} className="flex items-center gap-3">
                    <span className="w-20 font-mono text-[12px] text-ink">|{r.bitstring}⟩</span>
                    <span className="w-12 text-right font-mono text-[12px] text-muted">{r.mag.toFixed(3)}</span>
                    <div className="amp-track h-1.5 flex-1">
                      <div
                        className={`amp-fill ${r.prob < 0.02 ? 'faded' : ''}`}
                        style={{ width: `${Math.min(100, r.mag * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Measurement probabilities */}
            <section className="panel p-6">
              <h3 className="text-[15px] font-semibold text-ink">Measurement probabilities</h3>
              <p className="mb-4 mt-0.5 text-[12px] text-muted">Probability of each outcome |x⟩ (top 16).</p>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {probs.map((p) => (
                  <div key={p.bitstring} className="flex items-center gap-3">
                    <span className="w-20 font-mono text-[12px] text-ink">|{p.bitstring}⟩</span>
                    <div className="amp-track h-4 flex-1">
                      <div className="amp-fill" style={{ width: `${Math.min(100, p.prob * 100)}%` }} />
                    </div>
                    <span className="w-14 text-right font-mono text-[12px] text-muted">
                      {(p.prob * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  )
}

// Educational explainer for the currently selected scheme: the core idea, the
// step-by-step procedure, a worked example, qubit cost, and trade-offs.
function HowItWorks({ encoding }) {
  const how = encoding?.how
  if (!how) return null

  return (
    <section className="panel mt-6 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="display-serif text-xl font-semibold text-ink">How {encoding.name} works</h3>
        <code className="rounded-lg bg-[rgb(var(--ink)/0.04)] px-2 py-1 font-mono text-[12px] text-[color:rgb(var(--accent))]">
          {encoding.formula}
        </code>
      </div>

      <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted">{how.idea}</p>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-faint">Step by step</p>
          <ol className="space-y-2">
            {how.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-ink">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent)/0.14)] text-[11px] font-semibold text-[color:rgb(var(--accent))]">
                  {i + 1}
                </span>
                <span className="text-muted">{s}</span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[13px] text-muted">
            <span className="font-medium text-ink">Qubit cost:</span> {how.cost}
          </p>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-faint">Worked example</p>
          <p className="rounded-xl border border-line bg-[rgb(var(--ink)/0.03)] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink">
            {how.example}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-emerald-500">Strengths</p>
              <ul className="space-y-1">
                {how.pros.map((p, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug text-muted">
                    <span className="text-emerald-500">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-rose-500">Trade-offs</p>
              <ul className="space-y-1">
                {how.cons.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug text-muted">
                    <span className="text-rose-500">−</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Encoding-specific readout: what actually got loaded (normalized vector,
// per-feature angles, or the basis state), shown under the summary row.
function EncodingMeta({ encoding, meta }) {
  if (!meta) return null

  if (encoding === 'basis') {
    return (
      <p className="mt-3 font-mono text-[13px] text-muted">
        Basis state: <span className="text-ink">|{meta.basis_state}⟩</span>
      </p>
    )
  }

  if (encoding === 'amplitude') {
    return (
      <div className="mt-3 text-[13px] text-muted">
        <span>Normalized vector (‖x‖ = {meta.norm?.toFixed(4)}):</span>
        <div className="mt-1 font-mono text-[12px] text-ink">
          [{(meta.normalized || []).map((v) => v.toFixed(3)).join(', ')}]
        </div>
      </div>
    )
  }

  if (encoding === 'angle') {
    return (
      <p className="mt-3 font-mono text-[13px] text-muted">
        {meta.axis} angles:{' '}
        <span className="text-ink">[{(meta.angles || []).map((v) => v.toFixed(3)).join(', ')}]</span>
      </p>
    )
  }

  return null
}

export default EncodePage
