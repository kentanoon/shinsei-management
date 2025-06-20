# 申請管理システム

企業の多段階申請プロセスを効率化するWebアプリケーションです。基本情報入力から見積もり比較、最終申請まで段階的に管理し、Google Forms連携により申請書類の自動送信を実現します。

## 🏗️ システム概要

### 主要機能
- **多段階申請管理**: 基本情報→見積もり比較→最終申請の段階的フロー
- **Google Forms連携**: 申請書類の自動送信とフォーム管理
- **データベース管理**: プロジェクト、申請、見積もりデータの一元管理
- **ダッシュボード**: 申請状況の可視化と進捗追跡
- **承認ワークフロー**: 段階的な承認プロセスの管理
- **メール通知**: 申請状況変更時の自動通知機能

### 技術スタック
- **フロントエンド**: React 18 + TypeScript + Material-UI
- **バックエンド**: FastAPI + Python 3.11
- **データベース**: SQLite（開発）/ PostgreSQL（本番）
- **インフラ**: Docker + Docker Compose

## 📁 プロジェクト構造

```
申請管理システム/
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── api/               # API エンドポイント
│   │   ├── core/              # 設定・データベース
│   │   ├── models/            # データモデル
│   │   ├── services/          # ビジネスロジック
│   │   └── utils/             # ユーティリティ
│   ├── migrations/            # データベースマイグレーション
│   ├── scripts/               # 初期化・運用スクリプト
│   └── tests/                 # テスト
├── frontend/                   # React フロントエンド
│   ├── src/
│   │   ├── components/        # 再利用可能コンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   ├── services/         # API クライアント
│   │   ├── types/            # TypeScript 型定義
│   │   └── utils/            # ユーティリティ
│   └── public/               # 静的ファイル
├── data/                      # データファイル・テンプレート
├── legacy/                    # 既存システムのファイル
├── docs/                      # ドキュメント
└── scripts/                   # 運用スクリプト
```

## 🚀 セットアップ

### 前提条件
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose（推奨）

### 開発環境のセットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd 申請管理システム
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集して設定を調整
   ```

3. **Dockerを使用する場合（推奨）**
   ```bash
   # 開発環境の起動
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

4. **ローカル環境での起動**

   **バックエンド:**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # データベース初期化
   python scripts/init_db.py
   
   # 既存データの移行（必要に応じて）
   python scripts/migrate_legacy_data.py
   
   # サーバー起動
   uvicorn app.main:app --reload
   ```

   **フロントエンド:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### アクセス
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 📊 データベース

### 開発環境（SQLite）
- パス: `./data/application.db`
- 軽量で設定不要

### 本番環境（PostgreSQL）
- Docker Composeで自動セットアップ
- 永続化ボリューム対応

### マイグレーション
```bash
cd backend

# 新しいマイグレーションファイルの作成
alembic revision --autogenerate -m "説明"

# マイグレーションの実行
alembic upgrade head

# マイグレーション履歴の確認
alembic history
```

## 🔧 開発ガイド

### API開発
- FastAPI の自動生成ドキュメントを活用: http://localhost:8000/docs
- 新しいエンドポイントは `backend/app/api/api_v1/endpoints/` に追加
- ビジネスロジックは `backend/app/services/` に実装

### フロントエンド開発
- Material-UI コンポーネントを使用
- React Query でAPI状態管理
- TypeScriptの型安全性を活用

### コード品質
```bash
# バックエンド
cd backend
black .                    # フォーマット
isort .                    # インポート整理
mypy .                     # 型チェック
pytest                     # テスト実行

# フロントエンド
cd frontend
npm run lint               # ESLint
npm run format             # Prettier
npm test                   # テスト実行
```

## 📦 デプロイ

### 本番環境
```bash
# 本番環境の起動
docker-compose up -d

# SSL証明書の設定（nginx/ssl/に配置）
# 環境変数の本番用設定
```

### 環境変数
本番環境では以下の環境変数を適切に設定してください：
- `SECRET_KEY`: 強力なシークレットキー
- `POSTGRES_PASSWORD`: 安全なパスワード
- `ENVIRONMENT=production`

## 🤝 貢献

1. 機能ブランチを作成
2. 変更をコミット
3. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは私的利用のため、ライセンスは設定されていません。

## 📞 サポート

質問や問題がある場合は、以下までお問い合わせください：
- 開発者: [Your Name]
- メール: [your-email@example.com]