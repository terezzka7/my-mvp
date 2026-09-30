export interface ShareCardProps {
  heroName: string
  level: number
  imageUrl: string
  statsLine: string
  frameColor?: string
  onClose?: () => void
}

// M-11 / W-09 (§9.1, §10 share_cards) — переиспользуется и на web (демо на
// лендинге), и позже на mobile для реальной карточки игрока.
export function ShareCard({ heroName, level, imageUrl, statsLine, frameColor, onClose }: ShareCardProps) {
  return (
    <div
      className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-bg"
      style={frameColor ? { boxShadow: `0 0 0 4px ${frameColor}` } : undefined}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 z-10 text-lg text-white/60 hover:text-white"
        >
          ✕
        </button>
      )}
      <div className="px-6 pt-6 text-center">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
          LVL {level}
        </span>
        <p className="mt-2 text-lg font-bold text-text">{heroName}</p>
        <p className="mt-1 text-sm font-medium text-white/60">{statsLine}</p>
      </div>
      <div className="relative mt-4 h-96 w-full">
        <img src={imageUrl} alt={heroName} className="absolute inset-0 h-full w-full object-cover object-top" />
      </div>
    </div>
  )
}
