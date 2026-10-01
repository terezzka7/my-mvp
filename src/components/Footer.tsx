import { APP_NAME } from '../lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <span className="font-display text-lg font-extrabold">{APP_NAME}</span>
        <span className="text-sm text-white/40">© 2026 {APP_NAME}</span>
      </div>
    </footer>
  )
}
