# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-02-10

### Added
- **Web Dashboard**: Interactive FastAPI + SQLite dashboard for scan history, comparison, and visualization
  - `ai-bom dashboard` command to launch local web server
  - `--save-dashboard` flag to persist scan results
  - REST API: GET/POST/DELETE scans, compare scans side-by-side
  - Dark-themed HTML dashboard with severity charts and drill-down
  - Optional install: `pip install ai-bom[dashboard]`
- **SPDX 3.0 AI Profile Reporter**: EU AI Act compliant output format
  - JSON-LD output with `ai:AIPackage` elements and `ai:safetyRiskAssessment`
  - `--format spdx3` flag
- **Live n8n API Integration**: Scan running n8n instances via REST API
  - `--n8n-url` and `--n8n-api-key` flags replace the previous stub
  - Pagination support, auth error handling
- **CI/CD Policy Enforcement**: Gate builds on AI component violations
  - `--fail-on <severity>` flag — exit code 1 on threshold breach
  - `--policy <file>` flag — YAML policy file with thresholds, blocked providers, and flags
  - Updated GitHub Action with `fail-on` and `policy-file` inputs
- **AST-Based Python Scanning**: Deep analysis via `--deep` flag
  - Detects imports, decorators (@agent, @tool, @crew), function calls to AI APIs
  - String literal model name detection
- **Live Cloud API Scanning**: Discover managed AI services invisible to file scanning
  - `ai-bom scan-cloud aws` — Bedrock, SageMaker, Comprehend, Kendra
  - `ai-bom scan-cloud gcp` — Vertex AI, Dialogflow CX
  - `ai-bom scan-cloud azure` — Azure OpenAI, Cognitive Services, Azure ML
  - Optional install: `pip install ai-bom[aws]`, `ai-bom[gcp]`, `ai-bom[azure]`
- **Enhanced Detection Capabilities**:
  - A2A (Agent-to-Agent) protocol detection
  - CrewAI flow decorator detection (@crew, @agent, @task, @flow, @tool)
  - MCP config file parsing (mcp.json, .mcp.json, claude_desktop_config.json)
  - Latest model patterns: GPT-4.5, o1/o3, Claude 4/4.5, Gemini 2.0, Llama 4, DeepSeek
  - New deprecated models: gpt-4-0314, gpt-4-0613, claude-2.1, claude-3-haiku-20240307
- `--quiet` / `-q` flag for CI-friendly output (suppresses banner and progress)
- Example policy file: `.ai-bom-policy.yml`

### Changed
- README Quick Start now recommends `pipx install ai-bom` (PEP 668 fix)
- Added `requests>=2.28.0` to core dependencies
- Reduced sdist size by excluding assets, demo-video, node_modules
- 304 tests (up from 135)

## [0.1.0] - 2026-02-08

### Added
- 5 scanners: code, docker, network, cloud (Terraform/CloudFormation), n8n workflows
- AI SDK detection for OpenAI, Anthropic, Google, Mistral, Cohere, HuggingFace, and more
- Model version pinning and deprecation checks
- Shadow AI detection (undeclared AI dependencies)
- Hardcoded API key detection
- n8n workflow agent chain analysis with MCP risk assessment
- 5 output formats: table, JSON/CycloneDX, HTML, Markdown, SARIF
- SARIF 2.1.0 output for GitHub Code Scanning integration
- Single-file and directory scanning
- Git repository URL scanning (auto-clone)
- Severity filtering (critical, high, medium, low)
- Risk scoring engine with multi-factor assessment
- GitHub Action for CI/CD integration (`trusera/ai-bom@v1`)
- Docker container distribution
- Comprehensive test suite covering scanners and reporters

[Unreleased]: https://github.com/trusera/ai-bom/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/trusera/ai-bom/compare/v0.1.0...v2.0.0
[0.1.0]: https://github.com/trusera/ai-bom/releases/tag/v0.1.0
