import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'
import { TYPE_LABELS } from '../lib/stats'
import type { WorkoutLogsRow } from '../lib/database.types'

export function History() {
  const [workouts, setWorkouts] = useState<WorkoutLogsRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить историю тренировок. Попробуйте обновить страницу.')
      } else {
        setWorkouts(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // The search matches what is shown: the Russian name of the type.
  const filtered = (workouts ?? []).filter((workout) =>
    TYPE_LABELS[workout.type].toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">История тренировок</h1>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Фильтр по типу..."
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
            {filtered.length === 0 ? (
              <p className="mt-6 text-white/40">Тренировок пока нет</p>
            ) : (
              <ul className="mt-6 flex flex-col gap-2">
                {filtered.map((workout) => (
                  <li key={workout.id}>
                    <Link
                      to={`/profile/history/${workout.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-accent"
                    >
                      <span>
                        {new Date(workout.logged_at).toLocaleDateString()} · {TYPE_LABELS[workout.type]}
                      </span>
                      <span className="text-accent">+{workout.xp_earned} XP</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
