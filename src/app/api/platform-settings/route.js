import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('PlatformSettings')
    .select('discordServerLink, registrationFormUrl, platformName, tagline, logoIcon')
    .eq('id', 'main')
    .maybeSingle()

  if (error) return NextResponse.json({}, { status: 200 })
  return NextResponse.json(data || {})
}

export async function PUT(request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const allowed = ['discordServerLink', 'registrationFormUrl']
  const update = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key] || null
  }

  const { error } = await supabase
    .from('PlatformSettings')
    .upsert({ id: 'main', ...update }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
