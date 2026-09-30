export interface ShareCardProps {
  heroName: string
  level: number
  imageUrl: string
  statsLine: string
  frameColor?: string
}

// M-11 / W-09 (§9.1, §10 share_cards) — переиспользуется и на web (демо на
// лендинге), и позже на mobile для реальной карточки игрока.
export function ShareCard({ heroName, level, imageUrl, statsLine, frameColor }: ShareCardProps) {
  return (
    <div
      className="w-full max-w-sm rounded-3xl border border-white/10 bg-bg p-6"
      style={frameColor ? { boxShadow: `0 0 0 4px ${frameColor}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold text-text">Buildyfit</span>
        <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
          LVL {level}
        </span>
      </div>
      <img src={imageUrl} alt={heroName} className="mx-auto mt-2 h-80 w-full object-contain object-bottom" />
      <p className="mt-3 text-2xl font-extrabold text-text">{heroName}</p>
      <p className="mt-1 text-sm font-medium text-white/60">{statsLine}</p>
    </div>
  )
}
