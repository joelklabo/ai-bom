"""AI-BOM Extended SPDX reporter with AI extensions.

NOTE: This reporter outputs an SPDX 3.0-inspired JSON-LD format with custom
``ai-bom:`` extensions (e.g. ``ai-bom:AIPackage``, ``ai-bom:safetyRiskAssessment``).
These extensions are NOT part of the official SPDX 3.0 specification and will
not pass an SPDX validator.  They provide AI-specific metadata that goes beyond
what standard SPDX currently supports.
"""
from __future__ import annotations

import json
from uuid import uuid4

from ai_bom.models import AIComponent, ComponentType, ScanResult
from ai_bom.reporters.base import BaseReporter

# Map ComponentType to AI-BOM extended SPDX element types
_SPDX_TYPE_MAP: dict[ComponentType, str] = {
    ComponentType.llm_provider: "ai-bom:AIPackage",
    ComponentType.agent_framework: "ai-bom:AIPackage",
    ComponentType.model: "ai-bom:AIPackage",
    ComponentType.endpoint: "ai-bom:AIPackage",
    ComponentType.container: "software:Package",
    ComponentType.tool: "ai-bom:AIPackage",
    ComponentType.mcp_server: "ai-bom:AIPackage",
    ComponentType.mcp_client: "ai-bom:AIPackage",
    ComponentType.workflow: "ai-bom:AIPackage",
}

# Map Severity to safety risk assessment levels
_SAFETY_RISK_MAP: dict[str, str] = {
    "critical": "serious",
    "high": "high",
    "medium": "medium",
    "low": "low",
}


def _build_ai_package(component: AIComponent, doc_namespace: str) -> dict:
    """Build an AI-BOM extended SPDX element from an AIComponent."""
    spdx_id = f"{doc_namespace}#SPDXRef-{component.id}"
    element_type = _SPDX_TYPE_MAP.get(component.type, "ai-bom:AIPackage")

    element: dict = {
        "type": element_type,
        "spdxId": spdx_id,
        "name": component.name,
        "ai-bom:safetyRiskAssessment": {
            "score": component.risk.score,
            "severity": _SAFETY_RISK_MAP.get(
                component.risk.severity.value, "low"
            ),
        },
    }

    if component.version:
        element["software:packageVersion"] = component.version

    if component.provider:
        element["suppliedBy"] = {
            "type": "Organization",
            "name": component.provider,
        }

    if component.model_name:
        element["ai-bom:modelName"] = component.model_name

    element["ai-bom:usageType"] = component.usage_type.value
    element["ai-bom:componentType"] = component.type.value

    # Source location
    location = component.location
    loc_info: dict = {"file": location.file_path}
    if location.line_number is not None:
        loc_info["line"] = location.line_number
    element["ai-bom:sourceLocation"] = loc_info

    if component.risk.factors:
        element["ai-bom:riskFactors"] = component.risk.factors

    if component.flags:
        element["ai-bom:flags"] = component.flags

    return element


class SPDX3Reporter(BaseReporter):
    """Reporter that outputs SPDX 3.0-inspired JSON-LD with AI-BOM extensions."""

    def render(self, result: ScanResult) -> str:
        doc_namespace = f"https://spdx.org/spdxdocs/ai-bom-{uuid4()}"

        elements = [
            _build_ai_package(comp, doc_namespace) for comp in result.components
        ]

        doc: dict = {
            "@context": [
                "https://spdx.org/rdf/3.0.1/spdx-context.jsonld",
                "https://trusera.dev/schemas/ai-bom/v2.jsonld",
            ],
            "type": "SpdxDocument",
            "spdxId": f"{doc_namespace}#SPDXRef-DOCUMENT",
            "name": f"ai-bom-scan-{result.scan_timestamp}",
            "ai-bom:note": (
                "This document uses AI-BOM extensions (ai-bom: namespace) "
                "not yet part of the official SPDX specification."
            ),
            "creationInfo": {
                "specVersion": "3.0.1",
                "created": result.scan_timestamp,
                "createdBy": [
                    {
                        "type": "Tool",
                        "name": "ai-bom",
                        "version": result.ai_bom_version,
                    }
                ],
                "createdUsing": [
                    {
                        "type": "Tool",
                        "name": "ai-bom",
                        "version": result.ai_bom_version,
                    }
                ],
            },
            "rootElement": [f"{doc_namespace}#SPDXRef-DOCUMENT"],
            "elements": elements,
        }

        return json.dumps(doc, indent=2)
