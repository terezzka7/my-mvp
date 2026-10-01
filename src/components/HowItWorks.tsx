const STEPS = [
  { title: 'Собери персонажа', text: 'Задай телосложение и стиль — герой соберётся под тебя.' },
  { title: 'Тренируйся и логируй', text: 'Записывай тренировку в 2–3 тапа сразу после зала.' },
  { title: 'Качай уровень', text: 'Каждая тренировка даёт XP — персонаж растёт вместе с тобой.' },
  { title: 'Делись прогрессом', text: 'Покажи друзьям карточку героя с уровнем и серией.' },
]

export function HowItWorks() {
  // z-10 + opaque cards: Hero's side characters hang down into this
  // section, and the step text must stay readable over them.
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-center font-display text-4xl font-extrabold">Как это работает</h2>
      <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-white/10 bg-neutral-900 p-6">
            <span className="font-display text-3xl font-extrabold text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="mt-3 font-display text-xl font-bold">{step.title}</p>
            <p className="mt-2 text-base text-white/60">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
