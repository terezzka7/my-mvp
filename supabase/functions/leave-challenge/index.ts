// Edge Function: leave-challenge (M-08 Детали челленджа, "Покинуть челлендж").
// §10 gives the client no UPDATE/DELETE on user_challenges (progress is owned
// by on-workout-logged), so leaving has to run as service_role, same
// reasoning as delete-account/buy-item. Only the caller's own ACTIVE row can
// be dropped; a completed challenge stays as a record. Progress is lost with
// the row: joining again starts from 0.
//
// Deploy: npx supabase functions deploy leave-challenge

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

  let challengeId: unknown
  try {
    challengeId = (await req.json()).challenge_id
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (typeof challengeId !== 'string' || challengeId.length === 0) {
    return jsonResponse({ error: 'challenge_id is required' }, 400)
  }

  // Only used to identify the caller from their own JWT.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid session' }, 401)
  }

  const { data: row, error: findError } = await supabaseAdmin
    .from('user_challenges')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  if (findError) {
    console.error(findError)
    return jsonResponse({ error: 'Failed to look up the challenge' }, 500)
  }
  if (!row) {
    return jsonResponse({ error: 'You are not in this challenge' }, 404)
  }
  if (row.status !== 'active') {
    return jsonResponse({ error: 'Only an active challenge can be left' }, 409)
  }

  const { error: deleteError } = await supabaseAdmin.from('user_challenges').delete().eq('id', row.id)
  if (deleteError) {
    console.error(deleteError)
    return jsonResponse({ error: 'Failed to leave the challenge' }, 500)
  }

  return jsonResponse({ ok: true }, 200)
})
