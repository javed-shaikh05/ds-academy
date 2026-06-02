import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithRetry } from '@/lib/ai/gemini'
import { getDataset } from '@/lib/datasets/samples'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { action } = body

        // ── BRIEF: generate the intern task ──
        if (action === 'brief') {
            const { datasetId } = body
            const ds = getDataset(datasetId)
            if (!ds) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })

            const prompt = `You are a Data Science team lead assigning a task to a new intern.

DATASET: "${ds.name}" (${ds.domain})
COLUMNS: ${ds.columns}
CONTEXT: ${ds.description}

Create a realistic but BEGINNER-FRIENDLY intern brief. Respond ONLY with valid JSON:
{
  "title": "<short project title>",
  "scenario": "<2-3 sentences: the business situation and why this matters, like a real manager explaining it>",
  "tasks": ["<task 1 — start simple, e.g. load and explore>", "<task 2>", "<task 3>", "<task 4 — slightly harder>"],
  "hint": "<one friendly tip to get them started, mentioning pandas>"
}

Keep tasks achievable with pandas in a browser. Make the scenario feel like a real workplace.`

            const raw = await generateWithRetry({ prompt, jsonMode: true, temperature: 0.6 })
            let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
            const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
            if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)

            let brief
            try { brief = JSON.parse(cleaned) } catch {
                return NextResponse.json({ error: 'Could not generate brief. Try again.' }, { status: 500 })
            }

            const { data: saved } = await supabase
                .from('intern_projects')
                .insert({ user_id: user.id, dataset_id: datasetId, brief, status: 'in_progress' })
                .select()
                .single()

            return NextResponse.json({ projectId: saved!.id, brief })
        }

        // ── REVIEW: grade the intern's code ──
        if (action === 'review') {
            const { projectId, code, output } = body

            const { data: project } = await supabase
                .from('intern_projects')
                .select('*')
                .eq('id', projectId)
                .eq('user_id', user.id)
                .single()

            if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

            const brief = project.brief as any

            const prompt = `You are a supportive Data Science team lead reviewing a new intern's work.

THE TASK YOU GAVE THEM:
${brief.scenario}
Tasks: ${brief.tasks.join('; ')}

THEIR CODE:
${code}

${output ? `THEIR OUTPUT:\n${output}\n` : ''}

Review like a kind but honest manager. Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "what_went_well": ["...", "..."],
  "improvements": ["...", "..."],
  "manager_note": "<2-3 sentences of encouraging, constructive feedback like a real boss would give an intern>"
}

Be encouraging — they're learning. Give 2-3 items per list.`

            const raw = await generateWithRetry({ prompt, jsonMode: true, temperature: 0.5 })
            let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
            const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
            if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)

            let review
            try { review = JSON.parse(cleaned) } catch {
                return NextResponse.json({ error: 'Could not generate review. Try again.' }, { status: 500 })
            }

            await supabase.from('intern_projects')
                .update({ user_code: code, review, status: 'completed' })
                .eq('id', projectId)

            // Award XP
            await supabase.from('xp_events').insert({ user_id: user.id, amount: 100, reason: 'intern_project' })
            const { data: stats } = await supabase.from('user_stats').select('total_xp').eq('user_id', user.id).single()
            if (stats) await supabase.from('user_stats').update({ total_xp: stats.total_xp + 100 }).eq('user_id', user.id)

            return NextResponse.json({ review })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        console.error('Intern error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}