import { APP_NAME } from '../lib/constants'

export function Hero() {
  return (
    <section className="border-b border-white/10 px-6 py-20 text-center">
      <h1 className="font-display text-5xl font-extrabold">{APP_NAME}</h1>
      <p className="mx-auto mt-4 max-w-xl text-white/70">
        RPG-трекер тренировок с персонажем-конструктором. Собери героя,
        логируй тренировки, качай уровень.
      </p>
      <a
        href="#"
        className="mt-8 inline-block rounded bg-accent px-6 py-3 font-medium text-black"
      >
        Скачать в App Store
      </a>
    </section>
  )
}
