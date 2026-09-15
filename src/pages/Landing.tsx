import { CardGrid, type PublicProfileSummary } from '../components/CardGrid'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { SearchBar } from '../components/SearchBar'

const EXAMPLE_PROFILES: PublicProfileSummary[] = [
  { username: 'alex_hero', displayName: 'Alex', level: 12, topAchievement: '30 тренировок за месяц' },
  { username: 'mira_fit', displayName: 'Mira', level: 8, topAchievement: 'Стрик 45 дней' },
  { username: 'dan_strong', displayName: 'Dan', level: 21, topAchievement: 'Легендарный скин' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <Hero />
      <SearchBar />
      <CardGrid profiles={EXAMPLE_PROFILES} />
    </div>
  )
}
