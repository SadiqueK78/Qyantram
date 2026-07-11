import React from 'react'

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  return `rgb(${v.split(/\s+/).join(',')})`
}

// Must mirror QSphere.jsx's phaseColor() exactly so the legend always matches
// what's actually drawn on the sphere.
function hueAt(phi) {
  return (((phi + Math.PI) / (2 * Math.PI)) * 360 + 70 + 360) % 360
}

/**
 * Small circular "Phase" color wheel: 0 on the right, π/2 at top, π on the
 * left, 3π/2 at bottom (standard math convention), matching IBM's legend.
 */
function PhaseLegend({ size = 84 }) {
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 2
  const rInner = rOuter * 0.52
  const segments = 72 // thin wedges approximate a smooth conic gradient

  const wedges = []
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2
    const a1 = ((i + 1) / segments) * Math.PI * 2
    // screen angle: 0 at right, increasing counter-clockwise visually
    const pt = (r, a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)]
    const [ox0, oy0] = pt(rOuter, a0)
    const [ox1, oy1] = pt(rOuter, a1)
    const [ix1, iy1] = pt(rInner, a1)
    const [ix0, iy0] = pt(rInner, a0)
    const mid = (a0 + a1) / 2
    wedges.push(
      <path
        key={i}
        d={`M${ox0},${oy0} A${rOuter},${rOuter} 0 0,0 ${ox1},${oy1} L${ix1},${iy1} A${rInner},${rInner} 0 0,1 ${ix0},${iy0} Z`}
        fill={`hsl(${hueAt(mid).toFixed(0)}, 70%, 52%)`}
        stroke="none"
      />
    )
  }

  const labelPos = (a, r) => {
    const x = cx + r * Math.cos(a)
    const y = cy - r * Math.sin(a)
    return { x, y }
  }
  const lr = rOuter + 11
  const p0 = labelPos(0, lr)
  const pHalfPi = labelPos(Math.PI / 2, lr)
  const pPi = labelPos(Math.PI, lr)
  const p3HalfPi = labelPos((3 * Math.PI) / 2, lr)

  const padX = 30
  const padY = 36
  const w = size + padX * 2
  const h = size + padY * 2

  const surface = cssVar('--surface', '#ffffff')
  const ink = cssVar('--ink', 'rgb(30,30,30)')
  const faint = cssVar('--faint', 'rgb(150,150,150)')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <g transform={`translate(${padX}, ${padY})`}>
        {wedges}
        <circle cx={cx} cy={cy} r={rInner - 1} fill={surface} />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontFamily="IBM Plex Mono, monospace"
          fill={ink}
        >
          Phase
        </text>
        <text x={p0.x + 5} y={p0.y} textAnchor="start" dominantBaseline="middle" fontSize="10" fill={faint}>
          0
        </text>
        <text x={pHalfPi.x} y={pHalfPi.y - 4} textAnchor="middle" dominantBaseline="baseline" fontSize="10" fill={faint}>
          π/2
        </text>
        <text x={pPi.x - 5} y={pPi.y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={faint}>
          π
        </text>
        <text x={p3HalfPi.x} y={p3HalfPi.y + 10} textAnchor="middle" dominantBaseline="hanging" fontSize="10" fill={faint}>
          3π/2
        </text>
      </g>
    </svg>
  )
}

export default PhaseLegend