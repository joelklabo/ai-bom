"""Rich-based CLI reporter for terminal output."""

from __future__ import annotations

import io

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from ai_bom.models import ComponentType, ScanResult
from ai_bom.reporters.base import BaseReporter


def _get_component_type_color(component_type: ComponentType) -> str:
    """Get color for a component type.

    Args:
        component_type: The component type enum value

    Returns:
        Rich color string
    """
    color_map = {
        # Models/LLMs: Blue
        ComponentType.model: "blue",
        ComponentType.llm_provider: "bright_blue",
        # Agents: Green
        ComponentType.agent_framework: "green",
        ComponentType.mcp_client: "bright_green",
        ComponentType.workflow: "green",
        # Tools: Yellow
        ComponentType.tool: "yellow",
        ComponentType.mcp_server: "bright_yellow",
        # Endpoints: Cyan
        ComponentType.endpoint: "cyan",
        # Containers: Magenta
        ComponentType.container: "magenta",
    }
    return color_map.get(component_type, "white")


class CLIReporter(BaseReporter):
    """Rich console reporter for interactive terminal output."""

    def render(self, result: ScanResult) -> str:
        """Render scan result as rich terminal output.

        Args:
            result: The scan result to render

        Returns:
            ANSI-formatted string for terminal display
        """
        # Use Console with record=True and a dummy file to capture output
        # without printing to stdout (print happens in cli.py)
        console = Console(record=True, file=io.StringIO(), width=120)

        # 1. Summary Panel with stats
        summary = result.summary
        summary_lines = [
            f"Target: {result.target_path}",
            f"Components Found: {summary.total_components}",
            f"Files Scanned: {summary.total_files_scanned}",
            f"Highest Risk Score: {summary.highest_risk_score}/100",
            "",
            "By Type:",
        ]
        # Color code type counts
        for type_name, count in sorted(summary.by_type.items()):
            try:
                comp_type = ComponentType(type_name)
                color = _get_component_type_color(comp_type)
                summary_lines.append(f"  [{color}]{type_name}: {count}[/{color}]")
            except ValueError:
                summary_lines.append(f"  {type_name}: {count}")

        summary_lines.append("")
        summary_lines.append("By Severity:")
        severity_colors = {
            "critical": "red",
            "high": "yellow",
            "medium": "blue",
            "low": "green",
        }
        for sev in ["critical", "high", "medium", "low"]:
            count = summary.by_severity.get(sev, 0)
            color = severity_colors[sev]
            summary_lines.append(f"  [{color}]{sev}: {count}[/{color}]")

        console.print(
            Panel(
                "\n".join(summary_lines),
                title="Scan Summary",
                border_style="green",
            )
        )

        # 3. n8n Section (conditional - only if n8n workflows found)
        if result.n8n_workflows:
            n8n_table = Table(title="n8n AI Workflows", box=box.ROUNDED)
            n8n_table.add_column("Workflow", style="cyan", max_width=30)
            n8n_table.add_column("AI Nodes", justify="right", style="magenta")
            n8n_table.add_column("Trigger", style="yellow", max_width=20)
            n8n_table.add_column("Agent Chains", justify="right", style="blue")
            for wf in result.n8n_workflows:
                n8n_table.add_row(
                    wf.workflow_name,
                    str(len(wf.nodes)),
                    wf.trigger_type,
                    str(len(wf.agent_chains)),
                )
            console.print(n8n_table)
            console.print()

        # 4. Findings Table
        if result.components:
            table = Table(title="AI Components Discovered", box=box.ROUNDED)
            table.add_column("#", style="dim", width=4, justify="right")
            table.add_column("Component", style="cyan", max_width=30)
            table.add_column("Type", style="magenta", max_width=18)
            table.add_column("Provider", style="blue", max_width=15)
            table.add_column("Location", style="dim", max_width=35)
            table.add_column("Risk", justify="right", width=8)
            table.add_column("Flags", style="yellow", max_width=30)

            for i, comp in enumerate(
                sorted(result.components, key=lambda c: c.risk.score, reverse=True), 1
            ):
                # Color code risk
                risk_score = comp.risk.score
                if risk_score >= 76:
                    risk_style = "bold red"
                elif risk_score >= 51:
                    risk_style = "yellow"
                elif risk_score >= 26:
                    risk_style = "blue"
                else:
                    risk_style = "green"

                # Color code component name based on type
                type_color = _get_component_type_color(comp.type)

                # Highlight API keys/credentials with red
                comp_name_style = type_color
                if any(flag in comp.flags for flag in ["hardcoded_api_key", "hardcoded_credentials", "api_key_detected"]):
                    comp_name_style = "bold red"

                location = comp.location.file_path
                if comp.location.line_number:
                    location += f":{comp.location.line_number}"
                # Truncate path
                if len(location) > 35:
                    location = "..." + location[-32:]

                # Color code type column
                type_text = Text(comp.type.value, style=type_color)

                flags_display = ", ".join(comp.flags[:3]) if comp.flags else "-"

                table.add_row(
                    str(i),
                    Text(comp.name, style=comp_name_style),
                    type_text,
                    comp.provider,
                    location,
                    Text(str(risk_score), style=risk_style),
                    flags_display,
                )
            console.print(table)
        else:
            console.print("[green]No AI components detected.[/green]")

        # 5. CTA
        console.print()
        console.print(
            "Secure agent-to-agent communication with [bold cyan]Trusera[/bold cyan] → [link=https://trusera.dev]trusera.dev[/link]",
            style="dim",
        )

        return console.export_text()
