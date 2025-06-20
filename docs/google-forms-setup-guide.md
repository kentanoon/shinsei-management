# Googleフォーム連携システム セットアップガイド

## 🎯 概要

申請管理システムにGoogleフォーム連携機能を実装し、プロジェクトと申請種別に応じて適切なフォームを自動でメール送信する機能です。

## 📋 実装済み機能

✅ **バックエンド**
- フォームテンプレート管理（データベース）
- メール送信サービス（SMTP/SendGrid/AWS SES対応）
- Googleフォーム連携API
- 送信状況追跡システム

✅ **フロントエンド**
- 申請種別選択UI
- フォーム送信管理画面
- 送信状況ダッシュボード
- リアルタイム更新機能

✅ **データベース**
- フォームテンプレート管理テーブル
- 送信記録追跡テーブル
- メールテンプレート管理

## 🚀 セットアップ手順

### 1. 環境変数設定

`.env`ファイルに以下を追加：

```bash
# メール送信設定（いずれか一つを選択）

# SendGrid を使用する場合
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourcompany.com

# AWS SES を使用する場合
EMAIL_PROVIDER=aws_ses
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourcompany.com
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# SMTP を使用する場合
EMAIL_PROVIDER=smtp
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@yourcompany.com
```

### 2. 依存関係インストール

```bash
# バックエンド
cd backend
pip install sendgrid boto3  # 使用するプロバイダーに応じて

# フロントエンド（既存のMaterial-UIで対応済み）
cd frontend
# 追加の依存関係は不要
```

### 3. データベースマイグレーション

```bash
cd backend

# マイグレーションファイル作成
alembic revision --autogenerate -m "Add Google Forms integration tables"

# マイグレーション実行
alembic upgrade head

# 初期データ投入
python scripts/init_google_forms_data.py
```

### 4. APIルート追加

`backend/app/api/api_v1/api.py`に以下を追加：

```python
from app.api.api_v1.endpoints import google_forms

api_router.include_router(
    google_forms.router, 
    prefix="/google-forms", 
    tags=["google-forms"]
)
```

### 5. フロントエンドでの使用

プロジェクト詳細画面に以下を追加：

```tsx
import GoogleFormsManager from '../components/GoogleFormsManager';

// プロジェクト詳細コンポーネント内
<GoogleFormsManager
  projectId={project.id}
  projectName={project.project_name}
  customerEmails={[project.owner_email, project.contact_email].filter(Boolean)}
/>
```

## 📝 Googleフォーム作成ガイド

### 1. 基本的なフォーム作成

1. **Google Forms** (https://forms.google.com) にアクセス
2. **新しいフォームを作成**
3. フォームタイトルと説明を設定
4. 必要な質問項目を追加

### 2. 推奨フォーム構成

#### 建築確認申請フォーム例

```
フォームタイトル: 建築確認申請書（第一面）
説明: 建築確認申請の基本情報をご入力ください

質問項目:
1. プロジェクトコード（短答式テキスト・必須）
2. 施主名（短答式テキスト・必須）
3. 敷地所在地（長答式テキスト・必須）
4. 建物用途（選択式・必須）
   - 一戸建ての住宅
   - 共同住宅
   - 事務所
   - 店舗
   - その他
5. 構造（選択式・必須）
   - 木造
   - 鉄骨造
   - 鉄筋コンクリート造
   - その他
6. 階数（短答式テキスト・必須）
7. 建築面積（短答式テキスト・必須）
8. 延べ面積（短答式テキスト・必須）
9. 最高高さ（短答式テキスト・必須）
10. 設計者（短答式テキスト・必須）
11. 備考（長答式テキスト・任意）
```

### 3. フォーム設定

1. **設定** → **全般**
   - 「回答を1回に制限する」を無効化
   - 「回答後に編集を許可する」を有効化

2. **設定** → **プレゼンテーション**
   - 「進行状況バーを表示」を有効化
   - 「別の回答を送信するためのリンクを表示」を有効化

3. **設定** → **回答**
   - 「メール通知を受け取る」を有効化
   - 「回答のコピーを送信する」を有効化

### 4. フォームIDとURLの取得

```
フォームURL例:
https://docs.google.com/forms/d/e/1FAIpQLSe_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/viewform

フォームID: 1FAIpQLSe_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🗄️ データベース更新

フォーム作成後、データベースのフォームテンプレートを更新：

```sql
-- フォームテンプレート更新例
UPDATE application_form_templates 
SET 
    google_form_id = '1FAIpQLSe_YOUR_ACTUAL_FORM_ID',
    google_form_url = 'https://docs.google.com/forms/d/e/1FAIpQLSe_YOUR_ACTUAL_FORM_ID/viewform'
WHERE 
    application_type = 'building_permit' 
    AND form_category = 'basic_application';
```

または管理画面から更新：

```bash
# 管理用スクリプト実行
python scripts/update_form_templates.py
```

## 🔧 カスタマイズ方法

### 1. 新しい申請種別の追加

#### バックエンド

```python
# backend/app/schemas/google_forms.py
# APPLICATION_TYPES に追加

# 初期データスクリプトに新しいテンプレートを追加
```

#### フロントエンド

```tsx
// frontend/src/components/GoogleFormsManager.tsx
const APPLICATION_TYPES = {
  // 既存項目...
  'new_application_type': '新しい申請種別',
};
```

### 2. メールテンプレートのカスタマイズ

```python
# カスタムメールテンプレート作成
custom_template = EmailTemplate(
    template_name="custom_building_permit",
    subject_template="【緊急】{{form.form_name}}の提出をお願いします",
    body_template="""
    カスタマイズされたメール本文...
    """,
    template_variables={...}
)
```

### 3. フォーム送信後のアクション

```python
# backend/app/services/google_forms_service.py
def _send_form_email(self, submission, template):
    success = super()._send_form_email(submission, template)
    
    if success:
        # カスタムアクション
        self._notify_slack_channel(submission)
        self._update_external_system(submission)
    
    return success
```

## 📊 監視・運用

### 1. 送信状況の確認

```bash
# API経由で統計取得
curl -X GET "http://localhost:8000/api/v1/google-forms/stats/summary"
```

### 2. ログ確認

```bash
# メール送信ログ
tail -f logs/email_service.log

# フォーム送信ログ
tail -f logs/google_forms.log
```

### 3. データベース確認

```sql
-- 送信状況確認
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM form_submissions), 2) as percentage
FROM form_submissions 
GROUP BY status;

-- 最近の送信記録
SELECT 
    fs.recipient_email,
    aft.form_name,
    fs.status,
    fs.sent_at
FROM form_submissions fs
JOIN application_form_templates aft ON fs.form_template_id = aft.id
ORDER BY fs.created_at DESC
LIMIT 10;
```

## 🚨 トラブルシューティング

### よくある問題と解決策

#### 1. メール送信失敗

**症状**: フォームは送信されるがメールが届かない

**確認点**:
```bash
# ログ確認
grep "SMTP送信エラー" logs/email_service.log

# 設定確認
echo $EMAIL_PROVIDER
echo $SMTP_SERVER
```

**解決策**:
- SMTP設定の確認
- ファイアウォール設定
- メールプロバイダーの制限確認

#### 2. フォームテンプレート取得エラー

**症状**: 申請種別を選択してもフォームが表示されない

**確認点**:
```sql
-- データベース確認
SELECT * FROM application_form_templates 
WHERE application_type = 'building_permit' AND is_active = true;
```

**解決策**:
- 初期データスクリプトの再実行
- フォームIDとURLの確認

#### 3. Googleフォームのアクセスエラー

**症状**: フォームリンクにアクセスできない

**確認点**:
- フォームの公開設定
- URLの正確性
- Googleアカウントの権限

### セキュリティ対策

#### 1. メール送信制限

```python
# backend/app/services/google_forms_service.py
class GoogleFormsService:
    def __init__(self, db: Session):
        self.rate_limiter = RateLimiter(max_sends_per_day=100)
    
    def send_application_forms(self, request):
        if not self.rate_limiter.check_limit(request.project_id):
            raise HTTPException(429, "送信制限に達しました")
        # 送信処理...
```

#### 2. 入力値検証

```python
# 追加のバリデーション
def validate_email_addresses(emails: List[str]) -> bool:
    for email in emails:
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return False
    return True
```

## 📈 将来の拡張計画

### Phase 1 拡張（短期）
- [ ] フォーム回答状況のリアルタイム同期
- [ ] Slack/Teams通知連携
- [ ] モバイル対応強化

### Phase 2 拡張（中期）
- [ ] Googleフォーム自動作成機能
- [ ] AI活用による入力支援
- [ ] 多言語対応

### Phase 3 拡張（長期）
- [ ] 他フォームサービス対応（TypeForm、JotForm等）
- [ ] 電子署名連携
- [ ] ブロックチェーン証跡機能

## 📞 サポート・問い合わせ

### 技術的な質問
- GitHub Issues
- プロジェクトチーム内チャット

### 機能要望・改善提案
- プロダクトマネージャーまで

---

*最終更新: 2025年6月19日*