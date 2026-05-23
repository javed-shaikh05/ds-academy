// Uses Cloudflare Workers AI for embeddings — works on Vercel + free 10k/day
// Model: bge-small-en-v1.5 — 384 dimensions (matches our DB schema!)

export async function embed(text: string): Promise<number[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare credentials in env");
  }

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
    throw new Error(`Cloudflare embed failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.result.data[0] as number[];
}
