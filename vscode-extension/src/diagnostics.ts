/**
 * Diagnostic manager for VS Code Problems panel
 */

import * as vscode from 'vscode';
import { AIComponent, ScanResult, Severity } from './types';

export class DiagnosticManager {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-bom');
  }

  updateDiagnostics(scanResult: ScanResult): void {
    this.clear();

    // Group components by file
    const componentsByFile = new Map<string, AIComponent[]>();

    for (const component of scanResult.components) {
      const filePath = component.location.file_path;
      if (!componentsByFile.has(filePath)) {
        componentsByFile.set(filePath, []);
      }
      componentsByFile.get(filePath)!.push(component);
    }

    // Create diagnostics for each file
    for (const [filePath, components] of componentsByFile.entries()) {
      const uri = vscode.Uri.file(filePath);
      const diagnostics: vscode.Diagnostic[] = [];

      for (const component of components) {
        const diagnostic = this.createDiagnostic(component);
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      }

      this.diagnosticCollection.set(uri, diagnostics);
    }
  }

  private createDiagnostic(component: AIComponent): vscode.Diagnostic | null {
    if (component.location.line_number === null) {
      return null;
    }

    const lineNumber = component.location.line_number - 1; // VS Code uses 0-based line numbers
    const range = new vscode.Range(
      new vscode.Position(lineNumber, 0),
      new vscode.Position(lineNumber, 1000) // Whole line
    );

    const severity = this.mapSeverity(component.risk.severity);
    const message = this.buildMessage(component);

    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'ai-bom';
    diagnostic.code = component.type;

    // Add related information
    if (component.risk.factors.length > 0 || component.flags.length > 0) {
      diagnostic.relatedInformation = this.buildRelatedInformation(component, range);
    }

    return diagnostic;
  }

  private mapSeverity(severity: Severity): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'critical':
        return vscode.DiagnosticSeverity.Error;
      case 'high':
        return vscode.DiagnosticSeverity.Warning;
      case 'medium':
        return vscode.DiagnosticSeverity.Information;
      case 'low':
        return vscode.DiagnosticSeverity.Hint;
    }
  }

  private buildMessage(component: AIComponent): string {
    const parts = [
      `AI Component: ${component.name}`,
      `(${component.type})`,
      `- Risk: ${component.risk.score}/100`,
      `(${component.risk.severity.toUpperCase()})`
    ];

    if (component.provider) {
      parts.push(`- Provider: ${component.provider}`);
    }

    if (component.model_name) {
      parts.push(`- Model: ${component.model_name}`);
    }

    return parts.join(' ');
  }

  private buildRelatedInformation(
    component: AIComponent,
    range: vscode.Range
  ): vscode.DiagnosticRelatedInformation[] {
    const relatedInfo: vscode.DiagnosticRelatedInformation[] = [];
    const location = new vscode.Location(
      vscode.Uri.file(component.location.file_path),
      range
    );

    // Add risk factors
    for (const factor of component.risk.factors) {
      relatedInfo.push(
        new vscode.DiagnosticRelatedInformation(location, `Risk Factor: ${factor}`)
      );
    }

    // Add flags
    for (const flag of component.flags) {
      relatedInfo.push(
        new vscode.DiagnosticRelatedInformation(location, `Flag: ${flag}`)
      );
    }

    // Add OWASP categories
    for (const category of component.risk.owasp_categories) {
      relatedInfo.push(
        new vscode.DiagnosticRelatedInformation(location, `OWASP: ${category}`)
      );
    }

    return relatedInfo;
  }

  clear(): void {
    this.diagnosticCollection.clear();
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
