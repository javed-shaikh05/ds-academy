import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: fetch profile
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: stats } = await supabase
        .from('user_stats')
        .select('display_name, avatar_url, total_xp, current_streak, longest_streak, level, rank_name')
        .eq('user_id', user.id)
        .single()

    return NextResponse.json({
        email: user.email,
        display_name: stats?.display_name || user.email?.split('@')[0],
        avatar_url: stats?.avatar_url || null,
        stats,
    })
}

// PATCH: update display name
export async function PATCH(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { display_name } = await req.json()
    if (!display_name || display_name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    // Upsert in case user_stats doesn't exist yet
    await supabase.from('user_stats').upsert(
        { user_id: user.id, display_name: display_name.trim() },
        { onConflict: 'user_id' }
    )

    return NextResponse.json({ ok: true })
}