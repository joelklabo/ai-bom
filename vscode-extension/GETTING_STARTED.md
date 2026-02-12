# AI-BOM VS Code Extension - Getting Started

Quick guide to set up and start using the AI-BOM Security Scanner extension.

## Installation

### Option 1: Install from VS Code Marketplace (Once Published)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "AI-BOM Security Scanner"
4. Click Install

### Option 2: Install from VSIX (Local Development)

1. Build the extension:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   npm run package
   ```

2. Install the generated `.vsix` file:
   ```bash
   code --install-extension ai-bom-scanner-0.1.0.vsix
   ```

   Or in VS Code:
   - View > Extensions
   - Click "..." menu > "Install from VSIX..."
   - Select the `.vsix` file

### Option 3: Run from Source (Development)

1. Open the extension folder in VS Code:
   ```bash
   cd vscode-extension
   code .
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Press F5 to launch Extension Development Host

## Prerequisites

The extension requires the ai-bom Python CLI tool. Install it with:

```bash
pip install ai-bom
# or
pipx install ai-bom
```

If you don't have it installed, the extension will prompt you to install it automatically.

## First Scan

1. Open a project in VS Code that uses AI/ML libraries (e.g., a Python project with OpenAI, LangChain, etc.)

2. Open the Command Palette:
   - Windows/Linux: Ctrl+Shift+P
   - macOS: Cmd+Shift+P

3. Type "AI-BOM" and select:
   - **AI-BOM: Scan Workspace** - Scan the entire workspace
   - **AI-BOM: Scan Current File** - Scan only the active file

4. The extension will:
   - Run the ai-bom scanner
   - Display results in the sidebar
   - Show diagnostics in the Problems panel
   - Add inline decorations to your code

## Understanding the Results

### Sidebar View

The AI-BOM sidebar (click the shield icon in the Activity Bar) shows:

1. **Scan Results Panel**:
   - Components organized by severity (Critical > High > Medium > Low)
   - Click on a component to jump to its location
   - Expand to see details (provider, model, risk factors, flags)

2. **Summary Panel**:
   - Total components found
   - Highest risk score
   - Scan duration
   - Target path and timestamp

### Problems Panel

Detected AI components appear in the Problems panel (View > Problems) with:

- Error icon for critical severity
- Warning icon for high severity
- Info icon for medium severity
- Hint icon for low severity

Click on a problem to navigate to the code location.

### Inline Decorations

In your code editor, you'll see:

- Gutter icons showing severity level
- Inline annotations with risk scores
- Colored highlights on detected lines
- Hover tooltips with detailed information

### Status Bar

The status bar (bottom right) shows a quick summary:

- `AI-BOM: Clean` - No components found
- `AI-BOM: N found` - Components found, no critical/high risks
- `AI-BOM: N high` - High-severity components detected
- `AI-BOM: N critical` - Critical-severity components detected

Click to open the sidebar.

## Configuration

### Quick Settings

1. Open Settings: File > Preferences > Settings (Ctrl+, / Cmd+,)
2. Search for "ai-bom"
3. Configure:

   - **Python Path**: Path to your Python interpreter
     - Default: `python3`
     - Examples: `/usr/bin/python3`, `/path/to/venv/bin/python`

   - **Scan On Save**: Auto-scan files when you save
     - Default: `false`
     - Enable for real-time scanning

   - **Severity Threshold**: Minimum severity to show
     - Default: `low`
     - Options: `low`, `medium`, `high`, `critical`

   - **Deep Scan**: Enable AST-based analysis
     - Default: `false`
     - Enable for more thorough Python analysis (slower)

   - **Show Inline Decorations**: Show risk scores in code
     - Default: `true`
     - Disable to reduce visual clutter

   - **Auto Install**: Automatically install ai-bom if missing
     - Default: `false`
     - Enable for seamless first-run experience

### Settings JSON

Add to your `settings.json` (File > Preferences > Settings > Open Settings (JSON)):

```json
{
  "ai-bom.pythonPath": "python3",
  "ai-bom.scanOnSave": true,
  "ai-bom.severityThreshold": "medium",
  "ai-bom.deepScan": false,
  "ai-bom.showInlineDecorations": true,
  "ai-bom.autoInstall": false
}
```

### Workspace Settings

Configure per-workspace by creating `.vscode/settings.json`:

```json
{
  "ai-bom.pythonPath": "${workspaceFolder}/.venv/bin/python",
  "ai-bom.scanOnSave": true,
  "ai-bom.deepScan": true
}
```

## Common Use Cases

### Scan on Every Save

Enable automatic scanning:

```json
{
  "ai-bom.scanOnSave": true
}
```

Now every time you save a file, the extension automatically scans it.

### Filter by Severity

Show only high and critical findings:

```json
{
  "ai-bom.severityThreshold": "high"
}
```

### Use with Virtual Environment

Point to your venv Python:

```json
{
  "ai-bom.pythonPath": "${workspaceFolder}/.venv/bin/python"
}
```

### Deep Python Analysis

Enable AST-based scanning for Python:

```json
{
  "ai-bom.deepScan": true
}
```

This detects decorators (@agent, @tool, @crew) and function calls to AI APIs.

### Minimal Visual Clutter

Disable inline decorations:

```json
{
  "ai-bom.showInlineDecorations": false
}
```

Results still appear in the sidebar and Problems panel.

## Example Projects to Try

Scan these open-source projects to see the extension in action:

1. **LangChain**:
   ```bash
   git clone https://github.com/langchain-ai/langchain
   code langchain
   # Run: AI-BOM: Scan Workspace
   ```

2. **AutoGen**:
   ```bash
   git clone https://github.com/microsoft/autogen
   code autogen
   # Run: AI-BOM: Scan Workspace
   ```

3. **CrewAI**:
   ```bash
   git clone https://github.com/joaomdmoura/crewAI
   code crewAI
   # Run: AI-BOM: Scan Workspace
   ```

## Keyboard Shortcuts

Add custom shortcuts in File > Preferences > Keyboard Shortcuts:

```json
[
  {
    "key": "ctrl+shift+a",
    "command": "ai-bom.scanWorkspace"
  },
  {
    "key": "ctrl+shift+f",
    "command": "ai-bom.scanFile"
  }
]
```

## Troubleshooting

### "ai-bom is not installed"

1. Install ai-bom:
   ```bash
   pip install ai-bom
   ```

2. Or enable auto-install:
   ```json
   {
     "ai-bom.autoInstall": true
   }
   ```

### "Command not found" or "Python not found"

1. Check Python installation:
   ```bash
   python3 --version
   ```

2. Set absolute Python path:
   ```json
   {
     "ai-bom.pythonPath": "/usr/bin/python3"
   }
   ```

3. Check Output panel for details:
   - View > Output
   - Select "AI-BOM Scanner" from dropdown

### Scans are slow

1. Disable deep scan:
   ```json
   {
     "ai-bom.deepScan": false
   }
   ```

2. Disable scan on save:
   ```json
   {
     "ai-bom.scanOnSave": false
   }
   ```

3. Add `.ai-bomignore` file to exclude directories:
   ```
   node_modules/
   .venv/
   dist/
   build/
   ```

### No results found

1. Check that your project uses AI/ML libraries
2. Enable deep scan for Python projects
3. Check Output panel for errors
4. Manually run ai-bom CLI to verify:
   ```bash
   python3 -m ai_bom.cli scan . --format table
   ```

## Next Steps

- Explore the [README](README.md) for detailed feature descriptions
- Read [DEVELOPMENT.md](DEVELOPMENT.md) to contribute or customize
- Check [CHANGELOG.md](CHANGELOG.md) for version history
- Report issues at https://github.com/Trusera/ai-bom/issues

## Support

- Documentation: https://trusera.github.io/ai-bom/
- GitHub: https://github.com/Trusera/ai-bom
- Discussions: https://github.com/Trusera/ai-bom/discussions
- Website: https://trusera.dev
