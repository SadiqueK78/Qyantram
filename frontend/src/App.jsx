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
import AIAssistantPanel from './components/AIAssistantPanel'
import WelcomePrompt from './components/WelcomePrompt'

function App() {
  const [showWelcome, setShowWelcome] = React.useState(false)

  React.useEffect(() => {
    const dismissed = window.localStorage.getItem('quantum-welcome-dismissed') === '1'
    setShowWelcome(!dismissed)
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

          <main className="mx-auto w-full max-w-[1240px] px-8 py-8">
            <Hero />

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
              {/* Left: editor + details/statevector */}
              <div className="space-y-6">
                <CircuitGrid />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <CircuitDetails />
                  <StatevectorPanel />
                </div>
              </div>

              {/* Right: bloch + measurement */}
              <div className="space-y-6">
                <BlochPanel />
                <MeasurementStats />
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
