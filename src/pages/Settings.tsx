import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

export function Settings() {
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        setError('Войдите, чтобы изменить настройки.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить настройки. Попробуйте обновить страницу.')
        setLoading(false)
        return
      }

      setUserId(user.id)
      setDisplayName(data?.display_name ?? '')
      setEmail(data?.email ?? '')
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!userId) return

    setSaving(true)
    setSaveMessage(null)

    const { error: updateError } = await supabase
      .from('users')
      .update({ display_name: displayName, email })
      .eq('id', userId)

    if (updateError) {
      console.error(updateError)
      setSaveMessage('Не удалось сохранить изменения. Попробуйте ещё раз.')
      setSaving(false)
      return
    }

    if (password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) {
        console.error(passwordError)
        setSaveMessage('Профиль сохранён, но пароль обновить не удалось.')
        setSaving(false)
        return
      }
    }

    setPassword('')
    setSaveMessage('Изменения сохранены.')
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Настройки</h1>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        {!loading && !error && (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-sm text-white/70">
              Имя
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-white/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-white/70">
              Новый пароль
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {saveMessage && <p className="text-sm text-white/70">{saveMessage}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
