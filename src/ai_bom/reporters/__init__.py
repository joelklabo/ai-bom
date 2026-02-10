"""Reporter modules for AI-BOM scan output."""
from ai_bom.reporters.base import BaseReporter
from ai_bom.reporters.cli_reporter import CLIReporter
from ai_bom.reporters.cyclonedx import CycloneDXReporter
from ai_bom.reporters.html_reporter import HTMLReporter
from ai_bom.reporters.markdown import MarkdownReporter
from ai_bom.reporters.sarif import SARIFReporter
from ai_bom.reporters.spdx3 import SPDX3Reporter

REPORTERS = {
    "table": CLIReporter,
    "json": CycloneDXReporter,
    "cyclonedx": CycloneDXReporter,
    "html": HTMLReporter,
    "markdown": MarkdownReporter,
    "sarif": SARIFReporter,
    "spdx3": SPDX3Reporter,
}


def get_reporter(format_name: str) -> BaseReporter:
    """Get reporter instance by format name."""
    cls = REPORTERS.get(format_name, CLIReporter)
    return cls()


__all__ = ["BaseReporter", "get_reporter", "REPORTERS"]
