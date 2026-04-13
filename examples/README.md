# Examples

| Example | Provider | What it shows |
|---------|----------|---------------|
| [openai/quickstart.ts](openai/quickstart.ts) | OpenAI | Basic memory in 30 lines |
| [openai/chatbot.ts](openai/chatbot.ts) | OpenAI | Multi-turn CLI chatbot with persistent memory |
| [claude/quickstart.ts](claude/quickstart.ts) | Anthropic Claude | Same API, different LLM |
| [groq/quickstart.ts](groq/quickstart.ts) | Groq | Ultra-fast memory-augmented inference |
| [mcp/](mcp/) | MCP | Claude Desktop / Cursor config |

## Running an example

```bash
git clone https://github.com/devanshv17/syncmem-js
cd syncmem-js
npm install

# Set your key
export OPENAI_API_KEY=sk-...

# Run
npx ts-node examples/openai/quickstart.ts
```
