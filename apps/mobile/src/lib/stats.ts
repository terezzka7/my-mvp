// Same file as src/lib/stats.ts on the web (branch main): one definition of every period, total and goal, so Home here and Stats there cannot disagree. Keep the two in sync.
import type { WorkoutType } from './database.types'

// Used when a player has no weekly_goals row yet.
export const DEFAULT_WEEKLY_GOAL = 4
// A day bar's axis reaches at least this many workouts (it grows if a day has more).
export const MIN_DAY_AXIS = 3

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export const TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Растяжка',
  sports: 'Игра',
  other: 'Другое',
}

export interface Log {
  logged_at: string
  type: WorkoutType
  duration_minutes: number | null
  xp_earned: number
}

// One weekly_goals row: from this Monday on, the goal is `goal`. Sorted ascending by `from`.
export interface GoalFrom {
  from: Date
  goal: number
}

export interface DayAgg {
  count: number
  minutes: number
  xp: number
  types: Set<WorkoutType>
}

export type ByDay = Map<string, DayAgg>

export interface Totals {
  count: number
  minutes: number
  xp: number
}

export interface Bar {
  key: string
  label: string
  count: number
  totals: Totals
  types: WorkoutType[]
  goal: number | null // month view only: the goal of that week
  isCurrent: boolean
  isFuture: boolean
}

export interface ChartView {
  bars: Bar[]
  axisMax: number
  total: number
  xp: number
  rangeLabel: string
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Weeks start on Monday, same as Home in the mobile app.
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// 'YYYY-MM-DD' (a date column) as a local date.
export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function buildByDay(logs: Log[]): ByDay {
  const map: ByDay = new Map()
  for (const log of logs) {
    const key = dayKey(new Date(log.logged_at))
    const entry = map.get(key) ?? { count: 0, minutes: 0, xp: 0, types: new Set<WorkoutType>() }
    entry.count += 1
    entry.minutes += log.duration_minutes ?? 0
    entry.xp += log.xp_earned
    entry.types.add(log.type)
    map.set(key, entry)
  }
  return map
}

// Goal in force for the week starting on `monday`: that week's row, else the
// latest earlier one, else the default.
export function goalOfWeek(goals: GoalFrom[], monday: Date): number {
  let goal = DEFAULT_WEEKLY_GOAL
  for (const row of goals) {
    if (row.from.getTime() <= monday.getTime()) goal = row.goal
  }
  return goal
}

// The single place every number for a period comes from: workouts, minutes and
// XP over days [from, to] inclusive. KPI tiles, the goal ring and the month
// bars all go through it so they cannot disagree.
export function sumRange(byDay: ByDay, from: Date, to: Date): Totals {
  const totals: Totals = { count: 0, minutes: 0, xp: 0 }
  for (let d = startOfDay(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    const entry = byDay.get(dayKey(d))
    if (!entry) continue
    totals.count += entry.count
    totals.minutes += entry.minutes
    totals.xp += entry.xp
  }
  return totals
}

export function typesInRange(byDay: ByDay, from: Date, to: Date): WorkoutType[] {
  const found = new Set<WorkoutType>()
  for (let d = startOfDay(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    byDay.get(dayKey(d))?.types.forEach((type) => found.add(type))
  }
  return [...found]
}

export function weekView(byDay: ByDay, offset: number, now: Date): ChartView {
  const start = addDays(startOfWeek(now), offset * 7)
  const today = startOfDay(now)

  const bars: Bar[] = DAY_LABELS.map((label, i) => {
    const date = addDays(start, i)
    const entry = byDay.get(dayKey(date))
    return {
      key: dayKey(date),
      label,
      count: entry?.count ?? 0,
      totals: { count: entry?.count ?? 0, minutes: entry?.minutes ?? 0, xp: entry?.xp ?? 0 },
      types: [...(entry?.types ?? [])],
      goal: null,
      isCurrent: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    }
  })

  const end = addDays(start, 6)
  const totals = sumRange(byDay, start, end)
  return {
    bars,
    axisMax: Math.max(MIN_DAY_AXIS, ...bars.map((bar) => bar.count)),
    total: totals.count,
    xp: totals.xp,
    rangeLabel: `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`,
  }
}

// Month = Monday-aligned weeks clipped to the month (1–4, 5–11, …).
export function monthView(byDay: ByDay, offset: number, now: Date, goals: GoalFrom[]): ChartView {
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = base.getFullYear()
  const month = base.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const today = startOfDay(now)

  const bars: Bar[] = []
  let startDay = 1
  while (startDay <= lastDay) {
    const startDate = new Date(year, month, startDay)
    const endDay = Math.min(startDay + (6 - ((startDate.getDay() + 6) % 7)), lastDay)
    const endDate = new Date(year, month, endDay)
    const totals = sumRange(byDay, startDate, endDate)

    const range = startDay === endDay ? `${startDay}` : `${startDay}–${endDay}`
    bars.push({
      key: `${year}-${month}-${startDay}`,
      label: startDay === 1 ? `${range} ${MONTHS_SHORT[month]}` : range,
      count: totals.count,
      totals,
      types: typesInRange(byDay, startDate, endDate),
      goal: goalOfWeek(goals, startOfWeek(startDate)),
      isCurrent: today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime(),
      isFuture: startDate.getTime() > today.getTime(),
    })
    startDay = endDay + 1
  }

  const totals = sumRange(byDay, new Date(year, month, 1), new Date(year, month, lastDay))
  return {
    bars,
    axisMax: Math.max(1, ...bars.map((bar) => Math.max(bar.count, bar.goal ?? 0))),
    total: totals.count,
    xp: totals.xp,
    rangeLabel: `${MONTHS[month]} ${year}`,
  }
}
