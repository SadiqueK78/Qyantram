import React from 'react'

function Hero() {
  return (
    <section className="grid grid-cols-1 gap-6 border-b border-line pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <h2 className="display-serif text-5xl font-semibold leading-[0.98] text-ink md:text-[64px]">
        Visualizing Quantum
        <br />
        Computations
      </h2>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Build quantum circuits, run simulations, and explore the state space. See your results come to
        life on the Bloch sphere and in measurement statistics.
      </p>
    </section>
  )
}

export default Hero
