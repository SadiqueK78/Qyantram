import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import CircuitGrid from './components/CircuitGrid'
import GatePalette from './components/GatePalette'
import ControlPanel from './components/ControlPanel'
import VisualizationPanel from './components/VisualizationPanel'
import WelcomePrompt from './components/WelcomePrompt'

function App() {
  const [showWelcomePrompt, setShowWelcomePrompt] = React.useState(false)

  React.useEffect(() => {
    const dismissed = window.localStorage.getItem('quantum-welcome-dismissed') === '1'
    setShowWelcomePrompt(!dismissed)
  }, [])

  const handleDismissWelcome = (persistDismiss) => {
    if (persistDismiss) {
      window.localStorage.setItem('quantum-welcome-dismissed', '1')
    }
    setShowWelcomePrompt(false)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4 md:p-6">
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-[8%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-[5%] h-[24rem] w-[24rem] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-cyan-500/5 to-transparent" />
        </div>

        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/45 p-5 backdrop-blur-xl md:mb-8 md:p-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(0,217,255,0.35)]" />
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                    <span className="gradient-text">Quantum Logic Gate Simulator</span>
                  </h1>
                  <p className="text-sm text-slate-300 md:text-lg">
                    Build, animate, and analyze quantum states with an interactive composer.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-cyan-200">Live Simulation</span>
                <span className="rounded-full border border-indigo-300/40 bg-indigo-400/10 px-3 py-1 text-indigo-200">Drag and Drop Builder</span>
              </div>
            </div>
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Left sidebar - Gate palette */}
            <div className="xl:col-span-3">
              <GatePalette />
            </div>

            {/* Center - Circuit grid and controls */}
            <div className="space-y-6 xl:col-span-6">
              <CircuitGrid />
              <ControlPanel />
            </div>

            {/* Right sidebar - Visualization */}
            <div className="xl:col-span-3">
              <VisualizationPanel />
            </div>
          </div>
        </div>
      </div>

      {showWelcomePrompt && <WelcomePrompt onStart={handleDismissWelcome} />}
    </DndProvider>
  )
}

export default App
