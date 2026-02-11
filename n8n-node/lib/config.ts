/**
 * Configuration constants for the Trusera AI-BOM n8n scanner.
 * Ported from the Python config.py.
 */

/** Set of n8n node types that involve AI capabilities. */
export const N8N_AI_NODE_TYPES: ReadonlySet<string> = new Set([
  '@n8n/n8n-nodes-langchain.agent',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic',
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  '@n8n/n8n-nodes-langchain.lmChatOllama',
  '@n8n/n8n-nodes-langchain.lmChatAzureOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatMistralCloud',
  '@n8n/n8n-nodes-langchain.lmChatGroq',
  '@n8n/n8n-nodes-langchain.lmChatCohere',
  '@n8n/n8n-nodes-langchain.lmChatHuggingFace',
  '@n8n/n8n-nodes-langchain.mcpClientTool',
  '@n8n/n8n-nodes-langchain.toolHttpRequest',
  '@n8n/n8n-nodes-langchain.toolCode',
  '@n8n/n8n-nodes-langchain.toolWorkflow',
  '@n8n/n8n-nodes-langchain.toolCalculator',
  '@n8n/n8n-nodes-langchain.toolWikipedia',
  '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
  '@n8n/n8n-nodes-langchain.embeddingsAzureOpenAi',
  '@n8n/n8n-nodes-langchain.embeddingsCohere',
  '@n8n/n8n-nodes-langchain.embeddingsHuggingFaceInference',
  '@n8n/n8n-nodes-langchain.embeddingsGoogleGemini',
  '@n8n/n8n-nodes-langchain.embeddingsOllama',
  '@n8n/n8n-nodes-langchain.vectorStoreChroma',
  '@n8n/n8n-nodes-langchain.vectorStorePinecone',
  '@n8n/n8n-nodes-langchain.vectorStoreQdrant',
  '@n8n/n8n-nodes-langchain.vectorStoreSupabase',
  '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
  '@n8n/n8n-nodes-langchain.vectorStoreWeaviate',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  '@n8n/n8n-nodes-langchain.memoryPostgresChat',
  '@n8n/n8n-nodes-langchain.memoryChatHistory',
  '@n8n/n8n-nodes-langchain.memoryRedisChat',
  '@n8n/n8n-nodes-langchain.outputParserStructured',
  '@n8n/n8n-nodes-langchain.outputParserAutofixing',
  '@n8n/n8n-nodes-langchain.outputParserJson',
  '@n8n/n8n-nodes-langchain.chainLlm',
  '@n8n/n8n-nodes-langchain.chainSummarization',
  '@n8n/n8n-nodes-langchain.chainRetrievalQa',
  '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter',
  '@n8n/n8n-nodes-langchain.textSplitterCharacterTextSplitter',
  '@n8n/n8n-nodes-langchain.textSplitterMarkdownTextSplitter',
  '@n8n/n8n-nodes-langchain.documentLoaderFile',
  '@n8n/n8n-nodes-langchain.documentLoaderJson',
  '@n8n/n8n-nodes-langchain.documentLoaderCsv',
]);

export interface ApiKeyPattern {
  pattern: RegExp;
  provider: string;
}

/** Patterns for detecting hardcoded API keys by provider. */
export const API_KEY_PATTERNS: readonly ApiKeyPattern[] = [
  { pattern: /sk-proj-[a-zA-Z0-9_-]{20,}/, provider: 'OpenAI' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/, provider: 'OpenAI/DeepSeek' },
  { pattern: /sk-ant-[a-zA-Z0-9-]{20,}/, provider: 'Anthropic' },
  { pattern: /hf_[a-zA-Z0-9]{20,}/, provider: 'HuggingFace' },
  { pattern: /key-[a-zA-Z0-9]{20,}/, provider: 'Cohere' },
  { pattern: /gsk_[a-zA-Z0-9]{20,}/, provider: 'Groq' },
  { pattern: /r8_[a-zA-Z0-9]{20,}/, provider: 'Replicate' },
  { pattern: /xai-[a-zA-Z0-9]{20,}/, provider: 'xAI' },
  { pattern: /AIza[a-zA-Z0-9_-]{20,}/, provider: 'Google' },
  { pattern: /fw_[a-zA-Z0-9]{20,}/, provider: 'Fireworks' },
  { pattern: /pplx-[a-zA-Z0-9]{20,}/, provider: 'Perplexity' },
  {
    pattern: /(?:api[_-]?key|token|secret|together[_-]?(?:api|key))[\s'":=]+([a-f0-9]{64})\b/i,
    provider: 'Together',
  },
  {
    pattern: /(?:api[_-]?key|token|secret|mistral[_-]?(?:api|key))[\s'":=]+([a-zA-Z0-9]{32})\b/i,
    provider: 'Mistral',
  },
];

/** Risk weight assigned to each flag type. */
export const RISK_WEIGHTS: Readonly<Record<string, number>> = {
  hardcoded_api_key: 30,
  hardcoded_credentials: 30,
  code_http_tools: 30,
  shadow_ai: 25,
  webhook_no_auth: 25,
  internet_facing: 20,
  multi_agent_no_trust: 20,
  agent_chain_no_validation: 20,
  mcp_unknown_server: 20,
  no_auth: 15,
  no_rate_limit: 10,
  deprecated_model: 10,
  no_error_handling: 10,
  unpinned_model: 5,
};

/** Set of deprecated AI model identifiers. */
export const DEPRECATED_MODELS: ReadonlySet<string> = new Set([
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-0613',
  'text-davinci-003',
  'text-davinci-002',
  'code-davinci-002',
  'text-ada-001',
  'text-babbage-001',
  'text-curie-001',
  'text-embedding-ada-002',
  'gpt-4-0314',
  'gpt-4-0613',
  'gpt-4-32k-0314',
  'gpt-4-32k-0613',
  'claude-instant-1',
  'claude-instant-1.2',
  'claude-2.0',
  'claude-2.1',
  'claude-3-haiku-20240307',
]);

/** Remediation entry for a risk flag. */
export interface RemediationEntry {
  description: string;
  remediation: string;
  guardrail: string;
  owaspCategory: string;
  owaspCategoryName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/** Remediation guidance mapped to each risk flag. */
export const REMEDIATION_MAP: Readonly<Record<string, RemediationEntry>> = {
  hardcoded_api_key: {
    description: 'An AI provider API key is hardcoded in the workflow JSON instead of using n8n credentials.',
    remediation: 'Move the API key to n8n Credentials (Settings → Credentials) and reference it via the credential selector. Rotate the exposed key immediately.',
    guardrail: 'Enable a pre-commit hook or CI check that scans for API key patterns (sk-*, sk-ant-*, hf_*) in committed workflow exports.',
    owaspCategory: 'LLM06',
    owaspCategoryName: 'Excessive Agency',
    severity: 'critical',
  },
  hardcoded_credentials: {
    description: 'Sensitive credentials (passwords, tokens, secrets) are embedded directly in workflow node parameters.',
    remediation: 'Replace inline credentials with n8n Credential objects. Audit the workflow export for any remaining secrets and rotate them.',
    guardrail: 'Enforce a policy that workflow exports are scrubbed of secrets before sharing. Use n8n environment variables for sensitive values.',
    owaspCategory: 'LLM06',
    owaspCategoryName: 'Excessive Agency',
    severity: 'critical',
  },
  code_http_tools: {
    description: 'An AI agent has access to both code execution and HTTP request tools, allowing it to run arbitrary code and exfiltrate data.',
    remediation: 'Separate code execution and HTTP tools into different workflows or agents. If both are needed, add an approval step between them.',
    guardrail: 'Implement an output filter that blocks the agent from sending code execution results to external URLs. Use an allowlist for permitted HTTP destinations.',
    owaspCategory: 'LLM04',
    owaspCategoryName: 'Output Handling',
    severity: 'critical',
  },
  shadow_ai: {
    description: 'An AI dependency or integration is used in the workflow but not declared in project documentation or dependency files.',
    remediation: 'Document all AI integrations in your project README or architecture decision records. Register the AI component in your internal AI inventory.',
    guardrail: 'Run AI-BOM in CI to automatically detect and flag undocumented AI usage. Require AI component registration before deployment.',
    owaspCategory: 'LLM05',
    owaspCategoryName: 'Supply Chain',
    severity: 'high',
  },
  webhook_no_auth: {
    description: 'An n8n webhook trigger is configured without authentication, allowing anyone with the URL to invoke the workflow.',
    remediation: 'Enable webhook authentication: use Header Auth, Basic Auth, or JWT validation. At minimum, set the webhook to use a unique, unguessable path.',
    guardrail: 'Add a reverse proxy (nginx/Caddy) with authentication in front of n8n. Monitor webhook access logs for unauthorized calls.',
    owaspCategory: 'LLM02',
    owaspCategoryName: 'Sensitive Info Disclosure',
    severity: 'high',
  },
  internet_facing: {
    description: 'An AI endpoint or webhook is directly accessible from the internet without an authentication layer.',
    remediation: 'Place the endpoint behind a VPN, API gateway, or reverse proxy with authentication. Restrict access to known IP ranges if possible.',
    guardrail: 'Use network segmentation to ensure AI endpoints are only reachable from trusted networks. Implement rate limiting at the network edge.',
    owaspCategory: 'LLM02',
    owaspCategoryName: 'Sensitive Info Disclosure',
    severity: 'medium',
  },
  multi_agent_no_trust: {
    description: 'Multiple AI agents interact without defined trust boundaries, allowing one compromised agent to influence others.',
    remediation: 'Define explicit trust boundaries between agents. Validate and sanitize all inter-agent messages. Use separate credentials per agent.',
    guardrail: 'Implement a message broker between agents that enforces schema validation and content filtering. Log all inter-agent communication.',
    owaspCategory: 'LLM01',
    owaspCategoryName: 'Prompt Injection',
    severity: 'medium',
  },
  agent_chain_no_validation: {
    description: 'Agents are chained together (output of one feeds input of another) without intermediate validation or sanitization.',
    remediation: 'Add a validation node between chained agents to check output format, content safety, and data boundaries before passing to the next agent.',
    guardrail: 'Implement structured output parsers between agents. Use JSON schema validation for inter-agent data. Add content safety filters.',
    owaspCategory: 'LLM01',
    owaspCategoryName: 'Prompt Injection',
    severity: 'medium',
  },
  mcp_unknown_server: {
    description: 'An MCP (Model Context Protocol) client is connected to an unrecognized or unvetted server endpoint.',
    remediation: 'Verify the MCP server identity and ownership. Use only trusted, audited MCP servers. Pin the server URL to a known endpoint.',
    guardrail: 'Maintain an allowlist of approved MCP server endpoints. Block connections to unknown servers at the network level.',
    owaspCategory: 'LLM05',
    owaspCategoryName: 'Supply Chain',
    severity: 'medium',
  },
  no_auth: {
    description: 'An AI-related endpoint or service is configured without any authentication mechanism.',
    remediation: 'Add authentication to the endpoint: API key, OAuth2, or mTLS depending on the use case. Never expose AI services without identity verification.',
    guardrail: 'Enforce authentication policies at the API gateway level. Use automated scanning to detect unauthenticated endpoints.',
    owaspCategory: 'LLM02',
    owaspCategoryName: 'Sensitive Info Disclosure',
    severity: 'medium',
  },
  no_rate_limit: {
    description: 'No rate limiting is configured on an AI endpoint, making it vulnerable to abuse and cost overruns.',
    remediation: 'Add rate limiting at the application or API gateway level. Set per-user and per-IP limits appropriate for your use case.',
    guardrail: 'Configure budget alerts on AI provider accounts. Implement token-based rate limiting that accounts for LLM token consumption.',
    owaspCategory: 'LLM10',
    owaspCategoryName: 'Unbounded Consumption',
    severity: 'low',
  },
  deprecated_model: {
    description: 'The workflow uses an AI model version that has been deprecated by the provider and may be removed or lack security patches.',
    remediation: 'Upgrade to the latest stable model version recommended by the provider. Test the new model version in a staging environment first.',
    guardrail: 'Maintain a list of approved model versions. Run AI-BOM in CI to flag deprecated models before deployment.',
    owaspCategory: 'LLM05',
    owaspCategoryName: 'Supply Chain',
    severity: 'low',
  },
  no_error_handling: {
    description: 'AI API calls in the workflow have no error handling, which can lead to silent failures or data loss.',
    remediation: 'Add error handling nodes after AI operations. Configure retry logic with exponential backoff. Log failures for monitoring.',
    guardrail: 'Use n8n error workflows to catch and alert on AI operation failures. Implement circuit breakers for AI provider outages.',
    owaspCategory: 'LLM10',
    owaspCategoryName: 'Unbounded Consumption',
    severity: 'low',
  },
  unpinned_model: {
    description: 'The AI model version is not pinned, meaning provider-side updates could change behavior without notice.',
    remediation: 'Pin the model to a specific version (e.g., gpt-4-0125-preview instead of gpt-4). Document the pinned version in your runbook.',
    guardrail: 'Use a model registry or configuration file to track pinned versions. Alert when a pinned version approaches its deprecation date.',
    owaspCategory: 'LLM05',
    owaspCategoryName: 'Supply Chain',
    severity: 'low',
  },
};

/** Regex patterns for detecting dangerous code in n8n Code nodes. */
export const DANGEROUS_CODE_PATTERNS: readonly string[] = [
  'child_process',
  'execSync\\(',
  'exec\\(',
  'spawn\\(',
  'process\\.exit\\(',
  'eval\\(',
  'Function\\(',
  'new\\s+Function\\(',
  "require\\(['\"]fs['\"]\\)",
  'fs\\.writeFile',
  'fs\\.unlink',
  '__dirname',
  'require\\(\\s*[a-zA-Z_$]',
  'http\\.request',
  'https\\.request',
  'Buffer\\.from',
  "setTimeout\\s*\\(\\s*['\"]",
  "setInterval\\s*\\(\\s*['\"]",
  'document\\.cookie',
  'window\\.location',
];
