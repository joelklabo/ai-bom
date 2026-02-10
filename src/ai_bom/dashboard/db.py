"""SQLite database for persisting scan results."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".ai-bom" / "scans.db"


def _get_connection(db_path: Path | None = None) -> sqlite3.Connection:
    """Get a database connection.

    Args:
        db_path: Override path for testing. Uses DB_PATH if None.

    Returns:
        SQLite connection with row_factory set to sqlite3.Row.
    """
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path | None = None) -> None:
    """Initialize the database and create tables.

    Args:
        db_path: Override path for testing.
    """
    conn = _get_connection(db_path)
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                target_path TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                components_json TEXT NOT NULL,
                scan_duration REAL,
                ai_bom_version TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_timestamp ON scans(timestamp DESC);
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_scan(
    scan_id: str,
    timestamp: str,
    target_path: str,
    summary_json: str,
    components_json: str,
    scan_duration: float | None = None,
    ai_bom_version: str | None = None,
    db_path: Path | None = None,
) -> None:
    """Save a scan result to the database.

    Args:
        scan_id: Unique scan identifier.
        timestamp: ISO-8601 timestamp of the scan.
        target_path: Path or URL that was scanned.
        summary_json: JSON string of the scan summary.
        components_json: JSON string of the components list.
        scan_duration: Scan duration in seconds.
        ai_bom_version: Version of ai-bom that produced the scan.
        db_path: Override path for testing.
    """
    conn = _get_connection(db_path)
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO scans
                (id, timestamp, target_path, summary_json,
                 components_json, scan_duration, ai_bom_version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scan_id, timestamp, target_path, summary_json,
                components_json, scan_duration, ai_bom_version,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_scans(db_path: Path | None = None) -> list[dict]:
    """Get all scans, most recent first.

    Args:
        db_path: Override path for testing.

    Returns:
        List of scan dicts (without full components_json for listing).
    """
    conn = _get_connection(db_path)
    try:
        cursor = conn.execute(
            """
            SELECT id, timestamp, target_path, summary_json, scan_duration, ai_bom_version
            FROM scans
            ORDER BY timestamp DESC
            """
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["summary"] = json.loads(item.pop("summary_json"))
            result.append(item)
        return result
    finally:
        conn.close()


def get_scan_by_id(scan_id: str, db_path: Path | None = None) -> dict | None:
    """Get a single scan by ID.

    Args:
        scan_id: The scan identifier.
        db_path: Override path for testing.

    Returns:
        Full scan dict including components, or None if not found.
    """
    conn = _get_connection(db_path)
    try:
        cursor = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,))
        row = cursor.fetchone()
        if row is None:
            return None
        item = dict(row)
        item["summary"] = json.loads(item.pop("summary_json"))
        item["components"] = json.loads(item.pop("components_json"))
        return item
    finally:
        conn.close()


def delete_scan(scan_id: str, db_path: Path | None = None) -> bool:
    """Delete a scan by ID.

    Args:
        scan_id: The scan identifier.
        db_path: Override path for testing.

    Returns:
        True if a row was deleted, False if not found.
    """
    conn = _get_connection(db_path)
    try:
        cursor = conn.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
