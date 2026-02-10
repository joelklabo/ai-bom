"""REST API routes for the AI-BOM dashboard."""

from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai_bom.dashboard.db import (
    delete_scan,
    get_scan_by_id,
    get_scans,
    save_scan,
)

router = APIRouter()


class ScanCreate(BaseModel):
    """Pydantic model for validating scan creation requests."""

    id: str | None = None
    timestamp: str
    target_path: str
    summary: dict = {}
    components: list = []
    scan_duration: float | None = None
    ai_bom_version: str | None = None


@router.get("/scans")
def list_scans() -> list[dict]:
    """List all scans (without full component data)."""
    return get_scans()


@router.get("/scans/{scan_id}")
def get_scan(scan_id: str) -> dict:
    """Get a specific scan with full component data."""
    scan = get_scan_by_id(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.post("/scans", status_code=201)
def create_scan(scan_data: ScanCreate) -> dict:
    """Save a new scan result.

    Expects a JSON body with keys: target_path, timestamp, summary,
    components, scan_duration, ai_bom_version.
    """
    scan_id = scan_data.id or str(uuid4())

    save_scan(
        scan_id=scan_id,
        timestamp=scan_data.timestamp,
        target_path=scan_data.target_path,
        summary_json=json.dumps(scan_data.summary),
        components_json=json.dumps(scan_data.components),
        scan_duration=scan_data.scan_duration,
        ai_bom_version=scan_data.ai_bom_version,
    )
    return {"id": scan_id, "status": "saved"}


@router.delete("/scans/{scan_id}")
def remove_scan(scan_id: str) -> dict:
    """Delete a scan by ID."""
    deleted = delete_scan(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"id": scan_id, "status": "deleted"}


@router.get("/compare")
def compare_scans(scan_id_1: str, scan_id_2: str) -> dict:
    """Compare two scans side by side."""
    scan_a = get_scan_by_id(scan_id_1)
    scan_b = get_scan_by_id(scan_id_2)

    if scan_a is None or scan_b is None:
        missing = scan_id_1 if scan_a is None else scan_id_2
        raise HTTPException(status_code=404, detail=f"Scan {missing} not found")

    # Build component name sets for diff
    names_a = {c["name"] for c in scan_a["components"]}
    names_b = {c["name"] for c in scan_b["components"]}

    return {
        "scan_a": scan_a,
        "scan_b": scan_b,
        "added": sorted(names_b - names_a),
        "removed": sorted(names_a - names_b),
        "common": sorted(names_a & names_b),
    }
