import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileView from './ProfileView'
import { BADGES } from '@/lib/gamification/badges'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const { data: earnedBadges } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })

    const earnedIds = new Set(earnedBadges?.map((b) => b.badge_id) || [])
    // Strip the `check` function before passing to client component (not serializable)
    const badges = BADGES.map((b) => ({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
        description: b.description,
        earned: earnedIds.has(b.id),
    }))

    // Counts for showcase
    const { count: completedLessons } = await supabase
        .from('user_progress').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'completed')

    const { count: interviewsDone } = await supabase
        .from('interviews').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'completed')

    const { count: projectsReviewed } = await supabase
        .from('project_reviews').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    return (
        <ProfileView
            email={user.email || ''}
            displayName={stats?.display_name || user.email?.split('@')[0] || 'Learner'}
            avatarUrl={stats?.avatar_url || null}
            stats={stats}
            badges={badges}
            counts={{
                lessons: completedLessons ?? 0,
                interviews: interviewsDone ?? 0,
                projects: projectsReviewed ?? 0,
            }}
        />
    )
}