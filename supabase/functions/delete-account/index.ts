// Edge Function: delete-account (Настройки — "Удалить аккаунт", веб W-08
// / mobile M-15). Most user-data tables have no client DELETE policy at
// all per §10 (same reasoning as buy-item/on-workout-logged), so this
// has to run as service_role — and even where a table does allow an
// owner DELETE (users, workout_logs), doing it all here keeps the whole
// operation in one atomic, ordered place instead of split across the
// client.
//
// Deletion order matters: none of the FKs in schema.sql have
// `on delete cascade` (all default to NO ACTION), so children must go
// before parents:
//   share_cards -> user_items -> user_challenges -> workout_logs ->
//   streaks -> characters -> users -> auth.users
// users.referred_by is a self-referencing FK with no cascade either —
// if this account referred other users, their referred_by must be
// nulled out before the users row itself can be deleted.
// auth.users is removed last, via the Admin API (not SQL), since
// public.users.id references auth.users(id).
//
// Deploy: npx supabase functions deploy delete-account

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

  // Only used to identify the caller from their own JWT — every actual
  // write below goes through the service_role client.
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

  const uid = user.id

  const steps: Array<{ label: string; run: () => Promise<{ error: { message: string } | null }> }> = [
    { label: 'share_cards', run: () => supabaseAdmin.from('share_cards').delete().eq('user_id', uid) },
    { label: 'user_items', run: () => supabaseAdmin.from('user_items').delete().eq('user_id', uid) },
    { label: 'user_challenges', run: () => supabaseAdmin.from('user_challenges').delete().eq('user_id', uid) },
    { label: 'workout_logs', run: () => supabaseAdmin.from('workout_logs').delete().eq('user_id', uid) },
    { label: 'streaks', run: () => supabaseAdmin.from('streaks').delete().eq('user_id', uid) },
    { label: 'characters', run: () => supabaseAdmin.from('characters').delete().eq('user_id', uid) },
    {
      label: 'referred_by (nulling referrals of other users)',
      run: () => supabaseAdmin.from('users').update({ referred_by: null }).eq('referred_by', uid),
    },
    { label: 'users', run: () => supabaseAdmin.from('users').delete().eq('id', uid) },
  ]

  for (const step of steps) {
    const { error } = await step.run()
    if (error) {
      console.error(`delete-account failed at ${step.label}:`, error.message)
      return jsonResponse({ error: `Failed to delete ${step.label}: ${error.message}` }, 500)
    }
  }

  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(uid)
  if (authDeleteError) {
    console.error('delete-account failed at auth.users:', authDeleteError.message)
    return jsonResponse({ error: `Account data deleted, but failed to remove auth user: ${authDeleteError.message}` }, 500)
  }

  return jsonResponse({ success: true }, 200)
})
