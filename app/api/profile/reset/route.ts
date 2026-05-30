import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Wipes all learning progress but keeps the account
export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete in order (foreign keys)
    await supabase.from('mcq_reviews').delete().eq('user_id', user.id)
    await supabase.from('user_progress').delete().eq('user_id', user.id)
    await supabase.from('user_badges').delete().eq('user_id', user.id)
    await supabase.from('xp_events').delete().eq('user_id', user.id)
    await supabase.from('daily_missions').delete().eq('user_id', user.id)
    await supabase.from('mentor_chats').delete().eq('user_id', user.id)
    await supabase.from('interviews').delete().eq('user_id', user.id)
    await supabase.from('project_reviews').delete().eq('user_id', user.id)
    await supabase.from('resume_reviews').delete().eq('user_id', user.id)

    // Reset stats (keep the row but zero it out)
    await supabase.from('user_stats').update({
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        level: 1,
        rank_name: 'Beginner',
    }).eq('user_id', user.id)

    return NextResponse.json({ ok: true })
}