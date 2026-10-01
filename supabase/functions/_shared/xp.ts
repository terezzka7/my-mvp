// XP formula shared by on-workout-logged (awards it) and preview-workout-xp
// (tells the app what a workout WILL award, before it is saved), so the
// number on the button is always the number the server gives.

// Placeholder game-balance numbers — not specified in the book, tune later.
export const BASE_XP = 20
export const MAX_GROWTH_BONUS = 20 // full bonus at +100% growth vs previous log

export const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports', 'other']

// How hard the workout felt (mobile log sheet, step 2). Only ever raises XP:
// the easiest option is 1×, so nobody is "punished" for a light session
// (Риск 4). Not stored — there is no column for it in §10.
export const INTENSITY_FACTORS: Record<string, number> = { easy: 1, medium: 1.25, hard: 1.5, max: 2 }

export function volumeOf(entry: {
  weight_kg?: number | null
  reps?: number | null
  duration_minutes?: number | null
}) {
  if (entry.weight_kg != null && entry.reps != null) return entry.weight_kg * entry.reps
  if (entry.duration_minutes != null) return entry.duration_minutes
  return null
}

// XP честно привязан к приросту (Риск 4): без предыдущего лога того же
// типа — базовый XP за сам факт. С предыдущим — бонус растёт с ростом
// объёма, но никогда не опускается ниже базового (нет штрафа за застой
// или регресс).
function computeBaseXp(previousVolume: number | null, currentVolume: number | null): number {
  if (previousVolume == null || currentVolume == null || previousVolume <= 0) {
    return BASE_XP
  }
  const growthRatio = (currentVolume - previousVolume) / previousVolume
  const bonus = Math.round(Math.min(Math.max(growthRatio, 0), 1) * MAX_GROWTH_BONUS)
  return BASE_XP + bonus
}

export function computeXp(
  previousVolume: number | null,
  currentVolume: number | null,
  intensity?: string | null,
): number {
  const factor = (intensity && INTENSITY_FACTORS[intensity]) || 1
  return Math.round(computeBaseXp(previousVolume, currentVolume) * factor)
}
