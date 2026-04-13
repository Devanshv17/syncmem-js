# SyncMem MCP Server

Adds persistent memory to Claude Desktop, Cursor, Windsurf, Zed, and any MCP-compatible agent.

## Setup

### Claude Desktop

1. Open Claude Desktop → Settings → Developer → Edit Config
2. Add the following to your `claude_desktop_config.json`:

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

3. Restart Claude Desktop. SyncMem will now remember everything across conversations.

### Cursor / Windsurf

Add the same config to your editor's MCP settings file.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `syncmem_chat` | Memory-augmented chat |
| `syncmem_get_facts` | Retrieve stored facts for a user |
| `syncmem_add_fact` | Manually store a fact |
| `syncmem_search` | Full-text search across memories |
| `syncmem_get_links` | Get identity links |
