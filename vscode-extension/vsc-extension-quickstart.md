# AI-BOM VS Code Extension Development

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Open the project in VS Code:
   ```bash
   code .
   ```

3. Press F5 to open a new VS Code window with the extension loaded

4. Run the `AI-BOM: Scan Workspace` command from the Command Palette (Ctrl+Shift+P)

5. Set breakpoints in your code inside `src/extension.ts` to debug

6. Find output from your extension in the Debug Console

## Making Changes

1. Edit the TypeScript files in the `src/` directory

2. Recompile on save:
   ```bash
   npm run watch
   ```

3. Reload the Extension Development Host window (Ctrl+R / Cmd+R) to load your changes

## Testing

1. Open the Debug view (Ctrl+Shift+D / Cmd+Shift+D)

2. Select `Run Extension` from the dropdown

3. Press F5 to launch the Extension Development Host

4. Test your commands and features

## Building

1. Compile the extension:
   ```bash
   npm run compile
   ```

2. Package the extension:
   ```bash
   npm run package
   ```

This creates a `.vsix` file that can be installed in VS Code.

## Publishing

1. Install vsce:
   ```bash
   npm install -g @vscode/vsce
   ```

2. Create a Personal Access Token on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/)

3. Login:
   ```bash
   vsce login trusera
   ```

4. Publish:
   ```bash
   vsce publish
   ```

## Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts        # Main extension entry point
│   ├── scanner.ts          # AI-BOM CLI wrapper
│   ├── resultProvider.ts   # TreeView data provider
│   ├── decorations.ts      # Inline decorations
│   ├── diagnostics.ts      # Problems panel integration
│   └── types.ts            # TypeScript type definitions
├── .vscode/
│   ├── launch.json         # Debug configuration
│   ├── tasks.json          # Build tasks
│   └── settings.json       # Workspace settings
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── README.md               # Extension documentation
```

## Key APIs

- `vscode.window.createTreeView()` - Sidebar tree views
- `vscode.languages.createDiagnosticCollection()` - Problems panel
- `vscode.window.createTextEditorDecorationType()` - Inline decorations
- `vscode.commands.registerCommand()` - Command registration
- `vscode.workspace.getConfiguration()` - Settings access

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
