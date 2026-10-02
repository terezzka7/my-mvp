import appScreens from '../assets/app-screens.jpg'

const STEPS = [
  { title: 'Собери персонажа', text: 'Выбери пол и стиль, придумай имя, и герой готов' },
  { title: 'Тренируйся и фиксируй', text: 'Записывай тренировку в пару тапов' },
  { title: 'Качай уровень', text: 'Каждая тренировка даёт XP, и персонаж растёт вместе с тобой' },
  { title: 'Делись прогрессом', text: 'Делись своими результатами с друзьями' },
]

// Desktop "snake": row 1 runs left to right (steps 1-2), the dashed road turns
// at the right edge, row 2 runs right to left (steps 3-4) and ends in a check
// mark. Horizontal positions are percentages so it scales with the page; the
// rows are a fixed 208px apart, which is also the diameter of the turn.
const SNAKE_POSITIONS = [
  { left: '0%', top: 0 },
  { left: '39%', top: 0 },
  { left: '60%', top: 208 },
  { left: '23%', top: 208 },
]
// Where the solid arrow before a step sits: left of the pill (row 1 moves
// right) or right of it (row 2 moves left). Step 1 starts the road, no arrow.
const ARROWS: (null | 'right' | 'left')[] = [null, 'right', 'left', 'left']

const DASH = 'border-dashed border-white/55'

function Pill({ index, title }: { index: number; title: string }) {
  return (
    // Hovering the whole step (the parent has `group`) grows the pill a little.
    <span className="relative z-10 inline-flex h-14 items-center gap-3 whitespace-nowrap rounded-full bg-white pl-3 pr-6 text-lg font-semibold text-bg transition duration-200 ease-out group-hover:scale-[1.08] group-hover:shadow-[0_0_0_4px_rgba(198,255,0,0.3)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-extrabold">
        {String(index + 1).padStart(2, '0')}
      </span>
      {title}
    </span>
  )
}

function CheckMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-bg" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  )
}

export function HowItWorks() {
  // z-10 + opaque pills: Hero's side characters hang down into this section,
  // and the step text must stay readable over them.
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-16">
      <img
        src={appScreens}
        alt="Экраны приложения: выбор героя, готовый персонаж и главный экран"
        className="w-full rounded-3xl"
      />

      {/* Desktop: the snake */}
      <ol className="relative mt-2 hidden h-[372px] lg:block">
        <li aria-hidden="true" className={`absolute left-0 right-[104px] top-7 border-t ${DASH}`} />
        <li aria-hidden="true" className={`absolute right-0 top-7 h-[208px] w-[104px] rounded-r-full border-y border-r ${DASH}`} />
        <li aria-hidden="true" className={`absolute left-[62px] right-[104px] top-[236px] border-t ${DASH}`} />
        <li aria-hidden="true" className="absolute left-[18px] top-[214px]">
          <CheckMark />
        </li>

        {STEPS.map((step, index) => {
          const arrow = ARROWS[index]
          return (
            <li key={step.title} className="group absolute w-[270px]" style={SNAKE_POSITIONS[index]}>
              <span className="relative inline-block">
                {arrow === 'right' && (
                  <span aria-hidden="true" className="absolute right-full top-7 mr-3 h-px w-[78px] bg-white">
                    <span className="absolute -right-px -top-[3px] h-[7px] w-[7px] rotate-45 border-r border-t border-white" />
                  </span>
                )}
                {arrow === 'left' && (
                  <span aria-hidden="true" className="absolute left-full top-7 ml-3 h-px w-[78px] bg-white">
                    <span className="absolute -left-px -top-[3px] h-[7px] w-[7px] rotate-[-135deg] border-r border-t border-white" />
                  </span>
                )}
                <Pill index={index} title={step.title} />
              </span>
              <p className="ml-3 mt-3.5 max-w-[250px] text-base leading-relaxed text-white/60 transition-colors duration-200 group-hover:text-white">
                {step.text}
              </p>
            </li>
          )
        })}
      </ol>

      {/* Phone and tablet: the same road, going down */}
      <ol className="mt-10 flex flex-col lg:hidden">
        {STEPS.map((step, index) => (
          <li key={step.title} className="group">
            <Pill index={index} title={step.title} />
            <p className="ml-3 mt-3.5 text-base leading-relaxed text-white/60 transition-colors duration-200 group-hover:text-white">
              {step.text}
            </p>
            {index < STEPS.length - 1 ? (
              <span aria-hidden="true" className={`relative mb-6 ml-[22px] mt-5 block h-10 w-px border-l ${DASH}`}>
                <span className="absolute -bottom-px -left-[4px] h-[7px] w-[7px] rotate-[135deg] border-r border-t border-white" />
              </span>
            ) : (
              <span className="mt-5 block">
                <CheckMark />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
