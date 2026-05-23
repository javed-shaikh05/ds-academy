import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import ws from "ws";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws as any } },
);

// Uses Cloudflare Workers AI — works locally and on Vercel
async function embed(text: string): Promise<number[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-small-en-v1.5`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text] }),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudflare API ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data.result.data[0] as number[];
}

// Clean text — removes characters Postgres can't store
function sanitize(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 50) chunks.push(chunk);
  }
  return chunks;
}

async function ingestPDF(filename: string) {
  console.log(`\n📖 Reading ${filename}...`);

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const filePath = path.join(process.cwd(), "pdfs", filename);
  const dataBuffer = new Uint8Array(fs.readFileSync(filePath));

  const pdf = await pdfjs.getDocument({ data: dataBuffer }).promise;
  console.log(`   ${pdf.numPages} pages`);

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => it.str).join(" ");
    fullText += pageText + "\n\n";
  }

  fullText = sanitize(fullText);
  console.log(`   ${fullText.length} chars after cleaning`);

  const chunks = chunkText(fullText);
  console.log(`   → ${chunks.length} chunks`);

  const source = filename.replace(".pdf", "");
  let saved = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const cleanChunk = sanitize(chunks[i]);
      const embedding = await embed(cleanChunk);

      const { error } = await supabase.from("embeddings").insert({
        source,
        chunk_index: i,
        content: cleanChunk,
        embedding,
      });

      if (error) {
        console.error(`   ✗ Chunk ${i} failed:`, error.message);
      } else {
        saved++;
      }

      // Small delay to be friendly to Cloudflare's rate limits
      await new Promise((r) => setTimeout(r, 100));

      if (i % 50 === 0 && i > 0) {
        console.log(`   ... ${i}/${chunks.length} done`);
      }
    } catch (err: any) {
      console.error(`   ✗ Error on chunk ${i}:`, err.message);
      // If rate-limited, wait longer
      if (err.message?.includes("429")) {
        console.log("   ⏸ Rate limit hit — waiting 30s...");
        await new Promise((r) => setTimeout(r, 30000));
      }
    }
  }

  console.log(`✅ ${source}: ${saved}/${chunks.length} chunks saved`);
}

async function main() {
  console.log("🚀 Starting PDF ingestion (Cloudflare AI)...\n");

  console.log("🗑  Clearing old embeddings...");
  await supabase.from("embeddings").delete().neq("id", 0);

  const pdfs = ["burkov.pdf", "grus.pdf", "mckinney.pdf"];
  for (const pdf of pdfs) {
    await ingestPDF(pdf);
  }

  console.log("\n🎉 All done!");
}

main().catch(console.error);
