"""
設定管理
環境変数とアプリケーション設定を管理
"""

import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # 基本設定
    PROJECT_NAME: str = "申請管理システム"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # セキュリティ
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # CORS設定
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
    
    # Trusted Hosts
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]

    # データベース設定
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "shinsei_management"
    POSTGRES_PORT: int = 5432
    
    # SQLite設定（開発用）
    SQLITE_DATABASE_URL: str = "sqlite:///./data/application.db"
    
    # 使用するデータベース
    USE_SQLITE: bool = True  # Trueの場合SQLite、FalseでPostgreSQL
    
    # ファイルアップロード
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "./data/uploads"
    
    # テンプレート設定
    TEMPLATE_DIR: str = "./data/提出書類テンプレート"
    
    # ログ設定
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # 管理者設定
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changeme"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """PostgreSQL接続URIを生成"""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# グローバルな設定インスタンス
settings = Settings()