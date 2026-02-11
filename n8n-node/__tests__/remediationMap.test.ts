import { RISK_WEIGHTS, REMEDIATION_MAP } from '../lib/config';

describe('REMEDIATION_MAP', () => {
  const requiredFields = [
    'description',
    'remediation',
    'guardrail',
    'owaspCategory',
    'owaspCategoryName',
    'severity',
  ] as const;

  const validSeverities = ['critical', 'high', 'medium', 'low'];

  it('should have an entry for every flag in RISK_WEIGHTS', () => {
    for (const flag of Object.keys(RISK_WEIGHTS)) {
      expect(REMEDIATION_MAP[flag]).toBeDefined();
    }
  });

  it('should have all required fields for every entry', () => {
    for (const [flag, entry] of Object.entries(REMEDIATION_MAP)) {
      for (const field of requiredFields) {
        expect(entry[field]).toBeDefined();
        expect(typeof entry[field]).toBe('string');
        expect(entry[field].length).toBeGreaterThan(0);
      }
    }
  });

  it('should have valid severity values', () => {
    for (const [flag, entry] of Object.entries(REMEDIATION_MAP)) {
      expect(validSeverities).toContain(entry.severity);
    }
  });

  it('should have valid OWASP category IDs', () => {
    for (const [flag, entry] of Object.entries(REMEDIATION_MAP)) {
      expect(entry.owaspCategory).toMatch(/^LLM\d{2}$/);
    }
  });

  it('should cover all 14 risk flags', () => {
    const riskFlags = Object.keys(RISK_WEIGHTS);
    const remediationFlags = Object.keys(REMEDIATION_MAP);
    expect(remediationFlags.length).toBeGreaterThanOrEqual(riskFlags.length);
    for (const flag of riskFlags) {
      expect(remediationFlags).toContain(flag);
    }
  });
});
