import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabase'
import {
  DAY_LABELS,
  MONTHS,
  TYPE_LABELS,
  addDays,
  buildByDay,
  dayKey,
  goalOfWeek,
  monthView,
  parseDate,
  plural,
  startOfDay,
  startOfWeek,
  sumRange,
  weekView,
  type Bar,
  type ByDay,
  type ChartView,
  type GoalFrom,
  type Log,
} from '../lib/stats'
import type { WorkoutType } from '../lib/database.types'

const FILTERS = ['Неделя', 'Месяц'] as const
type Filter = (typeof FILTERS)[number]

const CARD = 'rounded-3xl border border-white/10 bg-[#151515] p-5'
const LABEL = 'text-xs font-semibold uppercase tracking-wider text-white/50'

interface Streak {
  current: number
  longest: number
}

interface Character {
  level: number
  xp_current: number
  xp_to_next: number
}

function minutesText(minutes: number): string {
  return minutes > 0 ? `≈${minutes}` : '0'
}

function Tile({
  label,
  value,
  unit,
  sub,
  lime,
  children,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  lime?: boolean
  children?: ReactNode
}) {
  return (
    <div className={lime ? 'rounded-3xl bg-accent p-5 text-[#0d0d0d]' : CARD}>
      <p className={`${LABEL} ${lime ? '!text-[#0d0d0d]/55' : ''}`}>{label}</p>
      <p className="mt-2 font-display text-4xl font-extrabold leading-tight">{value}</p>
      {unit && <p className={`text-sm font-semibold ${lime ? 'text-[#0d0d0d]/60' : 'text-white/50'}`}>{unit}</p>}
      {sub && <p className={`mt-1.5 text-sm ${lime ? 'text-[#0d0d0d]/60' : 'text-white/50'}`}>{sub}</p>}
      {children}
    </div>
  )
}

function tickValues(axisMax: number): number[] {
  const step = axisMax <= 6 ? 1 : Math.ceil(axisMax / 5)
  const ticks: number[] = []
  for (let value = step; value <= axisMax; value += step) ticks.push(value)
  return ticks
}

function tipText(bar: Bar, isWeek: boolean): { title: string; types: string; details: string } {
  const title = isWeek
    ? `${bar.label} · ${bar.count} ${plural(bar.count, 'тренировка', 'тренировки', 'тренировок')}`
    : `${bar.label} · ${bar.count}${bar.goal !== null ? ` из ${bar.goal}` : ''}`
  const types = bar.types.map((type) => TYPE_LABELS[type]).join(', ')
  const minutes = bar.totals.minutes > 0 ? `${minutesText(bar.totals.minutes)} мин · ` : ''
  return { title, types, details: `${minutes}+${bar.totals.xp} XP` }
}

function TrainingsChart({
  view,
  isWeek,
  subtitle,
  delta,
  offset,
  onPrev,
  onNext,
}: {
  view: ChartView
  isWeek: boolean
  subtitle: string
  delta: number | null
  offset: number
  onPrev: () => void
  onNext: () => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const ticks = tickValues(view.axisMax)

  return (
    <div className={`${CARD} sm:col-span-2`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold">Тренировки</h2>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          <p className="text-sm text-white/40">{view.rangeLabel}</p>
          {delta !== null && (
            <span className="mt-2 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              +{delta}% к прошлой неделе
            </span>
          )}
        </div>
        <div className="flex gap-1 text-lg text-white/60">
          <button
            type="button"
            aria-label={`Предыдущий ${isWeek ? 'период' : 'месяц'}`}
            onClick={onPrev}
            className="rounded-full px-3 py-1 hover:text-accent"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={`Следующий ${isWeek ? 'период' : 'месяц'}`}
            disabled={offset >= 0}
            onClick={onNext}
            className="rounded-full px-3 py-1 hover:text-accent disabled:opacity-30 disabled:hover:text-white/60"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-9 flex justify-center gap-2.5">
        <div className="relative h-[170px] w-5 text-[11px] text-white/50">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2"
              style={{ bottom: `${(tick / view.axisMax) * 100}%` }}
            >
              {tick}
            </span>
          ))}
          <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
        </div>

        <div>
          <div className="relative flex h-[170px] gap-2 sm:gap-[23px]">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute -inset-x-1 border-t border-white/[0.08]"
                style={{ bottom: `${(tick / view.axisMax) * 100}%` }}
              />
            ))}
            <div className="absolute -inset-x-1 bottom-0 border-t border-white/20" />

            {view.bars.map((bar, i) => {
              const height = (bar.count / view.axisMax) * 100
              const tip = tipText(bar, isWeek)
              const placement = i < 2 ? 'left-0' : i >= view.bars.length - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'
              return (
                <div
                  key={bar.key}
                  className="relative h-full w-6 sm:w-8"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered(hovered === i ? null : i)}
                  aria-label={`${bar.label}: ${bar.count} ${plural(bar.count, 'тренировка', 'тренировки', 'тренировок')}`}
                >
                  {bar.goal !== null && (
                    <div
                      className="absolute -inset-x-[7px] border-t-2 border-dashed border-white/75"
                      style={{ bottom: `${(bar.goal / view.axisMax) * 100}%` }}
                    />
                  )}
                  {bar.count > 0 && (
                    <>
                      <div
                        className={`absolute inset-x-0 bottom-0 rounded-full bg-accent ${
                          bar.isCurrent ? 'ring-2 ring-accent/35' : ''
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className="absolute inset-x-0 text-center text-[13px] font-bold"
                        style={{ bottom: `calc(${height}% + 4px)` }}
                      >
                        {bar.count}
                      </span>
                    </>
                  )}
                  {hovered === i && bar.count > 0 && (
                    <div
                      className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-xl border border-white/15 bg-[#262626] px-3 py-2 text-xs leading-relaxed shadow-xl ${placement}`}
                      style={{ bottom: `calc(${height}% + 28px)` }}
                    >
                      <p className="font-bold">{tip.title}</p>
                      {tip.types && <p className="text-white/50">{tip.types}</p>}
                      <p>{tip.details}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex gap-2 sm:gap-[23px]">
            {view.bars.map((bar) => (
              <span
                key={bar.key}
                className={`flex w-6 justify-center whitespace-nowrap text-xs sm:w-8 ${
                  bar.isCurrent ? 'font-bold text-accent' : 'text-white/50'
                } ${bar.isFuture ? 'opacity-45' : ''}`}
              >
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!isWeek && (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
          <span className="inline-block w-[18px] border-t-2 border-dashed border-white/75" /> цель недели
        </p>
      )}

      <p className="mt-4 text-sm text-white/50">
        XP за {isWeek ? 'неделю' : 'месяц'}: <span className="font-semibold text-white/80">+{view.xp}</span>
      </p>
    </div>
  )
}

function GoalRing({ done, goal }: { done: number; goal: number }) {
  const ratio = Math.min(done / goal, 1)
  const left = Math.max(0, goal - done)
  return (
    <div className={CARD}>
      <p className={LABEL}>Цель недели</p>
      <div className="relative mx-auto mt-4 h-[132px] w-[132px]">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          {ratio > 0 && (
            <circle
              cx="66"
              cy="66"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 * (1 - ratio)}
              className="text-accent"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-extrabold">
            {done}/{goal}
          </span>
          <span className="text-xs text-white/50">тренировок</span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-white/50">
        {left > 0 ? `Осталось ${left} до цели` : 'Цель недели выполнена'}
      </p>
    </div>
  )
}

function TypeList({ counts, month }: { counts: { type: WorkoutType; count: number }[]; month: string }) {
  const max = Math.max(1, ...counts.map((item) => item.count))
  return (
    <div className={CARD}>
      <p className={LABEL}>По типам · {month}</p>
      <div className="mt-4 flex flex-col gap-3.5">
        {counts.map((item) => (
          <div key={item.type}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{TYPE_LABELS[item.type]}</span>
              <span className="text-white/55">{item.count}</span>
            </div>
            <div className="mt-1.5 h-0.5 bg-white/[0.12]">
              <div className="h-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityCalendar({ byDay, now }: { byDay: ByDay; now: Date }) {
  const [offset, setOffset] = useState(0)
  const today = startOfDay(now)
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const last = new Date(first.getFullYear(), first.getMonth(), daysInMonth)
  const leading = (first.getDay() + 6) % 7

  const totals = sumRange(byDay, first, last)
  let activeDays = 0
  for (let d = 1; d <= daysInMonth; d += 1) {
    if (byDay.has(dayKey(new Date(first.getFullYear(), first.getMonth(), d)))) activeDays += 1
  }

  const monthName = MONTHS[first.getMonth()]
  const title = `${monthName[0].toUpperCase()}${monthName.slice(1)} ${first.getFullYear()}`

  return (
    <div className={`${CARD} sm:col-span-2 lg:col-span-4`}>
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div>
          <h2 className="font-display text-xl font-extrabold">Активность</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => setOffset((value) => value - 1)}
              className="rounded-full px-2 text-lg hover:text-accent"
            >
              ‹
            </button>
            <span className="min-w-[8.5rem] text-center">{title}</span>
            <button
              type="button"
              aria-label="Следующий месяц"
              disabled={offset >= 0}
              onClick={() => setOffset((value) => value + 1)}
              className="rounded-full px-2 text-lg hover:text-accent disabled:opacity-30 disabled:hover:text-white/50"
            >
              ›
            </button>
          </div>
          <div className="mt-5 flex gap-10 md:flex-col md:gap-5">
            <p className="text-sm text-white/50">
              <span className="block font-display text-3xl font-extrabold text-text">{totals.count}</span>
              {plural(totals.count, 'тренировка', 'тренировки', 'тренировок')} в месяце
            </p>
            <p className="text-sm text-white/50">
              <span className="block font-display text-3xl font-extrabold text-text">{activeDays}</span>
              {plural(activeDays, 'день', 'дня', 'дней')} с тренировкой
            </p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {DAY_LABELS.map((label) => (
              <span key={label} className="w-11 pb-1.5 text-xs text-white/50">
                {label}
              </span>
            ))}
            {Array.from({ length: leading }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(first.getFullYear(), first.getMonth(), i + 1)
              const trained = byDay.has(dayKey(date))
              const isToday = date.getTime() === today.getTime()
              const isFuture = date.getTime() > today.getTime()
              return (
                <span
                  key={i}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${
                    trained ? 'bg-accent font-extrabold text-[#0d0d0d]' : isFuture ? 'text-white/20' : 'text-white/45'
                  } ${isToday ? 'ring-2 ring-accent/55' : ''} ${isToday && !trained ? 'text-accent' : ''}`}
                >
                  {i + 1}
                </span>
              )
            })}
          </div>
          <p className="mt-3.5 flex items-center gap-3.5 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-accent" /> была тренировка
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full ring-2 ring-accent/55" /> сегодня
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Everything on the page, drawn from already-loaded data (the page itself only fetches).
export function StatsDashboard({
  logs,
  goals,
  streak,
  character,
  now,
}: {
  logs: Log[]
  goals: GoalFrom[]
  streak: Streak | null
  character: Character | null
  now: Date
}) {
  const [filter, setFilter] = useState<Filter>('Неделя')
  // 0 = current week/month, -1 = previous, …
  const [offset, setOffset] = useState(0)

  const byDay = useMemo(() => buildByDay(logs), [logs])

  const isWeek = filter === 'Неделя'
  const view = useMemo(
    () => (isWeek ? weekView(byDay, offset, now) : monthView(byDay, offset, now, goals)),
    [byDay, goals, isWeek, offset, now],
  )

  // Current week and month: the KPI tiles, the goal ring and the type list.
  const thisWeekStart = startOfWeek(now)
  const week = sumRange(byDay, thisWeekStart, addDays(thisWeekStart, 6))
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const month = sumRange(byDay, monthStart, monthEnd)
  const goalNow = goalOfWeek(goals, thisWeekStart)
  const monthName = MONTHS[now.getMonth()]

  // Same period as `month` above, so the counts add up to the "за месяц" tile.
  const typeTotals: Record<WorkoutType, number> = { strength: 0, cardio: 0, flexibility: 0, sports: 0, other: 0 }
  for (const log of logs) {
    const day = startOfDay(new Date(log.logged_at)).getTime()
    if (day >= monthStart.getTime() && day <= monthEnd.getTime()) typeTotals[log.type] += 1
  }
  const typeCounts = (Object.keys(typeTotals) as WorkoutType[])
    .filter((type) => type !== 'other' || typeTotals.other > 0)
    .map((type) => ({ type, count: typeTotals[type] }))
    .sort((a, b) => b.count - a.count)

  // "+N% to last week": only for the week view, only when it grew.
  let delta: number | null = null
  if (isWeek) {
    const shown = addDays(startOfWeek(now), offset * 7)
    const previous = sumRange(byDay, addDays(shown, -7), addDays(shown, -1)).count
    if (previous > 0 && view.total > previous) delta = Math.round(((view.total - previous) / previous) * 100)
  }

  const subtitle = isWeek
    ? `Цель: ${goalOfWeek(goals, addDays(startOfWeek(now), offset * 7))} в неделю`
    : 'Цель каждой недели отмечена пунктиром'

  function changeFilter(next: Filter) {
    setFilter(next)
    setOffset(0)
  }

  return (
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

      {logs.length === 0 && (
        <p className="mt-6 text-white/40">Пока нет тренировок: запишите первую в приложении, и здесь появятся данные.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          lime
          label="Серия"
          value={streak?.current ?? 0}
          unit={plural(streak?.current ?? 0, 'день', 'дня', 'дней')}
          sub={`Рекорд: ${streak?.longest ?? 0} ${plural(streak?.longest ?? 0, 'день', 'дня', 'дней')}`}
        />
        <Tile label="Тренировок" value={week.count} unit="на этой неделе" sub={`${month.count} за ${monthName}`} />
        <Tile
          label="Минут"
          value={minutesText(week.minutes)}
          unit="за неделю"
          sub={`${minutesText(month.minutes)} за ${monthName}`}
        />
        <Tile
          label={character ? `Уровень ${character.level}` : 'Уровень'}
          value={character ? character.xp_current : '—'}
          unit={character ? `/ ${character.xp_to_next} XP` : undefined}
        >
          {character && (
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (character.xp_current / character.xp_to_next) * 100)}%` }}
              />
            </div>
          )}
        </Tile>

        <TrainingsChart
          view={view}
          isWeek={isWeek}
          subtitle={subtitle}
          delta={delta}
          offset={offset}
          onPrev={() => setOffset((value) => value - 1)}
          onNext={() => setOffset((value) => value + 1)}
        />
        <GoalRing done={week.count} goal={goalNow} />
        <TypeList counts={typeCounts} month={monthName} />

        <ActivityCalendar byDay={byDay} now={now} />
      </div>
    </>
  )
}

export function Stats() {
  const [now] = useState(() => new Date())
  const [logs, setLogs] = useState<Log[]>([])
  const [goals, setGoals] = useState<GoalFrom[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      // Everything below belongs to the signed-in player (RLS: auth.uid() = user_id).
      const [logsResult, goalsResult, streakResult, characterResult] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('logged_at, type, duration_minutes, xp_earned')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true }),
        // The goal history is written in the mobile app's Settings; here it is read-only.
        supabase.from('weekly_goals').select('week_start, goal').eq('user_id', user.id).order('week_start', { ascending: true }),
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
        supabase.from('characters').select('level, xp_current, xp_to_next').eq('user_id', user.id).maybeSingle(),
      ])

      if (!active) return

      // These three must not hide the rest of the page if they fail
      // (e.g. add_weekly_goals.sql not applied yet: the default goal is used).
      if (goalsResult.error) console.error(goalsResult.error)
      else setGoals(goalsResult.data.map((row) => ({ from: parseDate(row.week_start), goal: row.goal })))
      if (streakResult.error) console.error(streakResult.error)
      else if (streakResult.data) {
        setStreak({ current: streakResult.data.current_streak, longest: streakResult.data.longest_streak })
      }
      if (characterResult.error) console.error(characterResult.error)
      else setCharacter(characterResult.data)

      if (logsResult.error) {
        console.error(logsResult.error)
        setError('Не удалось загрузить статистику. Попробуйте обновить страницу.')
      } else {
        setLogs(logsResult.data)
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="bg-bg text-text">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold">Статистика</h1>

        {loading && <p className="mt-6 text-white/40">Загрузка...</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        {!loading && !error && (
          <StatsDashboard logs={logs} goals={goals} streak={streak} character={character} now={now} />
        )}
      </div>
    </div>
  )
}
