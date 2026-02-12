# CI/CD Integration

AI-BOM integrates into your CI/CD pipeline to continuously discover and inventory AI/LLM components in your codebase. Supported platforms include GitHub Actions (native action) and GitLab CI (reusable template).

---

## GitHub Actions

### Quick Start

```yaml
name: AI-BOM Scan
on: [push, pull_request]

permissions:
  security-events: write
  contents: read

jobs:
  ai-bom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trusera/ai-bom@v2
        with:
          format: sarif
          fail-on: high
```

### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `path` | Directory to scan | `.` |
| `format` | Output format (`sarif`, `cyclonedx`, `spdx`, `table`, `html`, `markdown`, `csv`) | `table` |
| `output` | Output file path (prints to stdout if not set) | |
| `fail-on` | Fail if any component meets this severity (`critical`, `high`, `medium`, `low`) | |
| `scan-level` | Scanning depth: `quick`, `standard`, or `deep` | `standard` |
| `cedar-policy-file` | Path to a Cedar policy file for policy evaluation | |
| `cedar-entities-file` | Path to a Cedar entities file for additional context | |
| `policy-gate` | Enable Cedar policy gate evaluation (`true`/`false`) | `false` |

### SARIF Upload to GitHub Security

When `format: sarif`, scan results are automatically uploaded to GitHub Code Scanning (requires `security-events: write` permission):

```yaml
- uses: trusera/ai-bom@v2
  with:
    format: sarif
    output: ai-bom-results.sarif
    scan-level: deep
```

### Cedar Policy Gate

The Cedar policy gate evaluates scan results against a Cedar-like policy file, enabling fine-grained control over which AI components are permitted in your codebase. See the [Policy Enforcement](#cedar-policy-format) section below for the policy file format.

```yaml
- uses: trusera/ai-bom@v2
  with:
    format: table
    scan-level: deep
    policy-gate: "true"
    cedar-policy-file: ".cedar/ai-policy.cedar"
```

When a policy violation is detected, the action:
1. Exits with a non-zero code (fails the pipeline)
2. Prints a detailed violation table to the console
3. Writes a formatted violation report to the GitHub Actions job summary

---

## GitLab CI

### Quick Start

Include the AI-BOM template in your `.gitlab-ci.yml`:

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Trusera/ai-bom/main/templates/gitlab-ci-ai-bom.yml'
```

This adds an `ai-bom-scan` job to the `security` stage that runs on merge requests and pushes to the default branch.

### Local Include

To pin the template to a specific version, copy it into your repository:

```yaml
include:
  - local: '.gitlab/ci/ai-bom.yml'
```

### Variable Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_BOM_VERSION` | AI-BOM package version to install | `latest` |
| `AI_BOM_SCAN_PATH` | Directory to scan | `.` |
| `AI_BOM_FORMAT` | Output format (`sarif`, `cyclonedx`, `spdx`, `json`, `csv`, `html`, `markdown`, `table`) | `sarif` |
| `AI_BOM_FAIL_ON` | Fail if any component meets this severity (`critical`, `high`, `medium`, `low`) | _(empty = no threshold)_ |
| `AI_BOM_DEEP_SCAN` | Enable deep scanning with AST analysis (`true`/`false`) | `false` |
| `AI_BOM_POLICY_FILE` | Path to a Cedar policy file (enables the policy gate job) | _(empty = disabled)_ |
| `AI_BOM_CEDAR_GATE_URL` | URL to the cedar-gate.py script | GitHub raw URL |

### Example: Basic SARIF Scan

The default configuration generates a SARIF report that integrates with GitLab's SAST results view:

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Trusera/ai-bom/main/templates/gitlab-ci-ai-bom.yml'
```

No additional configuration needed. Results appear in the GitLab Security Dashboard.

### Example: Fail on High Severity

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Trusera/ai-bom/main/templates/gitlab-ci-ai-bom.yml'

variables:
  AI_BOM_FAIL_ON: "high"
  AI_BOM_DEEP_SCAN: "true"
```

### Example: Cedar Policy Gate

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Trusera/ai-bom/main/templates/gitlab-ci-ai-bom.yml'

variables:
  AI_BOM_POLICY_FILE: ".cedar/ai-policy.cedar"
  AI_BOM_DEEP_SCAN: "true"
```

When `AI_BOM_POLICY_FILE` is set, the template automatically enables a second job (`ai-bom-policy-gate`) that runs after the scan.

### Example: CycloneDX SBOM Output

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Trusera/ai-bom/main/templates/gitlab-ci-ai-bom.yml'

variables:
  AI_BOM_FORMAT: "cyclonedx"
```

The report artifact (`ai-bom-report.cdx.json`) is available for download for 30 days.

### Pipeline Badge

Add a badge to your README to show scan status:

```markdown
[![AI-BOM Scan](https://gitlab.com/<namespace>/<project>/badges/<branch>/pipeline.svg)](https://gitlab.com/<namespace>/<project>/-/pipelines)
```

---

## Cedar Policy Format

The Cedar policy gate uses a simplified Cedar-like syntax. Each rule is a `forbid` statement that blocks deployment when conditions match.

### Supported Conditions

| Field | Type | Description |
|-------|------|-------------|
| `resource.severity` | string | Component severity: `critical`, `high`, `medium`, `low`, `info` |
| `resource.provider` | string | AI provider name (e.g., `DeepSeek`, `OpenAI`) |
| `resource.component_type` | string | Component type (e.g., `llm-api`, `embedding`, `agent-framework`) |
| `resource.risk_score` | number | Risk score from 0 to 100 |
| `resource.name` | string | Component name |

### Supported Operators

`==`, `!=`, `>`, `>=`, `<`, `<=`

Severity comparisons use ordinal ranking: `critical(4) > high(3) > medium(2) > low(1) > info(0)`.

### Example Policy File

```cedar
// .cedar/ai-policy.cedar
// Block all critical-severity components from deployment
forbid (
  principal,
  action == Action::"deploy",
  resource
) when {
  resource.severity == "critical"
};

// Block a specific provider
forbid (
  principal,
  action == Action::"deploy",
  resource
) when {
  resource.provider == "DeepSeek"
};

// Block components with risk score above threshold
forbid (
  principal,
  action == Action::"deploy",
  resource
) when {
  resource.risk_score > 75
};

// Block high-severity LLM API integrations
forbid (
  principal,
  action == Action::"deploy",
  resource
) when {
  resource.component_type == "llm-api"
  resource.severity == "high"
};
```

### Violation Report

When a policy violation is detected, the gate produces a table like:

```
## Cedar Policy Gate - FAILED

**2 violation(s) found**

| # | Component | Type | Rule | Actual Value |
|---|-----------|------|------|--------------|
| 1 | openai-chat | llm-api | `resource.severity == "critical"` | critical |
| 2 | deepseek-v3 | llm-api | `resource.provider == "DeepSeek"` | DeepSeek |
```

---

## Policy Enforcement (Legacy)

### Severity Threshold

Fail CI if findings meet a severity threshold:

```bash
ai-bom scan . --fail-on critical --quiet
```

### YAML Policy File

Create a YAML policy file for basic threshold control:

```yaml
# policy.yml
max_risk_score: 75
blocked_providers:
  - "DeepSeek"
require_declared: true
max_components: 50
```

```bash
ai-bom scan . --policy policy.yml
```

For more advanced rule-based policies, use the Cedar policy gate described above.
