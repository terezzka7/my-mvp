import { useParams } from 'react-router-dom'
import { Header } from '../components/Header'

interface MockPublicProfile {
  displayName: string
  level: number
  achievements: string[]
}

const MOCK_PROFILES: Record<string, MockPublicProfile> = {
  alex_hero: {
    displayName: 'Alex',
    level: 12,
    achievements: ['30 тренировок за месяц', 'Стрик 20 дней', 'Легендарный шлем'],
  },
  mira_fit: {
    displayName: 'Mira',
    level: 8,
    achievements: ['Стрик 45 дней', 'Эпический плащ', 'Первый челлендж'],
  },
  dan_strong: {
    displayName: 'Dan',
    level: 21,
    achievements: ['Легендарный скин', '100 тренировок', 'Топ-3 сезона'],
  },
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const profile = (username && MOCK_PROFILES[username]) || {
    displayName: username ?? 'Герой',
    level: 1,
    achievements: ['Только начал путь'],
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="mx-auto h-40 w-40 rounded-full border border-white/10 bg-white/5" />
        <h1 className="mt-6 font-display text-3xl font-extrabold">{profile.displayName}</h1>
        <p className="mt-1 text-white/50">Уровень {profile.level}</p>
        <ul className="mt-6 flex flex-col gap-2 text-sm text-white/70">
          {profile.achievements.slice(0, 3).map((achievement) => (
            <li key={achievement}>{achievement}</li>
          ))}
        </ul>
        <a
          href="#"
          className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-black"
        >
          Создай своего
        </a>
      </div>
    </div>
  )
}
