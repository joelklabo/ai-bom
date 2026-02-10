# Contributing to AI-BOM

Thanks for your interest in contributing to AI-BOM! This guide covers the development setup, quality standards, and pull request process.

## Development Setup

```bash
git clone https://github.com/Trusera/ai-bom.git
cd ai-bom

python3 -m venv .venv
source .venv/bin/activate

pip install -e ".[dev]"
```

## Quality Standards

All code must pass three quality gates before merging:

### 1. Linting (ruff)

```bash
# Auto-format
ruff format src/ tests/

# Lint check (must pass with zero errors)
ruff check src/ tests/
```

**Enforced rule sets:** `E, F, I, W, S, B, C4, UP, SIM, N, RUF`

| Rule Set | Purpose |
|----------|---------|
| E, W | pycodestyle errors and warnings |
| F | pyflakes |
| I | isort import ordering |
| S | flake8-bandit security checks |
| B | flake8-bugbear |
| C4 | flake8-comprehensions |
| UP | pyupgrade |
| SIM | flake8-simplify |
| N | pep8-naming |
| RUF | ruff-specific rules |

### 2. Type Checking (mypy)

```bash
mypy src/ai_bom/ --ignore-missing-imports
```

Strict mode is enabled: `disallow_untyped_defs = true`. All new functions must have type annotations.

### 3. Testing (pytest)

```bash
# Run all tests
pytest -v

# Run with coverage (must meet 80% threshold)
pytest -v --cov=ai_bom --cov-report=term-missing

# Run a specific test file
pytest tests/test_cli.py -v
```

**Coverage threshold: 80%.** New code should include tests.

### Pre-commit checklist

```bash
ruff format src/ tests/
ruff check src/ tests/
mypy src/ai_bom/ --ignore-missing-imports
pytest -v --cov=ai_bom
```

## Project Structure

```
src/ai_bom/
  cli.py              # Typer CLI entry point
  config.py           # Detection patterns (data-driven)
  models.py           # Pydantic v2 data models
  scanners/           # 13 auto-registered scanner plugins
  detectors/          # Pattern registries (LLM, model, endpoint)
  reporters/          # 9 output formatters (CycloneDX, SARIF, HTML, etc.)
  compliance/         # EU AI Act, OWASP, license compliance modules
  dashboard/          # FastAPI web dashboard
  utils/              # Risk scoring and helpers
tests/                # Mirror of src/ structure
```

## Adding a New Scanner

1. Create a new file in `src/ai_bom/scanners/` (e.g., `my_scanner.py`)
2. Subclass `BaseScanner` -- auto-registration happens via `__init_subclass__`
3. Implement `scan(path) -> list[AIComponent]`
4. Add detection patterns to `config.py` if applicable
5. Import your scanner module in `src/ai_bom/scanners/__init__.py`
6. Add tests in `tests/test_scanners/`

## Pull Request Process

1. Fork the repo and create a feature branch from `main`
2. Make your changes with tests
3. Ensure all three quality gates pass:
   - `ruff check src/ tests/` -- zero errors
   - `mypy src/ai_bom/ --ignore-missing-imports` -- zero errors
   - `pytest -v --cov=ai_bom` -- all tests pass, coverage >= 80%
4. Submit a PR with a clear description
5. CI runs lint + type check + tests on Python 3.10-3.13

## Reporting Issues

Use [GitHub Issues](https://github.com/Trusera/ai-bom/issues) with the provided templates:
- **Bug Report** -- for errors and unexpected behavior
- **Feature Request** -- for new scanners, reporters, or capabilities
- **Detection Pattern** -- for new AI SDK or model patterns
