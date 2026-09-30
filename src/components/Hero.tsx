import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants'
import heroLeft from '../assets/hero-left.png'
import heroRight from '../assets/hero-right.png'

export function Hero() {
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
        className="pointer-events-none absolute right-[50px] top-28 z-0 hidden w-[32rem] translate-x-1/4 rotate-[-28deg] select-none lg:block"
      />

      <div className="relative z-10">
        <h1 className="font-display text-5xl font-extrabold">{APP_NAME}</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          RPG-трекер тренировок с персонажем-конструктором. Собери героя,
          логируй тренировки, качай уровень.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="https://apps.apple.com/ru/iphone/search"
            target="_blank"
            rel="noopener noreferrer"
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
      </div>
    </section>
  )
}
