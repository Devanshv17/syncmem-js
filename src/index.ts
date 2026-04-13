/**
 * SyncMem TypeScript/JavaScript SDK
 * The universal memory layer for AI agents.
 *
 * Auth model
 * ----------
 * SyncMem is a zero-signup infrastructure layer.
 * Your existing LLM API key IS your identity — pass it in every request
 * and SyncMem derives a stable, isolated namespace automatically.
 *
 * No SyncMem account. No extra credentials. Plug in front of whatever
 * LLM your agent is already using.
 *
 * @example Keyless (recommended)
 * ```ts
 * import { SyncMem } from '@syncmem/sdk';
 *
 * const client = new SyncMem({
 *   llmProvider: 'openai',
 *   llmApiKey: 'sk-...',   // your existing key — doubles as your identity
 * });
 *
 * const resp = await client.chat({
 *   accountId: 'alice@example.com',
 *   message: 'What do I like to eat?',
 * });
 * console.log(resp.reply);
 * ```
 *
 * @example With explicit SyncMem API key (for multi-namespace control)
 * ```ts
 * const client = new SyncMem({
 *   chApiKey: 'ch_live_...',
 *   llmProvider: 'openai',
 *   llmApiKey: 'sk-...',
 * });
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncMemConfig {
  /**
   * Your LLM API key. In keyless mode this is also your SyncMem identity —
   * no sign-up needed. Required unless chApiKey is provided with a server-level
   * LLM fallback.
   */
  llmApiKey?: string;
  /**
   * LLM provider name.
   * Supported: openai | gemini | claude | groq | together | perplexity | ollama |
   *            deepseek | mistral | custom
   * Default: 'openai'
   */
  llmProvider?: string;
  /** Custom base URL (for Ollama, proxies, etc.) */
  llmBaseUrl?: string;
  /** Model name override (auto-detected from provider if omitted) */
  llmModel?: string;
  /**
   * Optional explicit SyncMem API key (ch_live_...).
   * Use when you need namespace isolation beyond the LLM-key-derived namespace.
   */
  chApiKey?: string;
  /** API base URL. Defaults to https://api.syncmem.com */
  baseUrl?: string;
  /**
   * Stable device ID for cross-account identity linking.
   * Auto-generated and persisted to localStorage in browsers, or per-process in Node.
   */
  deviceId?: string;
  /** Request timeout in milliseconds. Defaults to 35000 for chat, 10000 for others. */
  timeout?: number;
}

export interface LLMConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  embedModel?: string;
}

export interface ChatRequest {
  /** Account identifier — email, UUID, phone, wallet, OAuth ID, or any custom string */
  accountId: string;
  /** The user's message */
  message: string;
  /** Whether to inject memory context into the LLM. Default: true */
  mcpEnabled?: boolean;
  /** Override the LLM config for this specific request */
  llmOverride?: LLMConfig;
}

export interface ChatResponse {
  reply: string;
  accountId: string;
  contextFactsCount: number;
  mcpEnabled: boolean;
  llmProvider?: string;
}

export interface Fact {
  id: string;
  accountId: string;
  content: string;
  category: string;
  importance: number;
  createdAt: string;
}

export interface IdentityLink {
  id: string;
  accountA: string;
  accountB: string;
  confidence: number;
  createdAt: string;
}

export interface Account {
  id: string;
  displayName: string;
  provider: string;
}

export interface GraphData {
  nodes: Array<{ id: string; label: string; type: string; factCount?: number }>;
  edges: Array<{ source: string; target: string; confidence: number }>;
}

export interface APIKeyInfo {
  id: string;
  keyPrefix: string;
  revoked: boolean;
  rateLimitRpm: number;
  rateLimitRph: number;
  createdAt: string;
  lastUsed?: string;
}

export interface CreateKeyResponse {
  key: string;
  keyId: string;
  ownerId: string;
  warning: string;
}

export class SyncMemError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'SyncMemError';
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class SyncMem {
  private readonly llmApiKey?: string;
  private readonly llmProvider: string;
  private readonly llmBaseUrl?: string;
  private readonly llmModel?: string;
  private readonly chApiKey?: string;
  private readonly baseUrl: string;
  private readonly deviceId: string;
  private readonly timeout: number;

  constructor(config: SyncMemConfig) {
    if (!config.llmApiKey && !config.chApiKey) {
      throw new SyncMemError(
        'Provide either llmApiKey (keyless mode) or chApiKey (explicit key mode). ' +
        'In keyless mode your LLM key is also your SyncMem identity — no sign-up needed.',
      );
    }

    this.llmApiKey  = config.llmApiKey;
    this.llmProvider = config.llmProvider || 'openai';
    this.llmBaseUrl  = config.llmBaseUrl;
    this.llmModel    = config.llmModel;
    this.chApiKey    = config.chApiKey;
    this.baseUrl     = (config.baseUrl || 'https://api.syncmem.com').replace(/\/$/, '') + '/v1';
    this.deviceId    = config.deviceId || this.loadOrCreateDeviceId();
    this.timeout     = config.timeout ?? 35_000;
  }

  // ─── Core API ───────────────────────────────────────────────────────────────

  /**
   * Send a message through the SyncMem memory layer.
   *
   * SyncMem automatically:
   *  1. Retrieves relevant memories for the account
   *  2. Injects them into the LLM context (using YOUR LLM key)
   *  3. Extracts and stores new facts asynchronously (zero latency impact)
   *  4. Updates identity links across accounts and devices
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const llm = request.llmOverride
      ? this.serializeLLM(request.llmOverride)
      : this.defaultLLMConfig();

    const body: Record<string, unknown> = {
      account_id: request.accountId,
      message:    request.message,
      mcp_enabled: request.mcpEnabled ?? true,
      device_id:  this.deviceId,
    };
    if (llm) body.llm = llm;

    return this.post<ChatResponse>('/api/chat', body);
  }

  /** Retrieve all facts stored for an account (newest first, max 200). */
  async getFacts(accountId: string): Promise<Fact[]> {
    const r = await this.get<Fact[] | { facts: Fact[] }>(
      `/api/facts/${encodeURIComponent(accountId)}`,
    );
    return Array.isArray(r) ? r : (r.facts ?? []);
  }

  /** List all accounts in your namespace, sorted by last activity. */
  async getAccounts(): Promise<Account[]> {
    const r = await this.get<Account[] | { accounts: Account[] }>('/api/accounts');
    return Array.isArray(r) ? r : (r.accounts ?? []);
  }

  /** Get identity links (probabilistically linked account pairs). */
  async getLinks(): Promise<IdentityLink[]> {
    const r = await this.get<IdentityLink[] | { links: IdentityLink[] }>('/api/links');
    return Array.isArray(r) ? r : (r.links ?? []);
  }

  /** Get the memory graph (nodes + edges) for visualization. */
  async getGraph(): Promise<GraphData> {
    return this.get<GraphData>('/api/graph');
  }

  /** List supported LLM providers. */
  async getProviders(): Promise<{ supported_providers: string[]; hint: string }> {
    return this.get('/api/providers');
  }

  // ─── Key management ─────────────────────────────────────────────────────────

  /**
   * List all SyncMem API keys for your namespace.
   * Useful when managing multiple keys (staging vs prod, multiple teams).
   */
  async listKeys(): Promise<APIKeyInfo[]> {
    const r = await this.get<{ keys: APIKeyInfo[] }>('/admin/keys');
    return r.keys ?? [];
  }

  /**
   * Create a new SyncMem API key for your namespace.
   * Useful when you want to hand namespaced keys to teammates without
   * sharing your LLM API key.
   *
   * The raw key is shown exactly once — store it securely.
   */
  async createKey(): Promise<CreateKeyResponse> {
    return this.post<CreateKeyResponse>('/admin/keys', {});
  }

  /** Permanently revoke a SyncMem API key. */
  async revokeKey(keyId: string): Promise<{ message: string; key_id: string }> {
    return this.delete(`/admin/keys/${encodeURIComponent(keyId)}`);
  }

  /**
   * Store LLM config for your SyncMem API key (one-time BYOK setup).
   * Only relevant when using chApiKey mode.
   */
  async configureLLM(llm: LLMConfig): Promise<{
    message: string;
    provider: string;
    model: string;
    supports_embedding: boolean;
  }> {
    return this.post('/admin/keys/llm', { llm: this.serializeLLM(llm) });
  }

  // ─── HTTP internals ─────────────────────────────────────────────────────────

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(),
        body:    body !== undefined ? JSON.stringify(body) : undefined,
        signal:  controller.signal,
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        const d = data as Record<string, string>;
        throw new SyncMemError(
          d?.message || d?.error || `SyncMem request failed: ${resp.status}`,
          resp.status,
          d?.error,
        );
      }

      return data as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SyncMemError(`SyncMem request timed out after ${this.timeout}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-Id':  this.deviceId,
    };

    if (this.chApiKey) {
      // Explicit SyncMem key takes precedence
      headers['X-API-Key'] = this.chApiKey;
    } else if (this.llmApiKey) {
      // Keyless mode: send LLM key in header for GET/DELETE requests
      // POST requests embed it in the body via defaultLLMConfig()
      headers['X-LLM-API-Key'] = this.llmApiKey;
    }

    return headers;
  }

  private defaultLLMConfig(): Record<string, string | undefined> | null {
    if (!this.llmApiKey) return null;
    return {
      provider:  this.llmProvider,
      api_key:   this.llmApiKey,
      base_url:  this.llmBaseUrl,
      model:     this.llmModel,
    };
  }

  private serializeLLM(cfg: LLMConfig): Record<string, string | undefined> {
    return {
      provider:    cfg.provider,
      api_key:     cfg.apiKey,
      base_url:    cfg.baseUrl,
      model:       cfg.model,
      embed_model: cfg.embedModel,
    };
  }

  private loadOrCreateDeviceId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('_ch_device_id');
      if (stored) return stored;
      const id = this.newUUID();
      localStorage.setItem('_ch_device_id', id);
      return id;
    }
    return this.newUUID();
  }

  private newUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export default SyncMem;
