/**
 * Policy evaluation engine for AI-BOM scan results.
 * Ported from the Python policy.py.
 */

import { ScanResult } from './models';

export interface Policy {
  maxCritical?: number;
  maxHigh?: number;
  maxRiskScore?: number;
  blockProviders: string[];
  blockFlags: string[];
}

export interface PolicyResult {
  passed: boolean;
  violations: string[];
}

/**
 * Evaluate a scan result against a policy.
 * Returns whether the policy passed and a list of violations.
 */
export function evaluatePolicy(
  result: ScanResult,
  policy: Policy,
): PolicyResult {
  const violations: string[] = [];

  if (policy.maxCritical !== undefined) {
    const criticalCount = result.summary.bySeverity['critical'] || 0;
    if (criticalCount > policy.maxCritical) {
      violations.push(
        `Found ${criticalCount} critical component(s), policy allows max ${policy.maxCritical}`,
      );
    }
  }

  if (policy.maxHigh !== undefined) {
    const highCount = result.summary.bySeverity['high'] || 0;
    if (highCount > policy.maxHigh) {
      violations.push(
        `Found ${highCount} high-severity component(s), policy allows max ${policy.maxHigh}`,
      );
    }
  }

  if (policy.maxRiskScore !== undefined) {
    for (const component of result.components) {
      if (component.risk.score > policy.maxRiskScore) {
        violations.push(
          `Component '${component.name}' has risk score ${component.risk.score}, policy max is ${policy.maxRiskScore}`,
        );
      }
    }
  }

  if (policy.blockProviders.length > 0) {
    const blockedLower = new Set(
      policy.blockProviders.map((p) => p.toLowerCase()),
    );
    for (const component of result.components) {
      if (blockedLower.has(component.provider.toLowerCase())) {
        violations.push(
          `Blocked provider '${component.provider}' found in component '${component.name}'`,
        );
      }
    }
  }

  if (policy.blockFlags.length > 0) {
    const blockedSet = new Set(policy.blockFlags);
    for (const component of result.components) {
      const matching = component.flags.filter((f) => blockedSet.has(f));
      for (const flag of matching) {
        violations.push(
          `Blocked flag '${flag}' found in component '${component.name}'`,
        );
      }
    }
  }

  return { passed: violations.length === 0, violations };
}
