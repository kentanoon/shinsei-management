"""
Google Forms 関連のPydanticスキーマ
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class ApplicationFormTemplateBase(BaseModel):
    """フォームテンプレートの基本スキーマ"""
    application_type: str = Field(..., description="申請種別")
    form_category: str = Field(..., description="フォームカテゴリ")
    form_name: str = Field(..., description="フォーム名")
    google_form_url: str = Field(..., description="GoogleフォームのURL")
    description: Optional[str] = Field(None, description="説明")
    required_fields: Optional[List[str]] = Field(default_factory=list, description="必須フィールド")
    is_active: bool = Field(True, description="アクティブ状態")

class ApplicationFormTemplateCreate(ApplicationFormTemplateBase):
    """フォームテンプレート作成用スキーマ"""
    pass

class ApplicationFormTemplateUpdate(BaseModel):
    """フォームテンプレート更新用スキーマ"""
    application_type: Optional[str] = None
    form_category: Optional[str] = None
    form_name: Optional[str] = None
    google_form_url: Optional[str] = None
    description: Optional[str] = None
    required_fields: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ApplicationFormTemplate(ApplicationFormTemplateBase):
    """フォームテンプレートレスポンス用スキーマ"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FormSubmissionBase(BaseModel):
    """フォーム送信履歴の基本スキーマ"""
    project_id: int = Field(..., description="プロジェクトID")
    form_template_id: int = Field(..., description="フォームテンプレートID")
    recipient_email: str = Field(..., description="送信先メールアドレス")
    status: str = Field("sent", description="ステータス")
    email_subject: Optional[str] = Field(None, description="メール件名")
    email_body: Optional[str] = Field(None, description="メール本文")
    form_response_data: Optional[Dict[str, Any]] = Field(None, description="フォーム回答データ")
    notes: Optional[str] = Field(None, description="備考")

class FormSubmissionCreate(FormSubmissionBase):
    """フォーム送信履歴作成用スキーマ"""
    pass

class FormSubmission(FormSubmissionBase):
    """フォーム送信履歴レスポンス用スキーマ"""
    id: int
    sent_at: datetime
    response_received_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SendFormRequest(BaseModel):
    """フォーム送信リクエスト用スキーマ"""
    project_id: int = Field(..., description="プロジェクトID")
    form_template_ids: List[int] = Field(..., description="送信するフォームテンプレートIDのリスト")
    recipient_emails: List[str] = Field(..., description="送信先メールアドレスのリスト")
    custom_message: Optional[str] = Field(None, description="カスタムメッセージ")

    @validator('recipient_emails')
    def validate_emails(cls, v):
        if not v:
            raise ValueError('少なくとも1つのメールアドレスが必要です')
        return v

    @validator('form_template_ids')
    def validate_form_template_ids(cls, v):
        if not v:
            raise ValueError('少なくとも1つのフォームテンプレートIDが必要です')
        return v

class SendFormResponse(BaseModel):
    """フォーム送信レスポンス用スキーマ"""
    success: List[Dict[str, Any]] = Field(..., description="送信成功リスト")
    failed: List[Dict[str, Any]] = Field(..., description="送信失敗リスト")
    total_sent: int = Field(..., description="送信成功数")
    total_failed: int = Field(..., description="送信失敗数")

class FormTemplateListResponse(BaseModel):
    """フォームテンプレート一覧レスポンス用スキーマ"""
    templates: List[ApplicationFormTemplate]
    total: int

class FormSubmissionListResponse(BaseModel):
    """フォーム送信履歴一覧レスポンス用スキーマ"""
    submissions: List[FormSubmission]
    total: int

class UpdateSubmissionStatusRequest(BaseModel):
    """送信履歴ステータス更新リクエスト用スキーマ"""
    status: str = Field(..., description="新しいステータス")
    response_data: Optional[Dict[str, Any]] = Field(None, description="レスポンスデータ")

    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['sent', 'opened', 'submitted', 'failed']
        if v not in allowed_statuses:
            raise ValueError(f'ステータスは {allowed_statuses} のいずれかである必要があります')
        return v

class FormStatusSummary(BaseModel):
    """フォーム送信状況サマリー用スキーマ"""
    project_id: int = Field(..., description="プロジェクトID")
    total_forms: int = Field(..., description="総フォーム数")
    sent_count: int = Field(..., description="送信済み数")
    opened_count: int = Field(..., description="開封済み数")
    submitted_count: int = Field(..., description="提出済み数")
    failed_count: int = Field(..., description="失敗数")
    submissions: List[FormSubmission] = Field(..., description="送信履歴")

class SubmissionStatus(BaseModel):
    """送信ステータス更新用スキーマ"""
    status: str = Field(..., description="ステータス")
    message: Optional[str] = Field(None, description="メッセージ")