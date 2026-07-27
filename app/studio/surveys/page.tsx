import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SurveyRow {
  id: string
  respondent_name: string | null
  respondent_email: string | null
  brokerage: string | null
  market: string | null
  score: number | null
  recommended_plan: string | null
  created_at: string
  answers: Record<string, unknown>
}

const PLANS = ['all', 'starter', 'signature', 'flagship'] as const

export default async function SurveysPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams
  const filter = plan && plan !== 'all' ? plan : null

  const supabase = await createClient()
  let query = supabase
    .from('survey_responses')
    .select('id, respondent_name, respondent_email, brokerage, market, score, recommended_plan, created_at, answers')
    .order('created_at', { ascending: false })
    .limit(200)
  if (filter) query = query.eq('recommended_plan', filter)
  const { data } = await query
  const rows = (data ?? []) as SurveyRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Survey responses</h1>
        <div className="flex gap-2 text-sm">
          {PLANS.map((p) => (
            <Link
              key={p}
              href={p === 'all' ? '/studio/surveys' : `/studio/surveys?plan=${p}`}
              className={`rounded-lg px-3 py-1.5 capitalize ${(filter ?? 'all') === p ? 'bg-primary text-primary-foreground' : 'border border-border bg-white text-muted-foreground'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Respondent', 'Market', 'Score', 'Recommended plan', 'When'].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.respondent_name ?? r.respondent_email ?? 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{[r.respondent_email, r.brokerage].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="px-4 py-3">{r.market ?? '—'}</td>
                <td className="px-4 py-3 font-semibold">{r.score ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{r.recommended_plan ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No responses{filter ? ` for ${filter}` : ''} yet — point the Framer survey webhook at /api/survey.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
