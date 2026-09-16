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
      const { data: characters, error: charactersError } = await supabase
        .from('characters')
        .select('user_id, level, xp_current')
        .order('level', { ascending: false })
        .limit(12)

      if (!active) return

      if (charactersError) {
        console.error(charactersError)
        setError('Не удалось загрузить публичные профили. Попробуйте обновить страницу.')
        setLoading(false)
        return
      }

      const userIds = characters.map((character) => character.user_id)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, display_name')
        .in('id', userIds)

      if (!active) return

      if (usersError) {
        console.error(usersError)
        setError('Не удалось загрузить публичные профили. Попробуйте обновить страницу.')
        setLoading(false)
        return
      }

      const usersById = new Map(users.map((user) => [user.id, user]))
      setProfiles(
        characters.flatMap((character) => {
          const user = usersById.get(character.user_id)
          if (!user) return []
          return [
            {
              username: user.username,
              displayName: user.display_name,
              level: character.level,
              xpCurrent: character.xp_current,
            },
          ]
        }),
      )
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
