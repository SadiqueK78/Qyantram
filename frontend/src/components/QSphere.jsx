import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { formatPhaseIBM } from '../utils/formatAngle'
import { toComplex, numQubitsFromStatevector } from '../utils/quantum'
import PhaseLegend from './PhaseLegend'

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
  const [themeTick, setThemeTick] = useState(0)

  // The scene below bakes CSS colors into materials/canvas textures once per
  // build. Watch <html> for the class/attribute the theme toggle flips so we
  // rebuild (and re-read fresh --ink / --grid-wire values) on every switch
  // between light and dark, not just on first mount.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const el = document.documentElement
    const observer = new MutationObserver(() => setThemeTick((t) => t + 1))
    observer.observe(el, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
    return () => observer.disconnect()
  }, [])

  const points = useMemo(() => {
    if (!Array.isArray(statevector) || statevector.length === 0) return []
    // The statevector array's own length is authoritative: it always spans
    // every qubit in the simulated register, including idle ones with no
    // gates on them. The `qubits` prop comes from separate UI state and can
    // go stale relative to the last-run result — trusting it first was
    // truncating `dim` below the array's real size, which silently sliced
    // off any basis state touching the idle qubit (and shortened the
    // |bitstring⟩ labels by one character). Derive n from the data first,
    // and only fall back to the prop/heuristic if the length isn't a clean
    // power of two.
    const lengthBits = Math.log2(statevector.length)
    const n = Number.isInteger(lengthBits) ? lengthBits : qubits ?? numQubitsFromStatevector(statevector)
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

  // Prefixed with the statevector's own dimension: for the ground state
  // (idx 0, prob 1, phi 0), that (idx,prob,phi) triple is identical at
  // every qubit count, so keying on point values alone let a qubit-count
  // resize produce the exact same key — the effect below then skipped the
  // rebuild and the sphere kept showing the old bitstring labels even
  // though `points` itself had the right (new) data.
  const dim = Array.isArray(statevector) ? statevector.length : 0
  const pointsKey = `${dim}|` + points.map((p) => `${p.idx}:${p.prob.toFixed(4)}:${p.phi.toFixed(4)}`).join('|')

  // A click popup opened for one circuit (e.g. "State |00⟩" at 2 qubits) has
  // no business surviving into a different one (3 qubits, a fresh gate,
  // etc.) — without this it just sits there showing stale data for a state
  // that no longer corresponds to what's on screen.
  useEffect(() => {
    setPick(null)
  }, [pointsKey])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    const width = mount.clientWidth || 300
    const height = 340

    const inkStr = cssVar('--ink', 'rgb(30,30,30)')
    const accent = new THREE.Color(cssVar('--accent', 'rgb(79,70,229)'))

    // Reliable theme read: index.css sets color-scheme: light/dark on :root
    // per theme, so trust that instead of guessing at a toggle class name.
    const isDark =
      typeof document !== 'undefined' &&
      getComputedStyle(document.documentElement).colorScheme.includes('dark')

    // The sphere is deliberately NOT tinted from --surface. In dark mode
    // --surface sits only a hair above --paper (30,30,33 vs 18,18,19), so a
    // surface-colored sphere on a near-black page reads as a void, not an
    // object. Calibrated against IBM Quantum Composer's own Q-sphere: a
    // solid, evenly-lit matte ball, not a glassy/see-through shell — pale
    // porcelain in light mode to sit with the paper, pale lavender-grey in
    // dark mode so it stays a distinct object against the black backdrop.
    const palette = isDark
      ? {
          shell: new THREE.Color('#dbdde6'),
          shellOpacity: 0.46,
          inner: new THREE.Color('#ffffff'),
          innerOpacity: 0.14,
          ambient: 0.55,
          keyIntensity: 0.95,
          fillColor: accent,
          fillIntensity: 0.14,
          ringColor: new THREE.Color('#aeb1c4'),
          ringEq: 0.34,
          ringOther: 0.18,
        }
      : {
          shell: new THREE.Color('#f6f4f0'),
          shellOpacity: 0.5,
          inner: new THREE.Color('#ffffff'),
          innerOpacity: 0.18,
          ambient: 0.55,
          keyIntensity: 1.0,
          fillColor: new THREE.Color('#c7c9d6'),
          fillIntensity: 0.12,
          ringColor: new THREE.Color('#3a3a3f'),
          ringEq: 0.34,
          ringOther: 0.2,
        }

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

    // Soft, matte, solid-looking sphere — pale porcelain ball with a gentle
    // top-to-bottom gradient (bright highlight near the pole, soft shadow
    // near the lower rim), closer to IBM's reference rendering than a glassy
    // translucent shell.
    scene.add(new THREE.AmbientLight(0xffffff, palette.ambient))
    const key = new THREE.DirectionalLight(0xffffff, palette.keyIntensity)
    key.position.set(1.4, 3.2, 2.2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(palette.fillColor, palette.fillIntensity)
    fill.position.set(-2, -1.4, -1.2)
    scene.add(fill)

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        color: palette.shell,
        transparent: true,
        opacity: palette.shellOpacity,
        roughness: 1,
        metalness: 0,
        side: THREE.FrontSide,
        depthWrite: false,
      })
    )
    scene.add(shell)
    // Faint inner shell adds depth without a hard second silhouette edge.
    const innerShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.985, 48, 48),
      new THREE.MeshStandardMaterial({
        color: palette.inner,
        transparent: true,
        opacity: palette.innerOpacity,
        roughness: 1,
        metalness: 0,
        side: THREE.BackSide,
        depthWrite: false,
      })
    )
    scene.add(innerShell)

    // Thin latitude rings (horizontal, like IBM's Q-sphere), fading toward
    // the poles. No meridian or axis lines, to keep the sphere reading as a
    // clean, softly-shaded ball rather than a wireframe globe.
    const ringMat = (opacity) => new THREE.LineBasicMaterial({ color: palette.ringColor, transparent: true, opacity })
    const latitudeRing = (yLevel, opacity) => {
      const r = Math.sqrt(Math.max(0, 1 - yLevel * yLevel))
      const pts = []
      for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * Math.PI * 2
        pts.push(new THREE.Vector3(r * Math.cos(t), yLevel, r * Math.sin(t)))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts)
      scene.add(new THREE.LineLoop(geom, ringMat(opacity)))
    }
    ;[-0.55, 0, 0.55].forEach((y) => latitudeRing(y, y === 0 ? palette.ringEq : palette.ringOther))

    // text sprite labels. Baked as a bitmap, so instead of trusting a single
    // ink color to always contrast with whatever's behind it (sphere, page
    // bg, either theme), draw a small rounded pill behind the glyphs, in the
    // opposite tone from the text color's own luminance — keeps labels
    // clearly legible against a pale, translucent sphere in either theme.
    const makeLabel = (text, pos, color = inkStr, scale = 0.4) => {
      const canvas = document.createElement('canvas')
      canvas.width = 220
      canvas.height = 84
      const ctx = canvas.getContext('2d')
      ctx.font = '600 32px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const nums = (color.match(/[\d.]+/g) || [30, 30, 30]).map(Number)
      const [r, g, b] = nums
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      const pillBg = luminance > 0.6 ? 'rgba(10,11,16,0.55)' : 'rgba(255,255,255,0.8)'

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const textWidth = ctx.measureText(text).width
      const pillW = Math.min(canvas.width - 8, textWidth + 28)
      const pillH = 40
      ctx.fillStyle = pillBg
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH, 10)
        ctx.fill()
      } else {
        ctx.fillRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH)
      }

      ctx.fillStyle = color
      ctx.fillText(text, cx, cy)

      const tex = new THREE.CanvasTexture(canvas)
      tex.needsUpdate = true
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.position.copy(pos)
      sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1)
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

      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
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
  }, [pointsKey, themeTick])

  if (points.length === 0) {
    return <div className="py-10 text-center text-[13px] text-muted">No statevector to plot</div>
  }

  return (
    <div className="w-full">
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
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 px-1">
        <PhaseLegend size={52} />
        <p className="text-right text-[10px] leading-snug text-faint">
          Point size = probability
          <br />
          Color = phase · drag to rotate
        </p>
      </div>
    </div>
  )
}

export default QSphere