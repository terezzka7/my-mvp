import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants'

export function Hero() {
  return (
    <section className="border-b border-white/10 px-6 py-20 text-center">
      <h1 className="font-display text-5xl font-extrabold">{APP_NAME}</h1>
      <p className="mx-auto mt-4 max-w-xl text-white/70">
        RPG-трекер тренировок с персонажем-конструктором. Собери героя,
        логируй тренировки, качай уровень.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <a
          href="#"
          className="rounded-full bg-accent px-6 py-3 font-semibold text-black"
        >
          Скачать в App Store
        </a>
        <Link
          to="/u/alex_hero"
          className="rounded-full border border-white/20 px-6 py-3 font-semibold text-text hover:border-accent"
        >
          Смотреть пример
        </Link>
      </div>
    </section>
  )
}
