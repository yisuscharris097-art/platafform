import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import sharp, { type OutputInfo } from 'sharp'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_EDGE = 2400 // brief §8: cap the long edge at 2400px, convert on WRITE
const MAX_BYTES = 25 * 1024 * 1024

const metaSchema = z.object({ client_id: z.string().uuid() })

export async function POST(request: Request) {
  // 1) Auth + membership: the user must be able to SEE this client under RLS.
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const parsed = metaSchema.safeParse({ client_id: form.get('client_id') })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 413 })

  const { data: clientRow } = await supabase.from('clients').select('id').eq('id', parsed.data.client_id).maybeSingle()
  if (!clientRow) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  // 2) Resize + WebP on write (never at request time — that is the Vercel meter).
  const input = Buffer.from(await file.arrayBuffer())
  let pipelineOut: { data: Buffer; info: OutputInfo }
  try {
    pipelineOut = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
  } catch {
    return NextResponse.json({ error: 'Not a processable image' }, { status: 415 })
  }

  // 3) Store via service role + register the media row.
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  const path = `${parsed.data.client_id}/cms/${Date.now()}-${file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_')}.webp`
  const { error: upErr } = await admin.storage
    .from('client-media')
    .upload(path, pipelineOut.data, { contentType: 'image/webp', upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: pub } = admin.storage.from('client-media').getPublicUrl(path)
  await admin.from('media').insert({
    client_id: parsed.data.client_id,
    storage_path: path,
    kind: 'photo',
    width: pipelineOut.info.width,
    height: pipelineOut.info.height,
    bytes: pipelineOut.info.size,
  })

  return NextResponse.json({ url: pub.publicUrl, width: pipelineOut.info.width, height: pipelineOut.info.height })
}
