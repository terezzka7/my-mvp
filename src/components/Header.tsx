import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants'

const NAV_LINKS = [
  { label: 'Главная', to: '/' },
  { label: 'Профиль', to: '/profile' },
  { label: 'История', to: '/profile/history' },
  { label: 'Статистика', to: '/profile/stats' },
  { label: 'Настройки', to: '/settings' },
  { label: 'Войти', to: '/login' },
]

export function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="font-display text-xl font-extrabold">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/70">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href="#"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black"
        >
          Скачать
        </a>
      </div>
    </header>
  )
}
