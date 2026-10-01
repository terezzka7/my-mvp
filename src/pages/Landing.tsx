import { useEffect, useState } from 'react'
import { CardGrid, type PublicProfileSummary } from '../components/CardGrid'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { SearchBar } from '../components/SearchBar'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const SEARCH_DEBOUNCE_MS = 300

// Значение попадает внутрь строки фильтра .or(...) — запятые/скобки
// ломают её синтаксис, а % и _ в ilike работают как шаблонные символы.
function sanitizeSearch(raw: string) {
  return raw
    .trim()
    .replace(/[,()\\]/g, ' ')
    .replace(/[%_]/g, (ch) => `\\${ch}`)
}

export function Landing() {
  const { user, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<PublicProfileSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    const timer = setTimeout(
      async () => {
        // Публичный каталог читает view public_profiles (см. supabase/rls.sql) —
        // после включения RLS таблицы users/characters сами по себе приватные.
        // Поиск идёт запросом в базу, а не фильтром по уже загруженным 12
        // карточкам — иначе человека вне топа по уровню было бы не найти.
        const term = sanitizeSearch(search)
        let query = supabase
          .from('public_profiles')
          .select('username, display_name, level, xp_current')
          .order('level', { ascending: false })

        if (term) {
          query = query.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).limit(24)
        } else {
          query = query.limit(12)
        }

        const { data, error } = await query

        if (!active) return

        if (error) {
          console.error(error)
          setError('Не удалось загрузить публичные профили. Попробуйте обновить страницу.')
        } else {
          setError(null)
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
      },
      search ? SEARCH_DEBOUNCE_MS : 0,
    )

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <Hero />
      <SearchBar value={search} onChange={setSearch} />
      {loading && <p className="py-16 text-center text-white/40">Загрузка...</p>}
      {error && <p className="py-16 text-center text-red-400">{error}</p>}
      {!loading && !error && (
        <CardGrid
          profiles={profiles ?? []}
          emptyMessage={search.trim() ? 'Ничего не найдено' : undefined}
        />
      )}
      {!authLoading && !user && <HowItWorks />}
      <Footer />
    </div>
  )
}
