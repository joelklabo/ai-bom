/**
 * AI-BOM VS Code Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { AIBOMScanner } from './scanner';
import { ResultTreeProvider, SummaryTreeProvider } from './resultProvider';
import { DecorationManager } from './decorations';
import { DiagnosticManager } from './diagnostics';
import { ScannerConfig, AIComponent } from './types';

let outputChannel: vscode.OutputChannel;
let scanner: AIBOMScanner;
let resultProvider: ResultTreeProvider;
let summaryProvider: SummaryTreeProvider;
let decorationManager: DecorationManager;
let diagnosticManager: DiagnosticManager;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  console.log('AI-BOM Scanner extension is now active');

  // Create output channel
  outputChannel = vscode.window.createOutputChannel('AI-BOM Scanner');
  context.subscriptions.push(outputChannel);

  // Initialize components
  const config = getConfig();
  scanner = new AIBOMScanner(config, outputChannel);
  resultProvider = new ResultTreeProvider();
  summaryProvider = new SummaryTreeProvider();
  decorationManager = new DecorationManager();
  diagnosticManager = new DiagnosticManager();

  // Register tree views
  const resultsView = vscode.window.createTreeView('ai-bom-results', {
    treeDataProvider: resultProvider
  });
  context.subscriptions.push(resultsView);

  const summaryView = vscode.window.createTreeView('ai-bom-summary', {
    treeDataProvider: summaryProvider
  });
  context.subscriptions.push(summaryView);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'ai-bom.showResults';
  statusBarItem.text = '$(shield) AI-BOM';
  statusBarItem.tooltip = 'AI-BOM Scanner';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.scanWorkspace', async () => {
      await scanWorkspace();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.scanFile', async () => {
      await scanCurrentFile();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.showResults', () => {
      vscode.commands.executeCommand('workbench.view.extension.ai-bom-explorer');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.clearResults', () => {
      clearResults();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.installScanner', async () => {
      await installScanner();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-bom.openFile', (component: AIComponent) => {
      openComponentFile(component);
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ai-bom')) {
        const newConfig = getConfig();
        scanner = new AIBOMScanner(newConfig, outputChannel);
        resultProvider.setSeverityThreshold(newConfig.severityThreshold);
      }
    })
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && getConfig().showInlineDecorations) {
        decorationManager.updateDecorations(editor);
      }
    })
  );

  // Listen for document saves
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (getConfig().scanOnSave) {
        await scanFile(document.uri.fsPath);
      }
    })
  );

  // Cleanup
  context.subscriptions.push({
    dispose: () => {
      decorationManager.dispose();
      diagnosticManager.dispose();
    }
  });

  // Check if ai-bom is installed
  checkInstallation();
}

export function deactivate(): void {
  // Cleanup is handled by subscriptions
}

/**
 * Get current configuration
 */
function getConfig(): ScannerConfig {
  const config = vscode.workspace.getConfiguration('ai-bom');
  return {
    pythonPath: config.get<string>('pythonPath', 'python3'),
    severityThreshold: config.get<'low' | 'medium' | 'high' | 'critical'>('severityThreshold', 'low'),
    deepScan: config.get<boolean>('deepScan', false),
    showInlineDecorations: config.get<boolean>('showInlineDecorations', true),
    scanOnSave: config.get<boolean>('scanOnSave', false),
    autoInstall: config.get<boolean>('autoInstall', false)
  };
}

/**
 * Check if ai-bom is installed
 */
async function checkInstallation(): Promise<void> {
  const installed = await scanner.isInstalled();

  if (!installed) {
    const action = await vscode.window.showWarningMessage(
      'AI-BOM scanner is not installed. Would you like to install it?',
      'Install',
      'Later'
    );

    if (action === 'Install') {
      await installScanner();
    }
  }
}

/**
 * Install ai-bom scanner
 */
async function installScanner(): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Installing AI-BOM Scanner',
      cancellable: false
    },
    async (progress) => {
      progress.report({ increment: 0, message: 'Running pip install...' });

      const success = await scanner.install();

      if (success) {
        vscode.window.showInformationMessage('AI-BOM scanner installed successfully');
      } else {
        vscode.window.showErrorMessage(
          'Failed to install AI-BOM scanner. Check the output panel for details.'
        );
        outputChannel.show();
      }
    }
  );
}

/**
 * Scan the current workspace
 */
async function scanWorkspace(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const targetPath = workspaceFolders[0].uri.fsPath;
  await scanPath(targetPath);
}

/**
 * Scan the current file
 */
async function scanCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No active file');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  await scanFile(filePath);
}

/**
 * Scan a specific path
 */
async function scanPath(targetPath: string): Promise<void> {
  outputChannel.clear();
  outputChannel.show(true);

  statusBarItem.text = '$(loading~spin) AI-BOM: Scanning...';

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning for AI/ML components',
      cancellable: false
    },
    async (progress) => {
      try {
        progress.report({ increment: 0, message: 'Running AI-BOM scanner...' });

        const result = await scanner.scan(targetPath);

        progress.report({ increment: 50, message: 'Processing results...' });

        // Update providers
        resultProvider.updateResult(result);
        summaryProvider.updateResult(result);

        // Update decorations
        if (getConfig().showInlineDecorations) {
          decorationManager.updateScanResult(result);
        }

        // Update diagnostics
        diagnosticManager.updateDiagnostics(result);

        // Update status bar
        const criticalCount = result.summary.by_severity.critical || 0;
        const highCount = result.summary.by_severity.high || 0;
        const totalCount = result.components.length;

        if (criticalCount > 0) {
          statusBarItem.text = `$(error) AI-BOM: ${criticalCount} critical`;
          statusBarItem.tooltip = `${totalCount} AI components found (${criticalCount} critical, ${highCount} high)`;
        } else if (highCount > 0) {
          statusBarItem.text = `$(warning) AI-BOM: ${highCount} high`;
          statusBarItem.tooltip = `${totalCount} AI components found (${highCount} high)`;
        } else if (totalCount > 0) {
          statusBarItem.text = `$(shield) AI-BOM: ${totalCount} found`;
          statusBarItem.tooltip = `${totalCount} AI components found`;
        } else {
          statusBarItem.text = '$(shield) AI-BOM: Clean';
          statusBarItem.tooltip = 'No AI components detected';
        }

        progress.report({ increment: 100, message: 'Complete' });

        // Show results
        vscode.commands.executeCommand('workbench.view.extension.ai-bom-explorer');

        // Show summary message
        if (totalCount === 0) {
          vscode.window.showInformationMessage('No AI/ML components detected');
        } else {
          const message = `Found ${totalCount} AI component(s): ${criticalCount} critical, ${highCount} high`;
          if (criticalCount > 0) {
            vscode.window.showWarningMessage(message);
          } else {
            vscode.window.showInformationMessage(message);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AI-BOM scan failed: ${errorMessage}`);
        outputChannel.appendLine(`Error: ${errorMessage}`);
        statusBarItem.text = '$(shield) AI-BOM: Error';
        statusBarItem.tooltip = 'Scan failed';
      }
    }
  );
}

/**
 * Scan a specific file
 */
async function scanFile(filePath: string): Promise<void> {
  await scanPath(filePath);
}

/**
 * Clear scan results
 */
function clearResults(): void {
  resultProvider.updateResult(null);
  summaryProvider.updateResult(null);
  decorationManager.updateScanResult(null);
  diagnosticManager.clear();
  statusBarItem.text = '$(shield) AI-BOM';
  statusBarItem.tooltip = 'AI-BOM Scanner';
  vscode.window.showInformationMessage('AI-BOM results cleared');
}

/**
 * Open file at component location
 */
async function openComponentFile(component: AIComponent): Promise<void> {
  try {
    const uri = vscode.Uri.file(component.location.file_path);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    if (component.location.line_number !== null) {
      const lineNumber = component.location.line_number - 1; // VS Code uses 0-based
      const position = new vscode.Position(lineNumber, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open file: ${error}`);
  }
}
