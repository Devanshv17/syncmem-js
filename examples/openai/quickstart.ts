/**
 * SyncMem + OpenAI — Quickstart
 *
 * This is the simplest way to add persistent memory to any OpenAI-powered agent.
 * Your OpenAI key is your SyncMem identity — zero sign-up, zero extra credentials.
 *
 * Run:
 *   npx ts-node quickstart.ts
 */

import { SyncMem } from '@syncmem/sdk';

const client = new SyncMem({
  llmProvider: 'openai',
  llmApiKey: process.env.OPENAI_API_KEY!,
});

async function main() {
  const userId = 'alice@example.com';

  console.log('--- Turn 1: Storing facts ---');
  const turn1 = await client.chat({
    accountId: userId,
    message: "I'm a vegetarian and I live in Tokyo. I'm a backend engineer at a fintech startup.",
  });
  console.log('Reply:', turn1.reply);
  console.log('Facts injected:', turn1.contextFactsCount);

  console.log('\n--- Turn 2: Memory retrieval ---');
  const turn2 = await client.chat({
    accountId: userId,
    message: 'What restaurants would you recommend near my office?',
  });
  console.log('Reply:', turn2.reply);
  // → Recommends vegetarian options in Tokyo

  console.log('\n--- Stored facts ---');
  const facts = await client.getFacts(userId);
  facts.forEach(f => console.log(`[${f.category}] ${f.content}`));
}

main().catch(console.error);
