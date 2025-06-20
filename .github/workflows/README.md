# GitHub Actions CI/CD設定ガイド

## 概要
このリポジトリには、GitHub ActionsによるCI/CDパイプラインが設定されています。mainブランチへのプッシュ時に自動でテスト、ビルド、デプロイが実行されます。

## ワークフロー構成

### 1. テスト (test)
- バックエンド (Python/FastAPI)
  - 依存関係のインストール
  - pytestによるテスト実行
- フロントエンド (React/TypeScript)
  - 依存関係のインストール
  - ビルド確認
  - テスト実行

### 2. ビルド・プッシュ (build-and-push)
- GitHub Container Registry (ghcr.io) へのDockerイメージプッシュ
- バックエンドとフロントエンドの両方のイメージを自動ビルド
- タグ付け:
  - `latest` (mainブランチ)
  - `sha-<commit-hash>`
  - ブランチ名

### 3. デプロイ (deploy)
- 本番サーバーへのSSH接続
- 最新のDockerイメージをプル
- docker-composeによるサービス更新
- ヘルスチェック実行

## 必要なシークレット設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定してください：

### 本番サーバー接続用
```
PRODUCTION_HOST=your.production.server.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### アプリケーション設定用
```
POSTGRES_PASSWORD=your-secure-database-password
SECRET_KEY=your-application-secret-key
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 本番サーバー準備

### 1. サーバー要件
- Docker & Docker Compose インストール済み
- SSH接続可能
- ポート 80, 443, 22 開放

### 2. ディレクトリ構造
```bash
/opt/shinsei-management/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.production
├── scripts/
│   └── init.sql
├── data/
├── logs/
└── nginx/
    ├── nginx-prod.conf
    └── ssl/
```

### 3. 初期セットアップ
```bash
# アプリケーションディレクトリ作成
sudo mkdir -p /opt/shinsei-management
sudo chown $USER:$USER /opt/shinsei-management

# リポジトリからファイルをコピー
cd /opt/shinsei-management
git clone https://github.com/kentanoon/shinsei-management.git .

# 環境変数ファイル作成
cp .env.production.example .env.production
# .env.production を適切に編集

# 初回デプロイ
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
```

## デプロイフロー

1. **開発者がmainブランチにプッシュ**
2. **GitHub Actionsが自動実行**
   - テスト実行
   - Dockerイメージビルド・プッシュ
   - 本番サーバーにSSH接続
   - 最新イメージでサービス更新
3. **ヘルスチェック完了**

## ローカル開発での確認

```bash
# テスト実行
cd backend && python -m pytest
cd frontend && npm test

# ローカルビルド確認
docker compose build

# 本番環境と同じ構成でテスト
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## トラブルシューティング

### デプロイ失敗時の確認点
1. GitHub Actions のログを確認
2. 本番サーバーのDockerログを確認
3. SSH接続・権限の確認
4. 環境変数・シークレットの設定確認

### 手動デプロイ
```bash
# 本番サーバーで手動実行
cd /opt/shinsei-management
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
```

## セキュリティ

- SSH秘密鍵は適切に管理
- 環境変数にパスワードや秘密鍵を直接記載しない
- GitHub Secretsを使用して機密情報を管理
- 本番サーバーのファイアウォール設定を適切に行う

## モニタリング

- GitHub Actions の実行履歴でCI/CDの状況を監視
- 本番サーバーのヘルスチェックエンドポイント: `/health`
- Dockerコンテナのログ監視: `docker compose logs -f`