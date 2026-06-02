import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InternView from './InternView'

export default async function InternPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    return <InternView />
}