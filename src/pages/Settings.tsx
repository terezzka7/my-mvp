import { Header } from '../components/Header'

export function Settings() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Настройки</h1>
        <form className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-white/70">
            Имя
            <input
              type="text"
              defaultValue="Игрок"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-white/70">
            Email
            <input
              type="email"
              defaultValue="player@example.com"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-white/70">
            Новый пароль
            <input
              type="password"
              placeholder="••••••••"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-accent px-6 py-3 font-semibold text-black"
          >
            Сохранить
          </button>
        </form>
      </div>
    </div>
  )
}
