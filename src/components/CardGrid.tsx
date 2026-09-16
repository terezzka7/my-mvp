import { Link } from 'react-router-dom'

export interface PublicProfileSummary {
  username: string
  displayName: string | null
  level: number
  xpCurrent: number
}

interface CardGridProps {
  profiles: PublicProfileSummary[]
}

export function CardGrid({ profiles }: CardGridProps) {
  if (profiles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <p className="py-16 text-center text-white/40">Пока нет публичных профилей</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Link
            key={profile.username}
            to={`/u/${profile.username}`}
            className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-accent"
          >
            <p className="font-display text-lg font-bold">
              {profile.displayName ?? profile.username}
            </p>
            <p className="mt-1 text-sm text-white/50">Уровень {profile.level}</p>
            <p className="mt-3 text-sm text-accent">{profile.xpCurrent} XP</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
