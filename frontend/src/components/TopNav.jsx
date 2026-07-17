import React, { useEffect, useRef, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { ALGORITHM_TEMPLATES } from '../data/templates'

const NAV = ['Dashboard', 'Documentation', 'About']

const HELP_HOME = 'https://quantum.cloud.ibm.com/docs/en/guides'
const HELP_LINKS = [
  { label: 'All Guides', url: HELP_HOME },
  { label: 'Install Qiskit', url: 'https://quantum.cloud.ibm.com/docs/en/guides/install-qiskit' },
  { label: 'Hello World', url: 'https://quantum.cloud.ibm.com/docs/en/guides/hello-world' },
  { label: 'Build Circuits', url: 'https://quantum.cloud.ibm.com/docs/en/guides/map-problem-to-circuits' },
  { label: 'Tutorials', url: 'https://quantum.cloud.ibm.com/docs/en/tutorials' },
  { label: 'Qiskit API Reference', url: 'https://quantum.cloud.ibm.com/docs/en/api/qiskit' },
  { label: 'Qiskit Runtime API', url: 'https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime' },
]

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function TopNav() {
  const {
    theme,
    toggleTheme,
    saveCircuit,
    loadCircuit,
    toggleAIPanel,
    beginnerMode,
    toggleBeginnerMode,
  } = useCircuitStore()

  const [active, setActive] = useState('Dashboard')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [tmplOpen, setTmplOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const fileRef = useRef(null)
  const toolsRef = useRef(null)
  const helpRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false)
        setTmplOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLoadFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        loadCircuit(JSON.parse(ev.target.result))
      } catch {
        window.alert('Invalid circuit file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setToolsOpen(false)
  }

  const loadTemplate = (t) => {
    loadCircuit({ name: t.name, description: t.description, qubits: t.qubits, gates: t.gates })
    setTmplOpen(false)
    setToolsOpen(false)
  }

  const MenuItem = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-[13px]
        text-ink hover:bg-[rgb(var(--ink)/0.05)] transition-colors"
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center justify-between border-b border-line px-8 py-4">
      <nav className="flex items-center gap-7">
        {NAV.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`nav-link ${active === item ? 'active' : ''}`}
          >
            {item}
          </button>
        ))}

        {/* Help dropdown */}
        <div ref={helpRef} className="relative">
          <button
            onClick={() => {
              window.open(HELP_HOME, '_blank', 'noopener,noreferrer')
              setHelpOpen(false)
            }}
            className="nav-link"
          >
            Help
          </button>
          <button
            onClick={() => setHelpOpen((v) => !v)}
            aria-label="Help menu"
            className="nav-link ml-1 text-[10px]"
          >
            ▾
          </button>

          {helpOpen && (
            <div className="absolute left-0 top-9 z-40 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
              {HELP_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setHelpOpen(false)}
                  className="flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-[13px]
                    text-ink hover:bg-[rgb(var(--ink)/0.05)] transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="text-faint">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-3">
        {/* Tools dropdown */}
        <div ref={toolsRef} className="relative">
          <button className="btn-ghost" onClick={() => setToolsOpen((v) => !v)}>
            Tools
            <span className="text-[10px]">▾</span>
          </button>

          {toolsOpen && (
            <div className="absolute right-0 top-11 z-40 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
              <MenuItem onClick={() => { saveCircuit(); setToolsOpen(false) }}>
                <span>Save Circuit</span><span className="text-faint">JSON</span>
              </MenuItem>
              <MenuItem onClick={() => fileRef.current?.click()}>
                <span>Load Circuit</span><span className="text-faint">↥</span>
              </MenuItem>

              <div className="relative">
                <MenuItem onClick={() => setTmplOpen((v) => !v)}>
                  <span>Algorithm Templates</span><span className="text-faint">▸</span>
                </MenuItem>
                {tmplOpen && (
                  <div className="max-h-72 overflow-y-auto border-t border-line bg-panel">
                    {ALGORITHM_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        className="block w-full px-4 py-2 text-left hover:bg-[rgb(var(--ink)/0.05)]"
                      >
                        <span className="block text-[12px] font-semibold text-ink">{t.name}</span>
                        <span className="block text-[11px] text-faint line-clamp-1">{t.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t border-line" />
              <MenuItem onClick={() => { toggleAIPanel(); setToolsOpen(false) }}>
                <span>AI Assistant</span><span className="text-faint">✦</span>
              </MenuItem>
              <MenuItem onClick={toggleBeginnerMode}>
                <span>Beginner Mode</span>
                <span className={beginnerMode ? 'text-[color:rgb(var(--accent))]' : 'text-faint'}>
                  {beginnerMode ? 'On' : 'Off'}
                </span>
              </MenuItem>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface
            text-ink hover:border-[rgb(var(--ink)/0.4)] transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <input ref={fileRef} type="file" accept=".json" onChange={handleLoadFile} className="hidden" />
    </div>
  )
}

export default TopNav
