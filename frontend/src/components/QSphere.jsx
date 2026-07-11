import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { formatPhaseIBM } from '../utils/formatAngle'
import { toComplex, numQubitsFromStatevector } from '../utils/quantum'

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  return `rgb(${v.split(/\s+/).join(',')})`
}

function popcount(n) {
  let c = 0
  while (n) {
    c += n & 1
    n >>= 1
  }
  return c
}

// Phase (radians, -π..π) -> hue, IBM-style phase color wheel.
function phaseColor(phi) {
  const hue = (((phi + Math.PI) / (2 * Math.PI)) * 360 + 70 + 360) % 360
  return `hsl(${hue.toFixed(0)}, 70%, 52%)`
}

function InfoCard({ p, color, onClose, style }) {
  return (
    <div
      className="absolute z-20 w-52 rounded-lg border border-line bg-surface p-3 text-[12px] shadow-xl"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-ink">State |{p.bitstring}⟩</span>
        <button onClick={onClose} className="leading-none text-faint hover:text-ink">
          ×
        </button>
      </div>
      <div className="flex items-center justify-between text-muted">
        <span>Probability:</span>
        <span className="font-semibold text-ink">{p.prob.toFixed(4)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-muted">
        <span>Phase angle:</span>
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          {formatPhaseIBM(p.phi)}
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        </span>
      </div>
    </div>
  )
}

/**
 * Full joint-statevector Q-sphere: one point per basis state, arranged in
 * rings by Hamming weight (north pole = |00..0>, south pole = |11..1>),
 * sized by probability, colored by phase. Built with three.js so it gets
 * the same orbit-controls / axis-line / sprite-label treatment as the
 * per-qubit 3D Bloch view.
 */
function QSphere({ statevector, qubits }) {
  const mountRef = useRef(null)
  const [pick, setPick] = useState(null)

  const points = useMemo(() => {
    if (!Array.isArray(statevector) || statevector.length === 0) return []
    const n = qubits ?? numQubitsFromStatevector(statevector)
    if (!n) return []
    const dim = 1 << n

    const byWeight = Array.from({ length: n + 1 }, () => [])
    for (let idx = 0; idx < dim; idx++) byWeight[popcount(idx)].push(idx)

    const pts = []
    byWeight.forEach((idxs, k) => {
      const z = n === 0 ? 1 : 1 - (2 * k) / n
      const ringR = Math.sqrt(Math.max(0, 1 - z * z))
      idxs.forEach((idx, i) => {
        const angle = (i / idxs.length) * Math.PI * 2 + Math.PI
        const x = ringR * Math.cos(angle)
        const y = ringR * Math.sin(angle)
        const c = toComplex(statevector[idx])
        const prob = c.re * c.re + c.im * c.im
        const phi = Math.atan2(c.im, c.re)
        pts.push({ idx, bitstring: idx.toString(2).padStart(n, '0'), x, y, z, prob, phi })
      })
    })
    return pts.filter((p) => p.prob > 1e-6)
  }, [statevector, qubits])

  const pointsKey = points.map((p) => `${p.idx}:${p.prob.toFixed(4)}:${p.phi.toFixed(4)}`).join('|')

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    const width = mount.clientWidth || 300
    const height = 340

    const wire = new THREE.Color(cssVar('--grid-wire', 'rgb(200,200,200)'))
    const inkStr = cssVar('--ink', 'rgb(30,30,30)')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    // IBM's Q-sphere default view: nearly front-on with a gentle downward tilt,
    // so the north pole (|00..0>) sits near the top of the frame and equatorial
    // states fan out clearly below it. Pulled back a bit further than a tight
    // fit so the sphere reads as a small object in space, like IBM's.
    camera.position.set(0.55, 1.35, 4.05)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 3.2
    controls.maxDistance = 7

    // Soft, lit, solid-looking sphere (IBM's Q-sphere reads as a pale glass
    // ball with gentle gradient shading, not a flat translucent shell).
    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const key = new THREE.DirectionalLight(0xffffff, 0.6)
    key.position.set(2, 3, 2)
    scene.add(key)

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.16,
        roughness: 0.9,
        metalness: 0,
        side: THREE.FrontSide,
        depthWrite: false,
      })
    )
    scene.add(shell)

    // three great circles
    const ringMat = new THREE.LineBasicMaterial({ color: wire, transparent: true, opacity: 0.28 })
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
    const axisMat = new THREE.LineBasicMaterial({ color: wire, transparent: true, opacity: 0.4 })
    const axis = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), axisMat)
    scene.add(axis(new THREE.Vector3(0, -1.15, 0), new THREE.Vector3(0, 1.15, 0)))
    scene.add(axis(new THREE.Vector3(-1.15, 0, 0), new THREE.Vector3(1.15, 0, 0)))
    scene.add(axis(new THREE.Vector3(0, 0, -1.15), new THREE.Vector3(0, 0, 1.15)))

    // text sprite labels
    const makeLabel = (text, pos, color = inkStr, scale = 0.4) => {
      const canvas = document.createElement('canvas')
      canvas.width = 160
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = color
      ctx.font = '600 30px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 80, 32)
      const tex = new THREE.CanvasTexture(canvas)
      tex.needsUpdate = true
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.position.copy(pos)
      sprite.scale.set(scale, scale * 0.4, 1)
      scene.add(sprite)
    }

    // basis-state points: bloch (x,y,z) -> three.js Y-up (x, z, y), same mapping
    // used by the per-qubit view, so orientation stays consistent app-wide.
    const hitMeshes = []
    points.forEach((p) => {
      const dir = new THREE.Vector3(p.x, p.z, p.y)
      const len = dir.length() || 1
      const colorHex = phaseColor(p.phi)
      const color = new THREE.Color(colorHex)
      const r = 0.045 + Math.sqrt(p.prob) * 0.09

      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir]), lineMat))

      const dot = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), new THREE.MeshBasicMaterial({ color }))
      dot.position.copy(dir)
      scene.add(dot)

      makeLabel(`|${p.bitstring}⟩`, dir.clone().multiplyScalar(1 + (r + 0.14) / len), inkStr, 0.34)

      const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.14, r + 0.06), 12, 12), new THREE.MeshBasicMaterial({ visible: false }))
      hit.position.copy(dir)
      hit.userData = { p, color: colorHex }
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
        const { p, color } = hits[0].object.userData
        setPick({ p, color, x: e.clientX - rect.left, y: e.clientY - rect.top })
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
  }, [pointsKey])

  if (points.length === 0) {
    return <div className="py-10 text-center text-[13px] text-muted">No statevector to plot</div>
  }

  return (
    <div className="relative w-full" style={{ height: 340 }}>
      <div ref={mountRef} className="h-full w-full" />
      {pick && (
        <InfoCard
          p={pick.p}
          color={pick.color}
          onClose={() => setPick(null)}
          style={{
            left: pick.x,
            top: pick.y,
            transform: `translate(-50%, ${pick.y > 80 ? '-116%' : '16px'})`,
          }}
        />
      )}
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-faint">
        Point size = probability · color = phase · drag to rotate
      </div>
    </div>
  )
}

export default QSphere