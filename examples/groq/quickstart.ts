/**
 * SyncMem + Groq — Ultra-fast memory-augmented inference
 *
 * Groq's speed + SyncMem's memory = sub-100ms personalized responses.
 *
 * Run:
 *   npx ts-node quickstart.ts
 */

import { SyncMem } from '@syncmem/sdk';

const client = new SyncMem({
  llmProvider: 'groq',
  llmApiKey: process.env.GROQ_API_KEY!,
});

async function main() {
  const userId = 'charlie@example.com';

  await client.chat({
    accountId: userId,
    message: 'I run a small bakery in Paris. I speak French and English.',
  });

  const response = await client.chat({
    accountId: userId,
    message: 'Give me a quick business tip for today.',
  });

  console.log(response.reply);
  // → Contextual tip for a Parisian bakery owner
}

main().catch(console.error);
