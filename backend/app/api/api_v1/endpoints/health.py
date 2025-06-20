"""
ヘルスチェック エンドポイント
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    """基本的なヘルスチェック"""
    return {
        "status": "healthy",
        "service": "申請管理システム API",
        "version": settings.VERSION
    }


@router.get("/db")
async def health_check_db(db: Session = Depends(get_db)):
    """データベース接続チェック"""
    try:
        # 簡単なクエリでDB接続を確認
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "db_type": "sqlite" if settings.USE_SQLITE else "postgresql"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }