/**
 * TreeDataProvider for displaying scan results in VS Code sidebar
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { AIComponent, ScanResult, Severity } from './types';

type TreeItemType = 'summary' | 'severity-group' | 'component' | 'detail';

class ResultTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: TreeItemType,
    public readonly component?: AIComponent,
    public readonly severity?: Severity
  ) {
    super(label, collapsibleState);

    if (type === 'component' && component) {
      this.tooltip = this.buildTooltip(component);
      this.description = `Risk: ${component.risk.score}`;
      this.iconPath = this.getIconForSeverity(component.risk.severity);
      this.contextValue = 'component';

      // Make component clickable
      if (component.location.file_path) {
        this.command = {
          command: 'ai-bom.openFile',
          title: 'Open File',
          arguments: [component]
        };
      }
    } else if (type === 'severity-group') {
      this.iconPath = this.getIconForSeverity(severity!);
      this.contextValue = 'severity-group';
    } else if (type === 'detail') {
      this.iconPath = new vscode.ThemeIcon('info');
      this.contextValue = 'detail';
    }
  }

  private buildTooltip(component: AIComponent): string {
    const lines = [
      `Name: ${component.name}`,
      `Type: ${component.type}`,
      `Risk Score: ${component.risk.score}/100`,
      `Severity: ${component.risk.severity.toUpperCase()}`,
      `File: ${component.location.file_path}`
    ];

    if (component.location.line_number) {
      lines.push(`Line: ${component.location.line_number}`);
    }

    if (component.provider) {
      lines.push(`Provider: ${component.provider}`);
    }

    if (component.model_name) {
      lines.push(`Model: ${component.model_name}`);
    }

    if (component.risk.factors.length > 0) {
      lines.push(`Risk Factors: ${component.risk.factors.join(', ')}`);
    }

    if (component.flags.length > 0) {
      lines.push(`Flags: ${component.flags.join(', ')}`);
    }

    return lines.join('\n');
  }

  private getIconForSeverity(severity: Severity): vscode.ThemeIcon {
    switch (severity) {
      case 'critical':
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
      case 'high':
        return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
      case 'medium':
        return new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
      case 'low':
        return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('editorInfo.foreground'));
    }
  }
}

export class ResultTreeProvider implements vscode.TreeDataProvider<ResultTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ResultTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private scanResult: ScanResult | null = null;
  private severityThreshold: Severity = 'low';

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateResult(result: ScanResult | null): void {
    this.scanResult = result;
    this.refresh();
  }

  setSeverityThreshold(threshold: Severity): void {
    this.severityThreshold = threshold;
    this.refresh();
  }

  getTreeItem(element: ResultTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ResultTreeItem): Thenable<ResultTreeItem[]> {
    if (!this.scanResult) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - show severity groups
      return Promise.resolve(this.getSeverityGroups());
    }

    if (element.type === 'severity-group') {
      // Show components for this severity
      return Promise.resolve(this.getComponentsForSeverity(element.severity!));
    }

    if (element.type === 'component') {
      // Show component details
      return Promise.resolve(this.getComponentDetails(element.component!));
    }

    return Promise.resolve([]);
  }

  private getSeverityGroups(): ResultTreeItem[] {
    if (!this.scanResult) {
      return [];
    }

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low'];
    const thresholdIndex = severityOrder.indexOf(this.severityThreshold);
    const relevantSeverities = severityOrder.slice(0, thresholdIndex + 1);

    const groups: ResultTreeItem[] = [];

    for (const severity of relevantSeverities) {
      const count = this.scanResult.summary.by_severity[severity] || 0;
      if (count > 0) {
        const label = `${severity.toUpperCase()} (${count})`;
        groups.push(
          new ResultTreeItem(
            label,
            vscode.TreeItemCollapsibleState.Expanded,
            'severity-group',
            undefined,
            severity
          )
        );
      }
    }

    return groups;
  }

  private getComponentsForSeverity(severity: Severity): ResultTreeItem[] {
    if (!this.scanResult) {
      return [];
    }

    const components = this.scanResult.components.filter(
      (c) => c.risk.severity === severity
    );

    return components.map((component) => {
      const label = this.formatComponentLabel(component);
      return new ResultTreeItem(
        label,
        vscode.TreeItemCollapsibleState.Collapsed,
        'component',
        component
      );
    });
  }

  private formatComponentLabel(component: AIComponent): string {
    let label = component.name;

    if (component.version) {
      label += ` (${component.version})`;
    }

    return label;
  }

  private getComponentDetails(component: AIComponent): ResultTreeItem[] {
    const details: ResultTreeItem[] = [];

    details.push(
      new ResultTreeItem(
        `Type: ${component.type}`,
        vscode.TreeItemCollapsibleState.None,
        'detail'
      )
    );

    if (component.provider) {
      details.push(
        new ResultTreeItem(
          `Provider: ${component.provider}`,
          vscode.TreeItemCollapsibleState.None,
          'detail'
        )
      );
    }

    if (component.model_name) {
      details.push(
        new ResultTreeItem(
          `Model: ${component.model_name}`,
          vscode.TreeItemCollapsibleState.None,
          'detail'
        )
      );
    }

    const fileName = path.basename(component.location.file_path);
    let fileLabel = `File: ${fileName}`;
    if (component.location.line_number) {
      fileLabel += `:${component.location.line_number}`;
    }
    details.push(
      new ResultTreeItem(
        fileLabel,
        vscode.TreeItemCollapsibleState.None,
        'detail'
      )
    );

    if (component.risk.factors.length > 0) {
      details.push(
        new ResultTreeItem(
          `Risk Factors: ${component.risk.factors.length}`,
          vscode.TreeItemCollapsibleState.None,
          'detail'
        )
      );
    }

    if (component.flags.length > 0) {
      for (const flag of component.flags) {
        details.push(
          new ResultTreeItem(
            `Flag: ${flag}`,
            vscode.TreeItemCollapsibleState.None,
            'detail'
          )
        );
      }
    }

    return details;
  }

  getScanResult(): ScanResult | null {
    return this.scanResult;
  }
}

/**
 * TreeDataProvider for summary statistics
 */
export class SummaryTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private scanResult: ScanResult | null = null;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateResult(result: ScanResult | null): void {
    this.scanResult = result;
    this.refresh();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<vscode.TreeItem[]> {
    if (!this.scanResult) {
      const emptyItem = new vscode.TreeItem(
        'No scan results',
        vscode.TreeItemCollapsibleState.None
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return Promise.resolve([emptyItem]);
    }

    const items: vscode.TreeItem[] = [];

    // Total components
    items.push(
      this.createItem(
        `Total Components: ${this.scanResult.summary.total_components}`,
        'symbol-number'
      )
    );

    // Highest risk score
    items.push(
      this.createItem(
        `Highest Risk Score: ${this.scanResult.summary.highest_risk_score}/100`,
        'flame'
      )
    );

    // Scan duration
    const duration = this.scanResult.summary.scan_duration_seconds.toFixed(2);
    items.push(
      this.createItem(
        `Scan Duration: ${duration}s`,
        'watch'
      )
    );

    // Target path
    items.push(
      this.createItem(
        `Target: ${path.basename(this.scanResult.target_path)}`,
        'folder'
      )
    );

    // Timestamp
    const timestamp = new Date(this.scanResult.scan_timestamp).toLocaleString();
    items.push(
      this.createItem(
        `Scanned: ${timestamp}`,
        'calendar'
      )
    );

    return Promise.resolve(items);
  }

  private createItem(label: string, icon: string): vscode.TreeItem {
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon(icon);
    return item;
  }
}
