"use strict";
/**
 * AI-BOM scanner wrapper - executes the Python CLI and parses results
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
exports.AIBOMScanner = void 0;
const child_process = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class AIBOMScanner {
    config;
    outputChannel;
    constructor(config, outputChannel) {
        this.config = config;
        this.outputChannel = outputChannel;
    }
    /**
     * Check if ai-bom is installed
     */
    async isInstalled() {
        try {
            const result = await this.executeCommand(`${this.config.pythonPath} -m pip show ai-bom`);
            return result.exitCode === 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Install ai-bom via pip
     */
    async install() {
        try {
            this.outputChannel.appendLine('Installing ai-bom...');
            const result = await this.executeCommand(`${this.config.pythonPath} -m pip install ai-bom`, { timeout: 60000 });
            if (result.exitCode === 0) {
                this.outputChannel.appendLine('ai-bom installed successfully');
                return true;
            }
            else {
                this.outputChannel.appendLine(`Installation failed: ${result.stderr}`);
                return false;
            }
        }
        catch (error) {
            this.outputChannel.appendLine(`Installation error: ${error}`);
            return false;
        }
    }
    /**
     * Scan a file or directory
     */
    async scan(targetPath) {
        // Check if ai-bom is installed
        const installed = await this.isInstalled();
        if (!installed) {
            if (this.config.autoInstall) {
                const installed = await this.install();
                if (!installed) {
                    throw new Error('ai-bom is not installed. Install it with: pip install ai-bom');
                }
            }
            else {
                throw new Error('ai-bom is not installed. Install it with: pip install ai-bom');
            }
        }
        // Create temp file for JSON output
        const tempFile = path.join(fs.mkdtempSync(path.join(require('os').tmpdir(), 'ai-bom-')), 'results.json');
        try {
            // Build command
            const args = [
                'scan',
                targetPath,
                '--format',
                'cyclonedx',
                '--output',
                tempFile,
                '--quiet'
            ];
            if (this.config.deepScan) {
                args.push('--deep');
            }
            const command = `${this.config.pythonPath} -m ai_bom.cli ${args.join(' ')}`;
            this.outputChannel.appendLine(`Running: ${command}`);
            // Execute scan
            const result = await this.executeCommand(command, { timeout: 120000 });
            if (result.exitCode !== 0 && result.exitCode !== 1) {
                // Exit code 1 is used for policy failures, which is okay
                throw new Error(`Scan failed: ${result.stderr}`);
            }
            // Read results
            const rawOutput = fs.readFileSync(tempFile, 'utf-8');
            const cyclonedxResult = JSON.parse(rawOutput);
            // Convert CycloneDX to our internal format
            const scanResult = this.convertCycloneDXToScanResult(cyclonedxResult, targetPath);
            this.outputChannel.appendLine(`Scan completed: ${scanResult.components.length} components found`);
            return scanResult;
        }
        finally {
            // Cleanup temp file
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }
            catch (error) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Convert CycloneDX format to our internal ScanResult format
     */
    convertCycloneDXToScanResult(cyclonedx, targetPath) {
        const components = (cyclonedx.components || []).map((comp) => {
            // Extract Trusera properties
            const props = comp.properties || [];
            const getRiskProp = (name) => {
                const prop = props.find((p) => p.name === `trusera:ai-bom:${name}`);
                return prop?.value || '';
            };
            const riskScore = parseInt(getRiskProp('risk-score') || '0', 10);
            const severity = getRiskProp('severity') || 'low';
            const factors = getRiskProp('risk-factors')?.split(',') || [];
            const owaspCategories = getRiskProp('owasp-categories')?.split(',') || [];
            const filePath = getRiskProp('file-path') || '';
            const lineNumber = getRiskProp('line-number');
            const componentType = getRiskProp('component-type') || 'llm_provider';
            const provider = getRiskProp('provider') || '';
            const modelName = getRiskProp('model-name') || '';
            const flags = getRiskProp('flags')?.split(',') || [];
            return {
                id: comp.bom_ref || comp['bom-ref'] || `comp-${Math.random()}`,
                name: comp.name,
                type: componentType,
                version: comp.version || '',
                provider: provider,
                model_name: modelName,
                location: {
                    file_path: filePath,
                    line_number: lineNumber ? parseInt(lineNumber, 10) : null,
                    context_snippet: ''
                },
                usage_type: 'unknown',
                risk: {
                    score: riskScore,
                    severity: severity,
                    factors: factors,
                    owasp_categories: owaspCategories
                },
                metadata: {},
                flags: flags,
                source: 'vscode-scan'
            };
        });
        // Build summary
        const bySeverity = components.reduce((acc, comp) => {
            acc[comp.risk.severity] = (acc[comp.risk.severity] || 0) + 1;
            return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });
        const byType = components.reduce((acc, comp) => {
            acc[comp.type] = (acc[comp.type] || 0) + 1;
            return acc;
        }, {});
        const highestRiskScore = components.reduce((max, comp) => Math.max(max, comp.risk.score), 0);
        return {
            target_path: targetPath,
            scan_timestamp: new Date().toISOString(),
            ai_bom_version: cyclonedx.metadata?.tools?.[0]?.version || 'unknown',
            components: components,
            summary: {
                total_components: components.length,
                total_files_scanned: 0,
                by_severity: bySeverity,
                by_type: byType,
                scan_duration_seconds: 0,
                highest_risk_score: highestRiskScore
            }
        };
    }
    /**
     * Execute a shell command
     */
    executeCommand(command, options) {
        return new Promise((resolve, reject) => {
            child_process.exec(command, {
                timeout: options?.timeout || 30000,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            }, (error, stdout, stderr) => {
                if (error && !error.code) {
                    reject(error);
                }
                else {
                    resolve({
                        exitCode: error?.code || 0,
                        stdout: stdout.toString(),
                        stderr: stderr.toString()
                    });
                }
            });
        });
    }
}
exports.AIBOMScanner = AIBOMScanner;
//# sourceMappingURL=scanner.js.map