"""
申請関連のスキーマ定義
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum

class ApplicationStatusEnum(str, Enum):
    """申請ステータス列挙型"""
    DRAFT = "下書き"
    IN_REVIEW = "レビュー中"
    APPROVED = "承認済"
    REJECTED = "差戻し"
    WITHDRAWN = "取下げ"
    COMPLETED = "完了"


class ApplicationTypeBase(BaseModel):
    """申請種別基底スキーマ"""
    code: str = Field(..., max_length=20, description="申請種別コード")
    name: str = Field(..., max_length=100, description="申請種別名")
    description: Optional[str] = Field(None, description="説明")
    is_active: bool = Field(True, description="有効フラグ")


class ApplicationTypeResponse(ApplicationTypeBase):
    """申請種別レスポンススキーマ"""
    id: int
    
    class Config:
        from_attributes = True


class ApplicationBase(BaseModel):
    """申請基底スキーマ"""
    project_id: int = Field(..., description="プロジェクトID")
    application_type_id: int = Field(..., description="申請種別ID")
    status: ApplicationStatusEnum = Field(ApplicationStatusEnum.DRAFT, description="申請ステータス")
    workflow_step: int = Field(0, description="ワークフロー進行段階")
    submitted_date: Optional[date] = Field(None, description="提出日")
    approved_date: Optional[date] = Field(None, description="承認日")
    rejected_date: Optional[date] = Field(None, description="差戻し日")
    completed_date: Optional[date] = Field(None, description="完了日")
    notes: Optional[str] = Field(None, description="備考")
    rejection_reason: Optional[str] = Field(None, description="差戻し理由")
    approval_comment: Optional[str] = Field(None, description="承認コメント")
    generated_document_path: Optional[str] = Field(None, description="生成ドキュメントパス")


class ApplicationCreate(ApplicationBase):
    """申請作成スキーマ"""
    pass


class ApplicationUpdate(BaseModel):
    """申請更新スキーマ"""
    project_id: Optional[int] = Field(None, description="プロジェクトID")
    application_type_id: Optional[int] = Field(None, description="申請種別ID")
    status: Optional[ApplicationStatusEnum] = Field(None, description="申請ステータス")
    workflow_step: Optional[int] = Field(None, description="ワークフロー進行段階")
    submitted_date: Optional[date] = Field(None, description="提出日")
    approved_date: Optional[date] = Field(None, description="承認日")
    rejected_date: Optional[date] = Field(None, description="差戻し日")
    completed_date: Optional[date] = Field(None, description="完了日")
    notes: Optional[str] = Field(None, description="備考")
    rejection_reason: Optional[str] = Field(None, description="差戻し理由")
    approval_comment: Optional[str] = Field(None, description="承認コメント")


class ApplicationWorkflowAction(BaseModel):
    """申請ワークフローアクション"""
    action: str = Field(..., description="アクション（submit/approve/reject/withdraw）")
    comment: Optional[str] = Field(None, description="コメント")
    
    @validator('action')
    def validate_action(cls, v):
        valid_actions = ['submit', 'approve', 'reject', 'withdraw']
        if v not in valid_actions:
            raise ValueError(f'アクションは {", ".join(valid_actions)} のいずれかである必要があります')
        return v


class ApplicationStatusUpdate(BaseModel):
    """申請ステータス更新スキーマ"""
    status: ApplicationStatusEnum = Field(..., description="申請ステータス")
    submitted_date: Optional[date] = Field(None, description="提出日")
    approved_date: Optional[date] = Field(None, description="承認日")
    rejected_date: Optional[date] = Field(None, description="差戻し日")
    completed_date: Optional[date] = Field(None, description="完了日")
    comment: Optional[str] = Field(None, description="コメント")


class ProjectBasic(BaseModel):
    """プロジェクト基本情報"""
    project_code: str
    project_name: str
    
    class Config:
        from_attributes = True


class ApplicationResponse(ApplicationBase):
    """申請レスポンススキーマ"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]
    updated_by: Optional[int]
    application_type: ApplicationTypeResponse
    project: ProjectBasic
    
    class Config:
        from_attributes = True


class AuditTrailResponse(BaseModel):
    """監査証跡レスポンススキーマ"""
    id: int
    user_id: Optional[int]
    target_model: str
    target_id: int
    field_name: str
    old_value: Optional[str]
    new_value: Optional[str]
    action: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """申請一覧レスポンス"""
    applications: List[ApplicationResponse]
    total: int
    skip: int
    limit: int