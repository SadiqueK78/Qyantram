import React from 'react'

// Bottom footer bar — legal / support links on the left, copyright on the
// right. Static shell to match the reference layout.
function Footer() {
  return (
    <footer className="mt-10 border-t border-line py-6">
      <div className="flex flex-col items-center justify-between gap-3 text-[13px] sm:flex-row">
        <div className="flex items-center gap-6">
          <a href="#" className="text-muted transition-colors hover:text-ink">
            Terms &amp; Privacy
          </a>
          <a href="#" className="text-muted transition-colors hover:text-ink">
            Support
          </a>
        </div>
        <div className="text-faint">© 2026 Qyantram Simulator</div>
      </div>
    </footer>
  )
}

export default Footer
