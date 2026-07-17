import React, { useEffect, useRef, useState } from 'react'

// Shared dropdown-style panel header used across the bottom analytics row:
// an accent title that reads like a select ("Probability Distribution ▾"),
// an optional info popover, and an optional kebab menu. Purely presentational —
// `options` (if given) just swap which title is shown via `onSelect`.
function InfoIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="11.5" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function KebabIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function CardHeader({ title, options, onSelect, info, menu }) {
  const [titleOpen, setTitleOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setTitleOpen(false)
        setInfoOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const hasTitleMenu = Array.isArray(options) && options.length > 0

  return (
    <div ref={rootRef} className="card-head">
      <div className="relative">
        <button
          className="card-head-title"
          onClick={() => hasTitleMenu && setTitleOpen((v) => !v)}
          style={{ cursor: hasTitleMenu ? 'pointer' : 'default' }}
        >
          {title}
          {hasTitleMenu && <span className="text-[10px]">▾</span>}
        </button>
        {titleOpen && hasTitleMenu && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onSelect?.(opt)
                  setTitleOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-1">
        {info && (
          <button className="card-head-icon" title="About this panel" onClick={() => setInfoOpen((v) => !v)}>
            <InfoIcon />
          </button>
        )}
        {menu && (
          <button className="card-head-icon" title="More" onClick={() => setMenuOpen((v) => !v)}>
            <KebabIcon />
          </button>
        )}

        {infoOpen && info && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-[12px] leading-relaxed text-muted shadow-xl">
            {info}
          </div>
        )}
        {menuOpen && menu && (
          <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl">
            {menu.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick?.()
                  setMenuOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-[rgb(var(--ink)/0.05)]"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CardHeader
