import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'

export const runtime = 'nodejs'

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV export of the signed-in client's own leads (RLS-scoped). */
export async function GET() {
  const me = await getMyClient()
  if (!me) return NextResponse.json({ error: 'No client' }, { status: 403 })
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('created_at, name, email, phone, intent, source, message, read_at')
    .eq('client_id', me.id)
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as Record<string, unknown>[]
  const headers = ['created_at', 'name', 'email', 'phone', 'intent', 'source', 'message', 'read_at']
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${me.slug}-leads.csv"`,
    },
  })
}
