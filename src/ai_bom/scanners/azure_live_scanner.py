"""Azure Live Scanner — discovers AI/ML services in a live Azure subscription."""

from __future__ import annotations

import logging
from pathlib import Path

from ai_bom.models import AIComponent, ComponentType, SourceLocation, UsageType
from ai_bom.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

try:
    from azure.core.exceptions import ClientAuthenticationError, HttpResponseError
    from azure.identity import DefaultAzureCredential

    _HAS_AZURE = True
except ImportError:
    DefaultAzureCredential = None  # type: ignore[assignment,misc]
    _HAS_AZURE = False

    class ClientAuthenticationError(Exception):  # type: ignore[no-redef]
        pass

    class HttpResponseError(Exception):  # type: ignore[no-redef]
        pass


class AzureLiveScanner(BaseScanner):
    """Scan Azure subscription for managed AI/ML services."""

    name = "azure-live"
    description = "Scan Azure subscription for AI/ML services"
    enabled: bool = False

    def supports(self, path: Path) -> bool:
        return self.enabled and _HAS_AZURE

    def scan(self, path: Path) -> list[AIComponent]:
        if not _HAS_AZURE:
            logger.warning("azure packages not installed — skipping Azure live scan")
            return []

        components: list[AIComponent] = []
        try:
            self._credential = DefaultAzureCredential()
            components.extend(self._scan_openai_deployments())
            components.extend(self._scan_cognitive_services())
            components.extend(self._scan_ml_endpoints())
        except ClientAuthenticationError as exc:
            logger.error("Azure authentication failed: %s", exc)
        except HttpResponseError as exc:
            logger.error("Azure API error: %s", exc)
        except Exception as exc:
            logger.error("Azure scan error: %s", exc)
        return components

    # ------------------------------------------------------------------
    # Azure OpenAI deployments
    # ------------------------------------------------------------------
    def _scan_openai_deployments(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        try:
            from azure.mgmt.cognitiveservices import CognitiveServicesManagementClient
            from azure.mgmt.resource import SubscriptionClient

            sub_client = SubscriptionClient(self._credential)
            for sub in sub_client.subscriptions.list():
                sub_id = sub.subscription_id
                cs_client = CognitiveServicesManagementClient(self._credential, sub_id)
                for account in cs_client.accounts.list():
                    if account.kind and account.kind.lower() in ("openai", "cognitiveservices"):
                        account_name = account.name or "unknown"
                        rg = self._resource_group_from_id(account.id or "")
                        try:
                            for deployment in cs_client.deployments.list(rg, account_name):
                                dep_name = deployment.name or "unknown"
                                model_name = ""
                                if deployment.properties and deployment.properties.model:
                                    model_name = deployment.properties.model.name or ""
                                components.append(
                                    AIComponent(
                                        name=dep_name,
                                        type=ComponentType.endpoint,
                                        provider="Azure OpenAI",
                                        model_name=model_name,
                                        location=SourceLocation(
                                            file_path=(
                                                f"azure://openai/{account_name}"
                                                f"/deployment/{dep_name}"
                                            ),
                                        ),
                                        usage_type=UsageType.completion,
                                        source="cloud-live",
                                    )
                                )
                        except Exception as exc:
                            logger.debug(
                                "Azure OpenAI list deployments for %s failed: %s",
                                account_name,
                                exc,
                            )
        except ImportError:
            logger.debug("azure-mgmt-cognitiveservices not installed")
        except Exception as exc:
            logger.debug("Azure OpenAI scan failed: %s", exc)
        return components

    # ------------------------------------------------------------------
    # Cognitive Services accounts
    # ------------------------------------------------------------------
    def _scan_cognitive_services(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        try:
            from azure.mgmt.cognitiveservices import CognitiveServicesManagementClient
            from azure.mgmt.resource import SubscriptionClient

            sub_client = SubscriptionClient(self._credential)
            for sub in sub_client.subscriptions.list():
                sub_id = sub.subscription_id
                cs_client = CognitiveServicesManagementClient(self._credential, sub_id)
                for account in cs_client.accounts.list():
                    kind = (account.kind or "").lower()
                    # Skip OpenAI accounts — already covered above
                    if kind == "openai":
                        continue
                    account_name = account.name or "unknown"
                    components.append(
                        AIComponent(
                            name=account_name,
                            type=ComponentType.model,
                            provider="Azure Cognitive Services",
                            location=SourceLocation(
                                file_path=f"azure://cognitive-services/{account_name}",
                            ),
                            usage_type=UsageType.completion,
                            source="cloud-live",
                            metadata={"kind": kind},
                        )
                    )
        except ImportError:
            logger.debug("azure-mgmt-cognitiveservices not installed")
        except Exception as exc:
            logger.debug("Azure Cognitive Services scan failed: %s", exc)
        return components

    # ------------------------------------------------------------------
    # Azure ML endpoints and models
    # ------------------------------------------------------------------
    def _scan_ml_endpoints(self) -> list[AIComponent]:
        components: list[AIComponent] = []
        try:
            from azure.ai.ml import MLClient

            ml_client = MLClient.from_config(credential=self._credential)

            # Online endpoints
            try:
                for ep in ml_client.online_endpoints.list():
                    ep_name = ep.name or "unknown"
                    components.append(
                        AIComponent(
                            name=ep_name,
                            type=ComponentType.endpoint,
                            provider="Azure ML",
                            location=SourceLocation(
                                file_path=f"azure://ml/online-endpoint/{ep_name}",
                            ),
                            usage_type=UsageType.completion,
                            source="cloud-live",
                        )
                    )
            except Exception as exc:
                logger.debug("Azure ML list_online_endpoints failed: %s", exc)

            # Models
            try:
                for model in ml_client.models.list():
                    model_name = model.name or "unknown"
                    model_version = model.version or ""
                    components.append(
                        AIComponent(
                            name=model_name,
                            type=ComponentType.model,
                            provider="Azure ML",
                            version=model_version,
                            location=SourceLocation(
                                file_path=f"azure://ml/model/{model_name}",
                            ),
                            usage_type=UsageType.completion,
                            source="cloud-live",
                        )
                    )
            except Exception as exc:
                logger.debug("Azure ML list_models failed: %s", exc)

        except ImportError:
            logger.debug("azure-ai-ml not installed")
        except Exception as exc:
            logger.debug("Azure ML scan failed: %s", exc)
        return components

    @staticmethod
    def _resource_group_from_id(resource_id: str) -> str:
        """Extract resource group name from an Azure resource ID."""
        parts = resource_id.split("/")
        for i, part in enumerate(parts):
            if part.lower() == "resourcegroups" and i + 1 < len(parts):
                return parts[i + 1]
        return ""
