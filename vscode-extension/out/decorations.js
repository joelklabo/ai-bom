"use strict";
/**
 * Editor decorations for showing AI component risk inline
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
exports.DecorationManager = void 0;
const vscode = __importStar(require("vscode"));
class DecorationManager {
    decorationTypes = new Map();
    scanResult = null;
    constructor() {
        // Create decoration types for each severity
        this.decorationTypes.set('critical', this.createDecorationType('critical'));
        this.decorationTypes.set('high', this.createDecorationType('high'));
        this.decorationTypes.set('medium', this.createDecorationType('medium'));
        this.decorationTypes.set('low', this.createDecorationType('low'));
    }
    createDecorationType(severity) {
        const colors = {
            critical: 'rgba(255, 0, 0, 0.3)',
            high: 'rgba(255, 140, 0, 0.3)',
            medium: 'rgba(255, 255, 0, 0.3)',
            low: 'rgba(100, 149, 237, 0.3)'
        };
        return vscode.window.createTextEditorDecorationType({
            backgroundColor: colors[severity],
            isWholeLine: false,
            overviewRulerColor: colors[severity],
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }
    updateScanResult(result) {
        this.scanResult = result;
        this.updateDecorations();
    }
    updateDecorations(editor) {
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
        const componentsBySeverity = new Map([
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
            const decorations = components
                .filter((c) => c.location.line_number !== null)
                .map((component) => {
                const lineNumber = component.location.line_number - 1; // VS Code uses 0-based line numbers
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
    clearDecorations(editor) {
        const activeEditor = editor || vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        for (const decorationType of this.decorationTypes.values()) {
            activeEditor.setDecorations(decorationType, []);
        }
    }
    dispose() {
        for (const decorationType of this.decorationTypes.values()) {
            decorationType.dispose();
        }
        this.decorationTypes.clear();
    }
    normalizeFilePath(filePath) {
        // Normalize file paths for comparison (handle different path separators, etc.)
        return filePath.replace(/\\/g, '/').toLowerCase();
    }
}
exports.DecorationManager = DecorationManager;
//# sourceMappingURL=decorations.js.map