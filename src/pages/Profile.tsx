import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

interface ProfileData {
  displayName: string | null
  level: number
  currentStreak: number
  activeChallenges: string[]
}

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      const [{ data: me, error: meError }, { data: character, error: characterError },
        { data: streak, error: streakError }, { data: activeChallenges, error: challengesError }] =
        await Promise.all([
          supabase.from('users').select('display_name').eq('id', user.id).maybeSingle(),
          supabase.from('characters').select('level').eq('user_id', user.id).maybeSingle(),
          supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
          supabase
            .from('user_challenges')
            .select('challenges(title)')
            .eq('user_id', user.id)
            .eq('status', 'active'),
        ])

      if (!active) return

      const firstError = meError ?? characterError ?? streakError ?? challengesError
      if (firstError) {
        console.error(firstError)
        setError('Не удалось загрузить профиль. Попробуйте обновить страницу.')
        setLoading(false)
        return
      }

      setProfile({
        displayName: me?.display_name ?? null,
        level: character?.level ?? 1,
        currentStreak: streak?.current_streak ?? 0,
        activeChallenges: (activeChallenges ?? []).flatMap((row) => {
          const challenge = row.challenges as unknown as { title: string } | null
          return challenge ? [challenge.title] : []
        }),
      })
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        {loading && <p className="text-white/40">Загрузка...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && profile && (
          <>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full border border-white/10 bg-white/5" />
              <div>
                <h1 className="font-display text-2xl font-extrabold">
                  {profile.displayName ?? 'Игрок'}
                </h1>
                <p className="text-white/50">
                  Уровень {profile.level} · Стрик {profile.currentStreak} дней
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-bold">Активные челленджи</h2>
              {profile.activeChallenges.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">Нет активных челленджей</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  {profile.activeChallenges.map((challenge) => (
                    <li key={challenge} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      {challenge}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/profile/stats"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent"
              >
                Статистика
              </Link>
              <Link
                to="/profile/history"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent"
              >
                История тренировок
              </Link>
              <Link
                to="/settings"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-accent"
              >
                Настройки
              </Link>
            </div>

            <a
              href="#"
              className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-black"
            >
              Открыть в приложении
            </a>
          </>
        )}
      </div>
    </div>
  )
}
