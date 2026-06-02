import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithRetry } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { action } = body

        // ── START: generate a fresh exam ──
        if (action === 'start') {
            const { count = 10 } = body

            // Pick subtopics the user has actually studied (completed), fall back to any
            const { data: completed } = await supabase
                .from('user_progress')
                .select('subtopic_id, subtopics(title)')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .limit(40)

            let pool = (completed || []).map((c: any) => ({ id: c.subtopic_id, title: c.subtopics?.title })).filter((x: any) => x.title)

            // If user hasn't completed enough, pull from all subtopics
            if (pool.length < 5) {
                const { data: all } = await supabase.from('subtopics').select('id, title').limit(40)
                pool = (all || []).map((s: any) => ({ id: s.id, title: s.title }))
            }

            if (pool.length === 0) {
                return NextResponse.json({ error: 'No topics available for an exam yet.' }, { status: 400 })
            }

            // Shuffle and take a spread of topics
            const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length))
            const topicList = shuffled.map((s: any) => s.title).join(', ')

            const prompt = `Create a ${count}-question multiple-choice EXAM for a Data Science student, covering these topics: ${topicList}.

Mix difficulty (some easy, some medium, a few hard). Each question tests real understanding, not trivia.

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "question": "<clear question>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_index": <0-3>,
      "explanation": "<1-2 sentences why the correct answer is right>"
    }
  ]
}

Exactly ${count} questions. Each has exactly 4 options. Keep questions concise and unambiguous.`

            const raw = await generateWithRetry({ prompt, jsonMode: true, temperature: 0.3 })
            let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
            const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
            if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)

            let parsed
            try {
                parsed = JSON.parse(cleaned)
            } catch {
                return NextResponse.json({ error: 'Could not generate exam. Try again.' }, { status: 500 })
            }

            const questions = (parsed.questions || []).slice(0, count)
            if (questions.length === 0) {
                return NextResponse.json({ error: 'Exam generation returned no questions. Try again.' }, { status: 500 })
            }

            const { data: saved } = await supabase
                .from('exams')
                .insert({ user_id: user.id, questions, total: questions.length, status: 'in_progress' })
                .select()
                .single()

            // Send questions WITHOUT correct answers (so users can't peek via network tab)
            const safeQuestions = questions.map((q: any) => ({
                question: q.question,
                options: q.options,
            }))

            return NextResponse.json({ examId: saved!.id, questions: safeQuestions })
        }

        // ── SUBMIT: grade the exam ──
        if (action === 'submit') {
            const { examId, answers, durationSeconds } = body

            const { data: exam } = await supabase
                .from('exams')
                .select('*')
                .eq('id', examId)
                .eq('user_id', user.id)
                .single()

            if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
            if (exam.status === 'completed') {
                return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })
            }

            const questions = exam.questions as any[]
            let score = 0
            const review = questions.map((q: any, i: number) => {
                const userAnswer = answers[i]
                const correct = userAnswer === q.correct_index
                if (correct) score++
                return {
                    question: q.question,
                    options: q.options,
                    correct_index: q.correct_index,
                    user_answer: userAnswer ?? null,
                    is_correct: correct,
                    explanation: q.explanation,
                }
            })

            await supabase
                .from('exams')
                .update({
                    answers,
                    score,
                    duration_seconds: durationSeconds,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', examId)

            // Award XP
            await supabase.from('xp_events').insert({ user_id: user.id, amount: 80, reason: 'exam_complete' })
            const { data: stats } = await supabase.from('user_stats').select('total_xp').eq('user_id', user.id).single()
            if (stats) await supabase.from('user_stats').update({ total_xp: stats.total_xp + 80 }).eq('user_id', user.id)

            const pct = Math.round((score / questions.length) * 100)

            return NextResponse.json({
                score,
                total: questions.length,
                pct,
                passed: pct >= 60,
                review,
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        console.error('Exam error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// History of past exams
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
        .from('exams')
        .select('id, score, total, created_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

    return NextResponse.json({ history: data || [] })
}