import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
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

// For markdown, strip basic syntax so embeddings focus on content
function stripMarkdown(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, ' ')        // code blocks
        .replace(/`([^`]+)`/g, '$1')             // inline code
        .replace(/!\[.*?\]\(.*?\)/g, '')         // images
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')      // links (keep text)
        .replace(/^#{1,6}\s+/gm, '')             // headers
        .replace(/\*\*(.*?)\*\*/g, '$1')         // bold
        .replace(/\*(.*?)\*/g, '$1')             // italic
        .replace(/^[-*+]\s+/gm, '')              // list markers
        .replace(/^>\s+/gm, '')                  // blockquotes
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

async function ingestTextFile(filename: string) {
    console.log(`\n📄 Reading ${filename}...`)
    const filePath = path.join(process.cwd(), 'docs', filename)

    if (!fs.existsSync(filePath)) {
        console.error(`   ✗ File not found at ${filePath}`)
        return
    }

    let text = fs.readFileSync(filePath, 'utf-8')

    // If it's markdown, strip the syntax
    if (filename.endsWith('.md')) {
        text = stripMarkdown(text)
    }

    text = sanitize(text)
    console.log(`   ${text.length} chars after cleaning`)

    if (text.length < 100) {
        console.log('   ✗ File too short, skipping')
        return
    }

    const chunks = chunkText(text)
    console.log(`   → ${chunks.length} chunks`)

    // Source name = filename without extension
    const source = filename.replace(/\.(txt|md)$/i, '')
    let saved = 0

    for (let i = 0; i < chunks.length; i++) {
        try {
            const embedding = await embed(chunks[i])

            const { error } = await supabase.from('embeddings').insert({
                source,
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

    console.log(`✅ ${source}: ${saved}/${chunks.length} chunks saved`)
}

async function main() {
    console.log('🚀 Ingesting text/markdown files...\n')

    // List your files here — put them in a `docs/` folder at the project root
    const files: string[] = [
        // 'my-notes.md',
        // 'cheatsheet.txt',
        // 'lecture-1.md',
    ]

    if (files.length === 0) {
        console.log('⚠️  No files listed. Add filenames to the `files` array in this script.')
        return
    }

    for (const file of files) {
        await ingestTextFile(file)
    }

    console.log('\n🎉 Done!')
}

main().catch(console.error)