import { scoreComponent, FLAG_DESCRIPTIONS } from '../lib/riskScorer';
import { createComponent, ComponentType, Severity } from '../lib/models';
import { RISK_WEIGHTS } from '../lib/config';

describe('scoreComponent', () => {
  it('should return Low severity with no flags', () => {
    const component = createComponent({
      name: 'Clean Component',
      type: ComponentType.LlmProvider,
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(0);
    expect(risk.severity).toBe(Severity.Low);
    expect(risk.factors).toHaveLength(0);
    expect(risk.owaspCategories).toHaveLength(0);
  });

  it('should score hardcoded_api_key at 30', () => {
    const component = createComponent({
      name: 'Leaked Key',
      type: ComponentType.LlmProvider,
      flags: ['hardcoded_api_key'],
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(30);
    expect(risk.severity).toBe(Severity.Medium);
    expect(risk.factors).toHaveLength(1);
    expect(risk.factors[0]).toContain('+30');
    expect(risk.owaspCategories).toContain('LLM06: Excessive Agency');
  });

  it('should accumulate multiple flag weights', () => {
    const component = createComponent({
      name: 'Very Risky',
      type: ComponentType.AgentFramework,
      flags: ['hardcoded_api_key', 'webhook_no_auth', 'code_http_tools'],
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(30 + 25 + 30);
    expect(risk.severity).toBe(Severity.Critical);
    expect(risk.factors).toHaveLength(3);
    expect(risk.owaspCategories.length).toBeGreaterThanOrEqual(2);
    expect(risk.owaspCategories).toContain('LLM06: Excessive Agency');
    expect(risk.owaspCategories).toContain('LLM02: Sensitive Info Disclosure');
    expect(risk.owaspCategories).toContain('LLM04: Output Handling');
  });

  it('should add deprecated_model weight for deprecated models', () => {
    const component = createComponent({
      name: 'Old Model',
      type: ComponentType.Model,
      modelName: 'gpt-3.5-turbo',
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(RISK_WEIGHTS['deprecated_model']);
    expect(risk.factors.some((f) => f.includes('deprecated'))).toBe(true);
    expect(risk.owaspCategories).toContain('LLM05: Supply Chain');
  });

  it('should not double-count deprecated_model when flag also present', () => {
    const component = createComponent({
      name: 'Old Model',
      type: ComponentType.Model,
      modelName: 'gpt-3.5-turbo',
      flags: ['deprecated_model'],
    });

    const risk = scoreComponent(component);
    // Both the flag and the model check add weight
    expect(risk.score).toBe(RISK_WEIGHTS['deprecated_model'] * 2);
  });

  it('should cap score at 100', () => {
    const component = createComponent({
      name: 'Everything Wrong',
      type: ComponentType.AgentFramework,
      flags: [
        'hardcoded_api_key',
        'hardcoded_credentials',
        'code_http_tools',
        'webhook_no_auth',
        'multi_agent_no_trust',
      ],
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(100);
    expect(risk.severity).toBe(Severity.Critical);
  });

  it('should assign correct severity thresholds', () => {
    // Low: 0-25
    const low = createComponent({ name: 'L', type: ComponentType.Tool, flags: ['unpinned_model'] });
    expect(scoreComponent(low).severity).toBe(Severity.Low);

    // Medium: 26-50
    const med = createComponent({ name: 'M', type: ComponentType.Tool, flags: ['hardcoded_api_key'] });
    expect(scoreComponent(med).severity).toBe(Severity.Medium);

    // High: 51-75
    const high = createComponent({
      name: 'H',
      type: ComponentType.Tool,
      flags: ['hardcoded_api_key', 'webhook_no_auth'],
    });
    expect(scoreComponent(high).severity).toBe(Severity.High);

    // Critical: 76-100
    const crit = createComponent({
      name: 'C',
      type: ComponentType.Tool,
      flags: ['hardcoded_api_key', 'hardcoded_credentials', 'webhook_no_auth'],
    });
    expect(scoreComponent(crit).severity).toBe(Severity.Critical);
  });

  it('should ignore unknown flags', () => {
    const component = createComponent({
      name: 'Unknown Flag',
      type: ComponentType.Tool,
      flags: ['nonexistent_flag'],
    });

    const risk = scoreComponent(component);
    expect(risk.score).toBe(0);
    expect(risk.factors).toHaveLength(0);
  });
});

describe('FLAG_DESCRIPTIONS', () => {
  it('should have descriptions for all risk weights', () => {
    for (const flag of Object.keys(RISK_WEIGHTS)) {
      expect(FLAG_DESCRIPTIONS[flag]).toBeDefined();
    }
  });
});
