"use strict";
/**
 * TreeDataProvider for displaying scan results in VS Code sidebar
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryTreeProvider = exports.ResultTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ResultTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    type;
    component;
    severity;
    constructor(label, collapsibleState, type, component, severity) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.type = type;
        this.component = component;
        this.severity = severity;
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
        }
        else if (type === 'severity-group') {
            this.iconPath = this.getIconForSeverity(severity);
            this.contextValue = 'severity-group';
        }
        else if (type === 'detail') {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = 'detail';
        }
    }
    buildTooltip(component) {
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
    getIconForSeverity(severity) {
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
class ResultTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    scanResult = null;
    severityThreshold = 'low';
    constructor() { }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    updateResult(result) {
        this.scanResult = result;
        this.refresh();
    }
    setSeverityThreshold(threshold) {
        this.severityThreshold = threshold;
        this.refresh();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.scanResult) {
            return Promise.resolve([]);
        }
        if (!element) {
            // Root level - show severity groups
            return Promise.resolve(this.getSeverityGroups());
        }
        if (element.type === 'severity-group') {
            // Show components for this severity
            return Promise.resolve(this.getComponentsForSeverity(element.severity));
        }
        if (element.type === 'component') {
            // Show component details
            return Promise.resolve(this.getComponentDetails(element.component));
        }
        return Promise.resolve([]);
    }
    getSeverityGroups() {
        if (!this.scanResult) {
            return [];
        }
        const severityOrder = ['critical', 'high', 'medium', 'low'];
        const thresholdIndex = severityOrder.indexOf(this.severityThreshold);
        const relevantSeverities = severityOrder.slice(0, thresholdIndex + 1);
        const groups = [];
        for (const severity of relevantSeverities) {
            const count = this.scanResult.summary.by_severity[severity] || 0;
            if (count > 0) {
                const label = `${severity.toUpperCase()} (${count})`;
                groups.push(new ResultTreeItem(label, vscode.TreeItemCollapsibleState.Expanded, 'severity-group', undefined, severity));
            }
        }
        return groups;
    }
    getComponentsForSeverity(severity) {
        if (!this.scanResult) {
            return [];
        }
        const components = this.scanResult.components.filter((c) => c.risk.severity === severity);
        return components.map((component) => {
            const label = this.formatComponentLabel(component);
            return new ResultTreeItem(label, vscode.TreeItemCollapsibleState.Collapsed, 'component', component);
        });
    }
    formatComponentLabel(component) {
        let label = component.name;
        if (component.version) {
            label += ` (${component.version})`;
        }
        return label;
    }
    getComponentDetails(component) {
        const details = [];
        details.push(new ResultTreeItem(`Type: ${component.type}`, vscode.TreeItemCollapsibleState.None, 'detail'));
        if (component.provider) {
            details.push(new ResultTreeItem(`Provider: ${component.provider}`, vscode.TreeItemCollapsibleState.None, 'detail'));
        }
        if (component.model_name) {
            details.push(new ResultTreeItem(`Model: ${component.model_name}`, vscode.TreeItemCollapsibleState.None, 'detail'));
        }
        const fileName = path.basename(component.location.file_path);
        let fileLabel = `File: ${fileName}`;
        if (component.location.line_number) {
            fileLabel += `:${component.location.line_number}`;
        }
        details.push(new ResultTreeItem(fileLabel, vscode.TreeItemCollapsibleState.None, 'detail'));
        if (component.risk.factors.length > 0) {
            details.push(new ResultTreeItem(`Risk Factors: ${component.risk.factors.length}`, vscode.TreeItemCollapsibleState.None, 'detail'));
        }
        if (component.flags.length > 0) {
            for (const flag of component.flags) {
                details.push(new ResultTreeItem(`Flag: ${flag}`, vscode.TreeItemCollapsibleState.None, 'detail'));
            }
        }
        return details;
    }
    getScanResult() {
        return this.scanResult;
    }
}
exports.ResultTreeProvider = ResultTreeProvider;
/**
 * TreeDataProvider for summary statistics
 */
class SummaryTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    scanResult = null;
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    updateResult(result) {
        this.scanResult = result;
        this.refresh();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        if (!this.scanResult) {
            const emptyItem = new vscode.TreeItem('No scan results', vscode.TreeItemCollapsibleState.None);
            emptyItem.iconPath = new vscode.ThemeIcon('info');
            return Promise.resolve([emptyItem]);
        }
        const items = [];
        // Total components
        items.push(this.createItem(`Total Components: ${this.scanResult.summary.total_components}`, 'symbol-number'));
        // Highest risk score
        items.push(this.createItem(`Highest Risk Score: ${this.scanResult.summary.highest_risk_score}/100`, 'flame'));
        // Scan duration
        const duration = this.scanResult.summary.scan_duration_seconds.toFixed(2);
        items.push(this.createItem(`Scan Duration: ${duration}s`, 'watch'));
        // Target path
        items.push(this.createItem(`Target: ${path.basename(this.scanResult.target_path)}`, 'folder'));
        // Timestamp
        const timestamp = new Date(this.scanResult.scan_timestamp).toLocaleString();
        items.push(this.createItem(`Scanned: ${timestamp}`, 'calendar'));
        return Promise.resolve(items);
    }
    createItem(label, icon) {
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        item.iconPath = new vscode.ThemeIcon(icon);
        return item;
    }
}
exports.SummaryTreeProvider = SummaryTreeProvider;
//# sourceMappingURL=resultProvider.js.map