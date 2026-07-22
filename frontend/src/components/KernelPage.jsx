import React, { useMemo, useState } from 'react'
import axios from 'axios'
import { useCircuitStore } from '../store/useCircuitStore'
import { API_ENDPOINTS } from '../config/api'

// -----------------------------------------------------------------------------
// Quantum Kernel Explorer. Maps each classical data point x to a state |φ(x)⟩
// with a chosen encoding feature map, then computes the fidelity kernel
// K[i][j] = |⟨φ(xᵢ)|φ(xⱼ)⟩|² — exactly the similarity measure a quantum-kernel
// SVM uses. Renders the matrix as a heatmap so you can see class structure.
// -----------------------------------------------------------------------------

const ENCODINGS = [
  { id: 'angle', name: 'Angle', hint: 'one qubit per feature, RY/RX/RZ rotation' },
  { id: 'amplitude', name: 'Amplitude', hint: '⌈log₂N⌉ qubits, vector as amplitudes' },
  { id: 'basis', name: 'Basis', hint: 'bitstrings → orthogonal basis states' },
]

// Two well-separated clusters — the heatmap shows a clear 2×2 block pattern.
const PRESETS = {
  angle: '0.1, 0.2\n0.2, 0.15\n0.15, 0.25\n1.4, 1.5\n1.5, 1.45\n1.45, 1.55',
  amplitude: '1, 0, 0, 0\n0.9, 0.1, 0, 0\n0, 0, 1, 0\n0, 0, 0.9, 0.1\n0.5, 0.5, 0.5, 0.5',
  basis: '0011\n0111\n1100\n1000',
}

// Parse the textarea: one point per line, comma/space separated numbers.
// Basis stays as raw bitstring tokens; others become number arrays.
function parsePoints(text, encoding) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (encoding === 'basis') {
        const compact = line.replace(/[,\s]/g, '')
        return compact.split('')
      }
      return line
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number)
    })
}

// Map a kernel value in [0,1] to a heat color. Uses the app accent at an
// opacity that tracks the value, with readable text once it gets dark.
function heatStyle(v) {
  const alpha = 0.08 + 0.92 * v
  return {
    backgroundColor: `rgb(var(--accent) / ${alpha.toFixed(3)})`,
    color: v > 0.55 ? '#fff' : 'rgb(var(--ink))',
  }
}

function KernelPage() {
  const setView = useCircuitStore((s) => s.setView)

  const [encoding, setEncoding] = useState('angle')
  const [axis, setAxis] = useState('RY')
  const [scale, setScale] = useState('1')
  const [text, setText] = useState(PRESETS.angle)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const switchEncoding = (id) => {
    setEncoding(id)
    setText(PRESETS[id])
    setResult(null)
    setError(null)
  }

  const compute = async () => {
    setLoading(true)
    setError(null)
    try {
      const points = parsePoints(text, encoding)
      if (points.length < 2) throw new Error('Enter at least 2 data points (one per line)')
      const body = { encoding, points }
      if (encoding === 'angle') {
        body.axis = axis
        body.scale = Number(scale) || 0
      }
      const res = await axios.post(API_ENDPOINTS.KERNEL, body)
      setResult({ ...res.data, points })
    } catch (err) {
      setResult(null)
      setError(err.response?.data?.error || err.message || 'Kernel computation failed')
    } finally {
      setLoading(false)
    }
  }

  // Most / least similar distinct pair, from the upper triangle.
  const extremes = useMemo(() => {
    const K = result?.kernel
    if (!K) return null
    let hi = { v: -1, i: 0, j: 0 }
    let lo = { v: 2, i: 0, j: 0 }
    for (let i = 0; i < K.length; i++) {
      for (let j = i + 1; j < K.length; j++) {
        const v = K[i][j]
        if (v > hi.v) hi = { v, i, j }
        if (v < lo.v) lo = { v, i, j }
      }
    }
    return { hi, lo }
  }, [result])

  return (
    <main className="mx-auto w-full max-w-[1560px] flex-1 px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="display-serif text-3xl font-semibold text-ink">Quantum Kernel</h2>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Encode each data point into a quantum state and measure how similar those states are.
            The kernel matrix K[i][j] = |⟨φ(xᵢ)|φ(xⱼ)⟩|² is the similarity a quantum-kernel classifier
            learns from.
          </p>
        </div>
        <button onClick={() => setView('editor')} className="btn-ghost shrink-0">
          ← Back to Editor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Controls */}
        <div className="panel p-6">
          <p className="mb-2 text-[13px] font-medium text-ink">Feature map</p>
          <div className="grid grid-cols-3 gap-2">
            {ENCODINGS.map((e) => (
              <button
                key={e.id}
                onClick={() => switchEncoding(e.id)}
                title={e.hint}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                  encoding === e.id
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.1)] text-[color:rgb(var(--accent))]'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-faint">{ENCODINGS.find((e) => e.id === encoding).hint}</p>

          {encoding === 'angle' && (
            <div className="mt-4 flex gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-faint">Axis</label>
                <select
                  value={axis}
                  onChange={(e) => setAxis(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgb(var(--accent))]"
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
                  className="w-24 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-[rgb(var(--accent))]"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label className="text-[13px] font-medium text-ink">Data points</label>
            <button
              onClick={() => setText(PRESETS[encoding])}
              className="text-[12px] text-[color:rgb(var(--accent))] hover:underline"
            >
              Load preset
            </button>
          </div>
          <p className="mb-1.5 text-[11.5px] text-faint">One point per line, comma-separated.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-[rgb(var(--accent))]"
          />

          <button onClick={compute} disabled={loading} className="run-btn mt-4 w-full justify-center">
            {loading ? 'Computing…' : 'Compute Kernel'}
            <span className="text-[11px]">›</span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-500">
              {error}
            </p>
          )}
        </div>

        {/* Heatmap */}
        <div className="panel p-6">
          {!result ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-center text-[13px] text-muted">
              Enter data points and compute the kernel to see the similarity heatmap.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h3 className="text-[15px] font-semibold text-ink">Kernel matrix</h3>
                <span className="rounded-full bg-[rgb(var(--accent)/0.12)] px-2.5 py-0.5 text-[12px] font-medium text-[color:rgb(var(--accent))]">
                  {result.encoding}
                </span>
                <span className="text-[12px] text-muted">
                  {result.num_points} points · {result.qubits} qubit{result.qubits === 1 ? '' : 's'}
                </span>
              </div>

              <KernelHeatmap kernel={result.kernel} />

              {/* Color legend */}
              <div className="mt-4 flex items-center gap-3 text-[11.5px] text-faint">
                <span>0 · orthogonal</span>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background:
                      'linear-gradient(to right, rgb(var(--accent) / 0.08), rgb(var(--accent)))',
                  }}
                />
                <span>1 · identical</span>
              </div>

              {extremes && (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Most similar pair</p>
                    <p className="mt-1 text-[13px] text-ink">
                      P{extremes.hi.i} ↔ P{extremes.hi.j}{' '}
                      <span className="font-mono text-[color:rgb(var(--accent))]">
                        {extremes.hi.v.toFixed(3)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-line px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Least similar pair</p>
                    <p className="mt-1 text-[13px] text-ink">
                      P{extremes.lo.i} ↔ P{extremes.lo.j}{' '}
                      <span className="font-mono text-muted">{extremes.lo.v.toFixed(3)}</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Explainer */}
      <section className="panel mt-6 p-6">
        <h3 className="display-serif text-xl font-semibold text-ink">What is a quantum kernel?</h3>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <p className="text-[13.5px] leading-relaxed text-muted">
            A kernel method measures similarity between data points without ever looking at their
            coordinates directly — only at a similarity score K(xᵢ, xⱼ). A <span className="text-ink">quantum</span>{' '}
            kernel computes that score in a quantum feature space: each point x is loaded into a state
            |φ(x)⟩ by an encoding, and the similarity is the <span className="text-ink">state fidelity</span>{' '}
            |⟨φ(xᵢ)|φ(xⱼ)⟩|² — 1 when the two states are identical, 0 when orthogonal.
          </p>
          <div className="text-[13.5px] leading-relaxed text-muted">
            <p>
              Reading the heatmap: bright blocks along the diagonal mean points that a classifier would
              group together; dark off-diagonal regions mean the feature map separates those classes well.
              A good feature map produces clear block structure.
            </p>
            <p className="mt-3 rounded-xl border border-line bg-[rgb(var(--ink)/0.03)] px-4 py-3 font-mono text-[12.5px] text-ink">
              K[i][j] = |⟨φ(xᵢ)|φ(xⱼ)⟩|²
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

// Square heatmap with Pᵢ headers. Cell size shrinks as the matrix grows so it
// always fits; values are printed inside once cells are large enough.
function KernelHeatmap({ kernel }) {
  const n = kernel.length
  const cell = Math.max(28, Math.min(64, Math.floor(560 / (n + 1)))) // px
  const showValues = cell >= 34

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Column headers */}
        <div className="flex" style={{ marginLeft: cell }}>
          {kernel.map((_, j) => (
            <div
              key={j}
              className="text-center font-mono text-[11px] text-faint"
              style={{ width: cell }}
            >
              P{j}
            </div>
          ))}
        </div>

        {kernel.map((row, i) => (
          <div key={i} className="flex items-center">
            <div
              className="text-right font-mono text-[11px] text-faint"
              style={{ width: cell, paddingRight: 6 }}
            >
              P{i}
            </div>
            {row.map((v, j) => (
              <div
                key={j}
                title={`K[P${i}, P${j}] = ${v.toFixed(4)}`}
                className="flex items-center justify-center border border-[rgb(var(--paper))] font-mono text-[10.5px]"
                style={{ width: cell, height: cell, ...heatStyle(v) }}
              >
                {showValues ? v.toFixed(2) : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default KernelPage
