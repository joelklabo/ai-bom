import { evaluatePolicy, Policy } from '../lib/policyEngine';
import { ScanResult, Severity, createComponent, ComponentType, createRiskAssessment } from '../lib/models';

function makeScanResult(overrides?: Partial<ScanResult>): ScanResult {
  return {
    targetPath: 'test.json',
    scanTimestamp: new Date().toISOString(),
    aiBomVersion: '0.1.0',
    components: [],
    n8nWorkflows: [],
    summary: {
      totalComponents: 0,
      totalFilesScanned: 1,
      byType: {},
      byProvider: {},
      bySeverity: {},
      highestRiskScore: 0,
      scanDurationSeconds: 0,
    },
    ...overrides,
  };
}

function makePolicy(overrides?: Partial<Policy>): Policy {
  return {
    blockProviders: [],
    blockFlags: [],
    ...overrides,
  };
}

describe('evaluatePolicy', () => {
  it('should pass when no constraints are violated', () => {
    const result = makeScanResult();
    const policy = makePolicy({ maxCritical: 0 });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(true);
    expect(violations).toHaveLength(0);
  });

  it('should fail when critical count exceeds maxCritical', () => {
    const result = makeScanResult({
      summary: {
        totalComponents: 2,
        totalFilesScanned: 1,
        byType: {},
        byProvider: {},
        bySeverity: { critical: 2 },
        highestRiskScore: 90,
        scanDurationSeconds: 0,
      },
    });
    const policy = makePolicy({ maxCritical: 1 });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('2 critical');
  });

  it('should fail when high count exceeds maxHigh', () => {
    const result = makeScanResult({
      summary: {
        totalComponents: 3,
        totalFilesScanned: 1,
        byType: {},
        byProvider: {},
        bySeverity: { high: 3 },
        highestRiskScore: 60,
        scanDurationSeconds: 0,
      },
    });
    const policy = makePolicy({ maxHigh: 1 });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations[0]).toContain('3 high-severity');
  });

  it('should fail when component risk score exceeds maxRiskScore', () => {
    const comp = createComponent({
      name: 'Risky',
      type: ComponentType.LlmProvider,
    });
    comp.risk = createRiskAssessment({ score: 80, severity: Severity.Critical });

    const result = makeScanResult({ components: [comp] });
    const policy = makePolicy({ maxRiskScore: 50 });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations[0]).toContain("Component 'Risky'");
    expect(violations[0]).toContain('80');
  });

  it('should fail when blocked provider is found', () => {
    const comp = createComponent({
      name: 'OpenAI Model',
      type: ComponentType.LlmProvider,
      provider: 'OpenAI',
    });

    const result = makeScanResult({ components: [comp] });
    const policy = makePolicy({ blockProviders: ['openai'] });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations[0]).toContain("Blocked provider 'OpenAI'");
  });

  it('should do case-insensitive provider matching', () => {
    const comp = createComponent({
      name: 'Anthropic Model',
      type: ComponentType.LlmProvider,
      provider: 'Anthropic',
    });

    const result = makeScanResult({ components: [comp] });
    const policy = makePolicy({ blockProviders: ['ANTHROPIC'] });

    const { passed } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
  });

  it('should fail when blocked flag is found', () => {
    const comp = createComponent({
      name: 'Hardcoded',
      type: ComponentType.LlmProvider,
      flags: ['hardcoded_api_key'],
    });

    const result = makeScanResult({ components: [comp] });
    const policy = makePolicy({ blockFlags: ['hardcoded_api_key'] });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations[0]).toContain("Blocked flag 'hardcoded_api_key'");
  });

  it('should accumulate multiple violations', () => {
    const comp1 = createComponent({
      name: 'C1',
      type: ComponentType.LlmProvider,
      provider: 'OpenAI',
      flags: ['hardcoded_api_key'],
    });
    comp1.risk = createRiskAssessment({ score: 90, severity: Severity.Critical });

    const result = makeScanResult({
      components: [comp1],
      summary: {
        totalComponents: 1,
        totalFilesScanned: 1,
        byType: {},
        byProvider: {},
        bySeverity: { critical: 1 },
        highestRiskScore: 90,
        scanDurationSeconds: 0,
      },
    });

    const policy = makePolicy({
      maxCritical: 0,
      maxRiskScore: 50,
      blockProviders: ['OpenAI'],
      blockFlags: ['hardcoded_api_key'],
    });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(false);
    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('should pass when all checks are within limits', () => {
    const comp = createComponent({
      name: 'Safe',
      type: ComponentType.LlmProvider,
      provider: 'Ollama',
    });
    comp.risk = createRiskAssessment({ score: 5, severity: Severity.Low });

    const result = makeScanResult({
      components: [comp],
      summary: {
        totalComponents: 1,
        totalFilesScanned: 1,
        byType: {},
        byProvider: {},
        bySeverity: { low: 1 },
        highestRiskScore: 5,
        scanDurationSeconds: 0,
      },
    });

    const policy = makePolicy({
      maxCritical: 0,
      maxHigh: 2,
      maxRiskScore: 50,
      blockProviders: ['OpenAI'],
      blockFlags: ['hardcoded_api_key'],
    });

    const { passed, violations } = evaluatePolicy(result, policy);
    expect(passed).toBe(true);
    expect(violations).toHaveLength(0);
  });
});
