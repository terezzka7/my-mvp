import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { APP_NAME, APP_STORE_URL, PROTECTED_LINKS } from '../lib/constants'

const GUEST_LINKS = [
  { label: 'Войти', to: '/login' },
  { label: 'Регистрация', to: '/signup' },
]

export function Footer() {
  const { user, loading } = useAuth()
  const navLinks = [
    { label: 'Главная', to: '/' },
    ...(loading ? [] : user ? PROTECTED_LINKS : GUEST_LINKS),
  ]

  return (
    <footer className="border-t border-white/10 px-6 pb-8 pt-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-3">
        <div>
          <span className="font-display text-xl font-extrabold">{APP_NAME}</span>
          <p className="mt-3 max-w-xs text-sm text-white/50">
            RPG-трекер тренировок с персонажем-конструктором.
          </p>
        </div>

        <nav>
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Навигация
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Приложение
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-white/70 hover:text-accent"
          >
            Скачать в App Store
          </a>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-sm text-white/40">
        © 2026 {APP_NAME}
      </p>
    </footer>
  )
}
