import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/events', label: 'Jelajah' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function Navbar() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 md:px-10">
        <NavLink to="/" className="font-display text-2xl uppercase tracking-tight text-cream">
          Weekly<span className="text-lime">Hub</span>
        </NavLink>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {({ isActive }) => (
                <span
                  className={`link-sweep text-sm transition-colors ${
                    isActive ? 'text-lime' : 'text-cream/70 hover:text-cream'
                  }`}
                >
                  {l.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile?.isAdmin && (
            <NavLink
              to="/admin"
              className="hidden text-sm text-cream/70 transition-colors hover:text-lime sm:inline-block"
            >
              Admin
            </NavLink>
          )}

          {session && profile ? (
            <>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-9 w-9 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-navy text-xs text-cream">
                  {initials(profile.name)}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="hidden text-sm text-cream/70 transition-colors hover:text-lime sm:inline-block"
              >
                Keluar
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="bg-lime px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-limedim"
            >
              Masuk
            </NavLink>
          )}
        </div>
      </div>

      {/* Navigasi bawah untuk layar kecil. Diletakkan di bawah header supaya
          ibu jari mudah menjangkaunya tanpa menutupi isi halaman. */}
      <nav className="flex border-t border-line md:hidden">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs ${isActive ? 'text-lime' : 'text-cream/60'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}