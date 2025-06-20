# PostgreSQL セットアップガイド

## 1. PostgreSQLのインストール

### macOS (Homebrew使用)
```bash
brew install postgresql
brew services start postgresql
```

### Windows
PostgreSQL公式サイトからインストーラーをダウンロード
https://www.postgresql.org/download/windows/

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. データベースとユーザーの作成

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベース作成
CREATE DATABASE shinsei_management;

# ユーザー作成（パスワードを設定）
CREATE USER postgres WITH PASSWORD 'your_password_here';

# 権限付与
GRANT ALL PRIVILEGES ON DATABASE shinsei_management TO postgres;

# 接続終了
\q
```

## 3. 環境設定の更新

`.env`ファイルを以下のように設定：

```env
# PostgreSQL設定
USE_SQLITE=false
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=shinsei_management
POSTGRES_PORT=5432

# セキュリティ
SECRET_KEY=your_secret_key_here

# CORS設定
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# 環境
ENVIRONMENT=development
```

## 4. データベースマイグレーション

```bash
# バックエンドディレクトリに移動
cd backend

# 仮想環境をアクティベート
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate     # Windows

# 依存関係インストール
pip install -r requirements.txt

# Alembicの初期化（既に設定済み）
# alembic init migrations

# マイグレーションファイル作成
alembic revision --autogenerate -m "Initial migration"

# マイグレーション実行
alembic upgrade head
```

## 5. 接続テスト

```bash
# サーバー起動
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## トラブルシューティング

### 接続エラーの場合
1. PostgreSQLサービスが起動しているか確認
2. ユーザー名・パスワードが正しいか確認
3. データベースが存在するか確認
4. ファイアウォール設定を確認

### 権限エラーの場合
```sql
-- スーパーユーザー権限が必要な場合
ALTER USER postgres CREATEDB;
ALTER USER postgres SUPERUSER;
```

## SQLiteからPostgreSQLへのデータ移行

既存のSQLiteデータを移行する場合：

```bash
# SQLiteからダンプ
sqlite3 data/application.db .dump > sqlite_dump.sql

# PostgreSQL用に変換（手動調整が必要）
# - AUTOINCREMENT → SERIAL
# - データ型の調整など

# PostgreSQLにインポート
psql -U postgres -d shinsei_management -f converted_dump.sql
```