# 申請管理システム - Makefile
# 開発・運用でよく使うコマンドを定義

.PHONY: help dev build up down logs clean test lint format init-db migrate

# デフォルトターゲット
help:
	@echo "申請管理システム - 利用可能なコマンド:"
	@echo ""
	@echo "  開発環境:"
	@echo "    make dev        - 開発環境を起動"
	@echo "    make dev-down   - 開発環境を停止"
	@echo "    make logs       - ログを表示"
	@echo ""
	@echo "  本番環境:"
	@echo "    make build      - イメージをビルド"
	@echo "    make up         - 本番環境を起動"
	@echo "    make down       - 本番環境を停止"
	@echo ""
	@echo "  データベース:"
	@echo "    make init-db    - データベースを初期化"
	@echo "    make migrate    - マイグレーションを実行"
	@echo "    make migrate-legacy - 既存データを移行"
	@echo ""
	@echo "  開発ツール:"
	@echo "    make test       - テストを実行"
	@echo "    make lint       - コード品質チェック"
	@echo "    make format     - コードフォーマット"
	@echo "    make clean      - 不要ファイルを削除"

# 開発環境
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# 本番環境
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

# ログ表示
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# データベース操作
init-db:
	cd backend && python scripts/init_db.py

migrate:
	cd backend && alembic upgrade head

migrate-legacy:
	cd backend && python scripts/migrate_legacy_data.py

# 開発ツール
test:
	@echo "バックエンドテスト実行..."
	cd backend && pytest
	@echo "フロントエンドテスト実行..."
	cd frontend && npm test -- --watchAll=false

lint:
	@echo "バックエンド lint チェック..."
	cd backend && black --check . && isort --check-only . && mypy .
	@echo "フロントエンド lint チェック..."
	cd frontend && npm run lint

format:
	@echo "バックエンド フォーマット実行..."
	cd backend && black . && isort .
	@echo "フロントエンド フォーマット実行..."
	cd frontend && npm run format

# クリーンアップ
clean:
	@echo "Dockerイメージ・コンテナをクリーンアップ..."
	docker-compose down --volumes --remove-orphans
	docker system prune -f
	@echo "ログファイルをクリーンアップ..."
	rm -rf logs/*.log
	@echo "一時ファイルをクリーンアップ..."
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true

# 依存関係の更新
update-deps:
	@echo "バックエンド依存関係を更新..."
	cd backend && pip-compile --upgrade requirements.in
	@echo "フロントエンド依存関係を更新..."
	cd frontend && npm update

# セットアップ（初回用）
setup:
	@echo "初回セットアップを実行..."
	cp .env.example .env
	@echo ".env ファイルを作成しました。必要に応じて編集してください。"
	mkdir -p data logs
	mkdir -p data/uploads data/出力提出書類
	@echo "ディレクトリを作成しました。"
	@echo "次のコマンドで開発環境を起動できます:"
	@echo "  make dev"

# 本番デプロイ
deploy:
	@echo "本番環境にデプロイ..."
	git pull origin main
	make build
	make down
	make up
	make migrate
	@echo "デプロイ完了"

# バックアップ
backup:
	@echo "データベースをバックアップ..."
	mkdir -p backups
	docker-compose exec db pg_dump -U postgres shinsei_management > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "バックアップ完了: backups/"

# 監視・ヘルスチェック
health:
	@echo "システムの健康状態をチェック..."
	curl -f http://localhost:8000/health || echo "バックエンドが応答しません"
	curl -f http://localhost:3000 || echo "フロントエンドが応答しません"