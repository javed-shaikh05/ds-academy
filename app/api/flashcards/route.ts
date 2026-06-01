import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithRetry } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { subtopicId } = await req.json()

        // Cache check
        const { data: cached } = await supabase
            .from('flashcards')
            .select('cards')
            .eq('subtopic_id', subtopicId)
            .single()

        if (cached) return NextResponse.json({ cards: cached.cards, cached: true })

        const { data: subtopic } = await supabase
            .from('subtopics')
            .select('title, topics(title)')
            .eq('id', subtopicId)
            .single() as any

        if (!subtopic) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 })

        const prompt = `Create flashcards for "${subtopic.title}" (Data Science) to help a student memorize the key facts FAST for exams and interviews.

Respond ONLY with valid JSON:
{
  "cards": [
    { "front": "<a question or key term>", "back": "<the crisp answer/definition — 1-2 sentences MAX>", "hook": "<a short memory trick: an analogy, acronym, or vivid mental image>" }
  ]
}

Make 8 cards. Rules:
- Each card = ONE atomic fact. Never cram multiple ideas into one card.
- Front: a clear question or term.
- Back: short and precise — this is the exact thing they memorize.
- Hook: a memorable aid (e.g. "Think of overfitting like memorizing answers instead of understanding — fails the real test").
- Cover the most important, test-worthy points.`

        const raw = await generateWithRetry({ prompt, jsonMode: true })
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
        const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
        if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)

        let parsed
        try {
            parsed = JSON.parse(cleaned)
        } catch {
            return NextResponse.json({ error: 'Could not generate flashcards. Try again.' }, { status: 500 })
        }

        const cards = parsed.cards || []
        await supabase.from('flashcards').insert({ subtopic_id: subtopicId, cards })

        return NextResponse.json({ cards, cached: false })
    } catch (err: any) {
        console.error('Flashcards error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}