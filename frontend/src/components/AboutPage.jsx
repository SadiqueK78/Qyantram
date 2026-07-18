import React from 'react'
import { useCircuitStore } from '../store/useCircuitStore'

const TEAM = [
  {
    name: 'Sharyu Kekane',
    role: 'Team Lead & UI/UX Design',
    description:
      'Led the project and designed the visual circuit builder, focusing on making an inherently complex subject feel intuitive and interactive.',
    linkedin: 'https://www.linkedin.com/in/sharyu-kekane',
  },
  {
    name: 'Sadique Khatib',
    role: 'Full-Stack Development',
    description:
      'Developed the quantum simulation engine and connected the circuit logic to the frontend interface.',
    linkedin: 'https://www.linkedin.com/in/sadique-khatib-4175342a9',
  },
  {
    name: 'Abhushan Bokade',
    role: 'Backend Development & AI Integration',
    description:
      'Built the backend infrastructure and integrated the AI-powered learning features that guide users through gate behavior and results.',
    linkedin: 'https://www.linkedin.com/in/abhushan-bokade-4b5a69304',
  },
]

const GUIDES = [
  {
    name: 'Dr. Uday Wad',
    role: 'Project Guide',
    linkedin: 'https://www.linkedin.com/in/uday-wad-8740b41a1',
  },
  {
    name: 'Dr. S. M. Kamalapur',
    role: 'Co-Guide',
    linkedin: 'https://www.linkedin.com/in/snehal-kamalapur-11304917',
  },
  {
    name: 'Dr. Y. D. Bhise',
    role: 'Co-Guide',
    linkedin: 'https://www.linkedin.com/in/dr-yogita-pagar-bhise-198428224',
  },
]

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

// Full-page About Us — project overview, team, and faculty guides.
function AboutPage() {
  const { setView } = useCircuitStore()

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="display-serif text-3xl font-semibold text-ink">About Us</h2>
          <p className="mt-1 text-[14px] text-muted">
            The story and the people behind Qyantram.
          </p>
        </div>
        <button onClick={() => setView('editor')} className="btn-ghost">
          ← Back to Editor
        </button>
      </div>

      {/* Project overview */}
      <div className="panel p-6">
        <p className="text-[15px] leading-relaxed text-ink">
          Qyantram is a quantum logic gate simulator built to make quantum computing concepts
          easier to learn and visualize. It combines an interactive circuit builder, real-time
          gate simulation, and AI-assisted explanations, so students can experiment with qubits
          and gates without needing a physics or quantum math background first.
        </p>
      </div>

      {/* Team */}
      <h3 className="display-serif mt-8 text-2xl font-semibold text-ink">Team</h3>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((member) => (
          <div key={member.name} className="panel flex flex-col p-5">
            <h4 className="text-[16px] font-semibold text-ink">{member.name}</h4>
            <p className="mt-0.5 text-[13px] font-medium text-[color:rgb(var(--accent))]">
              {member.role}
            </p>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
              {member.description}
            </p>
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[13px] text-ink transition-colors hover:text-[color:rgb(var(--accent))]"
            >
              <LinkedInIcon />
              <span>LinkedIn</span>
              <span className="text-faint">↗</span>
            </a>
          </div>
        ))}
      </div>

      {/* Project Guides */}
      <h3 className="display-serif mt-8 text-2xl font-semibold text-ink">Project Guides</h3>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <div key={guide.name} className="panel flex flex-col p-5">
            <h4 className="text-[16px] font-semibold text-ink">{guide.name}</h4>
            <p className="mt-0.5 flex-1 text-[13px] font-medium text-[color:rgb(var(--accent))]">
              {guide.role}
            </p>
            <a
              href={guide.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[13px] text-ink transition-colors hover:text-[color:rgb(var(--accent))]"
            >
              <LinkedInIcon />
              <span>LinkedIn</span>
              <span className="text-faint">↗</span>
            </a>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-muted">
        Developed under the guidance of the above faculty at KKWagh Institute of Engineering
        Education and Research, Nashik.
      </p>
    </main>
  )
}

export default AboutPage
