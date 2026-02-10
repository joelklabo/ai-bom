"""AWS Live Scanner — discovers AI/ML services in a live AWS account via boto3."""

from __future__ import annotations

import logging
from pathlib import Path

from ai_bom.models import AIComponent, ComponentType, SourceLocation, UsageType
from ai_bom.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    _HAS_BOTO3 = True
except ImportError:
    boto3 = None  # type: ignore[assignment]
    _HAS_BOTO3 = False

    # Provide stub exception classes so except clauses compile
    class ClientError(Exception):  # type: ignore[no-redef]
        pass

    class NoCredentialsError(Exception):  # type: ignore[no-redef]
        pass


class AWSLiveScanner(BaseScanner):
    """Scan AWS account for managed AI/ML services via boto3 API calls."""

    name = "aws-live"
    description = "Scan AWS account for AI/ML services"
    enabled: bool = False

    def supports(self, path: Path) -> bool:
        return self.enabled and _HAS_BOTO3

    def scan(self, path: Path) -> list[AIComponent]:
        if not _HAS_BOTO3:
            logger.warning("boto3 is not installed — skipping AWS live scan")
            return []

        components: list[AIComponent] = []
        try:
            components.extend(self._scan_bedrock())
            components.extend(self._scan_sagemaker())
            components.extend(self._scan_comprehend())
            components.extend(self._scan_kendra())
        except NoCredentialsError:
            logger.error("AWS credentials not configured — skipping AWS live scan")
        except ClientError as exc:
            logger.error("AWS API error: %s", exc)
        return components

    # ------------------------------------------------------------------
    # Bedrock
    # ------------------------------------------------------------------
    def _scan_bedrock(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        client = boto3.client("bedrock")
        agent_client = boto3.client("bedrock-agent")

        # Foundation models
        try:
            resp = client.list_foundation_models()
            for model in resp.get("modelSummaries", []):
                model_id = model.get("modelId", "unknown")
                provider = model.get("providerName", "AWS Bedrock")
                components.append(
                    AIComponent(
                        name=model_id,
                        type=ComponentType.model,
                        provider=f"AWS Bedrock ({provider})",
                        model_name=model_id,
                        location=SourceLocation(
                            file_path=f"aws://bedrock/foundation-model/{model_id}",
                        ),
                        usage_type=UsageType.completion,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("Bedrock list_foundation_models failed: %s", exc)

        # Agents
        try:
            resp = agent_client.list_agents()
            for agent in resp.get("agentSummaries", []):
                agent_id = agent.get("agentId", "unknown")
                agent_name = agent.get("agentName", agent_id)
                components.append(
                    AIComponent(
                        name=agent_name,
                        type=ComponentType.agent_framework,
                        provider="AWS Bedrock",
                        location=SourceLocation(
                            file_path=f"aws://bedrock-agent/agent/{agent_id}",
                        ),
                        usage_type=UsageType.agent,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("Bedrock list_agents failed: %s", exc)

        # Knowledge bases
        try:
            resp = agent_client.list_knowledge_bases()
            for kb in resp.get("knowledgeBaseSummaries", []):
                kb_id = kb.get("knowledgeBaseId", "unknown")
                kb_name = kb.get("name", kb_id)
                components.append(
                    AIComponent(
                        name=kb_name,
                        type=ComponentType.tool,
                        provider="AWS Bedrock",
                        location=SourceLocation(
                            file_path=f"aws://bedrock-agent/knowledge-base/{kb_id}",
                        ),
                        usage_type=UsageType.tool_use,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("Bedrock list_knowledge_bases failed: %s", exc)

        return components

    # ------------------------------------------------------------------
    # SageMaker
    # ------------------------------------------------------------------
    def _scan_sagemaker(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        client = boto3.client("sagemaker")

        # Endpoints
        try:
            resp = client.list_endpoints()
            for ep in resp.get("Endpoints", []):
                ep_name = ep.get("EndpointName", "unknown")
                ep_arn = ep.get("EndpointArn", ep_name)
                components.append(
                    AIComponent(
                        name=ep_name,
                        type=ComponentType.endpoint,
                        provider="AWS SageMaker",
                        location=SourceLocation(
                            file_path=f"aws://sagemaker/endpoint/{ep_arn}",
                        ),
                        usage_type=UsageType.completion,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("SageMaker list_endpoints failed: %s", exc)

        # Models
        try:
            resp = client.list_models()
            for model in resp.get("Models", []):
                model_name = model.get("ModelName", "unknown")
                model_arn = model.get("ModelArn", model_name)
                components.append(
                    AIComponent(
                        name=model_name,
                        type=ComponentType.model,
                        provider="AWS SageMaker",
                        location=SourceLocation(
                            file_path=f"aws://sagemaker/model/{model_arn}",
                        ),
                        usage_type=UsageType.completion,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("SageMaker list_models failed: %s", exc)

        # Notebook instances
        try:
            resp = client.list_notebook_instances()
            for nb in resp.get("NotebookInstances", []):
                nb_name = nb.get("NotebookInstanceName", "unknown")
                nb_arn = nb.get("NotebookInstanceArn", nb_name)
                components.append(
                    AIComponent(
                        name=nb_name,
                        type=ComponentType.tool,
                        provider="AWS SageMaker",
                        location=SourceLocation(
                            file_path=f"aws://sagemaker/notebook/{nb_arn}",
                        ),
                        usage_type=UsageType.unknown,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("SageMaker list_notebook_instances failed: %s", exc)

        return components

    # ------------------------------------------------------------------
    # Comprehend
    # ------------------------------------------------------------------
    def _scan_comprehend(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        client = boto3.client("comprehend")

        try:
            resp = client.list_entities_detection_jobs()
            for job in resp.get("EntitiesDetectionJobPropertiesList", []):
                job_id = job.get("JobId", "unknown")
                job_name = job.get("JobName", job_id)
                components.append(
                    AIComponent(
                        name=job_name,
                        type=ComponentType.model,
                        provider="AWS Comprehend",
                        location=SourceLocation(
                            file_path=f"aws://comprehend/entity-detection/{job_id}",
                        ),
                        usage_type=UsageType.completion,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("Comprehend list_entities_detection_jobs failed: %s", exc)

        return components

    # ------------------------------------------------------------------
    # Kendra
    # ------------------------------------------------------------------
    def _scan_kendra(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        client = boto3.client("kendra")

        try:
            resp = client.list_indices()
            for idx in resp.get("IndexConfigurationSummaryItems", []):
                idx_id = idx.get("Id", "unknown")
                idx_name = idx.get("Name", idx_id)
                components.append(
                    AIComponent(
                        name=idx_name,
                        type=ComponentType.tool,
                        provider="AWS Kendra",
                        location=SourceLocation(
                            file_path=f"aws://kendra/index/{idx_id}",
                        ),
                        usage_type=UsageType.tool_use,
                        source="cloud-live",
                    )
                )
        except ClientError as exc:
            logger.debug("Kendra list_indices failed: %s", exc)

        return components
