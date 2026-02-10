"""Scanner modules for AI-BOM detection.

Importing this package triggers auto-registration of all scanner classes
via the __init_subclass__ hook in BaseScanner.

Available scanners:
    - CodeScanner: Detects AI libraries and frameworks in source code
    - DockerScanner: Detects AI services in Docker/Kubernetes deployments
    - NetworkScanner: Detects AI endpoints and credentials in config files
    - CloudScanner: Detects AI services in Terraform, CloudFormation, etc.
    - N8nScanner: Detects AI components in n8n workflow automation
    - ASTScanner: Deep AST-based Python analysis (--deep flag)
    - AWSLiveScanner: Scans live AWS account for AI/ML services (optional)
    - GCPLiveScanner: Scans live GCP project for AI/ML services (optional)
    - AzureLiveScanner: Scans live Azure subscription for AI/ML services (optional)
"""

# Import scanner modules to trigger registration via __init_subclass__
from ai_bom.scanners import (  # noqa: F401
    ast_scanner,
    cloud_scanner,
    code_scanner,
    docker_scanner,
    n8n_scanner,
    network_scanner,
)
from ai_bom.scanners.base import BaseScanner, get_all_scanners

# Live cloud scanners — optional dependencies, skip if SDK not installed
try:
    from ai_bom.scanners import aws_live_scanner  # noqa: F401
except ImportError:
    pass

try:
    from ai_bom.scanners import gcp_live_scanner  # noqa: F401
except ImportError:
    pass

try:
    from ai_bom.scanners import azure_live_scanner  # noqa: F401
except ImportError:
    pass

__all__ = ["BaseScanner", "get_all_scanners"]
