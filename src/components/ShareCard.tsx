import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

export interface ShareCardProps {
  heroName: string
  level: number
  imageUrl: string
  statsLine: string
  frameColor?: string
  onClose?: () => void
  downloadable?: boolean
}

// M-11 / W-09 (§9.1, §10 share_cards) — переиспользуется и на web (демо на
// лендинге), и позже на mobile для реальной карточки игрока.
export function ShareCard({
  heroName,
  level,
  imageUrl,
  statsLine,
  frameColor,
  onClose,
  downloadable,
}: ShareCardProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!exportRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(exportRef.current)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `buildyfit-${heroName}.png`
      link.click()
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="relative w-full max-w-[418px] overflow-hidden rounded-3xl border border-white/10 bg-bg"
      style={frameColor ? { boxShadow: `0 0 0 4px ${frameColor}` } : undefined}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-[26px] top-4 z-10 text-lg text-white/60 hover:text-white"
        >
          ✕
        </button>
      )}
      {/* exportRef wraps exactly the content that ends up in the downloaded
          PNG — close/download buttons stay outside it on purpose. */}
      <div ref={exportRef} className="bg-bg">
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
      {downloadable && (
        <div className="px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="block w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-black disabled:opacity-50"
          >
            {downloading ? 'Сохраняем…' : 'Скачать карточку'}
          </button>
        </div>
      )}
    </div>
  )
}
