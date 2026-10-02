import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Beaker, BriefcaseBusiness, Compass, Crosshair, LayoutDashboard, ListChecks, Target, UserRound } from 'lucide-react'
import { useApp } from '../store'
import ErrorBoundary from './ErrorBoundary'
import { cx } from './ui'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/fit', label: 'Career Fit', icon: Compass },
  { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/job-strategy', label: 'Job Strategy', icon: Crosshair },
  { to: '/applications', label: 'Applications', icon: ListChecks },
  { to: '/skills', label: 'Skills', icon: Target },
  { to: '/experiments', label: 'Experiments', icon: Beaker },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

const Logo = () => <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-[12px] font-bold text-white shadow-sm">P</div>

export default function Layout() {
  const { profile, modified, resetDemo, apiStatus } = useApp()
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200/80 bg-white px-3 py-4 lg:sticky lg:top-0 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Pathwise</div>
            <div className="text-[10px] text-zinc-400">Job search, as data</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx('group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors', isActive ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900')
              }
            >
              {({ isActive }) => (<><Icon size={15} strokeWidth={isActive ? 2.2 : 1.75} className={isActive ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600'} />{label}</>)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-snug text-amber-800">
          <div className="font-semibold">Demo data</div>
          Fictional persona and companies. Nothing here is real user or market data.
          {modified && <button onClick={resetDemo} className="mt-2 block cursor-pointer font-medium underline">Reset to seed</button>}
        </div>
        {apiStatus !== 'off' && (
          <div className="mt-3 flex items-center gap-2 px-2 text-[11px] text-zinc-500">
            <span className={cx('h-1.5 w-1.5 rounded-full', apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-rose-500' : 'animate-pulse bg-zinc-300')} />
            {apiStatus === 'online' ? 'Changes saved to backend' : apiStatus === 'offline' ? 'Backend offline — changes won’t persist' : 'Connecting to backend…'}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 px-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">{profile.name.split(' ').map((s) => s[0]).join('')}</div>
          <div className="min-w-0 text-xs">
            <div className="truncate font-medium text-zinc-900">{profile.name}</div>
            <div className="truncate text-zinc-500">Class of {profile.gradYear}</div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-4 pt-3">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Pathwise</span>
          <span className="ml-auto rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Demo data</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2" aria-label="Primary">
          {nav.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cx('shrink-0 rounded-md px-2.5 py-1 text-xs font-medium', isActive ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-500')}>{label}</NavLink>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1180px]">
          {/* key = pathname: a fresh fade-in per page, and the boundary resets when you navigate away from a crash */}
          <ErrorBoundary key={pathname}><div className="anim-page"><Outlet /></div></ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
