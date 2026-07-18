import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useCircuitStore } from './store/useCircuitStore'
import TopNav from './components/TopNav'
import GatePalette from './components/GatePalette'
import CircuitGrid from './components/CircuitGrid'
import CircuitDetails from './components/CircuitDetails'
import StatevectorPanel from './components/StatevectorPanel'
import BlochPanel from './components/BlochPanel'
import MeasurementStats from './components/MeasurementStats'
import CodeViewPanel from './components/CodeViewPanel'
import AIAssistantPanel from './components/AIAssistantPanel'
import Footer from './components/Footer'
import TemplatesPage from './components/TemplatesPage'
import AboutPage from './components/AboutPage'
import WelcomePrompt from './components/WelcomePrompt'

function App() {
  const view = useCircuitStore((s) => s.view)
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
  }, [view])

  const dismissWelcome = (persist) => {
    if (persist) window.localStorage.setItem('quantum-welcome-dismissed', '1')
    setShowWelcome(false)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        <TopNav />

        {view === 'templates' ? (
          <TemplatesPage />
        ) : view === 'about' ? (
          <AboutPage />
        ) : (
          <main className="mx-auto w-full max-w-[1560px] flex-1 px-6 py-6 lg:px-8">
            <GatePalette />

            {/* Circuit editor + live code view, side by side. */}
            <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div ref={circuitRef}>
                <CircuitGrid />
              </div>
              <CodeViewPanel height={circuitHeight} />
            </div>

            {/* Bottom analytics — balanced 2×2 grid (distribution + Q-sphere
                on top, details + statevector below). Cards stretch to equal
                heights per row; the Probability and Statevector panels fill
                their partner's height (chart grows / list scrolls) so paired
                cards line up without blank space. */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <MeasurementStats />
              <BlochPanel />
              <CircuitDetails />
              <StatevectorPanel />
            </div>
          </main>
        )}

        <div className="mx-auto w-full max-w-[1560px] px-6 lg:px-8">
          <Footer />
        </div>
      </div>

      <AIAssistantPanel />
      {showWelcome && <WelcomePrompt onStart={dismissWelcome} />}
    </DndProvider>
  )
}

export default App