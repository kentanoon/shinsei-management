"""
API v1 メインルーター
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import projects, health, schedules, financials, applications, utilities, websocket, google_forms, database_admin

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(financials.router, prefix="/financials", tags=["financials"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(utilities.router, prefix="/utils", tags=["utilities"])
api_router.include_router(websocket.router, prefix="/realtime", tags=["websocket"])
api_router.include_router(google_forms.router, prefix="/google-forms", tags=["google-forms"])
api_router.include_router(database_admin.router, prefix="/admin/database", tags=["database-admin"])