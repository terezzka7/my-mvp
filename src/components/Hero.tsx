import { useEffect, useState } from 'react'
import { APP_NAME, APP_STORE_URL } from '../lib/constants'
import { getPlaceholderAvatar } from '../lib/placeholder-avatars'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import heroLeft from '../assets/hero-left.png'
import heroRight from '../assets/hero-right.png'
import demoCharacter from '../assets/demo-character.png'
import { ShareCard } from './ShareCard'

const DEMO_SHARE_DATA = {
  heroName: 'Камила',
  level: 8,
  imageUrl: demoCharacter,
  statsLine: '42 тренировки · серия 12 дней',
}

interface OwnShareData {
  heroName: string
  level: number
  imageUrl: string
  statsLine: string
}

export function Hero() {
  const { user, loading } = useAuth()
  const [showExample, setShowExample] = useState(false)
  const [ownData, setOwnData] = useState<OwnShareData | null>(null)

  useEffect(() => {
    if (!user) {
      setOwnData(null)
      return
    }
    let active = true

    async function load() {
      const [{ data: me }, { data: character }, { data: streak }, { count: workouts }] = await Promise.all([
        supabase.from('users').select('username').eq('id', user!.id).maybeSingle(),
        supabase.from('characters').select('name, level, image_url').eq('user_id', user!.id).maybeSingle(),
        supabase.from('streaks').select('current_streak').eq('user_id', user!.id).maybeSingle(),
        supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])

      if (!active || !character) return

      setOwnData({
        heroName: character.name,
        level: character.level,
        // TODO: character.image_url once real Storage-rendered characters
        // exist — placeholder photo for now per founder's request.
        imageUrl: getPlaceholderAvatar(me?.username).src,
        statsLine: `${workouts ?? 0} тренировок · серия ${streak?.current_streak ?? 0} дней`,
      })
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!showExample) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowExample(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showExample])

  const shareData = user ? ownData : DEMO_SHARE_DATA

  return (
    <section className="relative border-b border-white/10 px-6 py-20 text-center">
      <img
        src={heroLeft}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[-100px] top-[-42px] z-0 hidden w-[28rem] -translate-x-1/4 rotate-[35deg] select-none lg:block"
      />
      <img
        src={heroRight}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[40px] top-28 z-0 hidden w-[32rem] translate-x-1/4 rotate-[-28deg] select-none lg:block"
      />

      <div className="relative z-10">
        <h1 className="font-display text-5xl font-extrabold">{APP_NAME}</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          RPG-трекер тренировок с персонажем-конструктором. Собери героя,
          логируй тренировки, качай уровень.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {!loading && user && (
            <button
              type="button"
              onClick={() => setShowExample(true)}
              disabled={!ownData}
              className="rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              Поделиться прогрессом
            </button>
          )}
          {!loading && !user && (
            <>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-accent px-6 py-3 font-semibold text-black"
              >
                Скачать в App Store
              </a>
              <button
                type="button"
                onClick={() => setShowExample(true)}
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-text hover:border-accent"
              >
                Смотреть пример
              </button>
            </>
          )}
        </div>
      </div>

      {showExample && shareData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
          onClick={() => setShowExample(false)}
        >
          <div className="w-full max-w-[418px]" onClick={(e) => e.stopPropagation()}>
            <ShareCard
              heroName={shareData.heroName}
              level={shareData.level}
              imageUrl={shareData.imageUrl}
              statsLine={shareData.statsLine}
              onClose={() => setShowExample(false)}
              downloadable={!!user}
            />
            {!user && (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-full bg-accent px-6 py-3 text-center font-semibold text-black"
              >
                Собрать своего героя
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
