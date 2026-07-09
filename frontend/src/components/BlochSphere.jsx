import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function toComplex(value) {
  if (typeof value === 'number') {
    return { re: value, im: 0 }
  }
  if (!value) {
    return { re: 0, im: 0 }
  }
  return {
    re: Number(value.real ?? value.re ?? 0),
    im: Number(value.imag ?? value.im ?? 0),
  }
}

function magnitudeSquared(c) {
  return c.re * c.re + c.im * c.im
}

function phaseOf(c) {
  return Math.atan2(c.im, c.re)
}

function hammingWeight(value) {
  let v = value
  let count = 0
  while (v) {
    count += v & 1
    v >>= 1
  }
  return count
}

function phaseToColor(phase, enabled) {
  if (!enabled) {
    return '#4f46e5'
  }
  const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360
  return `hsl(${hue}, 85%, 60%)`
}

// Place basis states by Hamming-weight latitude and even longitude per latitude band.
function extractQSpherePoints(statevector, showPhaseColors) {
  if (!Array.isArray(statevector) || statevector.length < 2) {
    return []
  }

  const amps = statevector.map(toComplex)
  const n = Math.round(Math.log2(amps.length))
  if (2 ** n !== amps.length) {
    return []
  }

  const statesByBand = new Map()
  const entries = []

  for (let i = 0; i < amps.length; i++) {
    const prob = magnitudeSquared(amps[i])
    if (prob < 1e-6) {
      continue
    }
    const ones = hammingWeight(i)
    if (!statesByBand.has(ones)) {
      statesByBand.set(ones, [])
    }
    statesByBand.get(ones).push({ index: i, prob, amp: amps[i], ones })
  }

  statesByBand.forEach((bandStates, ones) => {
    bandStates.sort((a, b) => a.index - b.index)
    const z = n > 0 ? 1 - (2 * ones) / n : 1
    const r = Math.sqrt(Math.max(0, 1 - z * z))

    bandStates.forEach((state, idx) => {
      const angle = bandStates.length === 1 ? 0 : (2 * Math.PI * idx) / bandStates.length
      const x = r * Math.cos(angle)
      const y = r * Math.sin(angle)
      const phase = phaseOf(state.amp)

      entries.push({
        bitstring: state.index.toString(2).padStart(n, '0'),
        probability: state.prob,
        phase,
        x,
        y,
        z,
        color: phaseToColor(phase, showPhaseColors),
      })
    })
  })

  return entries.sort((a, b) => b.probability - a.probability)
}

// World mapping with vertical pole on Y-axis.
function qToWorld(x, y, z) {
  return new THREE.Vector3(x, z, y)
}

function formatAngleDegrees(value) {
  const deg = (((value * 180) / Math.PI) % 360 + 360) % 360
  return `${deg.toFixed(1)} deg`
}

function BlochSphere({ result, qubit = 0 }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const dynamicGroupRef = useRef(null)
  const [showStateLabels, setShowStateLabels] = useState(true)
  const [showPhaseLabel, setShowPhaseLabel] = useState(true)
  const [error, setError] = useState(null)

  const qSpherePoints = useMemo(() => {
    return extractQSpherePoints(result?.statevector ?? [], showPhaseLabel)
  }, [result, showPhaseLabel])

  const dominantPhase = qSpherePoints[0]?.phase ?? 0
  const phaseDeg = (((dominantPhase * 180) / Math.PI) % 360 + 360) % 360

  // Mount-once effect: set up renderer, scene, camera, controls, static
  // sphere/ring, and the animation loop. Runs a single time per mount.
  useEffect(() => {
    if (!canvasRef.current) return undefined

    const mount = canvasRef.current
    const width = mount.clientWidth || 360
    const height = mount.clientHeight || 320

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050b2a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100)
    camera.position.set(2.3, 1.6, 2.7)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = false
    controlsRef.current = controls

    const ambient = new THREE.AmbientLight(0xffffff, 0.64)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.74)
    keyLight.position.set(2, 2, 2)
    scene.add(keyLight)

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64)
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xd6d9e2,
      transparent: true,
      opacity: 0.14,
      shininess: 45,
      side: THREE.DoubleSide,
    })
    // Prevent transparent sphere from hiding internal state vectors.
    sphereMaterial.depthWrite = false
    scene.add(new THREE.Mesh(sphereGeometry, sphereMaterial))

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xb8bfcb,
      transparent: true,
      opacity: 0.34,
    })

    const buildRing = (rotationAxis) => {
      const curve = new THREE.EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0)
      const points2D = curve.getPoints(128)
      const points3D = points2D.map((p) => new THREE.Vector3(p.x, p.y, 0))
      const geometry = new THREE.BufferGeometry().setFromPoints(points3D)
      if (rotationAxis === 'x') {
        geometry.rotateX(Math.PI / 2)
      } else if (rotationAxis === 'y') {
        geometry.rotateY(Math.PI / 2)
      }
      return new THREE.LineLoop(geometry, ringMaterial)
    }

    // Keep only one white guide line (equator), as requested.
    // Equator must lie on the XZ plane (horizontal), so rotate the base XY circle around X.
    scene.add(buildRing('x'))

    // Dedicated group for per-simulation state-vector lines/nodes, so
    // updates only need to clear and repopulate this group instead of
    // touching the rest of the (expensive-to-create) scene.
    const dynamicGroup = new THREE.Group()
    scene.add(dynamicGroup)
    dynamicGroupRef.current = dynamicGroup

    let rafId = 0
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    const onResize = () => {
      const w = mount.clientWidth || 360
      const h = mount.clientHeight || 320
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)
    animate()

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      controls.dispose()
      sphereGeometry.dispose()
      sphereMaterial.dispose()
      ringMaterial.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      dynamicGroupRef.current = null
    }
  }, [])

  // Update-on-data effect: only touches the dynamic state-vector group,
  // instead of rebuilding the renderer/scene/camera every simulation run.
  useEffect(() => {
    const group = dynamicGroupRef.current
    if (!group) return undefined

    // Dispose old children's geometry/material before clearing, to avoid
    // leaking GPU resources across repeated simulation runs.
    while (group.children.length > 0) {
      const child = group.children.pop()
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    }

    qSpherePoints.slice(0, 32).forEach((point) => {
      const endPoint = qToWorld(point.x, point.y, point.z)
      const opacity = clamp(0.22 + 1.35 * point.probability, 0.22, 1)

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), endPoint]),
        new THREE.LineBasicMaterial({ color: new THREE.Color(point.color), transparent: true, opacity })
      )
      line.renderOrder = 10
      line.material.depthTest = false
      group.add(line)

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.028 + 0.05 * Math.sqrt(point.probability), 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(point.color), transparent: true, opacity })
      )
      node.position.copy(endPoint)
      node.renderOrder = 11
      node.material.depthTest = false
      group.add(node)
    })
  }, [qSpherePoints])

  useEffect(() => {
    setError(null)
  }, [result, qubit])

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
        Visualization Error: {error}
      </div>
    )
  }

  const topStates = qSpherePoints.slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-200">Q-sphere</h3>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">q{qubit}</span>
        </div>
        <span className="text-xs text-slate-400">State phase view</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2">
        <div ref={canvasRef} className="h-[300px] w-full overflow-hidden rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[96px_1fr]">
        <div className="relative mx-auto">
          <div className="phase-wheel" />
          <div
            className="phase-wheel-pointer"
            style={{ transform: `translate(-50%, -100%) rotate(${phaseDeg}deg)` }}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full text-[10px] font-semibold text-slate-100">
            phase
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300">
          <div className="mt-1 flex flex-wrap items-center gap-4 border-b border-white/10 pb-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-200">
              <input
                type="checkbox"
                checked={showStateLabels}
                onChange={(e) => setShowStateLabels(e.target.checked)}
                className="h-4 w-4 accent-cyan-400"
              />
              State
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-slate-200">
              <input
                type="checkbox"
                checked={showPhaseLabel}
                onChange={(e) => setShowPhaseLabel(e.target.checked)}
                className="h-4 w-4 accent-cyan-400"
              />
              Phase angle
            </label>
          </div>

          {showStateLabels && (
            <div className="space-y-1 font-mono text-[11px]">
              {topStates.map((s) => (
                <div key={s.bitstring} className="flex items-center justify-between text-slate-300">
                  <span>|{s.bitstring}</span>
                  <span>{(s.probability * 100).toFixed(2)}%</span>
                  <span>{showPhaseLabel ? formatAngleDegrees(s.phase) : 'phase hidden'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlochSphere
