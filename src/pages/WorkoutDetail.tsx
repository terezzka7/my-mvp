import { Link, useParams } from 'react-router-dom'
import { Header } from '../components/Header'

const WORKOUTS: Record<string, { date: string; type: string; xp: number }> = {
  '1': { date: '2026-09-10', type: 'strength', xp: 40 },
  '2': { date: '2026-09-08', type: 'cardio', xp: 25 },
  '3': { date: '2026-09-05', type: 'flexibility', xp: 15 },
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const workout = id ? WORKOUTS[id] : undefined

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/profile/history" className="text-sm text-white/50 hover:text-accent">
          ← К истории
        </Link>
        {workout ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/50">{workout.date}</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold capitalize">{workout.type}</h1>
            <p className="mt-4 text-accent">+{workout.xp} XP</p>
          </div>
        ) : (
          <p className="mt-6 text-white/50">Тренировка не найдена</p>
        )}
      </div>
    </div>
  )
}
