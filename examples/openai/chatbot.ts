/**
 * SyncMem + OpenAI — Persistent Chatbot
 *
 * A multi-turn chatbot that remembers everything across sessions.
 * Restart the script and it still knows who the user is.
 *
 * Run:
 *   npx ts-node chatbot.ts
 */

import * as readline from 'readline';
import { SyncMem } from '@syncmem/sdk';

const client = new SyncMem({
  llmProvider: 'openai',
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const USER_ID = 'demo-user'; // In production, use a real user ID

async function chat(message: string): Promise<string> {
  const response = await client.chat({
    accountId: USER_ID,
    message,
  });
  return response.reply;
}

async function main() {
  console.log('SyncMem Chatbot — memory persists across sessions');
  console.log('Type "facts" to see stored memories, "quit" to exit\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === 'quit') { rl.close(); return; }

      if (trimmed === 'facts') {
        const facts = await client.getFacts(USER_ID);
        console.log(`\n📦 ${facts.length} stored memories:`);
        facts.forEach(f => console.log(`  • [${f.category}] ${f.content}`));
        console.log();
        ask();
        return;
      }

      try {
        const reply = await chat(trimmed);
        console.log(`\nAssistant: ${reply}\n`);
      } catch (err) {
        console.error('Error:', err);
      }
      ask();
    });
  };

  ask();
}

main();
