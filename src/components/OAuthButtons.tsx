import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Provider = 'apple' | 'google'

const PROVIDERS: { provider: Provider; label: string }[] = [
  { provider: 'apple', label: 'Продолжить через Apple ID' },
  { provider: 'google', label: 'Продолжить через Google' },
]

// For OAuth, sign-in and sign-up are the same call: Supabase creates the
// account on first use (the auth trigger then creates the users row).
export function OAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick(provider: Provider) {
    setError(null)
    setPending(provider)

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/profile`,
        skipBrowserRedirect: true,
      },
    })

    if (oauthError || !data.url) {
      console.error(oauthError)
      setError('Не удалось начать вход. Попробуйте ещё раз.')
      setPending(null)
      return
    }

    // A provider that is switched off in Supabase answers 400 with raw JSON;
    // check first so the visitor gets a readable message instead of that page.
    // Success is a redirect to the provider (an opaque response here).
    try {
      const probe = await fetch(data.url, { redirect: 'manual' })
      if (probe.status === 400) {
        setError('Вход через этот сервис пока недоступен. Войдите по email.')
        setPending(null)
        return
      }
    } catch (probeError) {
      console.error(probeError)
    }

    window.location.assign(data.url)
  }

  return (
    <div className="flex flex-col gap-3">
      {PROVIDERS.map(({ provider, label }) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleClick(provider)}
          disabled={pending !== null}
          className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent disabled:opacity-50"
        >
          {pending === provider ? 'Переходим...' : label}
        </button>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
