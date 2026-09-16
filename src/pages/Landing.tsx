import { useEffect, useState } from 'react'
import { CardGrid, type PublicProfileSummary } from '../components/CardGrid'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { SearchBar } from '../components/SearchBar'
import { supabase } from '../lib/supabase'

export function Landing() {
  const [profiles, setProfiles] = useState<PublicProfileSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      // Публичный каталог читает view public_profiles (см. supabase/rls.sql) —
      // после включения RLS таблицы users/characters сами по себе приватные.
      const { data, error } = await supabase
        .from('public_profiles')
        .select('username, display_name, level, xp_current')
        .order('level', { ascending: false })
        .limit(12)

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить публичные профили. Попробуйте обновить страницу.')
      } else {
        setProfiles(
          data.map((row) => ({
            username: row.username,
            displayName: row.display_name,
            level: row.level,
            xpCurrent: row.xp_current,
          })),
        )
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <Hero />
      <SearchBar />
      {loading && <p className="py-16 text-center text-white/40">Загрузка...</p>}
      {error && <p className="py-16 text-center text-red-400">{error}</p>}
      {!loading && !error && <CardGrid profiles={profiles ?? []} />}
    </div>
  )
}
