import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import Hero from './components/Hero'
import CircuitGrid from './components/CircuitGrid'
import CircuitDetails from './components/CircuitDetails'
import StatevectorPanel from './components/StatevectorPanel'
import BlochPanel from './components/BlochPanel'
import MeasurementStats from './components/MeasurementStats'
import CodeViewPanel from './components/CodeViewPanel'
import AIAssistantPanel from './components/AIAssistantPanel'
import WelcomePrompt from './components/WelcomePrompt'

function App() {
  const [showWelcome, setShowWelcome] = React.useState(false)
  const circuitRef = React.useRef(null)
  const [circuitHeight, setCircuitHeight] = React.useState(null)

  React.useEffect(() => {
    const dismissed = window.localStorage.getItem('quantum-welcome-dismissed') === '1'
    setShowWelcome(!dismissed)
  }, [])

  // Grid stretch is symmetric — it makes both columns match whichever is
  // TALLER, so a long code listing would pull Circuit Editor's card taller
  // too (leaving empty space in it). We only want it to go the other way:
  // Code View should match Circuit Editor's own natural height and scroll
  // its code internally. So Circuit Editor keeps its natural (auto) height,
  // and we measure it here to hand down as an explicit height for Code View.
  React.useEffect(() => {
    const el = circuitRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height
      if (h) setCircuitHeight(h)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dismissWelcome = (persist) => {
    if (persist) window.localStorage.setItem('quantum-welcome-dismissed', '1')
    setShowWelcome(false)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen bg-paper text-ink">
        {/* Left rail */}
        <div className="sticky top-0 hidden h-screen w-[220px] shrink-0 lg:block">
          <Sidebar />
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />

          <main className="mx-auto w-full max-w-[1560px] px-8 py-8">
            <Hero />

            {/* Top: circuit editor + live code view, side by side.
                items-start keeps Circuit Editor at its own natural height —
                Code View is handed that exact height as a prop (measured via
                ResizeObserver above) and fills it, scrolling its code
                internally rather than growing the card. */}
            <div className="mt-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div ref={circuitRef}>
                <CircuitGrid />
              </div>
              <CodeViewPanel height={circuitHeight} />
            </div>

            {/* Below: matching the reference's 3-column rhythm — chart,
                state-visualization, and a third column — since we have four
                panels instead of their three (no Jobs panel here, and they
                don't have a separate amplitudes list), Circuit Details and
                Statevector are stacked together into that third slot.
                items-start again, so e.g. Statevector's amplitude list
                growing with more qubits doesn't stretch Q-Sphere or
                Measurement Stats taller than their own content needs. */}
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <MeasurementStats />
              <BlochPanel />
              <div className="space-y-6">
                <CircuitDetails />
                <StatevectorPanel />
              </div>
            </div>
          </main>
        </div>
      </div>

      <AIAssistantPanel />
      {showWelcome && <WelcomePrompt onStart={dismissWelcome} />}
    </DndProvider>
  )
}

export default App