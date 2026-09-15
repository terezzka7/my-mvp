import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

const MOCK_ME = {
  displayName: 'Ты',
  level: 5,
  streak: 7,
  activeChallenges: ['30 тренировок за месяц', 'Стрик 7 дней подряд'],
}

export function Profile() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full border border-white/10 bg-white/5" />
          <div>
            <h1 className="font-display text-2xl font-extrabold">{MOCK_ME.displayName}</h1>
            <p className="text-white/50">
              Уровень {MOCK_ME.level} · Стрик {MOCK_ME.streak} дней
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Активные челленджи</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            {MOCK_ME.activeChallenges.map((challenge) => (
              <li key={challenge} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                {challenge}
              </li>
            ))}
          </ul>
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
      </div>
    </div>
  )
}
