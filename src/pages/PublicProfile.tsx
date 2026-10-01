import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

interface ProfileData {
  displayName: string | null
  level: number
  achievements: string[]
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!username) return

      // Публичный профиль читает view public_profiles (см. supabase/rls.sql) —
      // таблицы users/characters сами по себе приватны после включения RLS.
      const { data: profileRow, error: profileError } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, level')
        .eq('username', username)
        .maybeSingle()

      if (!active) return

      if (profileError) {
        console.error(profileError)
        setError('Не удалось загрузить профиль. Попробуйте обновить страницу.')
        setLoading(false)
        return
      }

      if (!profileRow) {
        setError('Профиль не найден.')
        setLoading(false)
        return
      }

      // §10: у user_challenges нет публичной SELECT-политики (только
      // auth.uid() = user_id) — для чужого профиля этот запрос вернёт
      // пусто под RLS, для своего собственного покажет реальные достижения.
      const { data: completedChallenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('completed_at, challenges(title)')
        .eq('user_id', profileRow.user_id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(3)

      if (!active) return

      if (challengesError) {
        console.error(challengesError)
      }

      setProfile({
        displayName: profileRow.display_name,
        level: profileRow.level,
        achievements: (completedChallenges ?? []).flatMap((row) => {
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
  }, [username])

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        {loading && <p className="text-white/40">Загрузка...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && profile && (
          <>
            <Avatar className="mx-auto h-40 w-40" />
            <h1 className="mt-6 font-display text-3xl font-extrabold">
              {profile.displayName ?? username}
            </h1>
            <p className="mt-1 text-white/50">Уровень {profile.level}</p>
            {profile.achievements.length > 0 && (
              <ul className="mt-6 flex flex-col gap-2 text-sm text-white/70">
                {profile.achievements.map((achievement) => (
                  <li key={achievement}>{achievement}</li>
                ))}
              </ul>
            )}
            <a
              href="#"
              className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-black"
            >
              Создай своего
            </a>
          </>
        )}
      </div>
    </div>
  )
}
