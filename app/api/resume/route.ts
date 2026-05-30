import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithRetry } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { resumeText, jobDescription } = await req.json()

        if (!resumeText || resumeText.trim().length < 50) {
            return NextResponse.json({ error: 'Resume text is too short' }, { status: 400 })
        }

        const prompt = `You are a senior tech recruiter at a top company (FAANG-tier) reviewing a Data Science candidate's resume.

RESUME:
${resumeText}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n\nEvaluate the resume specifically for this role.\n` : 'No specific job target — give general FAANG/top-DS-role feedback.\n'}

Be honest, specific, and actionable. Respond ONLY with valid JSON:
{
  "ats_score": <0-100 estimated ATS-pass score>,
  "recruiter_score": <0-100 if a recruiter would shortlist you>,
  "verdict": "<one of: 'Strong shortlist', 'Likely shortlist', 'Maybe', 'Pass'> — with a one-line reason",
  "strengths": ["...", "..."],
  "red_flags": ["...", "..."],
  "missing_skills": ["<skills the resume should have but doesn't, especially vs target JD if given>"],
  "bullet_rewrites": [
    {"original": "<weak bullet from resume>", "improved": "<stronger version with metrics/impact>", "why": "<1 line>"}
  ],
  "top_priorities": ["<3 concrete actions to fix first>", "...", "..."]
}

Give 2-4 items in each array. For bullet_rewrites, pick the 3 weakest bullets from the resume and rewrite them properly (use action verbs, add metrics where plausible, show impact).`

        const raw = await generateWithRetry({ prompt, jsonMode: true })
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
        const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
        if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)

        let review
        try {
            review = JSON.parse(cleaned)
        } catch {
            return NextResponse.json({ error: 'Could not parse review. Try again.' }, { status: 500 })
        }

        // Save
        const { data: saved } = await supabase
            .from('resume_reviews')
            .insert({
                user_id: user.id,
                resume_text: resumeText,
                job_description: jobDescription || null,
                review,
            })
            .select()
            .single()

        // Award XP
        await supabase.from('xp_events').insert({ user_id: user.id, amount: 40, reason: 'resume_review' })
        const { data: stats } = await supabase.from('user_stats').select('total_xp').eq('user_id', user.id).single()
        if (stats) await supabase.from('user_stats').update({ total_xp: stats.total_xp + 40 }).eq('user_id', user.id)

        return NextResponse.json({ reviewId: saved!.id, review })
    } catch (err: any) {
        console.error('Resume review error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
        .from('resume_reviews')
        .select('id, review, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return NextResponse.json({ history: data || [] })
}