# SyncMem JS/TS SDK

**Persistent memory for AI agents — drop-in, zero sign-up, any LLM.**

[![npm version](https://img.shields.io/npm/v/@syncmem/sdk)](https://www.npmjs.com/package/@syncmem/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@syncmem/sdk)](https://www.npmjs.com/package/@syncmem/sdk)

SyncMem sits between your agent and your LLM. It injects relevant memories before each call and extracts new facts after — in under 4ms. No new account, no new credentials. Your existing LLM key is your identity.

```
User message
     │
     ▼
┌─────────────┐     retrieve facts (<4ms)    ┌──────────────┐
│   SyncMem   │ ◄─────────────────────────── │   Postgres   │
│   Memory    │                              │   + Valkey   │
│   Layer     │ ──── enriched prompt ──────► │              │
└─────────────┘                              └──────────────┘
     │
     ▼
  Your LLM (OpenAI / Claude / Gemini / Groq / ...)
     │
     ▼
  Reply  ──── extract facts (async, zero latency) ──►  stored
```

---

## Install

```bash
npm install @syncmem/sdk
```

---

## Quickstart

```ts
import { SyncMem } from '@syncmem/sdk';

// Your existing LLM key is your identity — no sign-up needed
const client = new SyncMem({
  llmProvider: 'openai',
  llmApiKey: process.env.OPENAI_API_KEY!,
});

// Turn 1 — facts are extracted automatically
await client.chat({
  accountId: 'alice@example.com',
  message: "I'm a vegetarian living in Tokyo. I'm a backend engineer.",
});

// Turn 2 — memory injected automatically, even across restarts
const { reply } = await client.chat({
  accountId: 'alice@example.com',
  message: 'What restaurants would you recommend near my office?',
});
// → "For vegetarian options in Tokyo, I'd suggest Ain Soph Ripple..."
```

Works the same with any supported provider — just swap `llmProvider`:

```ts
// Claude
new SyncMem({ llmProvider: 'claude', llmApiKey: process.env.ANTHROPIC_API_KEY! })

// Gemini
new SyncMem({ llmProvider: 'gemini', llmApiKey: process.env.GEMINI_API_KEY! })

// Groq
new SyncMem({ llmProvider: 'groq', llmApiKey: process.env.GROQ_API_KEY! })

// Ollama (local)
new SyncMem({ llmProvider: 'ollama', llmBaseUrl: 'http://localhost:11434/v1' })
```

---

## API

```ts
// Chat with memory
client.chat({ accountId, message, deviceId? })

// Read stored facts
client.getFacts(accountId)

// Full-text search
client.searchFacts(accountId, 'dietary preferences')

// Identity links (cross-account linking)
client.getIdentityLinks(accountId)

// All accounts in your namespace
client.getAccounts()

// Memory graph (for visualization)
client.getGraph()
```

Full API reference: [syncmem.com/docs](https://syncmem.com/docs)

---

## Supported Providers

`openai` · `claude` · `gemini` · `groq` · `mistral` · `together` · `deepseek` · `ollama` · `custom`

---

## MCP Server

Add SyncMem memory to Claude Desktop, Cursor, or Windsurf in 30 seconds:

```json
{
  "mcpServers": {
    "syncmem": {
      "command": "npx",
      "args": ["-y", "@syncmem/mcp"],
      "env": {
        "SYNCMEM_API_KEY": "sm_live_...",
        "LLM_PROVIDER": "openai",
        "LLM_API_KEY": "sk-..."
      }
    }
  }
}
```

See [examples/mcp/](examples/mcp/) for full setup guide.

---

## Examples

| File | Description |
|------|-------------|
| [examples/openai/quickstart.ts](examples/openai/quickstart.ts) | Basic persistent memory |
| [examples/openai/chatbot.ts](examples/openai/chatbot.ts) | Multi-turn CLI chatbot |
| [examples/claude/quickstart.ts](examples/claude/quickstart.ts) | Claude integration |
| [examples/groq/quickstart.ts](examples/groq/quickstart.ts) | Groq integration |
| [examples/mcp/](examples/mcp/) | MCP server config |

```bash
git clone https://github.com/devanshv17/syncmem-js
cd syncmem-js && npm install
export OPENAI_API_KEY=sk-...
npx ts-node examples/openai/quickstart.ts
```

---

## Self-hosting

SyncMem is fully open source. Run your own instance on any VPS:

```bash
git clone https://github.com/devanshv17/syncmem
cd syncmem/production
cp .env.example .env
bash scripts/deploy.sh
```

---

## Links

- [Documentation](https://syncmem.com/docs)
- [Dashboard](https://syncmem.com/dashboard)
- [syncmem.com](https://syncmem.com)

---

## License

MIT © [SyncMem](https://syncmem.com)
