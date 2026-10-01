import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'

const FILTERS = ['Неделя', 'Месяц'] as const
type Filter = (typeof FILTERS)[number]

// Placeholder until the goal becomes a setting.
const WEEKLY_GOAL = 4
// On the week view a day bar is full at this many workouts.
const DAY_FULL = 3

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

interface Log {
  logged_at: string
  xp_earned: number
}

interface Bar {
  label: string
  count: number
  fill: number // 0..1
  isCurrent: boolean
  isFuture: boolean
}

interface View {
  bars: Bar[]
  total: number
  xp: number
  rangeLabel: string
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Weeks start on Monday, same as Home in the mobile app.
function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function weekView(byDay: Map<string, { count: number; xp: number }>, offset: number, now: Date): View {
  const start = addDays(startOfWeek(now), offset * 7)
  const today = startOfDay(now)

  let total = 0
  let xp = 0
  const bars = DAY_LABELS.map((label, i) => {
    const date = addDays(start, i)
    const entry = byDay.get(dayKey(date))
    const count = entry?.count ?? 0
    total += count
    xp += entry?.xp ?? 0
    return {
      label,
      count,
      fill: Math.min(count / DAY_FULL, 1),
      isCurrent: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    }
  })

  const end = addDays(start, 6)
  const rangeLabel = `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`
  return { bars, total, xp, rangeLabel }
}

// Month = Monday-aligned weeks clipped to the month (1–4, 5–11, …).
function monthView(byDay: Map<string, { count: number; xp: number }>, offset: number, now: Date): View {
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = base.getFullYear()
  const month = base.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const today = startOfDay(now)

  let total = 0
  let xp = 0
  const bars: Bar[] = []
  let startDay = 1
  while (startDay <= lastDay) {
    const startDate = new Date(year, month, startDay)
    const endDay = Math.min(startDay + (6 - ((startDate.getDay() + 6) % 7)), lastDay)

    let count = 0
    for (let day = startDay; day <= endDay; day += 1) {
      const entry = byDay.get(dayKey(new Date(year, month, day)))
      count += entry?.count ?? 0
      xp += entry?.xp ?? 0
    }
    total += count

    const range = startDay === endDay ? `${startDay}` : `${startDay}–${endDay}`
    bars.push({
      label: startDay === 1 ? `${range} ${MONTHS_SHORT[month]}` : range,
      count,
      fill: Math.min(count / WEEKLY_GOAL, 1),
      isCurrent: today >= startDate && today <= new Date(year, month, endDay),
      isFuture: startDate.getTime() > today.getTime(),
    })
    startDay = endDay + 1
  }

  return { bars, total, xp, rangeLabel: `${MONTHS[month]} ${year}` }
}

export function Stats() {
  const [logs, setLogs] = useState<Log[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('Неделя')
  // 0 = current week/month, -1 = previous, …
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('logged_at, xp_earned')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true })

      if (!active) return

      if (error) {
        console.error(error)
        setError('Не удалось загрузить статистику. Попробуйте обновить страницу.')
      } else {
        setLogs(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // Workouts and XP per local calendar day.
  const byDay = useMemo(() => {
    const map = new Map<string, { count: number; xp: number }>()
    for (const log of logs ?? []) {
      const key = dayKey(new Date(log.logged_at))
      const entry = map.get(key) ?? { count: 0, xp: 0 }
      entry.count += 1
      entry.xp += log.xp_earned
      map.set(key, entry)
    }
    return map
  }, [logs])

  const view = useMemo(() => {
    const now = new Date()
    return filter === 'Неделя' ? weekView(byDay, offset, now) : monthView(byDay, offset, now)
  }, [byDay, filter, offset])

  function changeFilter(next: Filter) {
    setFilter(next)
    setOffset(0)
  }

  const isWeek = filter === 'Неделя'
  const periodWord = isWeek ? 'неделю' : 'месяц'

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Статистика</h1>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-4 flex gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    filter === option ? 'bg-accent text-black' : 'border border-white/20 text-white/70'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {(logs ?? []).length === 0 ? (
              <p className="mt-8 text-white/40">Пока нет тренировок для графика</p>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-[#151515] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold">Тренировки</h2>
                    <p className="mt-1 text-sm text-white/50">
                      Цель: {WEEKLY_GOAL} в неделю · {view.rangeLabel}
                    </p>
                  </div>
                  <div className="flex gap-1 text-lg text-white/60">
                    <button
                      type="button"
                      aria-label={`Предыдущий ${isWeek ? 'период' : 'месяц'}`}
                      onClick={() => setOffset((value) => value - 1)}
                      className="rounded-full px-3 py-1 hover:text-accent"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label={`Следующий ${isWeek ? 'период' : 'месяц'}`}
                      disabled={offset >= 0}
                      onClick={() => setOffset((value) => value + 1)}
                      className="rounded-full px-3 py-1 hover:text-accent disabled:opacity-30 disabled:hover:text-white/60"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <p className="mt-4 font-display text-3xl font-extrabold text-accent">
                  {view.total}{' '}
                  <span className="text-sm font-semibold text-white/50">
                    {isWeek
                      ? `из ${WEEKLY_GOAL} ${offset === 0 ? 'на этой неделе' : 'за неделю'}`
                      : `${plural(view.total, 'тренировка', 'тренировки', 'тренировок')} за месяц`}
                  </span>
                </p>

                <div className="mt-5 flex h-48 gap-2.5">
                  {view.bars.map((bar) => (
                    <div
                      key={bar.label}
                      className="flex flex-1 flex-col items-center gap-2"
                      title={`${bar.label}: ${bar.count} ${plural(bar.count, 'тренировка', 'тренировки', 'тренировок')}`}
                    >
                      <div
                        className={`relative w-8 flex-1 overflow-hidden rounded-full bg-white/[0.07] ${
                          bar.isCurrent ? 'ring-2 ring-accent/40' : ''
                        } ${bar.isFuture ? 'opacity-45' : ''}`}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-full bg-accent"
                          style={{ height: `${bar.fill * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs ${bar.isCurrent ? 'font-bold text-accent' : 'text-white/50'}`}
                      >
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-sm text-white/50">
                  XP за {periodWord}: <span className="font-semibold text-white/80">+{view.xp}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
