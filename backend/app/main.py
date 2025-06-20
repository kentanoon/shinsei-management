"""
申請管理システム - FastAPI Backend
メイン エントリポイント
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.api.api_v1.api import api_router

# FastAPIアプリケーションの初期化
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="建築申請管理システム API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

# CORS設定
if settings.BACKEND_CORS_ORIGINS:
    origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# APIルーターを追加
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """ヘルスチェック用のルートエンドポイント"""
    return {
        "message": "申請管理システム API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
    )