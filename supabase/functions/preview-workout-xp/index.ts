// Edge Function: preview-workout-xp
//
// Tells the app how much XP a workout WOULD earn, without saving anything:
// the log sheet shows it on its button ("+35 XP") before the user taps it.
// Uses the exact same formula as on-workout-logged (_shared/xp.ts), so the
// number matches what is awarded afterwards.
//
// Deploy: npx supabase functions deploy preview-workout-xp
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

import { computeXp, volumeOf, WORKOUT_TYPES } from '../_shared/xp.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

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

  // Caller's own JWT: workout_logs RLS only lets them see their own rows.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

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
    duration_minutes?: number | null
    intensity?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.type || !WORKOUT_TYPES.includes(body.type)) {
    return jsonResponse({ error: `type must be one of ${WORKOUT_TYPES.join(', ')}` }, 400)
  }

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

  const xpEarned = computeXp(
    previous ? volumeOf(previous) : null,
    volumeOf({
      weight_kg: body.weight_kg,
      reps: body.reps,
      duration_minutes: body.duration_minutes,
    }),
    body.intensity,
  )

  return jsonResponse({ xpEarned }, 200)
})
