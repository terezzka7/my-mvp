import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { APP_NAME, APP_STORE_URL, PROTECTED_LINKS } from '../lib/constants'
import { supabase } from '../lib/supabase'

export function Header() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="font-display text-xl font-extrabold">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/70">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          {!loading && user
            ? PROTECTED_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-accent">
                  {link.label}
                </Link>
              ))
            : null}
          {!loading && !user ? (
            <>
              <Link to="/login" className="hover:text-accent">
                Войти
              </Link>
              <Link to="/signup" className="hover:text-accent">
                Регистрация
              </Link>
            </>
          ) : null}
        </nav>
        {!loading && user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold hover:border-accent"
          >
            Выйти
          </button>
        ) : (
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black"
          >
            Скачать
          </a>
        )}
      </div>
    </header>
  )
}
