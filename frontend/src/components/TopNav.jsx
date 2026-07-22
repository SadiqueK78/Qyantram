import React, { useEffect, useRef, useState } from 'react'
import { useCircuitStore } from '../store/useCircuitStore'
import { useSimulation } from '../hooks/useSimulation'

const HELP_HOME = 'https://quantum.cloud.ibm.com/docs/en/guides'
const HELP_LINKS = [
  { label: 'All Guides', url: HELP_HOME },
  { label: 'Install Qiskit', url: 'https://quantum.cloud.ibm.com/docs/en/guides/install-qiskit' },
  { label: 'Hello World', url: 'https://quantum.cloud.ibm.com/docs/en/guides/hello-world' },
  { label: 'Build Circuits', url: 'https://quantum.cloud.ibm.com/docs/en/guides/map-problem-to-circuits' },
  { label: 'Tutorials', url: 'https://quantum.cloud.ibm.com/docs/en/tutorials' },
  { label: 'Qiskit API Reference', url: 'https://quantum.cloud.ibm.com/docs/en/api/qiskit' },
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
function AtomIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(120 12 12)" />
    </svg>
  )
}

function MenuItem({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-[13px]
        text-ink transition-colors hover:bg-[rgb(var(--ink)/0.05)]"
    >
      {children}
    </button>
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
    setView,
  } = useCircuitStore()
  const { runSimulation, isSimulating } = useSimulation()

  const [open, setOpen] = useState(null) // 'file' | 'templates' | 'view' | 'help' | null
  const fileRef = useRef(null)
  const navRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpen(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = (name) => setOpen((v) => (v === name ? null : name))
  const close = () => setOpen(null)

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
    close()
  }

  const MenuTrigger = ({ name, children }) => (
    <button className="menu-link" onClick={() => toggle(name)}>
      {children}
      <span className="text-[9px]">▾</span>
    </button>
  )

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-line bg-surface/95 px-6 py-3 backdrop-blur"
    >
      {/* Left: wordmark + menus */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-1">
          <span className="text-[color:rgb(var(--accent))]">
            <AtomIcon />
          </span>
          <span className="display-serif text-[22px] font-semibold text-ink">Qyantram</span>
        </div>

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <nav className="hidden items-center gap-1 sm:flex">
          {/* File */}
          <div className="relative">
            <MenuTrigger name="file">File</MenuTrigger>
            {open === 'file' && (
              <div className="absolute left-0 top-11 z-40 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
                <MenuItem onClick={() => { saveCircuit(); close() }}>
                  <span>Save Circuit</span><span className="text-faint">JSON</span>
                </MenuItem>
                <MenuItem onClick={() => fileRef.current?.click()}>
                  <span>Load Circuit</span><span className="text-faint">↥</span>
                </MenuItem>
              </div>
            )}
          </div>

          {/* Algorithm Templates — opens the full-page gallery */}
          <button
            className="menu-link"
            onClick={() => { setView('templates'); close() }}
          >
            Templates
          </button>

          {/* Data Encoding — opens the classical→quantum encoder page */}
          <button
            className="menu-link"
            onClick={() => { setView('encode'); close() }}
          >
            Encode
          </button>

          {/* View */}
          <div className="relative">
            <MenuTrigger name="view">View</MenuTrigger>
            {open === 'view' && (
              <div className="absolute left-0 top-11 z-40 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
                <MenuItem onClick={() => { toggleTheme(); close() }}>
                  <span>Toggle Theme</span>
                  <span className="text-faint">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </MenuItem>
                <MenuItem onClick={() => { toggleAIPanel(); close() }}>
                  <span>AI Assistant</span><span className="text-faint">✦</span>
                </MenuItem>
                <MenuItem onClick={() => { toggleBeginnerMode(); close() }}>
                  <span>Beginner Mode</span>
                  <span className={beginnerMode ? 'text-[color:rgb(var(--accent))]' : 'text-faint'}>
                    {beginnerMode ? 'On' : 'Off'}
                  </span>
                </MenuItem>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="relative">
            <MenuTrigger name="help">Help</MenuTrigger>
            {open === 'help' && (
              <div className="absolute left-0 top-11 z-40 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
                {HELP_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-[13px]
                      text-ink transition-colors hover:bg-[rgb(var(--ink)/0.05)]"
                  >
                    <span>{link.label}</span>
                    <span className="text-faint">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* About Us — opens the full-page about section */}
          <button
            className="menu-link"
            onClick={() => { setView('about'); close() }}
          >
            About Us
          </button>
        </nav>
      </div>

      {/* Right: theme toggle + Run */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface
            text-ink transition-colors hover:border-[rgb(var(--ink)/0.4)]"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button className="run-btn" onClick={runSimulation} disabled={isSimulating}>
          {isSimulating ? 'Running…' : 'Run'}
          <span className="text-[11px]">›</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept=".json" onChange={handleLoadFile} className="hidden" />
    </div>
  )
}

export default TopNav
