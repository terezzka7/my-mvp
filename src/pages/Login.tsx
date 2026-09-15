import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

export function Login() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-center font-display text-3xl font-extrabold">Войти</h1>

        <form className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 font-semibold text-black"
          >
            Войти
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent">
            Войти через Apple ID
          </button>
          <button className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent">
            Войти через Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          Демо-форма — авторизация подключается на Слое 2.{' '}
          <Link to="/profile" className="text-accent hover:underline">
            Открыть личный профиль
          </Link>
        </p>
      </div>
    </div>
  )
}
