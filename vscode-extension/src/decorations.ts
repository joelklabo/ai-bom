/**
 * Editor decorations for showing AI component risk inline
 */

import * as vscode from 'vscode';
import { AIComponent, ScanResult, Severity } from './types';

export class DecorationManager {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
  private scanResult: ScanResult | null = null;

  constructor() {
    // Create decoration types for each severity
    this.decorationTypes.set('critical', this.createDecorationType('critical'));
    this.decorationTypes.set('high', this.createDecorationType('high'));
    this.decorationTypes.set('medium', this.createDecorationType('medium'));
    this.decorationTypes.set('low', this.createDecorationType('low'));
  }

  private createDecorationType(severity: Severity): vscode.TextEditorDecorationType {
    const colors: Record<Severity, string> = {
      critical: 'rgba(255, 0, 0, 0.3)',
      high: 'rgba(255, 140, 0, 0.3)',
      medium: 'rgba(255, 255, 0, 0.3)',
      low: 'rgba(100, 149, 237, 0.3)'
    };

    const gutterIcons: Record<Severity, string> = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'circle-outline'
    };

    return vscode.window.createTextEditorDecorationType({
      backgroundColor: colors[severity],
      isWholeLine: false,
      gutterIconPath: new vscode.ThemeIcon(gutterIcons[severity]),
      gutterIconSize: 'contain',
      overviewRulerColor: colors[severity],
      overviewRulerLane: vscode.OverviewRulerLane.Right
    });
  }

  updateScanResult(result: ScanResult | null): void {
    this.scanResult = result;
    this.updateDecorations();
  }

  updateDecorations(editor?: vscode.TextEditor): void {
    if (!this.scanResult) {
      this.clearDecorations();
      return;
    }

    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;

    // Group components by severity for this file
    const componentsBySeverity: Map<Severity, AIComponent[]> = new Map([
      ['critical', []],
      ['high', []],
      ['medium', []],
      ['low', []]
    ]);

    for (const component of this.scanResult.components) {
      if (this.normalizeFilePath(component.location.file_path) === this.normalizeFilePath(filePath)) {
        const severity = component.risk.severity;
        componentsBySeverity.get(severity)?.push(component);
      }
    }

    // Apply decorations for each severity
    for (const [severity, components] of componentsBySeverity.entries()) {
      const decorationType = this.decorationTypes.get(severity);
      if (!decorationType) {
        continue;
      }

      const decorations: vscode.DecorationOptions[] = components
        .filter((c) => c.location.line_number !== null)
        .map((component) => {
          const lineNumber = component.location.line_number! - 1; // VS Code uses 0-based line numbers
          const line = activeEditor.document.lineAt(lineNumber);

          const hoverMessage = new vscode.MarkdownString();
          hoverMessage.appendMarkdown(`**AI Component Detected**\n\n`);
          hoverMessage.appendMarkdown(`- **Name:** ${component.name}\n`);
          hoverMessage.appendMarkdown(`- **Type:** ${component.type}\n`);
          hoverMessage.appendMarkdown(`- **Risk Score:** ${component.risk.score}/100\n`);
          hoverMessage.appendMarkdown(`- **Severity:** ${component.risk.severity.toUpperCase()}\n`);

          if (component.provider) {
            hoverMessage.appendMarkdown(`- **Provider:** ${component.provider}\n`);
          }

          if (component.model_name) {
            hoverMessage.appendMarkdown(`- **Model:** ${component.model_name}\n`);
          }

          if (component.risk.factors.length > 0) {
            hoverMessage.appendMarkdown(`\n**Risk Factors:**\n`);
            for (const factor of component.risk.factors) {
              hoverMessage.appendMarkdown(`- ${factor}\n`);
            }
          }

          if (component.flags.length > 0) {
            hoverMessage.appendMarkdown(`\n**Flags:**\n`);
            for (const flag of component.flags) {
              hoverMessage.appendMarkdown(`- ${flag}\n`);
            }
          }

          return {
            range: line.range,
            hoverMessage: hoverMessage,
            renderOptions: {
              after: {
                contentText: ` Risk: ${component.risk.score}`,
                color: 'rgba(153, 153, 153, 0.8)',
                fontStyle: 'italic',
                margin: '0 0 0 1em'
              }
            }
          };
        });

      activeEditor.setDecorations(decorationType, decorations);
    }
  }

  clearDecorations(editor?: vscode.TextEditor): void {
    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    for (const decorationType of this.decorationTypes.values()) {
      activeEditor.setDecorations(decorationType, []);
    }
  }

  dispose(): void {
    for (const decorationType of this.decorationTypes.values()) {
      decorationType.dispose();
    }
    this.decorationTypes.clear();
  }

  private normalizeFilePath(filePath: string): string {
    // Normalize file paths for comparison (handle different path separators, etc.)
    return filePath.replace(/\\/g, '/').toLowerCase();
  }
}
