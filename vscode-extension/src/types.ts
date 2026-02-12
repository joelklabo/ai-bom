/**
 * Type definitions for AI-BOM scanner results
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ComponentType =
  | 'llm_provider'
  | 'agent_framework'
  | 'model'
  | 'endpoint'
  | 'container'
  | 'tool'
  | 'mcp_server'
  | 'mcp_client'
  | 'workflow';

export type UsageType =
  | 'completion'
  | 'embedding'
  | 'image_gen'
  | 'speech'
  | 'agent'
  | 'tool_use'
  | 'orchestration'
  | 'unknown';

export interface SourceLocation {
  file_path: string;
  line_number: number | null;
  context_snippet: string;
}

export interface RiskAssessment {
  score: number;
  severity: Severity;
  factors: string[];
  owasp_categories: string[];
}

export interface AIComponent {
  id: string;
  name: string;
  type: ComponentType;
  version: string;
  provider: string;
  model_name: string;
  location: SourceLocation;
  usage_type: UsageType;
  risk: RiskAssessment;
  metadata: Record<string, unknown>;
  flags: string[];
  source: string;
}

export interface ScanSummary {
  total_components: number;
  total_files_scanned: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_type: Record<string, number>;
  scan_duration_seconds: number;
  highest_risk_score: number;
}

export interface ScanResult {
  target_path: string;
  scan_timestamp: string;
  ai_bom_version: string;
  components: AIComponent[];
  summary: ScanSummary;
}

export interface ScannerConfig {
  pythonPath: string;
  severityThreshold: Severity;
  deepScan: boolean;
  showInlineDecorations: boolean;
  scanOnSave: boolean;
  autoInstall: boolean;
}
