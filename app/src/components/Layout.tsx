import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Practice', end: true },
  { to: '/exam', label: 'Exam', end: false },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(243,239,230,0.92)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <NavLink to="/" className="group no-underline text-[var(--ink)]">
            <div className="brand text-2xl font-bold leading-none">
              AIF<span className="text-[var(--amber)]">Drill</span>
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mt-1 group-hover:text-[var(--ink)] transition-colors">
              AWS AI Practitioner · AIF-C01
            </div>
          </NavLink>
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--ink)] text-[var(--paper)] font-medium'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-black/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-16">{children}</main>
    </div>
  )
}
