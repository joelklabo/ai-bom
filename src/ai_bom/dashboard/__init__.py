"""AI-BOM web dashboard — optional FastAPI application."""

from __future__ import annotations

from contextlib import asynccontextmanager


def create_app() -> "FastAPI":  # noqa: F821
    """Create and configure the FastAPI dashboard app."""
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse

    from ai_bom import __version__
    from ai_bom.dashboard.api import router
    from ai_bom.dashboard.db import init_db
    from ai_bom.dashboard.frontend import get_dashboard_html

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db()
        yield

    app = FastAPI(title="AI-BOM Dashboard", version=__version__, lifespan=lifespan)
    app.include_router(router, prefix="/api")

    @app.get("/", response_class=HTMLResponse)
    def _dashboard_root() -> str:
        return get_dashboard_html()

    return app
