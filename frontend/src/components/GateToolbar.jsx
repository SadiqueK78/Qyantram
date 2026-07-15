import React, { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const IconBtn = ({ onClick, title, disabled, children }) => (
  <button
    onClick={(e) => {
      e.stopPropagation()
      if (!disabled) onClick?.(e)
    }}
    title={title}
    disabled={disabled}
    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
      disabled ? 'cursor-not-allowed text-faint opacity-30' : 'text-ink hover:bg-[rgb(var(--ink)/0.06)]'
    }`}
  >
    {children}
  </button>
)

const Divider = () => <span className="h-5 w-px bg-line" />

/**
 * Floating pill toolbar shown when a placed gate is clicked — edit (only if
 * the gate has something configurable), duplicate, delete, expand ("G" =
 * see the gate's internal arrangement / itself if it has none), and info.
 *
 * Rendered through a portal into document.body with position:fixed, anchored
 * to `anchorEl`'s real screen position. The circuit grid's horizontal
 * scroll container clips vertical overflow too (CSS forces overflow-y:auto
 * whenever overflow-x isn't visible), so an absolutely-positioned popover
 * nested inside it gets cut off — especially for gates on the top wire,
 * where the toolbar has nowhere to go but up. Escaping to a portal sidesteps
 * that entirely; flipping below the tile when there's no room above handles
 * the top-row case specifically.
 */
function GateToolbar({ anchorEl, editable, onEdit, onDuplicate, onDelete, onExpand, onInfo }) {
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!anchorEl) return undefined
    const MARGIN = 10
    const TOOLBAR_HEIGHT = 48

    const update = () => {
      const rect = anchorEl.getBoundingClientRect()
      const openAbove = rect.top - TOOLBAR_HEIGHT - MARGIN > 0
      setPos({
        left: rect.left + rect.width / 2,
        top: openAbove ? rect.top - MARGIN : rect.bottom + MARGIN,
        openAbove,
      })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorEl])

  if (!pos) return null

  return createPortal(
    <div
      data-gate-toolbar
      onClick={(e) => e.stopPropagation()}
      className={`fixed z-[90] flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-line bg-surface px-1 py-1 shadow-xl ${
        pos.openAbove ? '-translate-y-full' : ''
      }`}
      style={{ left: pos.left, top: pos.top }}
    >
      {editable && (
        <>
          <IconBtn onClick={onEdit} title="Edit gate">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </IconBtn>
          <Divider />
        </>
      )}

      <IconBtn onClick={onDuplicate} title="Duplicate gate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </IconBtn>

      <Divider />

      <IconBtn onClick={onDelete} title="Delete gate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </IconBtn>

      <Divider />

      <IconBtn onClick={onExpand} title="Expand gate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H6a3 3 0 0 0-3 3v2" />
          <path d="M16 3h2a3 3 0 0 1 3 3v2" />
          <path d="M21 16v2a3 3 0 0 1-3 3h-2" />
          <path d="M8 21H6a3 3 0 0 1-3-3v-2" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" fontFamily="inherit">
            G
          </text>
        </svg>
      </IconBtn>

      <Divider />

      <IconBtn onClick={onInfo} title="Gate info">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="11.5" />
          <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </IconBtn>
    </div>,
    document.body
  )
}

export default GateToolbar
