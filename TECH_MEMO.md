# 申請管理システム 技術MEMO

## 📋 概要

この技術MEMOは、申請管理システムの開発プロセス、技術選定、アーキテクチャの決定事項をまとめたものです。同様のシステムを構築する際の指針として活用してください。

---

## 🎯 システム概要

### 主要機能
- **プロジェクト管理**: 建築・土木工事案件の進捗管理
- **申請書類管理**: 各種行政申請の状況追跡
- **工程管理**: 検査スケジュール・進捗の可視化
- **財務管理**: 契約・決済金額の管理
- **Googleフォーム連携**: 申請書類の自動化

### 技術スタック
```
Frontend: React + TypeScript + Material-UI
Backend:  FastAPI + Python + SQLAlchemy
Database: PostgreSQL (開発時はSQLite)
Deploy:   Docker + GitHub Actions
```

---

## 🏗️ アーキテクチャ設計方針

### 1. **レイヤード アーキテクチャ**

```
┌─────────────────────────────────────┐
│ Presentation Layer (React/MUI)     │
├─────────────────────────────────────┤
│ API Layer (FastAPI)                │
├─────────────────────────────────────┤
│ Business Logic Layer (Services)    │
├─────────────────────────────────────┤
│ Data Access Layer (SQLAlchemy)     │
├─────────────────────────────────────┤
│ Database (PostgreSQL)              │
└─────────────────────────────────────┘
```

### 2. **ディレクトリ構造**

```
申請管理システム/
├── frontend/                    # React アプリケーション
│   ├── src/
│   │   ├── components/         # 再利用可能コンポーネント
│   │   ├── pages/             # ページコンポーネント
│   │   ├── services/          # API通信・データ処理
│   │   ├── theme/             # UIテーマ設定
│   │   ├── types/             # TypeScript型定義
│   │   └── utils/             # ユーティリティ関数
│   └── public/
├── backend/                     # FastAPI アプリケーション
│   ├── app/
│   │   ├── api/               # APIエンドポイント
│   │   ├── core/              # 設定・セキュリティ
│   │   ├── models/            # データベースモデル
│   │   ├── schemas/           # Pydanticスキーマ
│   │   └── services/          # ビジネスロジック
│   └── scripts/               # 初期化・メンテナンススクリプト
└── docs/                       # ドキュメント
```

---

## 🚀 開発プロセス・決定事項

### Phase 1: 要件定義・設計 (1-2週間)

#### 1.1 **ビジネス要件の明確化**
```markdown
## 必須で決めること
- 対象業界・業務プロセスの詳細理解
- 既存システムからの移行要件
- ユーザーロール・権限設計
- 外部システム連携仕様（Google Forms等）
- データ保存期間・バックアップ要件
```

#### 1.2 **技術要件定義テンプレート**
```yaml
技術要件:
  性能要件:
    - 同時接続ユーザー数: 100人
    - レスポンス時間: 2秒以内
    - 可用性: 99.9%
  
  セキュリティ要件:
    - 認証方式: JWT + OAuth2
    - データ暗号化: TLS 1.3
    - アクセスログ保管: 1年間
  
  運用要件:
    - バックアップ頻度: 日次
    - 監視項目: CPU, Memory, DB接続数
    - エラー通知: Slack連携
```

#### 1.3 **データモデル設計**
```sql
-- 必須テーブル設計パターン
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 監査ログテーブル（必須）
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 2: 環境構築・基盤開発 (1週間)

#### 2.1 **開発環境セットアップチェックリスト**
```bash
# Frontend環境
□ Node.js v18+ インストール
□ npm/yarn パッケージマネージャー設定
□ ESLint + Prettier 設定
□ TypeScript設定 (strict mode)
□ Material-UI v5+ インストール

# Backend環境  
□ Python 3.9+ + Poetry/pip
□ FastAPI + Uvicorn
□ SQLAlchemy + Alembic (DB migration)
□ pytest + factory_boy (テスト環境)
□ Black + isort (コードフォーマット)

# Database環境
□ PostgreSQL 14+ 本番環境
□ SQLite 開発環境 (軽量化)
□ DB接続プール設定
□ マイグレーション管理
```

#### 2.2 **Docker環境構築**
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]

# Backend Dockerfile  
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Phase 3: コア機能開発 (3-4週間)

#### 3.1 **API設計パターン**
```python
# FastAPI APIRouter パターン
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])

@router.get("/", response_model=List[ProjectSchema])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """プロジェクト一覧取得"""
    projects = project_service.get_projects(db, skip=skip, limit=limit)
    return projects
```

#### 3.2 **フロントエンド コンポーネント設計**
```typescript
// 再利用可能コンポーネントパターン
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
}

export const DataTable = <T,>({ 
  data, 
  columns, 
  loading = false,
  onRowClick,
  pagination = true 
}: DataTableProps<T>) => {
  // Material-UI Table implementation
};
```

#### 3.3 **状態管理パターン**
```typescript
// カスタムフック + Context パターン
interface AppState {
  user: User | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export const useAppState = () => {
  const [state, setState] = useState<AppState>(initialState);
  
  const actions = {
    setUser: (user: User) => setState(prev => ({ ...prev, user })),
    setProjects: (projects: Project[]) => setState(prev => ({ ...prev, projects })),
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading })),
    setError: (error: string | null) => setState(prev => ({ ...prev, error }))
  };
  
  return { state, actions };
};
```

### Phase 4: UI/UX設計・テーマ統一 (1-2週間)

#### 4.1 **デザインシステム構築**
```typescript
// Material-UI テーマ設定
export const theme = createTheme({
  palette: {
    primary: {
      main: '#3D5B81',      // ダークブルー（メインカラー）
      light: '#9BC0D9',     // ライトブルー（アクセント）
      dark: '#293241',      // ダークグレー（テキスト）
    },
    secondary: {
      main: '#EE6B4D',      // オレンジレッド（警告・アクション）
    },
    success: {
      main: '#9BC0D9',      // ライトブルー（成功状態）
    },
    error: {
      main: '#EE6B4D',      // オレンジレッド（エラー状態）
    },
    background: {
      default: '#ffffff',   // 白背景
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Noto Sans JP',
      'Hiragino Kaku Gothic ProN',
      'sans-serif'
    ].join(','),
  }
});
```

#### 4.2 **UIコンポーネント統一ルール**
```typescript
// ✅ 良い例: テーマカラー使用
<Typography sx={{ color: 'primary.main' }}>タイトル</Typography>
<Button color="primary" variant="contained">保存</Button>

// ❌ 悪い例: ハードコーディング
<Typography sx={{ color: '#007bff' }}>タイトル</Typography>
<Button sx={{ backgroundColor: '#28a745' }}>保存</Button>
```

#### 4.3 **アイコン使用ガイドライン**
```typescript
// Material Icons 使用パターン
import {
  Download as DownloadIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// ログメッセージパターン
console.log('[SUCCESS] データ保存完了');  // ✅
console.log('[ERROR] 接続エラー');        // ❌  
console.log('[WARNING] 警告メッセージ');   // ⚠️
console.log('[INFO] 情報メッセージ');      // ℹ️
```

---

## 📊 データベース設計ベストプラクティス

### 1. **テーブル設計原則**

```sql
-- 基本テーブル構造
CREATE TABLE [table_name] (
    id SERIAL PRIMARY KEY,                    -- 必須: 主キー
    [entity]_code VARCHAR(50) UNIQUE NOT NULL, -- 推奨: ビジネスキー
    [other_columns],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 必須: 作成日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 必須: 更新日時
    created_by INTEGER REFERENCES users(id),        -- 推奨: 作成者
    updated_by INTEGER REFERENCES users(id)         -- 推奨: 更新者
);
```

### 2. **マイグレーション管理**
```python
# Alembic revision example
"""Add project status tracking

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-01-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('project_code', sa.String(50), unique=True, nullable=False),
        sa.Column('project_name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

def downgrade():
    op.drop_table('projects')
```

### 3. **データ初期化スクリプト**
```python
# scripts/init_data.py
def create_master_data(db: Session):
    """マスターデータの初期投入"""
    
    # 申請種別マスターデータ
    application_types = [
        {"code": "building_permit", "name": "建築確認申請", "is_active": True},
        {"code": "completion_inspection", "name": "完了検査申請", "is_active": True},
    ]
    
    for app_type_data in application_types:
        existing = db.query(ApplicationType).filter_by(code=app_type_data["code"]).first()
        if not existing:
            app_type = ApplicationType(**app_type_data)
            db.add(app_type)
    
    db.commit()
    print("[SUCCESS] マスターデータ初期化完了")
```

---

## 🔧 開発ツール・設定

### 1. **VS Code 設定**
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### 2. **Git フック設定**
```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "Running pre-commit checks..."

# Frontend checks
cd frontend && npm run lint && npm run type-check

# Backend checks  
cd ../backend && black . --check && isort . --check-only && flake8

echo "Pre-commit checks passed!"
```

### 3. **Docker Compose 開発環境**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:8000
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/appdb
    depends_on:
      - db
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧪 テスト戦略

### 1. **フロントエンドテスト**
```typescript
// components/__tests__/ProjectList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../ProjectList';

describe('ProjectList', () => {
  it('should display projects list', () => {
    const mockProjects = [
      { id: 1, project_code: 'PRJ001', project_name: 'Test Project' }
    ];
    
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('PRJ001')).toBeInTheDocument();
  });
});
```

### 2. **バックエンドテスト**
```python
# tests/test_projects.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_projects():
    response = client.get("/api/v1/projects/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_project():
    project_data = {
        "project_code": "TEST001",
        "project_name": "Test Project",
        "status": "planning"
    }
    response = client.post("/api/v1/projects/", json=project_data)
    assert response.status_code == 201
    assert response.json()["project_code"] == "TEST001"
```

---

## 🚀 デプロイメント

### 1. **GitHub Actions CI/CD**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install frontend dependencies
        run: cd frontend && npm ci
        
      - name: Run frontend tests
        run: cd frontend && npm test
        
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install backend dependencies
        run: cd backend && pip install -r requirements.txt
        
      - name: Run backend tests
        run: cd backend && pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          echo "Deploying to production..."
          # デプロイスクリプト実行
```

### 2. **本番環境設定**
```bash
# 環境変数設定例
export DATABASE_URL="postgresql://user:pass@localhost:5432/proddb"
export JWT_SECRET_KEY="your-super-secret-key"
export GOOGLE_OAUTH_CLIENT_ID="your-google-client-id"
export GOOGLE_OAUTH_CLIENT_SECRET="your-google-client-secret"
export EMAIL_SMTP_HOST="smtp.gmail.com"
export EMAIL_SMTP_PORT="587"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
```

---

## 📝 運用・保守

### 1. **監視・ログ設定**
```python
# app/core/logging.py
import logging
from pythonjsonlogger import jsonlogger

def setup_logging():
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
```

### 2. **バックアップ戦略**
```bash
#!/bin/bash
# scripts/backup.sh
DB_NAME="appdb"
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# PostgreSQL バックアップ
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 古いバックアップ削除（30日以上前）
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "[SUCCESS] Backup completed: backup_$DATE.sql"
```

### 3. **パフォーマンス監視**
```python
# app/middleware/performance.py
from fastapi import Request
import time
import logging

async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logging.info({
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time": process_time
    })
    
    return response
```

---

## ⚠️ よくある問題と対策

### 1. **データベース接続問題**
```python
# 解決策: 接続プール + リトライ機能
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,  # 接続チェック
    pool_recycle=3600   # 1時間でコネクション再作成
)
```

### 2. **フロントエンド状態管理**
```typescript
// 解決策: エラーハンドリング付きカスタムフック
export const useApi = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
};
```

### 3. **セキュリティ対策**
```python
# JWT認証 + CORS設定
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 本番では特定ドメインのみ
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

security = HTTPBearer()
```

---

## 📚 技術選定の理由

| 技術 | 選定理由 | 代替案 |
|------|----------|--------|
| **React + TypeScript** | 型安全性、エコシステム充実、学習コスト低 | Vue.js, Angular |
| **Material-UI** | Google Material Design、日本語対応、豊富なコンポーネント | Ant Design, Chakra UI |
| **FastAPI** | 高速、自動OpenAPI生成、型ヒント活用 | Django, Flask |
| **PostgreSQL** | ACID特性、JSON対応、スケーラビリティ | MySQL, MongoDB |
| **SQLAlchemy** | Pythonでの実績、マイグレーション管理 | Django ORM, Peewee |

---

## 🎯 次回開発時の改善点

### 1. **事前に決めておくべきこと**
- [ ] 詳細な要件定義書（機能一覧、画面遷移図）
- [ ] データベース設計書（ER図、テーブル定義書）
- [ ] API仕様書（OpenAPI/Swagger）
- [ ] UI/UXデザインガイドライン
- [ ] テスト戦略・品質基準
- [ ] デプロイメント戦略
- [ ] 運用・保守計画

### 2. **開発効率化**
- [ ] コードジェネレーター導入（Scaffold生成）
- [ ] Storybook導入（コンポーネント管理）
- [ ] E2Eテスト自動化（Playwright/Cypress）
- [ ] コードレビューチェックリスト
- [ ] 定期的なリファクタリング計画

### 3. **技術的改善**
- [ ] リアルタイム通信（WebSocket）
- [ ] 検索機能強化（Elasticsearch）
- [ ] キャッシュ戦略（Redis）
- [ ] マイクロサービス化検討
- [ ] 監視・ログ集約（ELK Stack）

---

## 📞 緊急時対応

### システム障害時
1. **障害レベル判定**: 影響度・緊急度の評価
2. **初期対応**: サービス復旧の応急処置
3. **原因調査**: ログ解析・データベース状態確認
4. **恒久対策**: 根本原因解決・再発防止策

### 連絡体制
- **開発チーム**: システム復旧・原因調査
- **運用チーム**: ユーザー対応・情報共有
- **管理者**: 意思決定・関係者調整

---

*この技術MEMOは継続的にアップデートし、プロジェクトの成長とともに改善していくものです。*

最終更新: 2024年6月28日