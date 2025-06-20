# 申請管理システム クイックリファレンス

## 🚀 実装済み機能一覧（Phase 1完了 + Phase 2 B1完了）

### A1. プロジェクト作成・編集機能

#### 郵便番号自動入力
```typescript
// フロントエンド: PostalCodeField コンポーネント
<PostalCodeField 
  value={postalCode}
  onChange={setPostalCode}
  onAddressSelect={handleAddressSelect}
/>

// バックエンド: 郵便番号API
GET /api/v1/utils/postal-code/{postal_code}
```

#### 顧客検索オートコンプリート
```typescript
// フロントエンド: CustomerAutocomplete コンポーネント
<CustomerAutocomplete
  value={selectedCustomer}
  onChange={setSelectedCustomer}
/>

// バックエンド: 顧客検索API
GET /api/v1/utils/customers/search?q={query}&limit={limit}
```

#### プロジェクトコード自動生成
```python
# バックエンド: ProjectService
def generate_project_code(self) -> str:
    current_year = datetime.now().year
    # [年度4桁][連番3桁] 形式で生成
    return f"{current_year}{current_number:03d}"
```

#### バリデーション
```typescript
// フロントエンド: バリデーションユーティリティ
import { ProjectValidator, CustomerValidator } from '../utils/validation';

const nameResult = ProjectValidator.validateProjectName(projectName);
const phoneResult = CustomerValidator.validatePhoneNumber(phone);
```

### A2. データ編集機能

#### インライン編集
```typescript
// フロントエンド: InlineEditField コンポーネント
<InlineEditField
  value={project.name}
  field="project_name"
  onSave={handleFieldSave}
  type="text"
/>

// ステータス専用コンポーネント
<InlineStatusField
  value={project.status}
  field="status"
  onSave={handleFieldSave}
/>
```

#### 一括編集・部分更新
```typescript
// 一括編集API
PATCH /api/v1/projects/
{
  "project_ids": [1, 2, 3],
  "updates": { "status": "工事中" }
}

// 部分更新API
PATCH /api/v1/projects/{project_id}
{
  "project_name": "新しい案件名",
  "status": "受注"
}
```

#### 監査証跡
```python
# バックエンド: 自動監査証跡記録
def _record_audit_trail(self, target_model, target_id, action, field_name, old_value, new_value):
    audit_trail = AuditTrail(
        target_model=target_model,
        target_id=target_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        action=action
    )
    self.db.add(audit_trail)
```

### A3. 申請ワークフロー

#### ワークフロー状態管理
```python
# バックエンド: ApplicationStatusEnum
class ApplicationStatusEnum(enum.Enum):
    DRAFT = "下書き"
    IN_REVIEW = "レビュー中" 
    APPROVED = "承認済"
    REJECTED = "差戻し"
    WITHDRAWN = "取下げ"
    COMPLETED = "完了"
```

#### ワークフローアクション
```typescript
// フロントエンド: ワークフローアクション
<ApplicationWorkflowActions
  applicationId={application.id}
  currentStatus={application.status}
  onStatusChange={handleStatusChange}
/>

// バックエンド: ワークフローアクションAPI
POST /api/v1/applications/{id}/submit
POST /api/v1/applications/{id}/approve
POST /api/v1/applications/{id}/reject
POST /api/v1/applications/{id}/withdraw
```

#### ワークフロー表示
```typescript
// フロントエンド: ワークフロー進捗表示
<ApplicationWorkflowStepper
  currentStatus={application.status}
  submittedDate={application.submitted_date}
  approvedDate={application.approved_date}
  rejectedDate={application.rejected_date}
  orientation="horizontal"
/>
```

---

## 📊 API エンドポイント一覧

### プロジェクト関連
```
GET    /api/v1/projects/                    # プロジェクト一覧
GET    /api/v1/projects/summary             # サマリー情報
GET    /api/v1/projects/{project_code}      # プロジェクト詳細
POST   /api/v1/projects/                    # プロジェクト作成
PUT    /api/v1/projects/{project_id}        # プロジェクト更新
PATCH  /api/v1/projects/{project_id}        # 部分更新
PATCH  /api/v1/projects/                    # 一括更新
DELETE /api/v1/projects/{project_id}        # プロジェクト削除
```

### 申請ワークフロー関連
```
GET    /api/v1/applications/                # 申請一覧
GET    /api/v1/applications/summary         # 申請サマリー
GET    /api/v1/applications/{id}            # 申請詳細
POST   /api/v1/applications/                # 申請作成
PUT    /api/v1/applications/{id}            # 申請更新
POST   /api/v1/applications/{id}/submit     # 申請提出
POST   /api/v1/applications/{id}/approve    # 申請承認
POST   /api/v1/applications/{id}/reject     # 申請差戻し
POST   /api/v1/applications/{id}/withdraw   # 申請取下げ
GET    /api/v1/applications/{id}/audit-trail # 監査証跡取得
```

### ユーティリティ関連
```
GET    /api/v1/utils/postal-code/{code}           # 郵便番号検索
GET    /api/v1/utils/postal-code/validate/{code}  # 郵便番号バリデーション
GET    /api/v1/utils/customers/search             # 顧客検索
GET    /api/v1/utils/prefectures                  # 都道府県一覧
GET    /api/v1/utils/building-uses                # 建物用途一覧
GET    /api/v1/utils/structures                   # 構造種別一覧
```

### リアルタイム通信関連
```
WS     /api/v1/realtime/ws                        # WebSocket接続
GET    /api/v1/realtime/ws/stats                  # WebSocket統計
```

---

## 📊 Phase 2 B1: インタラクティブ・ダッシュボード（実装完了）

### ダッシュボード機能
```typescript
// メインダッシュボードコンポーネント
import InteractiveDashboard from '../components/dashboard/InteractiveDashboard';

// 基本的な使用方法
<InteractiveDashboard 
  projects={projectsData}
  loading={isLoading}
/>
```

### 実装済みウィジェット
```typescript
// プロジェクト概要ウィジェット
import ProjectSummaryWidget from '../components/dashboard/widgets/ProjectSummaryWidget';

// ステータス分布ウィジェット
import ProjectStatusWidget from '../components/dashboard/widgets/ProjectStatusWidget';

// 月別推移ウィジェット  
import MonthlyTrendWidget from '../components/dashboard/widgets/MonthlyTrendWidget';

// 最近のプロジェクトウィジェット
import RecentProjectsWidget from '../components/dashboard/widgets/RecentProjectsWidget';

// KPI指標ウィジェット
import KPIMetricsWidget from '../components/dashboard/widgets/KPIMetricsWidget';
```

### WebSocketリアルタイム更新
```typescript
// WebSocketフック
import { useWebSocket } from '../hooks/useWebSocket';

// リアルタイム更新の使用方法
const { isConnected, connectionError, sendMessage } = useWebSocket({
  userId: 'user-id',
  onProjectUpdate: (data, action) => {
    // プロジェクト更新時の処理
    console.log('Project updated:', data, action);
  },
  onDashboardRefresh: () => {
    // ダッシュボード更新時の処理
    refreshDashboardData();
  },
});
```

### パーソナライズ機能
```typescript
// ダッシュボード設定
import DashboardSettingsDialog, { DashboardSettings } from '../components/dashboard/DashboardSettings';

// 設定項目
interface DashboardSettings {
  autoRefresh: boolean;           // 自動更新
  refreshInterval: number;        // 更新間隔（秒）
  showAnimations: boolean;        // アニメーション
  compactMode: boolean;           // コンパクトモード
  defaultView: string;            // デフォルトビュー
  showConnectionStatus: boolean;  // 接続ステータス表示
  enableNotifications: boolean;   // 通知有効
  theme: string;                  // テーマ
}
```

### レイアウト管理
```typescript
// レイアウトのエクスポート
const exportLayout = () => {
  // 現在のレイアウトをJSONファイルとしてダウンロード
};

// レイアウトのインポート
const importLayout = (file: File) => {
  // JSONファイルからレイアウトを復元
};

// レイアウトのリセット
const resetLayout = () => {
  // デフォルトレイアウトに戻す
};
```

---

## 🎨 UIコンポーネント一覧

### 入力支援コンポーネント
```typescript
// 郵便番号入力 + 住所自動入力
import PostalCodeField from '../components/PostalCodeField';

// 顧客検索オートコンプリート
import CustomerAutocomplete from '../components/CustomerAutocomplete';

// インライン編集フィールド
import InlineEditField, { InlineStatusField } from '../components/InlineEditField';
```

### ワークフロー関連コンポーネント
```typescript
// ワークフロー進捗ステッパー
import ApplicationWorkflowStepper from '../components/ApplicationWorkflowStepper';

// ワークフローアクションボタン
import ApplicationWorkflowActions from '../components/ApplicationWorkflowActions';
```

### バリデーション
```typescript
// バリデーションヘルパー
import { 
  ProjectValidator, 
  CustomerValidator, 
  SiteValidator,
  BuildingValidator,
  FormValidator 
} from '../utils/validation';

// リアルタイムバリデーションフック
import { useFieldValidation } from '../utils/validation';
```

---

## 🗄️ データベーススキーマ

### 主要テーブル
```sql
-- プロジェクト基本情報
projects (id, project_code, project_name, status, input_date, created_at, updated_at)

-- 顧客情報
customers (id, project_id, owner_name, owner_kana, owner_zip, owner_address, owner_phone, ...)

-- 敷地情報
sites (id, project_id, address, land_area, city_plan, zoning, ...)

-- 建物情報
buildings (id, project_id, building_name, construction_type, structure, ...)

-- 申請情報（拡張済み）
applications (id, project_id, application_type_id, status, workflow_step, 
             submitted_date, approved_date, rejected_date, completed_date,
             notes, rejection_reason, approval_comment, generated_document_path, ...)

-- 監査証跡
audit_trails (id, user_id, target_model, target_id, field_name, 
              old_value, new_value, action, timestamp)
```

### ステータス一覧
```python
# プロジェクトステータス
PROJECT_STATUSES = [
    "事前相談", "受注", "申請作業", "審査中", 
    "配筋検査待ち", "中間検査待ち", "完了検査待ち", "完了", "失注"
]

# 申請ステータス
APPLICATION_STATUSES = [
    "下書き", "レビュー中", "承認済", "差戻し", "取下げ", "完了"
]
```

---

## ⚡ 開発・テスト用コマンド

### 開発環境起動
```bash
# バックエンド
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド
cd frontend  
npm start
```

### データベース操作
```bash
# マイグレーション作成
alembic revision --autogenerate -m "description"

# マイグレーション実行
alembic upgrade head

# テストデータ投入
python scripts/load_test_data.py
```

### テスト実行
```bash
# バックエンドテスト
pytest backend/app/tests/

# フロントエンドテスト
cd frontend && npm test

# E2Eテスト
cd frontend && npm run test:e2e
```

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 郵便番号APIが動作しない
```bash
# ネットワーク接続確認
curl "https://zipcloud.ibsnet.co.jp/api/search?zipcode=1234567"

# フロントエンドプロキシ設定確認（package.json）
"proxy": "http://localhost:8000"
```

#### データベース接続エラー
```bash
# PostgreSQL接続確認
python backend/test_postgres_connection.py

# 接続設定確認
cat backend/app/core/config.py
```

#### ワークフロー状態遷移エラー
```python
# 有効な遷移を確認
ApplicationService._validate_status_transition(current_status, action)

# 状態遷移ログ確認
SELECT * FROM audit_trails WHERE target_model = 'Application' ORDER BY timestamp DESC;
```

#### バリデーションエラー
```typescript
// フロントエンド: バリデーション結果確認
const validation = ProjectValidator.validateProjectName(name);
console.log(validation.isValid, validation.error);

// バックエンド: Pydanticバリデーションエラー
# FastAPIの自動バリデーション機能を確認
```

---

## 📈 パフォーマンス指標

### 目標値（Phase 1達成済み）
- API応答時間: < 0.8秒 ✅
- テストカバレッジ: 85% ✅
- バグ発生率: < 1.5% ✅
- システム可用性: 99.5% ✅

### 監視方法
```bash
# API応答時間測定
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/api/v1/projects/"

# メモリ使用量監視
docker stats

# データベース性能監視
SELECT * FROM pg_stat_activity;
```

---

## 📞 緊急時連絡先

### システム障害時
1. **ログ確認**: `logs/` ディレクトリ
2. **データベース確認**: PostgreSQL接続とクエリ
3. **API確認**: `/api/v1/health` エンドポイント
4. **エスカレーション**: プロジェクトマネージャーへ連絡

### 開発関連問い合わせ
- **技術的問題**: テックリード
- **要件・仕様**: プロジェクトマネージャー
- **UI/UX**: フロントエンドリード

---

*最終更新: 2024年12月19日*