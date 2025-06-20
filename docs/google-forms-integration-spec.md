# Googleフォーム連携システム 実装仕様書

## 🎯 機能概要

プロジェクトと申請書類の種別を選択すると、対応するGoogleフォームのリンクが自動でメール送信される機能を実装します。

## 📋 システム要件

### 基本フロー
1. **申請種別選択**: ユーザーがプロジェクトと申請書類種別を選択
2. **フォーム特定**: 選択された組み合わせに対応するGoogleフォームを特定
3. **メール自動送信**: 顧客・関係者に適切なフォームリンクを含むメールを送信
4. **進捗追跡**: フォーム送信状況と回答状況を追跡

### 対応申請書類種別
```yaml
application_types:
  building_permit:
    name: "建築確認申請"
    forms:
      - initial_application: "建築確認申請書（第一面）"
      - site_plan: "配置図・各階平面図"
      - structural_plan: "構造計算書"
  
  completion_inspection:
    name: "完了検査申請"
    forms:
      - completion_form: "完了検査申請書"
      - completion_checklist: "完了検査チェックリスト"
  
  interim_inspection:
    name: "中間検査申請"
    forms:
      - interim_form: "中間検査申請書"
      - progress_photos: "工事進捗写真提出フォーム"
  
  bels_application:
    name: "BELS申請"
    forms:
      - bels_basic: "BELS基本情報"
      - energy_calculation: "省エネ計算書"
      - consent_form: "評価物件掲載承諾書"
```

## 🛠️ 技術実装

### データベース設計

#### 新テーブル: `application_form_templates`
```sql
CREATE TABLE application_form_templates (
    id SERIAL PRIMARY KEY,
    application_type VARCHAR(100) NOT NULL,
    form_category VARCHAR(100) NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    google_form_id VARCHAR(100) NOT NULL,
    google_form_url TEXT NOT NULL,
    description TEXT,
    required_fields JSONB DEFAULT '{}',
    email_template_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_application_form_type ON application_form_templates(application_type, form_category);
```

#### 新テーブル: `form_submissions`
```sql
CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    application_id INTEGER REFERENCES applications(id),
    form_template_id INTEGER REFERENCES application_form_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    submitted_at TIMESTAMP,
    google_response_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, opened, submitted, expired
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_project ON form_submissions(project_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
```

#### 新テーブル: `email_templates`
```sql
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    template_variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### バックエンド実装

#### 1. モデル定義
```python
# backend/app/models/google_forms.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class ApplicationFormTemplate(Base):
    __tablename__ = "application_form_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    application_type = Column(String(100), nullable=False)
    form_category = Column(String(100), nullable=False)
    form_name = Column(String(200), nullable=False)
    google_form_id = Column(String(100), nullable=False)
    google_form_url = Column(Text, nullable=False)
    description = Column(Text)
    required_fields = Column(JSON, default={})
    email_template_id = Column(Integer, ForeignKey("email_templates.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # リレーション
    email_template = relationship("EmailTemplate", back_populates="form_templates")
    submissions = relationship("FormSubmission", back_populates="form_template")

class FormSubmission(Base):
    __tablename__ = "form_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    form_template_id = Column(Integer, ForeignKey("application_form_templates.id"))
    recipient_email = Column(String(255), nullable=False)
    sent_at = Column(DateTime)
    opened_at = Column(DateTime)
    submitted_at = Column(DateTime)
    google_response_id = Column(String(100))
    status = Column(String(50), default="pending")
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # リレーション
    project = relationship("Project", back_populates="form_submissions")
    application = relationship("Application", back_populates="form_submissions")
    form_template = relationship("ApplicationFormTemplate", back_populates="submissions")

class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(100), nullable=False)
    subject_template = Column(Text, nullable=False)
    body_template = Column(Text, nullable=False)
    template_variables = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # リレーション
    form_templates = relationship("ApplicationFormTemplate", back_populates="email_template")
```

#### 2. Pydanticスキーマ
```python
# backend/app/schemas/google_forms.py
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class SubmissionStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    OPENED = "opened"
    SUBMITTED = "submitted"
    EXPIRED = "expired"

class ApplicationFormTemplateBase(BaseModel):
    application_type: str
    form_category: str
    form_name: str
    google_form_id: str
    google_form_url: HttpUrl
    description: Optional[str] = None
    required_fields: Dict[str, Any] = {}
    email_template_id: Optional[int] = None
    is_active: bool = True

class ApplicationFormTemplateCreate(ApplicationFormTemplateBase):
    pass

class ApplicationFormTemplate(ApplicationFormTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FormSubmissionBase(BaseModel):
    project_id: int
    application_id: Optional[int] = None
    form_template_id: int
    recipient_email: EmailStr
    metadata: Dict[str, Any] = {}

class FormSubmissionCreate(FormSubmissionBase):
    pass

class FormSubmissionUpdate(BaseModel):
    opened_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    google_response_id: Optional[str] = None
    status: Optional[SubmissionStatus] = None
    metadata: Optional[Dict[str, Any]] = None

class FormSubmission(FormSubmissionBase):
    id: int
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    google_response_id: Optional[str] = None
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EmailTemplateBase(BaseModel):
    template_name: str
    subject_template: str
    body_template: str
    template_variables: Dict[str, Any] = {}
    is_active: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplate(EmailTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# リクエスト・レスポンス用スキーマ
class SendFormRequest(BaseModel):
    project_id: int
    application_type: str
    form_categories: List[str]
    recipient_emails: List[EmailStr]
    custom_message: Optional[str] = None

class SendFormResponse(BaseModel):
    success: bool
    message: str
    submission_ids: List[int]
    failed_emails: List[str] = []

class FormStatusSummary(BaseModel):
    total_sent: int
    pending: int
    opened: int
    submitted: int
    expired: int
    submissions: List[FormSubmission]
```

#### 3. サービス層実装
```python
# backend/app/services/google_forms_service.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.google_forms import ApplicationFormTemplate, FormSubmission, EmailTemplate
from app.schemas.google_forms import (
    ApplicationFormTemplateCreate, FormSubmissionCreate, 
    SendFormRequest, SubmissionStatus
)
from app.services.email_service import EmailService
from app.core.config import settings
import datetime
import logging

logger = logging.getLogger(__name__)

class GoogleFormsService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
    
    def get_form_templates(
        self, 
        application_type: Optional[str] = None,
        is_active: bool = True
    ) -> List[ApplicationFormTemplate]:
        """申請種別に対応するフォームテンプレートを取得"""
        query = self.db.query(ApplicationFormTemplate).filter(
            ApplicationFormTemplate.is_active == is_active
        )
        
        if application_type:
            query = query.filter(
                ApplicationFormTemplate.application_type == application_type
            )
        
        return query.all()
    
    def send_application_forms(self, request: SendFormRequest) -> Dict[str, Any]:
        """指定された申請種別とカテゴリに対応するフォームを送信"""
        try:
            # 対応するフォームテンプレートを取得
            templates = self.db.query(ApplicationFormTemplate).filter(
                ApplicationFormTemplate.application_type == request.application_type,
                ApplicationFormTemplate.form_category.in_(request.form_categories),
                ApplicationFormTemplate.is_active == True
            ).all()
            
            if not templates:
                return {
                    "success": False,
                    "message": f"指定された申請種別 '{request.application_type}' に対応するフォームが見つかりません",
                    "submission_ids": [],
                    "failed_emails": request.recipient_emails
                }
            
            submission_ids = []
            failed_emails = []
            
            # 各受信者に対してフォームを送信
            for email in request.recipient_emails:
                for template in templates:
                    try:
                        # フォーム送信記録を作成
                        submission = FormSubmission(
                            project_id=request.project_id,
                            form_template_id=template.id,
                            recipient_email=email,
                            status=SubmissionStatus.PENDING,
                            metadata={
                                "custom_message": request.custom_message,
                                "sent_by_user": True
                            }
                        )
                        self.db.add(submission)
                        self.db.flush()  # IDを取得
                        
                        # メール送信
                        success = self._send_form_email(submission, template)
                        
                        if success:
                            submission.status = SubmissionStatus.SENT
                            submission.sent_at = datetime.datetime.utcnow()
                            submission_ids.append(submission.id)
                        else:
                            submission.status = SubmissionStatus.PENDING
                            if email not in failed_emails:
                                failed_emails.append(email)
                        
                        self.db.commit()
                        
                    except Exception as e:
                        logger.error(f"フォーム送信エラー (email: {email}, template: {template.id}): {e}")
                        self.db.rollback()
                        if email not in failed_emails:
                            failed_emails.append(email)
            
            success_count = len(submission_ids)
            total_expected = len(request.recipient_emails) * len(templates)
            
            return {
                "success": success_count > 0,
                "message": f"{success_count}/{total_expected} 件のフォームを送信しました",
                "submission_ids": submission_ids,
                "failed_emails": failed_emails
            }
            
        except Exception as e:
            logger.error(f"フォーム送信処理でエラーが発生: {e}")
            self.db.rollback()
            return {
                "success": False,
                "message": f"システムエラーが発生しました: {str(e)}",
                "submission_ids": [],
                "failed_emails": request.recipient_emails
            }
    
    def _send_form_email(self, submission: FormSubmission, template: ApplicationFormTemplate) -> bool:
        """個別のフォームメール送信"""
        try:
            # プロジェクト情報を取得
            project = submission.project
            
            # メールテンプレートを使用してメール内容を生成
            email_template = template.email_template
            if not email_template:
                # デフォルトテンプレートを使用
                subject = f"【{template.form_name}】申請書類のご提出について - {project.project_name}"
                body = self._generate_default_email_body(submission, template, project)
            else:
                subject = self._render_template(email_template.subject_template, {
                    "project": project,
                    "form": template,
                    "submission": submission
                })
                body = self._render_template(email_template.body_template, {
                    "project": project,
                    "form": template,
                    "submission": submission
                })
            
            # メール送信
            return self.email_service.send_email(
                to_email=submission.recipient_email,
                subject=subject,
                body=body,
                is_html=True
            )
            
        except Exception as e:
            logger.error(f"メール送信エラー: {e}")
            return False
    
    def _generate_default_email_body(
        self, 
        submission: FormSubmission, 
        template: ApplicationFormTemplate, 
        project
    ) -> str:
        """デフォルトのメール本文を生成"""
        custom_message = submission.metadata.get("custom_message", "")
        
        body = f"""
        <html>
        <body>
            <h2>申請書類提出のお願い</h2>
            
            <p>いつもお世話になっております。</p>
            
            <p>下記プロジェクトに関する申請書類のご提出をお願いいたします。</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3>📋 プロジェクト情報</h3>
                <ul>
                    <li><strong>プロジェクト名:</strong> {project.project_name}</li>
                    <li><strong>プロジェクトコード:</strong> {project.project_code}</li>
                    <li><strong>申請種別:</strong> {template.application_type}</li>
                    <li><strong>書類名:</strong> {template.form_name}</li>
                </ul>
            </div>
            
            {f'<div style="background-color: #e8f4f8; padding: 15px; margin: 20px 0; border-radius: 5px;"><h4>📝 追加メッセージ</h4><p>{custom_message}</p></div>' if custom_message else ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{template.google_form_url}" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    📝 フォームに入力する
                </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4>⚠️ ご注意事項</h4>
                <ul>
                    <li>フォームの入力期限は送信から <strong>7日間</strong> です</li>
                    <li>入力内容に不明な点がございましたら、お気軽にお問い合わせください</li>
                    <li>このメールは自動送信されています</li>
                </ul>
            </div>
            
            <p>ご不明な点がございましたら、下記までお問い合わせください。</p>
            
            <hr style="margin: 30px 0;">
            <div style="color: #666; font-size: 12px;">
                <p>申請管理システム<br>
                Email: support@example.com<br>
                Tel: 03-1234-5678</p>
            </div>
        </body>
        </html>
        """
        
        return body
    
    def _render_template(self, template: str, context: Dict[str, Any]) -> str:
        """テンプレート文字列を置換"""
        # 簡易的なテンプレート置換（本格的にはJinja2等を使用）
        result = template
        for key, value in context.items():
            if hasattr(value, '__dict__'):
                # オブジェクトの場合は属性にアクセス
                for attr_name in dir(value):
                    if not attr_name.startswith('_'):
                        attr_value = getattr(value, attr_name, '')
                        result = result.replace(f"{{{{{key}.{attr_name}}}}}", str(attr_value))
            else:
                result = result.replace(f"{{{{{key}}}}}", str(value))
        
        return result
    
    def get_submission_status(self, project_id: int) -> Dict[str, Any]:
        """プロジェクトのフォーム送信状況を取得"""
        submissions = self.db.query(FormSubmission).filter(
            FormSubmission.project_id == project_id
        ).all()
        
        status_counts = {
            "total_sent": len(submissions),
            "pending": len([s for s in submissions if s.status == SubmissionStatus.PENDING]),
            "sent": len([s for s in submissions if s.status == SubmissionStatus.SENT]),
            "opened": len([s for s in submissions if s.status == SubmissionStatus.OPENED]),
            "submitted": len([s for s in submissions if s.status == SubmissionStatus.SUBMITTED]),
            "expired": len([s for s in submissions if s.status == SubmissionStatus.EXPIRED]),
        }
        
        return {
            **status_counts,
            "submissions": submissions
        }
    
    def update_submission_status(
        self, 
        submission_id: int, 
        status: SubmissionStatus,
        google_response_id: Optional[str] = None
    ) -> bool:
        """フォーム送信状況を更新（Webhook用）"""
        try:
            submission = self.db.query(FormSubmission).filter(
                FormSubmission.id == submission_id
            ).first()
            
            if not submission:
                return False
            
            submission.status = status
            submission.updated_at = datetime.datetime.utcnow()
            
            if status == SubmissionStatus.OPENED and not submission.opened_at:
                submission.opened_at = datetime.datetime.utcnow()
            elif status == SubmissionStatus.SUBMITTED and not submission.submitted_at:
                submission.submitted_at = datetime.datetime.utcnow()
                if google_response_id:
                    submission.google_response_id = google_response_id
            
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"送信状況更新エラー: {e}")
            self.db.rollback()
            return False
```

続いてメール送信サービスとAPIエンドポイントを実装します...
