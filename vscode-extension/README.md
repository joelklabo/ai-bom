# AI-BOM Security Scanner

Scan your codebase for AI/ML security risks directly from VS Code. Discover all AI agents, models, and API integrations hiding in your infrastructure.

## Features

- **Real-time AI/ML Component Detection**: Scan your workspace or individual files for AI/ML libraries, frameworks, models, and APIs
- **Security Risk Assessment**: Get risk scores (0-100) and severity levels (critical/high/medium/low) for each component
- **Problems Panel Integration**: View detected components as diagnostics in VS Code's Problems panel
- **Inline Decorations**: See risk scores directly in your code with inline annotations and gutter icons
- **Interactive Sidebar**: Browse results by severity, navigate to components, and view detailed information
- **Scan on Save**: Automatically scan files when you save them (configurable)
- **Deep Analysis**: Enable AST-based deep scanning for thorough Python analysis
- **Multi-Language Support**: Detects AI components in Python, JavaScript, TypeScript, YAML, JSON, Dockerfiles, and more

## What It Detects

- **LLM Providers**: OpenAI, Anthropic, Google AI, Mistral, Cohere, Ollama, DeepSeek
- **Agent Frameworks**: LangChain, CrewAI, AutoGen, LlamaIndex, LangGraph
- **Model References**: gpt-4o, claude-3-5-sonnet, gemini-1.5-pro, llama-3
- **API Keys**: Hardcoded credentials (sk-*, sk-ant-*, hf_*)
- **AI Containers**: Ollama, vLLM, HuggingFace TGI, NVIDIA Triton
- **Cloud AI Services**: AWS Bedrock/SageMaker, Azure OpenAI/ML, Google Vertex AI
- **MCP Servers**: Model Context Protocol configurations
- **n8n Workflows**: AI nodes and agent chains in n8n JSON files
- **Jupyter Notebooks**: AI imports and model usage in .ipynb files

## Requirements

- VS Code 1.85.0 or higher
- Python 3.10 or higher
- ai-bom Python package (will prompt to install if not found)

## Installation

1. Install the extension from the VS Code Marketplace or from VSIX
2. The extension will check if ai-bom is installed and offer to install it if missing
3. Alternatively, install ai-bom manually:

```bash
pip install ai-bom
# or
pipx install ai-bom
```

## Usage

### Commands

Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and search for:

- **AI-BOM: Scan Workspace** - Scan the entire workspace for AI/ML components
- **AI-BOM: Scan Current File** - Scan only the currently open file
- **AI-BOM: Show Results** - Open the AI-BOM sidebar view
- **AI-BOM: Clear Results** - Clear all scan results
- **AI-BOM: Install Scanner** - Install or reinstall the ai-bom CLI tool

### Context Menu

Right-click on a file in the Explorer or in the editor and select:

- **AI-BOM: Scan Current File**

### Sidebar

The AI-BOM Scanner adds a sidebar view with two panels:

1. **Scan Results**: Browse detected components organized by severity
   - Click on a component to jump to its location in the code
   - Expand components to see detailed information

2. **Summary**: View scan statistics
   - Total components found
   - Highest risk score
   - Scan duration
   - Target path and timestamp

### Status Bar

The status bar shows a quick summary of the last scan:

- `AI-BOM: Clean` - No components detected
- `AI-BOM: N found` - Components detected with no critical/high risks
- `AI-BOM: N high` - High-severity components detected
- `AI-BOM: N critical` - Critical-severity components detected

Click the status bar item to open the AI-BOM sidebar.

### Problems Panel

Detected AI components appear in VS Code's Problems panel with:

- Severity indicators (error/warning/info/hint)
- Component name, type, and risk score
- Related information with risk factors and flags
- Click to navigate to the source location

### Inline Decorations

When enabled, the extension shows:

- Gutter icons indicating component severity
- Inline risk score annotations
- Hover tooltips with detailed component information
- Colored highlights on detected lines

## Extension Settings

Configure the extension via File > Preferences > Settings (search for "ai-bom"):

- `ai-bom.pythonPath`: Path to Python interpreter
  - Default: `python3`
  - Examples: `python3`, `/usr/bin/python3`, `/path/to/venv/bin/python`

- `ai-bom.scanOnSave`: Automatically scan files on save
  - Default: `false`

- `ai-bom.severityThreshold`: Minimum severity level to display
  - Default: `low`
  - Options: `low`, `medium`, `high`, `critical`

- `ai-bom.deepScan`: Enable deep AST-based analysis
  - Default: `false`
  - Note: Slower but more thorough, especially for Python

- `ai-bom.showInlineDecorations`: Show inline risk score decorations
  - Default: `true`

- `ai-bom.autoInstall`: Automatically install ai-bom if not found
  - Default: `false`

## Example Configuration

Add to your `settings.json`:

```json
{
  "ai-bom.pythonPath": "/usr/bin/python3",
  "ai-bom.scanOnSave": true,
  "ai-bom.severityThreshold": "medium",
  "ai-bom.deepScan": false,
  "ai-bom.showInlineDecorations": true,
  "ai-bom.autoInstall": false
}
```

## Screenshots

### Sidebar View
Browse scan results organized by severity with detailed component information.

### Problems Panel
Detected AI components appear as diagnostics with risk scores and severity indicators.

### Inline Decorations
See risk scores directly in your code with gutter icons and inline annotations.

## Troubleshooting

### "ai-bom is not installed"

Install the ai-bom Python package:

```bash
pip install ai-bom
# or
pipx install ai-bom
```

If using a virtual environment, configure `ai-bom.pythonPath` to point to your venv Python:

```json
{
  "ai-bom.pythonPath": "/path/to/venv/bin/python"
}
```

### "Scan failed" or "Command not found"

1. Check that Python 3.10+ is installed: `python3 --version`
2. Verify ai-bom is installed: `python3 -m pip show ai-bom`
3. Check the Output panel (View > Output > AI-BOM Scanner) for detailed error messages
4. Try setting an absolute path for `ai-bom.pythonPath`

### Slow scans

- Disable `ai-bom.deepScan` for faster scans (AST analysis is slower)
- Exclude large directories by adding `.ai-bomignore` file to your workspace
- Use `ai-bom.scanOnSave: false` to avoid automatic scans on every file save

## Privacy & Security

- The extension runs locally and does not send any data to external servers
- All scanning is performed by the open-source ai-bom CLI tool
- No telemetry or analytics are collected

## About AI-BOM

AI-BOM is an open-source AI Bill of Materials scanner developed by Trusera. It helps organizations discover and inventory all AI/LLM components across their infrastructure for compliance, security, and risk management.

- [GitHub Repository](https://github.com/Trusera/ai-bom)
- [Documentation](https://trusera.github.io/ai-bom/)
- [Website](https://trusera.dev)

## License

Apache License 2.0

## Support

- [Report Issues](https://github.com/Trusera/ai-bom/issues)
- [Documentation](https://trusera.github.io/ai-bom/)
- [Community Discussions](https://github.com/Trusera/ai-bom/discussions)
