// Edge Function: buy-item (product_book.md §10 items/user_items).
//
// user_items has no authenticated INSERT policy (§10: purchases must go
// through server-side logic, same reasoning as streaks in
// on-workout-logged) — this is the one write path for M-10/M-10a
// "Купить". Pro-gated items (price_earned = null and price_premium =
// null, see seed_challenges_and_items.sql) are rejected here; the
// client should route those to the Paywall (M-16) instead of calling
// this function.
//
// Deploy: npx supabase functions deploy buy-item

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

  // Caller-JWT client for reads that RLS already allows (items is public
  // to authenticated, users/user_items are owner-readable).
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  // user_items has no authenticated INSERT policy, and deducting coins
  // atomically alongside it is simplest from one privileged client.
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid session' }, 401)
  }

  let body: { itemId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.itemId) {
    return jsonResponse({ error: 'itemId is required' }, 400)
  }

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, price_earned, price_premium')
    .eq('id', body.itemId)
    .maybeSingle()

  if (itemError) {
    console.error(itemError)
    return jsonResponse({ error: 'Failed to look up item' }, 500)
  }
  if (!item) {
    return jsonResponse({ error: 'Item not found' }, 404)
  }
  if (item.price_earned == null && item.price_premium == null) {
    return jsonResponse({ error: 'This item requires Buildyfit Pro, not coins' }, 400)
  }

  const { data: alreadyOwned, error: ownedError } = await supabase
    .from('user_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', item.id)
    .maybeSingle()

  if (ownedError) {
    console.error(ownedError)
    return jsonResponse({ error: 'Failed to check ownership' }, 500)
  }
  if (alreadyOwned) {
    return jsonResponse({ error: 'Already owned' }, 400)
  }

  const { data: buyer, error: buyerError } = await supabase
    .from('users')
    .select('currency_earned')
    .eq('id', user.id)
    .maybeSingle()

  if (buyerError || !buyer) {
    console.error(buyerError)
    return jsonResponse({ error: 'Failed to load balance' }, 500)
  }

  const price = item.price_earned ?? 0
  if (buyer.currency_earned < price) {
    return jsonResponse({ error: 'Insufficient coins' }, 400)
  }

  const { error: insertError } = await supabaseAdmin
    .from('user_items')
    .insert({ user_id: user.id, item_id: item.id, purchased_with: 'earned_currency' })

  if (insertError) {
    console.error(insertError)
    return jsonResponse({ error: 'Failed to record purchase' }, 500)
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ currency_earned: buyer.currency_earned - price })
    .eq('id', user.id)
    .select('currency_earned')
    .single()

  if (updateError) {
    console.error(updateError)
    return jsonResponse({ error: 'Failed to deduct coins' }, 500)
  }

  return jsonResponse({ currencyEarned: updatedUser.currency_earned }, 200)
})
