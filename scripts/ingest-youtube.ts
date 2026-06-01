import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { YoutubeTranscript } from 'youtube-transcript'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { realtime: { transport: ws as any } }
)

async function embed(text: string): Promise<number[]> {
    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/baai/bge-small-en-v1.5`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: [text] }),
        }
    )

    if (!res.ok) {
        throw new Error(`Cloudflare API ${res.status}: ${await res.text()}`)
    }

    const data = await res.json()
    return data.result.data[0] as number[]
}

function sanitize(text: string): string {
    return text
        .replace(/\u0000/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/).filter(Boolean)
    const chunks: string[] = []
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(' ')
        if (chunk.trim().length > 50) chunks.push(chunk)
    }
    return chunks
}

// Extract videoId from any YouTube URL format
function extractVideoId(input: string): string {
    // Already just an ID?
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input

    // Try common URL patterns
    const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ]
    for (const p of patterns) {
        const m = input.match(p)
        if (m) return m[1]
    }
    throw new Error(`Could not extract video ID from: ${input}`)
}

async function ingestYouTube(input: string, sourceName: string) {
    const videoId = extractVideoId(input)
    console.log(`\n🎬 Fetching transcript for ${videoId}...`)

    let transcript
    try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId)
    } catch (err: any) {
        console.error(`   ✗ Could not fetch transcript: ${err.message}`)
        console.log('   (Video may have transcripts disabled or be private)')
        return
    }

    if (!transcript || transcript.length === 0) {
        console.log('   ✗ Empty transcript')
        return
    }

    const fullText = sanitize(transcript.map((t) => t.text).join(' '))
    console.log(`   ${fullText.length} chars (${transcript.length} segments)`)

    if (fullText.length < 100) {
        console.log('   ✗ Transcript too short')
        return
    }

    const chunks = chunkText(fullText)
    console.log(`   → ${chunks.length} chunks`)

    let saved = 0

    for (let i = 0; i < chunks.length; i++) {
        try {
            const embedding = await embed(chunks[i])

            const { error } = await supabase.from('embeddings').insert({
                source: sourceName,
                chunk_index: i,
                content: chunks[i],
                embedding,
            })

            if (error) {
                console.error(`   ✗ chunk ${i}:`, error.message)
            } else {
                saved++
            }

            await new Promise((r) => setTimeout(r, 100))

            if (i % 50 === 0 && i > 0) {
                console.log(`   ... ${i}/${chunks.length} done`)
            }
        } catch (err: any) {
            console.error(`   ✗ chunk ${i}:`, err.message)
            if (err.message?.includes('429')) {
                console.log('   ⏸ Rate limit hit — waiting 30s...')
                await new Promise((r) => setTimeout(r, 30000))
            }
        }
    }

    console.log(`✅ ${sourceName}: ${saved}/${chunks.length} chunks saved`)
}

async function main() {
    console.log('🚀 Ingesting YouTube transcripts...\n')

    const videos = [
        // Foundational
        { url: 'PPLop4L2eGk', name: 'andrew-ng-ml-supervised' },        // Andrew Ng - Supervised Learning
        { url: 'aircAruvnKk', name: '3b1b-what-is-nn' },                // 3Blue1Brown - What is a Neural Network
        { url: 'IHZwWFHWa-w', name: '3b1b-gradient-descent' },          // 3Blue1Brown - Gradient Descent

        // StatQuest (excellent transcripts)
        { url: 'Q9V2QGAcMOg', name: 'statquest-decision-trees' },       // Decision Trees
        { url: 'J4Wdy0Wc_xQ', name: 'statquest-random-forests' },       // Random Forests
        { url: 'efR1C6CvhmE', name: 'statquest-svm' },                  // SVMs
    ]

    if (videos.length === 0) {
        console.log('⚠️  No videos listed. Add entries to the `videos` array in this script.')
        return
    }

    for (const v of videos) {
        await ingestYouTube(v.url, v.name)
    }

    console.log('\n🎉 Done!')
}

main().catch(console.error)