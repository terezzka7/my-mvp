import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'
import type { WorkoutLogsRow } from '../lib/database.types'

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const [workout, setWorkout] = useState<WorkoutLogsRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!id) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить тренировку. Попробуйте обновить страницу.')
      } else {
        setWorkout(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/profile/history" className="text-sm text-white/50 hover:text-accent">
          ← К истории
        </Link>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {!loading && !error && workout && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/50">{new Date(workout.logged_at).toLocaleDateString()}</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold capitalize">{workout.type}</h1>
            <p className="mt-4 text-accent">+{workout.xp_earned} XP</p>
          </div>
        )}
        {!loading && !error && !workout && (
          <p className="mt-6 text-white/50">Тренировка не найдена</p>
        )}
      </div>
    </div>
  )
}
