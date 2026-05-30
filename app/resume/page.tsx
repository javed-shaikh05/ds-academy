import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResumeView from './ResumeView'

export default async function ResumePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    return <ResumeView />
}