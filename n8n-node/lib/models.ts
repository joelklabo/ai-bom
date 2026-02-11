/**
 * Core data models for the Trusera AI-BOM scanner.
 * Ported from the Python models.py.
 */

import { randomUUID } from 'crypto';

export enum ComponentType {
  LlmProvider = 'llm_provider',
  AgentFramework = 'agent_framework',
  Model = 'model',
  Endpoint = 'endpoint',
  Container = 'container',
  Tool = 'tool',
  McpServer = 'mcp_server',
  McpClient = 'mcp_client',
  Workflow = 'workflow',
}

export enum UsageType {
  Completion = 'completion',
  Embedding = 'embedding',
  ImageGen = 'image_gen',
  Speech = 'speech',
  Agent = 'agent',
  ToolUse = 'tool_use',
  Orchestration = 'orchestration',
  Unknown = 'unknown',
}

export enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface SourceLocation {
  filePath: string;
  lineNumber?: number;
  contextSnippet?: string;
}

export interface RiskAssessment {
  score: number;
  severity: Severity;
  factors: string[];
  owaspCategories: string[];
}

export interface AIComponent {
  id: string;
  name: string;
  type: ComponentType;
  version: string;
  provider: string;
  modelName: string;
  location: SourceLocation;
  usageType: UsageType;
  risk: RiskAssessment;
  metadata: Record<string, unknown>;
  flags: string[];
  source: string;
}

export interface N8nWorkflowInfo {
  workflowName: string;
  workflowId: string;
  nodes: string[];
  connections: Record<string, string[]>;
  triggerType: string;
  agentChains: string[][];
}

export interface ScanSummary {
  totalComponents: number;
  totalFilesScanned: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  bySeverity: Record<string, number>;
  highestRiskScore: number;
  scanDurationSeconds: number;
}

export interface ScanResult {
  targetPath: string;
  scanTimestamp: string;
  aiBomVersion: string;
  components: AIComponent[];
  n8nWorkflows: N8nWorkflowInfo[];
  summary: ScanSummary;
}

/** Generate a UUID v4 identifier. */
export function generateId(): string {
  return randomUUID();
}

/** Create a default RiskAssessment. */
export function createRiskAssessment(
  partial?: Partial<RiskAssessment>,
): RiskAssessment {
  return {
    score: 0,
    severity: Severity.Low,
    factors: [],
    owaspCategories: [],
    ...partial,
  };
}

/** Create an AIComponent with sensible defaults. */
export function createComponent(
  partial: Partial<AIComponent> & { name: string; type: ComponentType },
): AIComponent {
  return {
    id: generateId(),
    version: '',
    provider: '',
    modelName: '',
    location: { filePath: '' },
    usageType: UsageType.Unknown,
    risk: createRiskAssessment(),
    metadata: {},
    flags: [],
    source: 'n8n-workflow',
    ...partial,
  };
}

/** Build a ScanSummary from the components in a ScanResult. */
export function buildSummary(result: ScanResult): ScanSummary {
  const byType: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let highestRiskScore = 0;

  for (const component of result.components) {
    byType[component.type] = (byType[component.type] || 0) + 1;

    if (component.provider) {
      byProvider[component.provider] =
        (byProvider[component.provider] || 0) + 1;
    }

    const sev = component.risk.severity;
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;

    if (component.risk.score > highestRiskScore) {
      highestRiskScore = component.risk.score;
    }
  }

  return {
    totalComponents: result.components.length,
    totalFilesScanned: result.summary?.totalFilesScanned ?? 0,
    byType,
    byProvider,
    bySeverity,
    highestRiskScore,
    scanDurationSeconds: result.summary?.scanDurationSeconds ?? 0,
  };
}
