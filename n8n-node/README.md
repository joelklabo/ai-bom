# n8n-nodes-trusera

n8n community node to scan workflows for AI security risks using Trusera AI-BOM.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

[Trusera](https://trusera.dev) provides AI Bill of Materials (AI-BOM) scanning for detecting security risks in AI-powered workflows.

## Nodes

### Trusera Scan

Scans n8n workflow JSON for AI components and security risks. Detects:

- LLM providers (OpenAI, Anthropic, Google, Ollama, etc.)
- Agent frameworks and multi-agent chains
- MCP client/server connections
- Tool usage (code execution, HTTP requests)
- Embedding and vector store configurations
- Hardcoded API keys and credentials
- Dangerous code patterns

### Trusera Policy

Evaluates scan results against configurable security policies:

- Maximum critical/high severity component limits
- Maximum risk score thresholds
- Provider blocklists
- Flag blocklists

### Trusera Report

Generates human-readable security reports from scan results:

- Markdown format with severity breakdown
- JSON summary format
- Configurable severity threshold

## Credentials

### Trusera API

Configure with your Trusera API key (`tsk_` prefix) and base URL for self-hosted instances.

## Risk Flags

| Flag | Weight | Description |
| --- | --- | --- |
| hardcoded_api_key | 30 | Hardcoded API key detected |
| hardcoded_credentials | 30 | Hardcoded credentials in workflow |
| code_http_tools | 30 | Agent with code execution and HTTP tools |
| shadow_ai | 25 | AI dependency not declared in project files |
| webhook_no_auth | 25 | n8n webhook without authentication |
| internet_facing | 20 | AI endpoint exposed to internet |
| multi_agent_no_trust | 20 | Multi-agent system without trust boundaries |
| agent_chain_no_validation | 20 | Agent-to-agent chain without validation |
| mcp_unknown_server | 20 | MCP client connected to unknown server |
| no_auth | 15 | AI endpoint without authentication |
| no_rate_limit | 10 | No rate limiting on AI endpoint |
| deprecated_model | 10 | Using deprecated AI model |
| no_error_handling | 10 | No error handling for AI calls |
| unpinned_model | 5 | Model version not pinned |

## Severity Thresholds

| Severity | Score Range |
| --- | --- |
| Critical | 76 - 100 |
| High | 51 - 75 |
| Medium | 26 - 50 |
| Low | 0 - 25 |

## License

Apache-2.0
