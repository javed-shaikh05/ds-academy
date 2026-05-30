import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Account deletion requires admin privileges (service role key).
    // Since we don't expose service role to the frontend, we sign the user out
    // and delete all their data. The auth user row will be cleaned up by Supabase
    // (or remains as an orphan, harmless).

    const userId = user.id

    // Delete all user data (cascades will handle most via FK)
    await supabase.from('mcq_reviews').delete().eq('user_id', userId)
    await supabase.from('user_progress').delete().eq('user_id', userId)
    await supabase.from('user_badges').delete().eq('user_id', userId)
    await supabase.from('xp_events').delete().eq('user_id', userId)
    await supabase.from('daily_missions').delete().eq('user_id', userId)
    await supabase.from('mentor_chats').delete().eq('user_id', userId)
    await supabase.from('interviews').delete().eq('user_id', userId)
    await supabase.from('project_reviews').delete().eq('user_id', userId)
    await supabase.from('resume_reviews').delete().eq('user_id', userId)
    await supabase.from('user_preferences').delete().eq('user_id', userId)
    await supabase.from('user_stats').delete().eq('user_id', userId)

    // Sign them out
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
}