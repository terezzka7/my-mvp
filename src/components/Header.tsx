import { APP_NAME } from '../lib/constants'

export function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="font-display text-xl tracking-wide">{APP_NAME}</span>
        <nav className="flex gap-6 text-sm text-white/70">
          <a href="/" className="hover:text-accent">
            Каталог
          </a>
          <a href="/login" className="hover:text-accent">
            Войти
          </a>
        </nav>
      </div>
    </header>
  )
}
