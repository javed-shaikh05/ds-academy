import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import ws from 'ws'

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
            headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: [text] }),
        }
    )
    const data = await res.json()
    return data.result.data[0] as number[]
}

function sanitize(t: string) {
    return t.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim()
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

async function ingestUrl(url: string, sourceName: string) {
    console.log(`\n🌐 Fetching ${url}...`)
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await res.text()

    const dom = new JSDOM(html, { url })
    const article = new Readability(dom.window.document).parse()
    if (!article) { console.log('   ✗ Could not extract article content'); return }

    const fullText = sanitize(article.textContent || '')
    console.log(`   Title: ${article.title}`)
    console.log(`   ${fullText.length} chars`)

    const chunks = chunkText(fullText)
    console.log(`   → ${chunks.length} chunks`)

    let saved = 0
    for (let i = 0; i < chunks.length; i++) {
        try {
            const embedding = await embed(chunks[i])
            await supabase.from('embeddings').insert({ source: sourceName, chunk_index: i, content: chunks[i], embedding })
            saved++
            await new Promise((r) => setTimeout(r, 100))
        } catch (err: any) {
            console.error(`   ✗ chunk ${i}:`, err.message)
        }
    }
    console.log(`✅ ${sourceName}: ${saved}/${chunks.length}`)
}

async function main() {
    const sources = [
        { url: 'https://scikit-learn.org/stable/modules/clustering.html', name: 'sklearn-clustering' },
        { url: 'https://course.fast.ai/', name: 'Deep-learning' },
        // Add more
    ]
    for (const s of sources) await ingestUrl(s.url, s.name)
    console.log('\n🎉 Done!')
}

main().catch(console.error)