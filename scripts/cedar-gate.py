#!/usr/bin/env python3
"""
Cedar-like policy gate for AI-BOM scan results.

Evaluates AI-BOM scan output against a simplified Cedar policy file.
Used in CI pipelines (GitHub Actions, GitLab CI) to enforce security
policies on discovered AI/LLM components.

Supported policy patterns:
  - forbid ... when { resource.severity == "critical" };
  - forbid ... when { resource.provider == "DeepSeek" };
  - forbid ... when { resource.component_type == "llm-api" };
  - forbid ... when { resource.risk_score > 75 };

Usage:
  python3 cedar-gate.py <scan-results.json> <policy.cedar> [--summary <path>]

Exit codes:
  0 = all policies passed
  1 = one or more policy violations
  2 = input/parse error
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class PolicyRule:
    """A single parsed Cedar-like forbid rule."""

    action: str
    field: str
    operator: str
    value: str | int | float
    raw: str


@dataclass
class Violation:
    """A policy violation found during evaluation."""

    rule: PolicyRule
    component_name: str
    component_type: str
    actual_value: Any


SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0, "none": 0}

# Regex patterns for Cedar-like policy syntax
# Matches: forbid ( principal, action == Action::"deploy", resource ) when { ... };
RULE_PATTERN = re.compile(
    r'forbid\s*\(\s*principal\s*,\s*action\s*==\s*Action::"(\w+)"\s*,\s*resource\s*\)'
    r'\s*when\s*\{([^}]+)\}\s*;',
    re.MULTILINE | re.DOTALL,
)

# Matches conditions inside when { ... }
# e.g. resource.severity == "critical"  or  resource.risk_score > 75
CONDITION_PATTERN = re.compile(
    r'resource\.(\w+)\s*(==|!=|>|>=|<|<=)\s*"?([^";]+?)"?\s*$',
    re.MULTILINE,
)


def parse_policy(policy_text: str) -> list[PolicyRule]:
    """Parse a Cedar-like policy file into a list of rules."""
    rules: list[PolicyRule] = []
    # Strip comments (// style)
    cleaned = re.sub(r'//[^\n]*', '', policy_text)

    for match in RULE_PATTERN.finditer(cleaned):
        action = match.group(1)
        body = match.group(2).strip()

        for cond in CONDITION_PATTERN.finditer(body):
            field_name = cond.group(1)
            operator = cond.group(2)
            raw_value = cond.group(3).strip()

            # Try to parse as number
            try:
                value: str | int | float = int(raw_value)
            except ValueError:
                try:
                    value = float(raw_value)
                except ValueError:
                    value = raw_value

            rules.append(
                PolicyRule(
                    action=action,
                    field=field_name,
                    operator=operator,
                    value=value,
                    raw=match.group(0).strip(),
                )
            )

    return rules


def evaluate_condition(rule: PolicyRule, component: dict[str, Any]) -> bool:
    """Check if a single component violates a rule. Returns True if violated."""
    # Map Cedar field names to AI-BOM scan result keys
    field_map = {
        "severity": "severity",
        "provider": "provider",
        "component_type": "component_type",
        "type": "component_type",
        "risk_score": "risk_score",
        "name": "name",
    }

    key = field_map.get(rule.field, rule.field)
    actual = component.get(key)
    if actual is None:
        return False

    # Severity comparison uses ordinal ranking
    if rule.field == "severity":
        actual_rank = SEVERITY_ORDER.get(str(actual).lower(), 0)
        target_rank = SEVERITY_ORDER.get(str(rule.value).lower(), 0)

        if rule.operator == "==":
            return actual_rank == target_rank
        if rule.operator == "!=":
            return actual_rank != target_rank
        if rule.operator == ">=":
            return actual_rank >= target_rank
        if rule.operator == ">":
            return actual_rank > target_rank
        if rule.operator == "<=":
            return actual_rank <= target_rank
        if rule.operator == "<":
            return actual_rank < target_rank

    # Numeric comparison
    if isinstance(rule.value, (int, float)):
        try:
            actual_num = float(actual)
        except (TypeError, ValueError):
            return False

        if rule.operator == "==":
            return actual_num == rule.value
        if rule.operator == "!=":
            return actual_num != rule.value
        if rule.operator == ">":
            return actual_num > rule.value
        if rule.operator == ">=":
            return actual_num >= rule.value
        if rule.operator == "<":
            return actual_num < rule.value
        if rule.operator == "<=":
            return actual_num <= rule.value

    # String comparison (case-insensitive)
    actual_str = str(actual).lower()
    target_str = str(rule.value).lower()

    if rule.operator == "==":
        return actual_str == target_str
    if rule.operator == "!=":
        return actual_str != target_str

    return False


def evaluate(
    components: list[dict[str, Any]], rules: list[PolicyRule]
) -> list[Violation]:
    """Evaluate all components against all rules. Returns list of violations."""
    violations: list[Violation] = []

    for component in components:
        for rule in rules:
            if evaluate_condition(rule, component):
                violations.append(
                    Violation(
                        rule=rule,
                        component_name=component.get("name", "unknown"),
                        component_type=component.get("component_type", "unknown"),
                        actual_value=component.get(
                            rule.field, component.get(rule.field, "N/A")
                        ),
                    )
                )

    return violations


def extract_components(scan_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract the component list from various AI-BOM output formats."""
    # Direct list at top level
    if isinstance(scan_data, list):
        return scan_data

    # Standard AI-BOM JSON output: { "components": [...] }
    if "components" in scan_data:
        return scan_data["components"]

    # CycloneDX format: { "components": [...] } nested differently
    if "bomFormat" in scan_data and "components" in scan_data:
        return scan_data["components"]

    # SARIF format: extract from results
    if "runs" in scan_data:
        components = []
        for run in scan_data.get("runs", []):
            for result in run.get("results", []):
                comp: dict[str, Any] = {
                    "name": result.get("ruleId", "unknown"),
                    "severity": result.get("level", "none"),
                    "component_type": result.get("properties", {}).get(
                        "component_type", "unknown"
                    ),
                    "provider": result.get("properties", {}).get("provider", "unknown"),
                    "risk_score": result.get("properties", {}).get("risk_score", 0),
                }
                components.append(comp)
        return components

    # Fallback: treat the whole dict as a single component
    if "name" in scan_data:
        return [scan_data]

    return []


def format_violation_report(violations: list[Violation]) -> str:
    """Format violations into a human-readable report."""
    lines = [
        "## Cedar Policy Gate - FAILED",
        "",
        f"**{len(violations)} violation(s) found**",
        "",
        "| # | Component | Type | Rule | Actual Value |",
        "|---|-----------|------|------|--------------|",
    ]

    for i, v in enumerate(violations, 1):
        condition = f"`resource.{v.rule.field} {v.rule.operator} {v.rule.value}`"
        lines.append(
            f"| {i} | {v.component_name} | {v.component_type} | {condition} | {v.actual_value} |"
        )

    lines.extend(
        [
            "",
            "### Policy rules that triggered",
            "",
        ]
    )

    seen_rules: set[str] = set()
    for v in violations:
        if v.rule.raw not in seen_rules:
            seen_rules.add(v.rule.raw)
            lines.append(f"```cedar\n{v.rule.raw}\n```")
            lines.append("")

    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) < 3:
        print(
            "Usage: cedar-gate.py <scan-results.json> <policy.cedar> [--summary <path>]",
            file=sys.stderr,
        )
        return 2

    results_path = Path(sys.argv[1])
    policy_path = Path(sys.argv[2])

    summary_path: Path | None = None
    if "--summary" in sys.argv:
        idx = sys.argv.index("--summary")
        if idx + 1 < len(sys.argv):
            summary_path = Path(sys.argv[idx + 1])

    # Load scan results
    if not results_path.exists():
        print(f"Error: scan results file not found: {results_path}", file=sys.stderr)
        return 2

    try:
        scan_data = json.loads(results_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON in {results_path}: {e}", file=sys.stderr)
        return 2

    # Load policy
    if not policy_path.exists():
        print(f"Error: policy file not found: {policy_path}", file=sys.stderr)
        return 2

    policy_text = policy_path.read_text(encoding="utf-8")

    # Parse
    rules = parse_policy(policy_text)
    if not rules:
        print("Warning: no rules found in policy file", file=sys.stderr)
        print("Cedar policy gate: PASSED (no rules to evaluate)")
        return 0

    components = extract_components(scan_data)
    if not components:
        print("Cedar policy gate: PASSED (no components found in scan results)")
        return 0

    print(f"Evaluating {len(rules)} rule(s) against {len(components)} component(s)...")

    # Evaluate
    violations = evaluate(components, rules)

    if violations:
        report = format_violation_report(violations)
        print(report)

        # Write GitHub Actions summary if path provided
        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(report)
                f.write("\n")

        return 1

    print(f"Cedar policy gate: PASSED ({len(rules)} rules, {len(components)} components)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
