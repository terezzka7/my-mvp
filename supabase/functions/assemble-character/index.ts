// Edge Function: assemble-character (product_book.md §7.1/§11.1/§13.2)
//
// Finds one body template and one style template matching the criteria
// tags picked at onboarding (M-02), composites the two layers into one
// PNG, uploads it to the `characters` Storage bucket, and upserts the
// caller's `characters` row. Runs with the CALLER's own JWT (not
// service_role) — RLS already allows auth.uid() = user_id on
// characters/template_assets, so no elevated privileges are needed.
//
// Deploy: npx supabase functions deploy assemble-character

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const CHARACTER_SIZE = 256
const INITIAL_XP_TO_NEXT = 100

// Mobile calls this from a real device (no CORS there), but the web
// build of the same app (react-native-web, used for local testing —
// see apps/mobile CLAUDE.md) calls it from a browser, which enforces
// CORS preflight. Supabase Edge Functions add no CORS headers by
// default, so without these every browser call fails before it's
// even sent to the function.
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

  // Client scoped to the caller's own JWT, so every query below is
  // subject to the same RLS as if the app queried directly.
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

  let body: { bodyTag?: string; styleTag?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const bodyTag = body.bodyTag?.trim().toLowerCase()
  const styleTag = body.styleTag?.trim().toLowerCase()
  if (!bodyTag || !styleTag) {
    return jsonResponse({ error: 'bodyTag and styleTag are required' }, 400)
  }

  const { data: bodyTemplate, error: bodyError } = await supabase
    .from('template_assets')
    .select('id, image_url')
    .eq('category', 'body')
    .contains('criteria_tags', [bodyTag])
    .limit(1)
    .maybeSingle()

  const { data: styleTemplate, error: styleError } = await supabase
    .from('template_assets')
    .select('id, image_url')
    .eq('category', 'style')
    .contains('criteria_tags', [styleTag])
    .limit(1)
    .maybeSingle()

  if (bodyError || styleError) {
    console.error(bodyError ?? styleError)
    return jsonResponse({ error: 'Failed to look up templates' }, 500)
  }
  if (!bodyTemplate || !styleTemplate) {
    return jsonResponse(
      { error: `No template found for bodyTag="${bodyTag}" / styleTag="${styleTag}"` },
      404,
    )
  }

  let composed: Uint8Array
  try {
    const [bodyBytes, styleBytes] = await Promise.all([
      fetch(bodyTemplate.image_url).then((r) => r.arrayBuffer()),
      fetch(styleTemplate.image_url).then((r) => r.arrayBuffer()),
    ])

    const bodyImage = await Image.decode(new Uint8Array(bodyBytes))
    const styleImage = await Image.decode(new Uint8Array(styleBytes))

    bodyImage.resize(CHARACTER_SIZE, CHARACTER_SIZE)
    styleImage.resize(CHARACTER_SIZE, CHARACTER_SIZE)

    // Style layer drawn on top of body layer (both already RGBA with alpha).
    bodyImage.composite(styleImage, 0, 0)
    composed = await bodyImage.encode()
  } catch (err) {
    console.error('image composition failed:', err)
    return jsonResponse({ error: 'Failed to compose character image' }, 500)
  }

  const objectPath = `${user.id}/${Date.now()}.png`
  const { error: uploadError } = await supabase.storage
    .from('characters')
    .upload(objectPath, composed, { contentType: 'image/png', upsert: true })

  if (uploadError) {
    console.error(uploadError)
    return jsonResponse({ error: 'Failed to upload character image' }, 500)
  }

  const { data: publicUrlData } = supabase.storage.from('characters').getPublicUrl(objectPath)

  const { data: character, error: upsertError } = await supabase
    .from('characters')
    .upsert(
      {
        user_id: user.id,
        name: 'Герой',
        level: 1,
        xp_current: 0,
        xp_to_next: INITIAL_XP_TO_NEXT,
        body_template_id: bodyTemplate.id,
        style_template_id: styleTemplate.id,
        image_url: publicUrlData.publicUrl,
        equipped_items: null,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (upsertError) {
    console.error(upsertError)
    return jsonResponse({ error: 'Failed to save character' }, 500)
  }

  return jsonResponse({ character }, 200)
})
