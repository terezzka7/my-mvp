import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

const WORKOUTS = [
  { id: '1', date: '2026-09-10', type: 'strength', xp: 40 },
  { id: '2', date: '2026-09-08', type: 'cardio', xp: 25 },
  { id: '3', date: '2026-09-05', type: 'flexibility', xp: 15 },
]

export function History() {
  const [query, setQuery] = useState('')
  const filtered = WORKOUTS.filter((workout) => workout.type.includes(query.toLowerCase()))

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">История тренировок</h1>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Фильтр по типу..."
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 placeholder:text-white/40 focus:border-accent focus:outline-none"
        />
        <ul className="mt-6 flex flex-col gap-2">
          {filtered.map((workout) => (
            <li key={workout.id}>
              <Link
                to={`/profile/history/${workout.id}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-accent"
              >
                <span>
                  {workout.date} · {workout.type}
                </span>
                <span className="text-accent">+{workout.xp} XP</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
