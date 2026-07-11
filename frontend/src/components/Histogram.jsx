import React from 'react'

/**
 * Vertical measurement-outcome histogram. `mode` is 'probability' | 'counts'.
 * Rendered with plain elements so it inherits the theme tokens directly.
 */
function Histogram({ result, mode = 'probability' }) {
  const source =
    mode === 'counts'
      ? result?.counts
      : result?.probabilities || result?.sampled_probabilities

  if (!source || Object.keys(source).length === 0) {
    return <div className="py-8 text-center text-[13px] text-muted">No measurement data</div>
  }

  const entries = Object.entries(source)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 8)

  const isProb = mode !== 'counts'
  const max = isProb ? 1 : Math.max(...entries.map((e) => e.value), 1)
  const yTicks = isProb ? [1, 0.75, 0.5, 0.25, 0] : [max, max * 0.75, max * 0.5, max * 0.25, 0]

  return (
    <div className="flex gap-2">
      {/* y-axis */}
      <div className="flex w-8 flex-col justify-between py-1 text-right text-[10px] text-faint" style={{ height: 190 }}>
        {yTicks.map((t) => (
          <span key={t}>{isProb ? t.toFixed(2) : Math.round(t)}</span>
        ))}
      </div>

      {/* plot */}
      <div className="min-w-0 flex-1">
        <div className="relative flex items-end justify-around gap-2 border-l border-b border-line" style={{ height: 190 }}>
          {/* gridlines */}
          {yTicks.slice(0, -1).map((t, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 border-t border-line opacity-40"
              style={{ top: `${(i / (yTicks.length - 1)) * 100}%` }}
            />
          ))}

          {entries.map((e) => {
            const h = Math.max(1, (e.value / max) * 100)
            return (
              <div key={e.label} className="relative flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-1 font-mono text-[10px] text-muted">
                  {isProb ? `${(e.value * 100).toFixed(1)}%` : e.value}
                </span>
                <div
                  className="w-full max-w-[34px] rounded-t"
                  style={{ height: `${h}%`, background: 'rgb(var(--accent))' }}
                  title={`${e.label}: ${isProb ? (e.value * 100).toFixed(2) + '%' : e.value}`}
                />
              </div>
            )
          })}
        </div>

        {/* x labels */}
        <div className="flex justify-around gap-2 pt-1.5">
          {entries.map((e) => (
            <span key={e.label} className="flex-1 truncate text-center font-mono text-[10px] text-faint">
              {e.label}
            </span>
          ))}
        </div>
        <div className="mt-1 text-center text-[11px] text-faint">Outcome</div>
      </div>
    </div>
  )
}

export default Histogram
