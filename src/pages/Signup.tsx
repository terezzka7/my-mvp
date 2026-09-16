import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

export function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setCheckEmailMessage(null)

    if (!email || !password || !confirmPassword) {
      setError('Заполните все поля.')
      return
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов.')
      return
    }

    setSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (signUpError) {
      console.error(signUpError)
      setError('Не удалось зарегистрироваться. Попробуйте ещё раз.')
      return
    }

    if (data.session) {
      navigate('/profile')
      return
    }

    setCheckEmailMessage('Проверьте почту и подтвердите регистрацию, затем войдите.')
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-sm px-6 py-20">
        <h1 className="text-center font-display text-3xl font-extrabold">Регистрация</h1>

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
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Повторите пароль"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {checkEmailMessage && <p className="text-sm text-accent">{checkEmailMessage}</p>}
        </form>

        <p className="mt-8 text-center text-sm text-white/50">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
