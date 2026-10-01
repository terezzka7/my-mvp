// Edge Function: on-workout-logged (product_book.md §10 workout_logs.xp_earned,
// §13.2 Must Have, Риск 4 — "рост персонажа честно привязан к реальному
// прогрессу", "никаких наказывающих механик").
//
// Client sends the raw facts of a workout (type/weight/reps/duration/note/
// logged_at). This function inserts the workout_logs row itself, because
// xp_earned/currency_earned depend on server-computed growth vs. the
// previous log of the same type — the client no longer computes them.
// It also updates streaks (current_streak/longest_streak/last_workout_date)
// and applies the earned XP to the caller's character (with level-ups).
//
// Deploy: npx supabase functions deploy on-workout-logged

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Placeholder game-balance numbers — not specified in the book, tune later.
const BASE_XP = 20
const MAX_GROWTH_BONUS = 20 // full bonus at +100% growth vs previous log
const LEVEL_UP_MULTIPLIER = 1.5

const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports', 'other']
// How hard the workout felt (mobile log sheet, step 2). Only ever raises XP:
// the easiest option is 1×, so nobody is "punished" for a light session
// (Риск 4). Not stored — there is no column for it in §10.
const INTENSITY_FACTORS: Record<string, number> = { easy: 1, medium: 1.25, hard: 1.5, max: 2 }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function volumeOf(entry: { weight_kg?: number | null; reps?: number | null; duration_minutes?: number | null }) {
  if (entry.weight_kg != null && entry.reps != null) return entry.weight_kg * entry.reps
  if (entry.duration_minutes != null) return entry.duration_minutes
  return null
}

// XP честно привязан к приросту (Риск 4): без предыдущего лога того же
// типа — базовый XP за сам факт. С предыдущим — бонус растёт с ростом
// объёма, но никогда не опускается ниже базового (нет штрафа за застой
// или регресс).
function computeXp(previousVolume: number | null, currentVolume: number | null): number {
  if (previousVolume == null || currentVolume == null || previousVolume <= 0) {
    return BASE_XP
  }
  const growthRatio = (currentVolume - previousVolume) / previousVolume
  const bonus = Math.round(Math.min(Math.max(growthRatio, 0), 1) * MAX_GROWTH_BONUS)
  return BASE_XP + bonus
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  // Scoped to the caller's own JWT for workout_logs/characters — RLS
  // already allows auth.uid() = user_id there, same as assemble-character.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  // streaks has no authenticated INSERT/UPDATE policy at all (§10: "Edge
  // Function" only) — this is the one place that genuinely needs service_role.
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid session' }, 401)
  }

  let body: {
    type?: string
    weight_kg?: number | null
    reps?: number | null
    intensity?: string | null
    duration_minutes?: number | null
    note?: string | null
    logged_at?: string
    platform_origin?: string
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.type || !WORKOUT_TYPES.includes(body.type)) {
    return jsonResponse({ error: `type must be one of ${WORKOUT_TYPES.join(', ')}` }, 400)
  }
  const loggedAt = body.logged_at ?? new Date().toISOString()
  const platformOrigin = body.platform_origin ?? 'ios'

  // 1. Look up the previous log of the same type to measure growth.
  const { data: previous, error: previousError } = await supabase
    .from('workout_logs')
    .select('weight_kg, reps, duration_minutes')
    .eq('user_id', user.id)
    .eq('type', body.type)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previousError) {
    console.error(previousError)
    return jsonResponse({ error: 'Failed to look up previous workout' }, 500)
  }

  const currentVolume = volumeOf({ weight_kg: body.weight_kg, reps: body.reps, duration_minutes: body.duration_minutes })
  const previousVolume = previous ? volumeOf(previous) : null
  const intensityFactor = (body.intensity && INTENSITY_FACTORS[body.intensity]) || 1
  const xpEarned = Math.round(computeXp(previousVolume, currentVolume) * intensityFactor)
  const currencyEarned = Math.round(xpEarned / 2)

  // 2. Insert the workout log with the server-computed XP/currency.
  const { data: workoutLog, error: insertError } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      type: body.type,
      weight_kg: body.weight_kg ?? null,
      reps: body.reps ?? null,
      duration_minutes: body.duration_minutes ?? null,
      note: body.note ?? null,
      xp_earned: xpEarned,
      currency_earned: currencyEarned,
      logged_at: loggedAt,
      platform_origin: platformOrigin,
    })
    .select()
    .single()

  if (insertError) {
    console.error(insertError)
    return jsonResponse({ error: 'Failed to save workout log' }, 500)
  }

  // 3. Streak: freeze on a gap rather than reset to 0 (Риск 4 — no
  // punishing mechanics). Only a genuinely consecutive day increments it.
  const today = loggedAt.slice(0, 10)
  const { data: streakRow, error: streakSelectError } = await supabaseAdmin
    .from('streaks')
    .select('current_streak, longest_streak, last_workout_date')
    .eq('user_id', user.id)
    .maybeSingle()

  let currentStreak = 1
  if (streakSelectError) {
    console.error(streakSelectError)
  } else {
    let nextCurrent = 1
    if (streakRow) {
      const gap = daysBetween(today, streakRow.last_workout_date)
      if (gap === 0) nextCurrent = streakRow.current_streak
      else if (gap === 1) nextCurrent = streakRow.current_streak + 1
      else nextCurrent = streakRow.current_streak // frozen, not reset
    }
    const nextLongest = Math.max(streakRow?.longest_streak ?? 0, nextCurrent)

    const { error: streakUpsertError } = await supabaseAdmin.from('streaks').upsert(
      {
        user_id: user.id,
        current_streak: nextCurrent,
        longest_streak: nextLongest,
        last_workout_date: today,
      },
      { onConflict: 'user_id' },
    )
    if (streakUpsertError) console.error(streakUpsertError)
    currentStreak = nextCurrent
  }

  // 4. Apply XP to the character, handling level-ups. Skipped gracefully
  // if the caller has no character yet (shouldn't happen in the normal
  // flow, but logging the workout itself should still succeed).
  const { data: character, error: characterSelectError } = await supabase
    .from('characters')
    .select('level, xp_current, xp_to_next')
    .eq('user_id', user.id)
    .maybeSingle()

  let updatedCharacter = null
  let leveledUp = false
  if (characterSelectError) {
    console.error(characterSelectError)
  } else if (character) {
    let { level, xp_to_next: xpToNext } = character
    let xpCurrent = character.xp_current + xpEarned
    while (xpCurrent >= xpToNext) {
      xpCurrent -= xpToNext
      level += 1
      xpToNext = Math.round(xpToNext * LEVEL_UP_MULTIPLIER)
      leveledUp = true
    }

    const { data: savedCharacter, error: characterUpdateError } = await supabase
      .from('characters')
      .update({ level, xp_current: xpCurrent, xp_to_next: xpToNext })
      .eq('user_id', user.id)
      .select()
      .single()

    if (characterUpdateError) {
      console.error(characterUpdateError)
    } else {
      updatedCharacter = savedCharacter
    }
  }

  // Credit the wallet. workout_logs.currency_earned was only ever
  // recorded per-row before this — nothing actually added it to the
  // spendable users.currency_earned balance, which meant the Shop
  // (M-10) could never have real coins to spend. +200 bonus on a
  // level-up, matching M-06's copy.
  const { data: wallet, error: walletSelectError } = await supabase
    .from('users')
    .select('currency_earned')
    .eq('id', user.id)
    .maybeSingle()

  if (walletSelectError) {
    console.error(walletSelectError)
  } else if (wallet) {
    const gain = currencyEarned + (leveledUp ? 200 : 0)
    const { error: walletUpdateError } = await supabase
      .from('users')
      .update({ currency_earned: wallet.currency_earned + gain })
      .eq('id', user.id)
    if (walletUpdateError) console.error(walletUpdateError)
  }

  // 5. Bump progress on the caller's active challenges (§10 user_challenges
  // has no authenticated UPDATE policy — this is the Edge Function that
  // owns it, same reasoning as streaks above). type_specific has no
  // dedicated "target workout type" column in §10, so it's treated the
  // same as workout_count here (best-effort, documented simplification).
  const { data: activeChallenges, error: activeChallengesError } = await supabaseAdmin
    .from('user_challenges')
    .select('id, progress, challenges(type, target_value)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (activeChallengesError) {
    console.error(activeChallengesError)
  } else if (activeChallenges) {
    for (const uc of activeChallenges) {
      const challenge = uc.challenges as unknown as { type: string; target_value: number } | null
      if (!challenge) continue

      let nextProgress: number
      if (challenge.type === 'streak') {
        nextProgress = currentStreak
      } else if (challenge.type === 'duration_total') {
        nextProgress = uc.progress + (body.duration_minutes ?? 0)
      } else {
        // workout_count and type_specific (no target-type column in §10
        // to filter by, so treated the same — any logged workout counts).
        nextProgress = uc.progress + 1
      }
      nextProgress = Math.min(nextProgress, challenge.target_value)
      if (nextProgress === uc.progress) continue

      const completed = nextProgress >= challenge.target_value
      const { error: progressError } = await supabaseAdmin
        .from('user_challenges')
        .update({
          progress: nextProgress,
          status: completed ? 'completed' : 'active',
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', uc.id)
      if (progressError) console.error(progressError)
    }
  }

  return jsonResponse({ workoutLog, character: updatedCharacter }, 200)
})
