import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import ws from 'ws'
import mammoth from 'mammoth'

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

function sanitize(text: string) {
    return text.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim()
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

async function ingestDocx(filename: string) {
    console.log(`\n📄 Reading ${filename}...`)
    const filePath = path.join(process.cwd(), 'docs', filename)
    const result = await mammoth.extractRawText({ path: filePath })
    const fullText = sanitize(result.value)
    console.log(`   ${fullText.length} chars`)

    const chunks = chunkText(fullText)
    console.log(`   → ${chunks.length} chunks`)

    const source = filename.replace('.docx', '')
    let saved = 0

    for (let i = 0; i < chunks.length; i++) {
        try {
            const embedding = await embed(chunks[i])
            await supabase.from('embeddings').insert({ source, chunk_index: i, content: chunks[i], embedding })
            saved++
            await new Promise((r) => setTimeout(r, 100))
            if (i % 50 === 0 && i > 0) console.log(`   ... ${i}/${chunks.length}`)
        } catch (err: any) {
            console.error(`   ✗ chunk ${i}:`, err.message)
        }
    }
    console.log(`✅ ${source}: ${saved}/${chunks.length}`)
}

async function main() {
    const files = ['my-notes.docx']  // your .docx files
    // Put them in a `docs/` folder (create it next to pdfs/)
    for (const f of files) await ingestDocx(f)
    console.log('\n🎉 Done!')
}

main().catch(console.error)