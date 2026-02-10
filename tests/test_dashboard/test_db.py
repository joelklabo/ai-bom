"""Tests for the dashboard SQLite database module."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ai_bom.dashboard.db import (
    delete_scan,
    get_scan_by_id,
    get_scans,
    init_db,
    save_scan,
)


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    """Provide a temporary database path."""
    path = tmp_path / "test_scans.db"
    init_db(db_path=path)
    return path


def _sample_summary() -> str:
    return json.dumps({
        "total_components": 2,
        "total_files_scanned": 1,
        "by_type": {"llm_provider": 1, "model": 1},
        "by_provider": {"openai": 2},
        "by_severity": {"high": 1, "low": 1},
        "highest_risk_score": 75,
        "scan_duration_seconds": 1.5,
    })


def _sample_components() -> str:
    return json.dumps([
        {
            "name": "openai",
            "type": "llm_provider",
            "provider": "openai",
            "risk": {"score": 75, "severity": "high", "factors": []},
            "location": {"file_path": "app.py", "line_number": 10},
        },
        {
            "name": "gpt-4",
            "type": "model",
            "provider": "openai",
            "risk": {"score": 30, "severity": "low", "factors": []},
            "location": {"file_path": "app.py", "line_number": 15},
        },
    ])


class TestInitDb:
    def test_creates_tables(self, db_path: Path) -> None:
        """init_db should create the scans table."""
        import sqlite3
        conn = sqlite3.connect(str(db_path))
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='scans'"
        )
        assert cursor.fetchone() is not None
        conn.close()

    def test_idempotent(self, db_path: Path) -> None:
        """Calling init_db twice should not raise."""
        init_db(db_path=db_path)  # second call
        # Should not raise


class TestSaveScan:
    def test_save_and_retrieve(self, db_path: Path) -> None:
        save_scan(
            scan_id="scan-001",
            timestamp="2025-01-15T10:00:00Z",
            target_path="/home/user/project",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            scan_duration=1.5,
            ai_bom_version="0.1.0",
            db_path=db_path,
        )
        result = get_scan_by_id("scan-001", db_path=db_path)
        assert result is not None
        assert result["id"] == "scan-001"
        assert result["target_path"] == "/home/user/project"
        assert result["summary"]["total_components"] == 2
        assert len(result["components"]) == 2

    def test_upsert_on_duplicate_id(self, db_path: Path) -> None:
        """INSERT OR REPLACE should overwrite existing scan."""
        save_scan(
            scan_id="scan-dup",
            timestamp="2025-01-15T10:00:00Z",
            target_path="/old/path",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            db_path=db_path,
        )
        save_scan(
            scan_id="scan-dup",
            timestamp="2025-01-15T11:00:00Z",
            target_path="/new/path",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            db_path=db_path,
        )
        result = get_scan_by_id("scan-dup", db_path=db_path)
        assert result is not None
        assert result["target_path"] == "/new/path"


class TestGetScans:
    def test_empty_db(self, db_path: Path) -> None:
        scans = get_scans(db_path=db_path)
        assert scans == []

    def test_returns_most_recent_first(self, db_path: Path) -> None:
        timestamps = [
            "2025-01-01T00:00:00Z",
            "2025-06-01T00:00:00Z",
            "2025-03-01T00:00:00Z",
        ]
        for i, ts in enumerate(timestamps):
            save_scan(
                scan_id=f"scan-{i}",
                timestamp=ts,
                target_path=f"/path/{i}",
                summary_json=_sample_summary(),
                components_json=_sample_components(),
                db_path=db_path,
            )
        scans = get_scans(db_path=db_path)
        assert len(scans) == 3
        # Most recent first
        assert scans[0]["id"] == "scan-1"
        assert scans[1]["id"] == "scan-2"
        assert scans[2]["id"] == "scan-0"

    def test_listing_does_not_include_components(self, db_path: Path) -> None:
        save_scan(
            scan_id="scan-no-comp",
            timestamp="2025-01-01T00:00:00Z",
            target_path="/test",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            db_path=db_path,
        )
        scans = get_scans(db_path=db_path)
        assert "components" not in scans[0]
        assert "summary" in scans[0]


class TestGetScanById:
    def test_not_found(self, db_path: Path) -> None:
        result = get_scan_by_id("nonexistent", db_path=db_path)
        assert result is None

    def test_includes_components(self, db_path: Path) -> None:
        save_scan(
            scan_id="scan-full",
            timestamp="2025-01-01T00:00:00Z",
            target_path="/test",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            db_path=db_path,
        )
        result = get_scan_by_id("scan-full", db_path=db_path)
        assert result is not None
        assert "components" in result
        assert len(result["components"]) == 2
        assert result["components"][0]["name"] == "openai"


class TestDeleteScan:
    def test_delete_existing(self, db_path: Path) -> None:
        save_scan(
            scan_id="scan-del",
            timestamp="2025-01-01T00:00:00Z",
            target_path="/test",
            summary_json=_sample_summary(),
            components_json=_sample_components(),
            db_path=db_path,
        )
        assert delete_scan("scan-del", db_path=db_path) is True
        assert get_scan_by_id("scan-del", db_path=db_path) is None

    def test_delete_nonexistent(self, db_path: Path) -> None:
        assert delete_scan("nope", db_path=db_path) is False
