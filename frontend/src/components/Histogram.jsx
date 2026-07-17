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
    <div className="flex h-full min-h-[200px] flex-col">
      {/* chart region (y-axis + plot) grows to fill available height */}
      <div className="flex min-h-0 flex-1 gap-2">
        {/* y-axis */}
        <div className="flex w-8 flex-col justify-between py-1 text-right text-[10px] text-faint">
          {yTicks.map((t) => (
            <span key={t}>{isProb ? t.toFixed(2) : Math.round(t)}</span>
          ))}
        </div>

        {/* plot */}
        <div className="relative flex min-w-0 flex-1 items-end justify-around gap-3 border-l border-b border-line px-2">
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
            const labelText = isProb ? `${(e.value * 100).toFixed(1)}%` : e.value
            const labelInside = h > 88 // near-full bars carry their label inside the bar top
            return (
              <div key={e.label} className="relative z-10 flex h-full flex-1 items-end justify-center">
                {/* Bar height is an exact % of the plot area, so its top lines
                    up with the y-axis ticks/gridlines; the value label is
                    overlaid (absolute) so it never squeezes the bar. */}
                <div
                  className="relative w-full max-w-[40px] rounded-t-md transition-[height] duration-300"
                  style={{
                    height: `${h}%`,
                    background: 'linear-gradient(180deg, rgb(var(--accent)) 0%, rgb(var(--accent)/0.7) 100%)',
                  }}
                  title={`${e.label}: ${isProb ? (e.value * 100).toFixed(2) + '%' : e.value}`}
                >
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] ${
                      labelInside ? 'top-1 text-white' : 'text-muted'
                    }`}
                    style={labelInside ? undefined : { top: -16 }}
                  >
                    {labelText}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* x labels — offset to sit under the plot (past the y-axis column) */}
      <div className="flex gap-2 pt-1.5">
        <div className="w-8 shrink-0" />
        <div className="flex flex-1 justify-around gap-3 px-2">
          {entries.map((e) => (
            <span key={e.label} className="flex-1 truncate text-center font-mono text-[10px] text-faint">
              {e.label}
            </span>
          ))}
        </div>
      </div>
      <div className="pl-10 text-center text-[11px] text-faint">Computational basis states</div>
    </div>
  )
}

export default Histogram
