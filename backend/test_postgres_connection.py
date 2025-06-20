#!/usr/bin/env python3
"""
PostgreSQL接続テストスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def test_postgresql_connection():
    """PostgreSQL接続をテストする"""
    
    if settings.USE_SQLITE:
        print("❌ 現在SQLiteが設定されています")
        print("環境変数 USE_SQLITE=false に設定してください")
        return False
    
    try:
        # PostgreSQL接続文字列を作成
        database_url = settings.SQLALCHEMY_DATABASE_URI
        print(f"🔗 接続先: {database_url.replace(settings.POSTGRES_PASSWORD, '***')}")
        
        # エンジン作成
        engine = create_engine(database_url)
        
        # 接続テスト
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL接続成功!")
            print(f"📊 バージョン: {version}")
            
            # データベース情報取得
            result = connection.execute(text("SELECT current_database();"))
            database_name = result.fetchone()[0]
            print(f"🗄️  データベース名: {database_name}")
            
            # テーブル一覧取得
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            """))
            tables = result.fetchall()
            print(f"📋 テーブル数: {len(tables)}")
            if tables:
                print("   テーブル一覧:")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("   ⚠️  テーブルが見つかりません（マイグレーションが必要）")
            
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL接続エラー: {e}")
        print("\n🛠️  トラブルシューティング:")
        print("1. PostgreSQLサービスが起動しているか確認")
        print("2. 接続情報（ホスト、ポート、ユーザー、パスワード）が正しいか確認")
        print("3. データベースが存在するか確認")
        print("4. ユーザーに適切な権限があるか確認")
        return False

def show_current_config():
    """現在の設定を表示"""
    print("🔧 現在のデータベース設定:")
    print(f"   USE_SQLITE: {settings.USE_SQLITE}")
    print(f"   POSTGRES_SERVER: {settings.POSTGRES_SERVER}")
    print(f"   POSTGRES_PORT: {settings.POSTGRES_PORT}")
    print(f"   POSTGRES_USER: {settings.POSTGRES_USER}")
    print(f"   POSTGRES_DB: {settings.POSTGRES_DB}")
    print("")

if __name__ == "__main__":
    print("🐘 PostgreSQL接続テスト")
    print("=" * 50)
    
    show_current_config()
    
    if test_postgresql_connection():
        print("\n🎉 PostgreSQL接続テスト完了！")
        print("次のステップ:")
        print("1. alembic revision --autogenerate -m 'Initial migration'")
        print("2. alembic upgrade head")
        print("3. uvicorn app.main:app --reload")
    else:
        print("\n❌ 接続に失敗しました。設定を確認してください。")
        sys.exit(1)