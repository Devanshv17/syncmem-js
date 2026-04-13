/**
 * SyncMem + Anthropic Claude — Quickstart
 *
 * Same memory layer, different LLM. Your Claude key is your identity.
 *
 * Run:
 *   npx ts-node quickstart.ts
 */

import { SyncMem } from '@syncmem/sdk';

const client = new SyncMem({
  llmProvider: 'claude',
  llmApiKey: process.env.ANTHROPIC_API_KEY!,
});

async function main() {
  const userId = 'bob@example.com';

  // Store some facts
  await client.chat({
    accountId: userId,
    message: "I'm a designer based in Berlin. I prefer concise answers and hate jargon.",
  });

  // Memory kicks in automatically
  const response = await client.chat({
    accountId: userId,
    message: 'Recommend some tools for my work.',
  });

  console.log(response.reply);
  // → Short, jargon-free recommendations tailored to a Berlin-based designer
}

main().catch(console.error);
