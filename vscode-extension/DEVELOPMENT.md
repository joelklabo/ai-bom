# AI-BOM VS Code Extension - Development Guide

This document provides comprehensive instructions for developing, testing, and publishing the AI-BOM VS Code extension.

## Prerequisites

- Node.js 18+ and npm
- VS Code 1.85.0 or higher
- Python 3.10+ with ai-bom installed
- TypeScript knowledge

## Initial Setup

1. Clone the repository:
   ```bash
   cd /path/to/ai-bom
   cd vscode-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the TypeScript code:
   ```bash
   npm run compile
   ```

## Development Workflow

### Running the Extension

1. Open the `vscode-extension` folder in VS Code:
   ```bash
   code .
   ```

2. Press `F5` or select "Run > Start Debugging" to launch the Extension Development Host

3. In the new VS Code window, open a project and test the commands:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run "AI-BOM: Scan Workspace"

### Hot Reloading

1. Start the watch task:
   ```bash
   npm run watch
   ```

2. When you make changes to TypeScript files, they automatically recompile

3. Reload the Extension Development Host:
   - Press Ctrl+R / Cmd+R in the Extension Development Host window
   - Or use the reload icon in the debug toolbar

### Debugging

1. Set breakpoints in your TypeScript code (src/extension.ts, etc.)

2. Launch the extension with F5

3. When the breakpoint hits, inspect variables and step through code

4. View debug output in:
   - VS Code Debug Console (your extension's logs)
   - Extension Development Host's Output panel (AI-BOM Scanner channel)

## Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts        # Main entry point - activates extension
│   ├── scanner.ts          # Wraps ai-bom CLI, handles execution
│   ├── resultProvider.ts   # TreeView data providers for sidebar
│   ├── decorations.ts      # Inline editor decorations
│   ├── diagnostics.ts      # VS Code Problems panel integration
│   └── types.ts            # TypeScript type definitions
├── out/                    # Compiled JavaScript (generated)
├── .vscode/
│   ├── launch.json         # F5 debug configuration
│   ├── tasks.json          # Build tasks
│   └── settings.json       # Workspace settings
├── images/
│   └── icon.png            # Extension icon (128x128)
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript compiler config
├── .vscodeignore           # Files excluded from .vsix package
├── .eslintrc.json          # ESLint configuration
├── README.md               # Marketplace documentation
├── CHANGELOG.md            # Version history
└── LICENSE                 # Apache 2.0 license
```

## Key Files Explained

### package.json

The extension manifest defines:

- **Metadata**: name, version, publisher, description
- **Activation Events**: when the extension loads
- **Commands**: user-facing commands
- **Configuration**: extension settings
- **Views**: sidebar panels
- **Menus**: where commands appear (Command Palette, context menus)

### src/extension.ts

Main entry point with two key functions:

- `activate()`: Called when the extension is activated
  - Registers commands
  - Creates UI components (tree views, status bar, diagnostics)
  - Sets up event listeners

- `deactivate()`: Called when the extension is deactivated
  - Cleanup is handled by VS Code subscriptions

### src/scanner.ts

Wraps the ai-bom CLI:

- `isInstalled()`: Checks if ai-bom Python package is installed
- `install()`: Installs ai-bom via pip
- `scan()`: Executes ai-bom scan command and parses results

### src/resultProvider.ts

Implements `TreeDataProvider` for sidebar views:

- `ResultTreeProvider`: Shows scan results organized by severity
- `SummaryTreeProvider`: Shows scan statistics

### src/decorations.ts

Manages inline editor decorations:

- Creates decoration types for each severity level
- Updates decorations based on scan results
- Shows gutter icons, highlights, and hover tooltips

### src/diagnostics.ts

Integrates with VS Code's Problems panel:

- Creates diagnostic entries for each detected component
- Maps severity levels to VS Code diagnostic severity
- Adds related information (risk factors, flags, OWASP categories)

## Configuration Schema

Extension settings are defined in `package.json` under `contributes.configuration`:

```json
{
  "ai-bom.pythonPath": {
    "type": "string",
    "default": "python3",
    "description": "Path to Python interpreter"
  },
  "ai-bom.scanOnSave": {
    "type": "boolean",
    "default": false,
    "description": "Automatically scan files on save"
  },
  "ai-bom.severityThreshold": {
    "type": "string",
    "enum": ["low", "medium", "high", "critical"],
    "default": "low",
    "description": "Minimum severity level to display"
  }
}
```

Access settings in code:

```typescript
const config = vscode.workspace.getConfiguration('ai-bom');
const pythonPath = config.get<string>('pythonPath', 'python3');
```

## Testing

### Manual Testing

1. Launch Extension Development Host (F5)

2. Test each command:
   - AI-BOM: Scan Workspace
   - AI-BOM: Scan Current File
   - AI-BOM: Show Results
   - AI-BOM: Clear Results
   - AI-BOM: Install Scanner

3. Test with different project types:
   - Python projects with LangChain, OpenAI, etc.
   - JavaScript/TypeScript projects with AI libraries
   - Projects with Dockerfiles, YAML configs, etc.

4. Test configuration changes:
   - Change `severityThreshold` and verify filtering
   - Toggle `scanOnSave` and verify auto-scan behavior
   - Change `pythonPath` and verify scanner still works

5. Test error conditions:
   - Scan without ai-bom installed
   - Scan non-existent path
   - Scan empty workspace

### Integration Testing

Test with real projects:

1. Clone a repository with AI dependencies:
   ```bash
   git clone https://github.com/langchain-ai/langchain
   cd langchain
   ```

2. Open in Extension Development Host

3. Run scan and verify:
   - Components are detected
   - Severity levels are correct
   - File paths and line numbers are accurate
   - Inline decorations appear
   - Problems panel shows diagnostics

## Building and Packaging

### Compile

```bash
npm run compile
```

This runs `tsc -p ./` to compile TypeScript to JavaScript in the `out/` directory.

### Package

```bash
npm run package
```

This runs `vsce package` to create a `.vsix` file that can be installed in VS Code.

The `.vsix` file includes:

- Compiled JavaScript (`out/`)
- Package manifest (`package.json`)
- README, LICENSE, CHANGELOG
- Icon (`images/icon.png`)

Files excluded (defined in `.vscodeignore`):

- Source TypeScript files (`src/`)
- Development files (`.vscode/`, `tsconfig.json`, etc.)
- Node modules (bundled by vsce if needed)

### Install Locally

```bash
code --install-extension ai-bom-scanner-0.1.0.vsix
```

Or in VS Code:

1. View > Extensions
2. Click "..." menu
3. "Install from VSIX..."
4. Select the `.vsix` file

## Publishing to Marketplace

### Prerequisites

1. Create a [Visual Studio Marketplace publisher account](https://marketplace.visualstudio.com/manage)

2. Generate a Personal Access Token:
   - Go to https://dev.azure.com/
   - User Settings > Personal Access Tokens
   - Create token with "Marketplace (Manage)" scope

3. Install vsce:
   ```bash
   npm install -g @vscode/vsce
   ```

### Publish Steps

1. Update version in `package.json`:
   ```json
   {
     "version": "0.1.0"
   }
   ```

2. Update CHANGELOG.md with release notes

3. Login to vsce:
   ```bash
   vsce login trusera
   ```
   Enter your Personal Access Token when prompted.

4. Publish:
   ```bash
   vsce publish
   ```

   Or publish with version bump:
   ```bash
   vsce publish minor  # 0.1.0 -> 0.2.0
   vsce publish patch  # 0.1.0 -> 0.1.1
   vsce publish major  # 0.1.0 -> 1.0.0
   ```

### Pre-publish Checklist

- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] README.md is complete and accurate
- [ ] Icon image exists at `images/icon.png` (128x128 PNG)
- [ ] Extension tested in clean VS Code instance
- [ ] All TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] License file is correct (Apache 2.0)
- [ ] Repository URL is correct in `package.json`

### Marketplace Listing

After publishing, your extension appears at:
- https://marketplace.visualstudio.com/items?itemName=trusera.ai-bom-scanner

The listing shows:

- Extension name, icon, and description (from `package.json`)
- README.md content (as HTML)
- Screenshots (add to README or upload separately)
- Ratings and reviews
- Version history (from CHANGELOG.md)

## Code Quality

### Linting

```bash
npm run lint
```

This runs ESLint on the TypeScript source files. Fix issues automatically:

```bash
npm run lint -- --fix
```

### TypeScript Strict Mode

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

This catches many bugs at compile time.

### VS Code API Guidelines

Follow [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines):

- Use native VS Code UI components (tree views, diagnostics, etc.)
- Follow VS Code theme colors
- Provide clear command names and descriptions
- Use icons from VS Code's built-in icon set (ThemeIcon)
- Handle errors gracefully with user-friendly messages
- Log detailed errors to the Output channel

## Troubleshooting

### Extension not activating

Check activation events in `package.json`:

```json
{
  "activationEvents": [
    "onCommand:ai-bom.scanWorkspace",
    "onLanguage:python"
  ]
}
```

The extension activates when:
- A command is invoked
- A file with specified language is opened

### Commands not appearing

1. Check command registration in `package.json`:
   ```json
   {
     "contributes": {
       "commands": [
         {
           "command": "ai-bom.scanWorkspace",
           "title": "AI-BOM: Scan Workspace"
         }
       ]
     }
   }
   ```

2. Check command registration in `extension.ts`:
   ```typescript
   context.subscriptions.push(
     vscode.commands.registerCommand('ai-bom.scanWorkspace', async () => {
       await scanWorkspace();
     })
   );
   ```

### Scanner not found

1. Check Python path configuration:
   ```typescript
   const config = vscode.workspace.getConfiguration('ai-bom');
   const pythonPath = config.get<string>('pythonPath', 'python3');
   ```

2. Verify ai-bom is installed:
   ```bash
   python3 -m pip show ai-bom
   ```

3. Check Output panel for detailed error messages

### Decorations not showing

1. Verify `showInlineDecorations` is enabled
2. Check that scan results include file paths and line numbers
3. Ensure active editor's file path matches component file path
4. Check `DecorationManager.updateDecorations()` is called

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [TreeView API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Diagnostics API](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#provide-diagnostics)

## Support

- Report bugs: https://github.com/Trusera/ai-bom/issues
- Discussions: https://github.com/Trusera/ai-bom/discussions
- Documentation: https://trusera.github.io/ai-bom/
