"""Policy engine for CI/CD enforcement of AI-BOM scan results.

Allows defining thresholds, blocked providers, and blocked flags
in a YAML policy file, then evaluating scan results against them.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field

from ai_bom.models import ScanResult


class Policy(BaseModel):
    """Policy definition for scan enforcement."""

    max_critical: int | None = Field(
        default=None, description="Maximum allowed critical-severity components"
    )
    max_high: int | None = Field(
        default=None, description="Maximum allowed high-severity components"
    )
    max_risk_score: int | None = Field(
        default=None, description="Maximum allowed risk score for any component"
    )
    block_providers: list[str] = Field(
        default_factory=list, description="Providers that are not allowed"
    )
    block_flags: list[str] = Field(
        default_factory=list, description="Risk flags that cause failure"
    )


def load_policy(path: str | Path) -> Policy:
    """Load a policy from a YAML file.

    Args:
        path: Path to the YAML policy file

    Returns:
        Parsed Policy object

    Raises:
        FileNotFoundError: If policy file doesn't exist
        ValueError: If policy file is invalid
    """
    policy_path = Path(path)
    if not policy_path.exists():
        raise FileNotFoundError(f"Policy file not found: {policy_path}")

    try:
        with open(policy_path, encoding="utf-8") as f:
            data: dict[str, Any] = yaml.safe_load(f) or {}
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML in policy file: {e}") from e

    return Policy(**data)


def evaluate_policy(
    result: ScanResult, policy: Policy
) -> tuple[bool, list[str]]:
    """Evaluate a scan result against a policy.

    Args:
        result: The scan result to evaluate
        policy: The policy to evaluate against

    Returns:
        Tuple of (passed, violations) where passed is True if no
        violations were found, and violations is a list of
        human-readable violation descriptions
    """
    violations: list[str] = []

    # Check severity counts
    severity_counts = result.summary.by_severity

    if policy.max_critical is not None:
        critical_count = severity_counts.get("critical", 0)
        if critical_count > policy.max_critical:
            violations.append(
                f"Found {critical_count} critical component(s), "
                f"policy allows max {policy.max_critical}"
            )

    if policy.max_high is not None:
        high_count = severity_counts.get("high", 0)
        if high_count > policy.max_high:
            violations.append(
                f"Found {high_count} high-severity component(s), "
                f"policy allows max {policy.max_high}"
            )

    # Check max risk score
    if policy.max_risk_score is not None:
        for component in result.components:
            if component.risk.score > policy.max_risk_score:
                violations.append(
                    f"Component '{component.name}' has risk score "
                    f"{component.risk.score}, policy max is {policy.max_risk_score}"
                )

    # Check blocked providers
    if policy.block_providers:
        blocked_lower = {p.lower() for p in policy.block_providers}
        for component in result.components:
            if component.provider.lower() in blocked_lower:
                violations.append(
                    f"Blocked provider '{component.provider}' found "
                    f"in component '{component.name}'"
                )

    # Check blocked flags
    if policy.block_flags:
        blocked_flags_set = set(policy.block_flags)
        for component in result.components:
            matching_flags = blocked_flags_set.intersection(component.flags)
            for flag in matching_flags:
                violations.append(
                    f"Blocked flag '{flag}' found in component "
                    f"'{component.name}'"
                )

    return (len(violations) == 0, violations)
