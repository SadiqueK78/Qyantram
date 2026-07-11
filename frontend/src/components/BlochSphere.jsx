import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Read a CSS variable ("r g b") from the document and return a THREE color / css string.
function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  return `rgb(${v.split(/\s+/).join(',')})`
}

// Distinct, deterministic color per qubit index.
const VECTOR_PALETTE = ['#c13e76', '#2f7de1', '#2f9e56', '#d9a406', '#7b5ce8', '#e2622b', '#0f9aa8', '#a83f9e']
function vectorColor(i) {
  return VECTOR_PALETTE[i % VECTOR_PALETTE.length]
}

// IBM-Composer-style info card shown when a vector's tip is clicked.
function VectorInfoCard({ v, color, onClose, style }) {
  const p0 = (1 + v.z) / 2
  const p1 = (1 - v.z) / 2
  return (
    <div
      className="absolute z-20 w-48 rounded-lg border border-line bg-surface p-2.5 text-[11px] shadow-xl"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono font-semibold text-ink">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {v.qubit !== undefined ? `Qubit q${v.qubit}` : 'State'}
        </span>
        <button onClick={onClose} className="leading-none text-faint hover:text-ink">
          ×
        </button>
      </div>
      <div className="flex justify-between font-mono text-muted">
        <span>P(|0⟩)</span>
        <span className="text-ink">{p0.toFixed(4)}</span>
      </div>
      <div className="flex justify-between font-mono text-muted">
        <span>P(|1⟩)</span>
        <span className="text-ink">{p1.toFixed(4)}</span>
      </div>
      <div className="flex justify-between font-mono text-muted">
        <span>Phase φ</span>
        <span className="text-ink">{v.phi.toFixed(3)} rad</span>
      </div>
      {!v.pure && (
        <div className="mt-1 text-[10px] leading-snug text-faint">
          Mixed state — |r| = {v.r.toFixed(2)}
        </div>
      )}
    </div>
  )
}

// -------------------- 2D projection (default view) --------------------
function Bloch2D({ bloch, vectors }) {
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const R = 118
  const ry = R * 0.32 // flattened equator

  const accent = cssVar('--accent', 'rgb(79,70,229)')
  const line = cssVar('--grid-wire', 'rgb(200,200,200)')
  const ink = cssVar('--ink', 'rgb(30,30,30)')
  const faint = cssVar('--faint', 'rgb(150,150,150)')
  const surface = cssVar('--surface', '#ffffff')

  const [selectedKey, setSelectedKey] = useState(null)
  useEffect(() => setSelectedKey(null), [bloch, vectors])

  const project = (x, y, z) => ({ x: cx + R * x, y: cy - R * z + ry * y })

  const multi = Array.isArray(vectors) && vectors.length > 0
  const list = multi ? vectors : [bloch]
  const keyOf = (v, i) => v.qubit ?? i

  // equator path
  const eq = []
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2
    const p = project(Math.cos(t), Math.sin(t), 0)
    eq.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
  }

  const label = (x, y, z, text, dx = 0, dy = 0) => {
    const p = project(x, y, z)
    return (
      <text
        x={p.x + dx}
        y={p.y + dy}
        fontSize="12"
        fontFamily="IBM Plex Mono, monospace"
        fill={faint}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {text}
      </text>
    )
  }

  // Places the qN chip so it doesn't sit on top of the |0⟩/|1⟩ pole labels,
  // which live directly above/below center — nudge sideways when a vector
  // points near a pole instead of stacking the chip straight above the tip.
  const labelPos = (tip) => {
    const nearPole = Math.abs(tip.x - cx) < R * 0.22
    return nearPole ? { x: tip.x + 22, y: tip.y + 1 } : { x: tip.x, y: tip.y - 15 }
  }

  const selected = list.find((v, i) => keyOf(v, i) === selectedKey)
  const selectedTip = selected ? project(selected.x, selected.y, selected.z) : null
  const selectedColor = selected ? (multi ? vectorColor(selected.qubit ?? 0) : accent) : accent

  return (
    <div className="relative mx-auto" style={{ maxWidth: size }}>
      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto block"
        onClick={() => setSelectedKey(null)}
      >
        {/* sphere outline */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={line} strokeWidth="1.2" />
        {/* meridian (vertical ellipse, edge-on -> a line) */}
        <ellipse cx={cx} cy={cy} rx={ry} ry={R} fill="none" stroke={line} strokeWidth="1" opacity="0.6" />
        {/* equator disc */}
        <path d={eq.join(' ')} fill={accent} fillOpacity="0.06" stroke={line} strokeWidth="1" />
        {/* axes */}
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke={line} strokeWidth="1" opacity="0.5" />

        {/* pole + equator labels */}
        {label(0, 0, 1, '|0⟩', 0, -14)}
        {label(0, 0, -1, '|1⟩', 0, 16)}
        {label(1, 0, 0, '|+⟩', 16, 0)}
        {label(-1, 0, 0, '|−⟩', -16, 0)}
        {label(0, 1, 0, '|i⟩', 12, 8)}
        {label(0, -1, 0, '|−i⟩', -14, -8)}

        {/* state vector(s) */}
        {list.map((v, i) => {
          const key = keyOf(v, i)
          const tip = project(v.x, v.y, v.z)
          const color = multi ? vectorColor(v.qubit ?? i) : accent
          const pos = labelPos(tip)
          const text = multi ? `q${v.qubit}` : null
          const chipW = text ? text.length * 6.4 + 10 : 0
          const isSelected = selectedKey === key
          return (
            <g key={key}>
              <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
              <circle
                cx={tip.x}
                cy={tip.y}
                r={isSelected ? 7 : 5}
                fill={color}
                stroke={isSelected ? ink : 'none'}
                strokeWidth={isSelected ? 1.5 : 0}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedKey(isSelected ? null : key)
                }}
              />
              {text && (
                <g pointerEvents="none">
                  <rect
                    x={pos.x - chipW / 2}
                    y={pos.y - 8}
                    width={chipW}
                    height={16}
                    rx={4}
                    fill={surface}
                    opacity="0.95"
                    stroke={color}
                    strokeWidth="0.75"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 3.5}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={color}
                    textAnchor="middle"
                  >
                    {text}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        <circle cx={cx} cy={cy} r="2.5" fill={ink} />
      </svg>

      {selected && selectedTip && (
        <VectorInfoCard
          v={selected}
          color={selectedColor}
          onClose={() => setSelectedKey(null)}
          style={{
            left: `${(selectedTip.x / size) * 100}%`,
            top: `${(selectedTip.y / size) * 100}%`,
            transform: `translate(-50%, ${(selectedTip.y / size) * 100 > 22 ? '-116%' : '16px'})`,
          }}
        />
      )}
    </div>
  )
}

// -------------------- 3D interactive view --------------------
function Bloch3D({ bloch, vectors }) {
  const mountRef = useRef(null)
  const multi = Array.isArray(vectors) && vectors.length > 0
  const list = multi ? vectors : [bloch]
  // Key on qubit count + mode so the scene rebuilds when switching single/all.
  const sceneKey = multi ? `all-${vectors.length}` : 'single'

  const [pick, setPick] = useState(null)
  useEffect(() => setPick(null), [bloch, vectors])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    const width = mount.clientWidth || 300
    const height = 300

    const accent = new THREE.Color(cssVar('--accent', 'rgb(79,70,229)'))
    const wire = new THREE.Color(cssVar('--grid-wire', 'rgb(200,200,200)'))
    const inkStr = cssVar('--ink', 'rgb(30,30,30)')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(2.4, 1.7, 2.6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 2.6
    controls.maxDistance = 6

    // faint sphere shell
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshBasicMaterial({ color: wire, transparent: true, opacity: 0.06, side: THREE.BackSide })
    )
    scene.add(shell)

    // three great circles
    const ringMat = new THREE.LineBasicMaterial({ color: wire, transparent: true, opacity: 0.5 })
    const circlePts = []
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2
      circlePts.push(new THREE.Vector3(Math.cos(t), Math.sin(t), 0))
    }
    const baseCircle = new THREE.BufferGeometry().setFromPoints(circlePts)
    const eqGeom = baseCircle.clone().rotateX(Math.PI / 2)
    scene.add(new THREE.LineLoop(eqGeom, ringMat))
    scene.add(new THREE.LineLoop(baseCircle.clone(), ringMat))
    scene.add(new THREE.LineLoop(baseCircle.clone().rotateY(Math.PI / 2), ringMat))

    // axes
    const axisMat = new THREE.LineBasicMaterial({ color: wire, transparent: true, opacity: 0.7 })
    const axis = (a, b) =>
      new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), axisMat)
    scene.add(axis(new THREE.Vector3(0, -1.15, 0), new THREE.Vector3(0, 1.15, 0)))
    scene.add(axis(new THREE.Vector3(-1.15, 0, 0), new THREE.Vector3(1.15, 0, 0)))
    scene.add(axis(new THREE.Vector3(0, 0, -1.15), new THREE.Vector3(0, 0, 1.15)))

    // text sprite labels
    const makeLabel = (text, pos, color = inkStr, scale = 0.42) => {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = color
      ctx.font = '600 34px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 64, 32)
      const tex = new THREE.CanvasTexture(canvas)
      tex.needsUpdate = true
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.position.copy(pos)
      sprite.scale.set(scale, scale * 0.5, 1)
      scene.add(sprite)
    }
    // three.js is Y-up; map bloch (x,y,z) -> (x, z, y)
    makeLabel('|0⟩', new THREE.Vector3(0, 1.3, 0))
    makeLabel('|1⟩', new THREE.Vector3(0, -1.3, 0))
    makeLabel('|+⟩', new THREE.Vector3(1.32, 0, 0))
    makeLabel('|−⟩', new THREE.Vector3(-1.32, 0, 0))
    makeLabel('|i⟩', new THREE.Vector3(0, 0, 1.32))
    makeLabel('|−i⟩', new THREE.Vector3(0, 0, -1.32))

    // state vector arrow(s) — one per qubit when in "all" mode, colored distinctly.
    // Each vector also gets an invisible, slightly oversized hit-sphere so it's
    // easy to click, which we raycast against below.
    const hitMeshes = []
    list.forEach((v, i) => {
      const colorHex = multi ? vectorColor(v.qubit ?? i) : `#${accent.getHexString()}`
      const color = new THREE.Color(colorHex)
      const dir = new THREE.Vector3(v.x, v.z, v.y)
      const len = Math.max(0.02, dir.length())
      let tipPos
      if (len > 0.02) {
        const arrow = new THREE.ArrowHelper(dir.clone().normalize(), new THREE.Vector3(0, 0, 0), len, color, 0.16, 0.09)
        scene.add(arrow)
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 16, 16),
          new THREE.MeshBasicMaterial({ color })
        )
        tip.position.copy(dir)
        scene.add(tip)
        tipPos = dir
        if (multi) {
          const lp = dir.clone().multiplyScalar(1 + 0.18 / Math.max(len, 0.3))
          makeLabel(`q${v.qubit}`, lp, colorHex, 0.3)
        }
      } else {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 16, 16),
          new THREE.MeshBasicMaterial({ color })
        )
        scene.add(dot)
        tipPos = new THREE.Vector3(0, 0, 0)
      }
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      )
      hit.position.copy(tipPos)
      hit.userData = { v, color: colorHex }
      scene.add(hit)
      hitMeshes.push(hit)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(hitMeshes)
      if (hits.length > 0) {
        const { v, color } = hits[0].object.userData
        setPick({ v, color, x: e.clientX - rect.left, y: e.clientY - rect.top })
      } else {
        setPick(null)
      }
    }
    renderer.domElement.addEventListener('click', onClick)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = mount.clientWidth || 300
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onClick)
      cancelAnimationFrame(raf)
      controls.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [sceneKey, bloch, vectors])

  return (
    <div className="relative w-full" style={{ height: 300 }}>
      <div ref={mountRef} className="h-full w-full" />
      {pick && (
        <VectorInfoCard
          v={pick.v}
          color={pick.color}
          onClose={() => setPick(null)}
          style={{
            left: pick.x,
            top: pick.y,
            transform: `translate(-50%, ${pick.y > 70 ? '-116%' : '16px'})`,
          }}
        />
      )}
    </div>
  )
}

function BlochSphere({ bloch, vectors, mode = '2D' }) {
  return mode === '3D' ? <Bloch3D bloch={bloch} vectors={vectors} /> : <Bloch2D bloch={bloch} vectors={vectors} />
}

export default BlochSphere