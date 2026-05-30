import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: save uploaded avatar URL
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { avatar_url } = await req.json()

    await supabase.from('user_stats').upsert(
        { user_id: user.id, avatar_url },
        { onConflict: 'user_id' }
    )

    return NextResponse.json({ ok: true })
}