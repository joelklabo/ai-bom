"""Tests for SPDX 3.0 JSON-LD reporter with AI Profile extensions."""
import json

from ai_bom.models import (
    AIComponent,
    ComponentType,
    RiskAssessment,
    ScanResult,
    Severity,
    SourceLocation,
)
from ai_bom.reporters import get_reporter
from ai_bom.reporters.spdx3 import SPDX3Reporter


class TestSPDX3Structure:
    """Test JSON-LD document structure."""

    def test_has_context(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        assert "@context" in data
        assert isinstance(data["@context"], list)
        assert any("spdx.org" in c for c in data["@context"])

    def test_document_type(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        assert data["type"] == "SpdxDocument"

    def test_has_spdx_id(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        assert "spdxId" in data
        assert "SPDXRef-DOCUMENT" in data["spdxId"]

    def test_has_creation_info(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        info = data["creationInfo"]
        assert info["specVersion"] == "3.0.1"
        assert "created" in info
        assert "createdBy" in info
        assert info["createdBy"][0]["type"] == "Tool"
        assert info["createdBy"][0]["name"] == "ai-bom"

    def test_has_elements(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        assert "elements" in data
        assert len(data["elements"]) == len(multi_component_result.components)

    def test_valid_json(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        assert isinstance(data, dict)

    def test_pretty_printed(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        # Pretty-printed JSON has newlines and indentation
        assert "\n" in output
        assert "  " in output


class TestComponentMapping:
    """Test AIComponent to ai-bom:AIPackage mapping."""

    def test_element_type(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["type"] == "ai-bom:AIPackage"

    def test_element_name(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["name"] == "openai"

    def test_element_has_spdx_id(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert "spdxId" in elem
        assert "SPDXRef-" in elem["spdxId"]

    def test_supplied_by(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["suppliedBy"]["type"] == "Organization"
        assert elem["suppliedBy"]["name"] == "OpenAI"

    def test_model_name(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["ai-bom:modelName"] == "gpt-4o"

    def test_usage_type(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["ai-bom:usageType"] == "completion"

    def test_source_location(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["ai-bom:sourceLocation"]["file"] == "app.py"
        assert elem["ai-bom:sourceLocation"]["line"] == 5

    def test_component_without_version(self):
        comp = AIComponent(
            name="test-lib",
            type=ComponentType.tool,
            location=SourceLocation(file_path="test.py"),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert "software:packageVersion" not in elem

    def test_component_with_version(self):
        comp = AIComponent(
            name="openai",
            type=ComponentType.llm_provider,
            version="1.30.0",
            location=SourceLocation(file_path="req.txt"),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["software:packageVersion"] == "1.30.0"

    def test_component_without_provider(self):
        comp = AIComponent(
            name="custom-model",
            type=ComponentType.model,
            location=SourceLocation(file_path="model.py"),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert "suppliedBy" not in elem

    def test_container_type_maps_to_software_package(self):
        comp = AIComponent(
            name="nvidia-cuda",
            type=ComponentType.container,
            location=SourceLocation(file_path="Dockerfile"),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["type"] == "software:Package"

    def test_flags_included(self, multi_component_result):
        reporter = SPDX3Reporter()
        output = reporter.render(multi_component_result)
        data = json.loads(output)
        # The critical_component (index 1) has flags
        flagged = [e for e in data["elements"] if "ai-bom:flags" in e]
        assert len(flagged) > 0
        assert "hardcoded_api_key" in flagged[0]["ai-bom:flags"]


class TestRiskAssessmentMapping:
    """Test risk assessment to ai-bom:safetyRiskAssessment mapping."""

    def test_risk_score(self, sample_scan_result):
        reporter = SPDX3Reporter()
        output = reporter.render(sample_scan_result)
        data = json.loads(output)
        elem = data["elements"][0]
        assessment = elem["ai-bom:safetyRiskAssessment"]
        assert "score" in assessment
        assert isinstance(assessment["score"], int)

    def test_risk_severity_mapping(self):
        comp = AIComponent(
            name="risky-model",
            type=ComponentType.model,
            location=SourceLocation(file_path="m.py"),
            risk=RiskAssessment(
                score=85, severity=Severity.critical, factors=["no_guardrails"]
            ),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        assessment = data["elements"][0]["ai-bom:safetyRiskAssessment"]
        assert assessment["severity"] == "serious"
        assert assessment["score"] == 85

    def test_risk_factors_included(self):
        comp = AIComponent(
            name="test",
            type=ComponentType.model,
            location=SourceLocation(file_path="t.py"),
            risk=RiskAssessment(
                score=50, severity=Severity.medium, factors=["factor_a", "factor_b"]
            ),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert elem["ai-bom:riskFactors"] == ["factor_a", "factor_b"]

    def test_no_risk_factors_omitted(self):
        comp = AIComponent(
            name="safe",
            type=ComponentType.tool,
            location=SourceLocation(file_path="s.py"),
            risk=RiskAssessment(score=10, severity=Severity.low),
        )
        result = ScanResult(target_path="/test")
        result.components = [comp]
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        elem = data["elements"][0]
        assert "ai-bom:riskFactors" not in elem


class TestEmptyScanResult:
    """Test empty scan result handling."""

    def test_empty_components(self):
        result = ScanResult(target_path="/empty")
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        assert data["elements"] == []
        assert data["type"] == "SpdxDocument"
        assert "@context" in data

    def test_empty_valid_json(self):
        result = ScanResult(target_path="/empty")
        result.build_summary()
        reporter = SPDX3Reporter()
        output = reporter.render(result)
        data = json.loads(output)
        assert isinstance(data, dict)


class TestWriteToFile:
    """Test file output."""

    def test_write_creates_file(self, multi_component_result, tmp_path):
        reporter = SPDX3Reporter()
        path = tmp_path / "report.spdx.json"
        reporter.write(multi_component_result, path)
        assert path.exists()

    def test_write_valid_json(self, multi_component_result, tmp_path):
        reporter = SPDX3Reporter()
        path = tmp_path / "report.spdx.json"
        reporter.write(multi_component_result, path)
        data = json.loads(path.read_text())
        assert data["type"] == "SpdxDocument"
        assert len(data["elements"]) == len(multi_component_result.components)


class TestGetReporterIntegration:
    """Test reporter registration."""

    def test_spdx3_format(self):
        reporter = get_reporter("spdx3")
        assert isinstance(reporter, SPDX3Reporter)
