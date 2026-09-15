import { useState } from 'react'
import { Header } from '../components/Header'

const WEEKLY_XP = [
  { week: 'Нед 1', xp: 120 },
  { week: 'Нед 2', xp: 340 },
  { week: 'Нед 3', xp: 210 },
  { week: 'Нед 4', xp: 480 },
]

const FILTERS = ['Неделя', 'Месяц'] as const

export function Stats() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Неделя')
  const maxXp = Math.max(...WEEKLY_XP.map((entry) => entry.xp))

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Статистика</h1>

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

        <div className="mt-8 flex h-48 items-end gap-4">
          {WEEKLY_XP.map((entry) => (
            <div key={entry.week} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-accent"
                style={{ height: `${(entry.xp / maxXp) * 100}%` }}
              />
              <span className="text-xs text-white/50">{entry.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
