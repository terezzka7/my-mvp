import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Заполните email и пароль.')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (signInError) {
      console.error(signInError)
      setError('Не удалось войти. Проверьте email и пароль.')
      return
    }

    navigate('/profile')
  }

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-center font-display text-3xl font-extrabold">Войти</h1>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {submitting ? 'Вход...' : 'Войти'}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled
            title="Упрощение этого шага: OAuth пока не подключён, только email+пароль"
            className="cursor-not-allowed rounded-full border border-white/20 px-6 py-3 font-semibold text-white/30"
          >
            Войти через Apple ID
          </button>
          <button
            type="button"
            disabled
            title="Упрощение этого шага: OAuth пока не подключён, только email+пароль"
            className="cursor-not-allowed rounded-full border border-white/20 px-6 py-3 font-semibold text-white/30"
          >
            Войти через Google
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-white/30">
          Apple ID / Google из §11.3 — намеренное упрощение, пока не подключены
        </p>

        <p className="mt-8 text-center text-sm text-white/50">
          Нет аккаунта?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
