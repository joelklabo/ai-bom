"use strict";
/**
 * Diagnostic manager for VS Code Problems panel
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
exports.DiagnosticManager = void 0;
const vscode = __importStar(require("vscode"));
class DiagnosticManager {
    diagnosticCollection;
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-bom');
    }
    updateDiagnostics(scanResult) {
        this.clear();
        // Group components by file
        const componentsByFile = new Map();
        for (const component of scanResult.components) {
            const filePath = component.location.file_path;
            if (!componentsByFile.has(filePath)) {
                componentsByFile.set(filePath, []);
            }
            componentsByFile.get(filePath).push(component);
        }
        // Create diagnostics for each file
        for (const [filePath, components] of componentsByFile.entries()) {
            const uri = vscode.Uri.file(filePath);
            const diagnostics = [];
            for (const component of components) {
                const diagnostic = this.createDiagnostic(component);
                if (diagnostic) {
                    diagnostics.push(diagnostic);
                }
            }
            this.diagnosticCollection.set(uri, diagnostics);
        }
    }
    createDiagnostic(component) {
        if (component.location.line_number === null) {
            return null;
        }
        const lineNumber = component.location.line_number - 1; // VS Code uses 0-based line numbers
        const range = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, 1000) // Whole line
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
    mapSeverity(severity) {
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
    buildMessage(component) {
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
    buildRelatedInformation(component, range) {
        const relatedInfo = [];
        const location = new vscode.Location(vscode.Uri.file(component.location.file_path), range);
        // Add risk factors
        for (const factor of component.risk.factors) {
            relatedInfo.push(new vscode.DiagnosticRelatedInformation(location, `Risk Factor: ${factor}`));
        }
        // Add flags
        for (const flag of component.flags) {
            relatedInfo.push(new vscode.DiagnosticRelatedInformation(location, `Flag: ${flag}`));
        }
        // Add OWASP categories
        for (const category of component.risk.owasp_categories) {
            relatedInfo.push(new vscode.DiagnosticRelatedInformation(location, `OWASP: ${category}`));
        }
        return relatedInfo;
    }
    clear() {
        this.diagnosticCollection.clear();
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.DiagnosticManager = DiagnosticManager;
//# sourceMappingURL=diagnostics.js.map