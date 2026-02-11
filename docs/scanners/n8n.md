# n8n Scanner

The n8n scanner detects AI components, agent chains, and security risks in [n8n](https://n8n.io) workflow automation files.

## What It Detects

| Category | Examples |
|----------|----------|
| LLM providers | OpenAI, Anthropic, Google Gemini, Ollama, Azure OpenAI, Mistral, Groq, Cohere, HuggingFace |
| Agent nodes | AI Agent, chains, orchestration flows |
| Tools | HTTP Request, Code, Workflow, Calculator, Wikipedia |
| MCP clients | MCP client tool nodes with SSE/stdio transports |
| Embeddings | OpenAI, Cohere, HuggingFace, Google, Ollama embeddings |
| Vector stores | Pinecone, ChromaDB, Qdrant, Supabase, Weaviate, in-memory |

## Security Checks

The scanner flags the following risks:

- **`hardcoded_credentials`** -- API keys or tokens embedded directly in node parameters
- **`webhook_no_auth`** -- Webhook triggers with no authentication configured
- **`code_http_tools`** -- Agents with both code execution and HTTP request tools (data exfiltration risk)
- **`mcp_unknown_server`** -- MCP client connecting to a non-localhost server
- **`agent_chain_no_validation`** -- Agent chains connected via executeWorkflow with no validation step
- **`multi_agent_no_trust`** -- Multi-agent workflows without trust boundaries
- **Dangerous code patterns** -- `child_process`, `eval()`, `fs.writeFile`, dynamic `require()` in code nodes

## Usage

### Scan exported workflow files

```bash
ai-bom scan ./workflows/ --format table
```

### Scan a single workflow JSON

```bash
ai-bom scan ./my-workflow.json --format sarif
```

### Scan a live n8n instance via API

```bash
ai-bom scan . --n8n-url http://localhost:5678 --n8n-api-key YOUR_API_KEY
```

The live API integration supports pagination and returns workflows from the running instance.

## n8n Community Node

The [n8n-nodes-trusera](https://www.npmjs.com/package/n8n-nodes-trusera) community node lets you run AI-BOM scans directly inside n8n workflows. Install it from the n8n community nodes panel or via:

```bash
cd ~/.n8n
npm install n8n-nodes-trusera
```

The community node provides four nodes:

- **Trusera Dashboard** -- Fetches all workflows via n8n API, scans them, and returns an interactive HTML dashboard with remediation cards
- **Trusera Scan** -- Scans workflows for AI components and security risks
- **Trusera Report** -- Generates reports in multiple formats (Markdown, JSON summary)
- **Trusera Policy** -- Enforces security policies and fails workflows on threshold breaches

The dashboard includes severity charts, OWASP LLM Top 10 mapping, per-flag remediation guidance, and optional AES-256-GCM password protection.

Source code: [`n8n-node/`](https://github.com/trusera/ai-bom/tree/main/n8n-node) in the AI-BOM repository.

## File Detection

The scanner processes `.json` files and validates they are n8n workflows by checking for the presence of both `nodes` (array) and `connections` (object) keys.

## Agent Chain Analysis

When multiple agent nodes are connected in sequence, the scanner traces the chain and reports it. Cross-workflow agent chains (via executeWorkflow nodes) are also detected and flagged.
