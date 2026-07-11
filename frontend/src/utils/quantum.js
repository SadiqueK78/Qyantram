// =============================================================================
// Quantum math helpers shared across visualization components.
// Backend statevector is Qiskit little-endian: amplitude index i has qubit q's
// value in bit (i >> q) & 1, and the printed bitstring is big-endian
// format(i, '0{n}b') (qubit n-1 is the leftmost character).
// =============================================================================

export function toComplex(v) {
  if (typeof v === 'number') return { re: v, im: 0 }
  if (!v) return { re: 0, im: 0 }
  return { re: Number(v.real ?? v.re ?? 0), im: Number(v.imag ?? v.im ?? 0) }
}

export function magnitude(c) {
  return Math.sqrt(c.re * c.re + c.im * c.im)
}

export function numQubitsFromStatevector(statevector) {
  if (!Array.isArray(statevector) || statevector.length < 2) return 0
  const n = Math.round(Math.log2(statevector.length))
  return 2 ** n === statevector.length ? n : 0
}

/**
 * Single-qubit Bloch vector for `qubit` from the full statevector, via the
 * reduced density matrix (partial trace over all other qubits).
 *   x = 2·Re(ρ01), y = -2·Im(ρ01), z = p0 - p1
 * Returns { x, y, z, r, theta, phi, p0, p1, pure }.
 * r < 1 signals a mixed (e.g. entangled) qubit -> the arrow is shortened.
 */
export function blochVector(statevector, qubit) {
  const n = numQubitsFromStatevector(statevector)
  if (!n || qubit < 0 || qubit >= n) {
    return { x: 0, y: 0, z: 1, r: 1, theta: 0, phi: 0, p0: 1, p1: 0, pure: true }
  }

  const amps = statevector.map(toComplex)
  const bit = 1 << qubit
  let p0 = 0
  let p1 = 0
  let rho01re = 0
  let rho01im = 0

  for (let i = 0; i < amps.length; i++) {
    if (i & bit) continue // handle each (i0, i1) pair once from the bit=0 side
    const j = i | bit
    const a = amps[i]
    const b = amps[j]
    p0 += a.re * a.re + a.im * a.im
    p1 += b.re * b.re + b.im * b.im
    // ρ01 += a · conj(b)
    rho01re += a.re * b.re + a.im * b.im
    rho01im += a.im * b.re - a.re * b.im
  }

  const x = 2 * rho01re
  const y = -2 * rho01im
  const z = p0 - p1
  const r = Math.min(1, Math.sqrt(x * x + y * y + z * z))
  const theta = r < 1e-9 ? 0 : Math.acos(Math.max(-1, Math.min(1, z / r)))
  const phi = Math.atan2(y, x)

  return { x, y, z, r, theta, phi, p0, p1, pure: r > 0.999 }
}

// Amplitude rows for the statevector panel: [{ index, bitstring, re, im, mag, prob }].
export function amplitudeRows(statevector) {
  const n = numQubitsFromStatevector(statevector)
  if (!n) return []
  return statevector.map((v, i) => {
    const c = toComplex(v)
    const mag = magnitude(c)
    return {
      index: i,
      bitstring: i.toString(2).padStart(n, '0'),
      re: c.re,
      im: c.im,
      mag,
      prob: mag * mag,
    }
  })
}

export const formatRad = (v) => `${v.toFixed(3)} rad`
