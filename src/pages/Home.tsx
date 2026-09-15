import { CardGrid } from '../components/CardGrid'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { SearchBar } from '../components/SearchBar'

export function Home() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <Hero />
      <SearchBar />
      <CardGrid />
    </div>
  )
}
