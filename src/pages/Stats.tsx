import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'
import type { WorkoutLogsRow } from '../lib/database.types'

const FILTERS = ['Неделя', 'Месяц'] as const

function bucketKey(dateStr: string, granularity: (typeof FILTERS)[number]): string {
  const date = new Date(dateStr)
  if (granularity === 'Месяц') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const week = Math.ceil(((date.getTime() - firstDayOfYear.getTime()) / 86400000 + firstDayOfYear.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${week}`
}

export function Stats() {
  const [workouts, setWorkouts] = useState<WorkoutLogsRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Неделя')

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
        .order('logged_at', { ascending: true })

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить статистику. Попробуйте обновить страницу.')
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

  const buckets = useMemo(() => {
    const totals = new Map<string, number>()
    for (const workout of workouts ?? []) {
      const key = bucketKey(workout.logged_at, filter)
      totals.set(key, (totals.get(key) ?? 0) + workout.xp_earned)
    }
    return Array.from(totals.entries()).map(([label, xp]) => ({ label, xp }))
  }, [workouts, filter])

  const maxXp = Math.max(1, ...buckets.map((bucket) => bucket.xp))

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Статистика</h1>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-4 flex gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    filter === option ? 'bg-accent text-black' : 'border border-white/20 text-white/70'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {buckets.length === 0 ? (
              <p className="mt-8 text-white/40">Пока нет тренировок для графика</p>
            ) : (
              <div className="mt-8 flex h-48 items-end gap-4">
                {buckets.map((bucket) => (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-accent"
                      style={{ height: `${(bucket.xp / maxXp) * 100}%` }}
                    />
                    <span className="text-xs text-white/50">{bucket.label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
