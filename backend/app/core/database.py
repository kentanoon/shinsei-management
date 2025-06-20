"""
データベース設定とセッション管理
SQLite と PostgreSQL の両方に対応
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# データベースエンジンの作成
if settings.USE_SQLITE:
    # SQLite設定（開発用）
    SQLALCHEMY_DATABASE_URL = settings.SQLITE_DATABASE_URL
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,
    )
else:
    # PostgreSQL設定（本番用）
    SQLALCHEMY_DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URI)
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

# セッションローカルの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()


def get_db():
    """
    データベースセッションの取得
    FastAPIの依存性注入で使用
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    テーブルの作成
    開発時の初期化用
    """
    Base.metadata.create_all(bind=engine)