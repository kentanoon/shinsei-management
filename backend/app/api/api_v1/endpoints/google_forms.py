"""
Googleフォーム連携API エンドポイント
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.google_forms_service import GoogleFormsService
from app.schemas.google_forms import (
    ApplicationFormTemplate,
    ApplicationFormTemplateCreate,
    FormSubmission,
    SendFormRequest,
    SendFormResponse,
    FormTemplateListResponse,
    FormSubmissionListResponse,
    UpdateSubmissionStatusRequest,
    FormStatusSummary,
    SubmissionStatus
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/form-templates", response_model=List[ApplicationFormTemplate])
def get_form_templates(
    application_type: str = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """
    申請書類フォームテンプレート一覧を取得
    
    Parameters:
    - application_type: 申請種別でフィルタ（省略時は全種別）
    - is_active: アクティブなテンプレートのみ取得するか
    """
    try:
        service = GoogleFormsService(db)
        templates = service.get_form_templates(
            application_type=application_type,
            is_active=is_active
        )
        return templates
    except Exception as e:
        logger.error(f"フォームテンプレート取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="フォームテンプレートの取得に失敗しました"
        )

@router.get("/form-templates/by-type/{application_type}")
def get_form_templates_by_type(
    application_type: str,
    db: Session = Depends(get_db)
):
    """
    特定の申請種別に対応するフォームテンプレートを取得
    
    Returns:
    - フォームテンプレートをカテゴリ別にグループ化したデータ
    """
    try:
        service = GoogleFormsService(db)
        templates = service.get_form_templates(application_type=application_type)
        
        # カテゴリ別にグループ化
        grouped_templates = {}
        for template in templates:
            category = template.form_category
            if category not in grouped_templates:
                grouped_templates[category] = []
            grouped_templates[category].append({
                "id": template.id,
                "form_name": template.form_name,
                "google_form_url": template.google_form_url,
                "description": template.description,
                "required_fields": template.required_fields
            })
        
        return {
            "application_type": application_type,
            "categories": grouped_templates,
            "total_forms": len(templates)
        }
    except Exception as e:
        logger.error(f"申請種別別フォーム取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="フォーム情報の取得に失敗しました"
        )

@router.post("/send-forms", response_model=SendFormResponse)
def send_application_forms(
    request: SendFormRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    申請書類フォームをメール送信
    
    Parameters:
    - project_id: プロジェクトID
    - application_type: 申請種別
    - form_categories: 送信するフォームカテゴリのリスト
    - recipient_emails: 送信先メールアドレスのリスト
    - custom_message: カスタムメッセージ（省略可）
    """
    try:
        service = GoogleFormsService(db)
        
        # バリデーション: プロジェクトの存在確認
        from app.models.project import Project
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"プロジェクトID {request.project_id} が見つかりません"
            )
        
        # バリデーション: 対応するフォームテンプレートの存在確認
        available_templates = service.get_form_templates(
            application_type=request.application_type
        )
        if not available_templates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"申請種別 '{request.application_type}' に対応するフォームが見つかりません"
            )
        
        available_categories = {t.form_category for t in available_templates}
        invalid_categories = set(request.form_categories) - available_categories
        if invalid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"無効なフォームカテゴリ: {list(invalid_categories)}"
            )
        
        # フォーム送信実行
        result = service.send_application_forms(request)
        
        return SendFormResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フォーム送信エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="フォーム送信処理でエラーが発生しました"
        )

@router.get("/submissions/project/{project_id}", response_model=FormStatusSummary)
def get_project_form_submissions(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    プロジェクトのフォーム送信状況を取得
    
    Parameters:
    - project_id: プロジェクトID
    """
    try:
        service = GoogleFormsService(db)
        status_summary = service.get_submission_status(project_id)
        
        return FormStatusSummary(**status_summary)
        
    except Exception as e:
        logger.error(f"送信状況取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="送信状況の取得に失敗しました"
        )

@router.get("/submissions/{submission_id}", response_model=FormSubmission)
def get_form_submission(
    submission_id: int,
    db: Session = Depends(get_db)
):
    """
    特定のフォーム送信詳細を取得
    """
    try:
        from app.models.google_forms import FormSubmission as FormSubmissionModel
        
        submission = db.query(FormSubmissionModel).filter(
            FormSubmissionModel.id == submission_id
        ).first()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"送信記録ID {submission_id} が見つかりません"
            )
        
        return submission
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"送信詳細取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="送信詳細の取得に失敗しました"
        )

@router.patch("/submissions/{submission_id}/status")
def update_submission_status(
    submission_id: int,
    status: SubmissionStatus,
    google_response_id: str = None,
    db: Session = Depends(get_db)
):
    """
    フォーム送信状況を更新（Googleフォームからのウェブフック用）
    
    Parameters:
    - submission_id: 送信記録ID
    - status: 新しいステータス
    - google_response_id: Google フォームのレスポンスID（提出完了時）
    """
    try:
        service = GoogleFormsService(db)
        success = service.update_submission_status(
            submission_id=submission_id,
            status=status,
            google_response_id=google_response_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"送信記録ID {submission_id} が見つかりません"
            )
        
        return {"message": "ステータスを更新しました", "submission_id": submission_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ステータス更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ステータス更新に失敗しました"
        )

@router.post("/form-templates", response_model=ApplicationFormTemplate)
def create_form_template(
    template: ApplicationFormTemplateCreate,
    db: Session = Depends(get_db)
):
    """
    新しいフォームテンプレートを作成（管理者用）
    """
    try:
        from app.models.google_forms import ApplicationFormTemplate as TemplateModel
        
        # 重複チェック
        existing = db.query(TemplateModel).filter(
            TemplateModel.application_type == template.application_type,
            TemplateModel.form_category == template.form_category,
            TemplateModel.google_form_id == template.google_form_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="同じフォームテンプレートが既に存在します"
            )
        
        # 新規作成
        db_template = TemplateModel(**template.dict())
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        return db_template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フォームテンプレート作成エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="フォームテンプレートの作成に失敗しました"
        )

@router.delete("/form-templates/{template_id}")
def delete_form_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """
    フォームテンプレートを削除（無効化）
    """
    try:
        from app.models.google_forms import ApplicationFormTemplate as TemplateModel
        
        template = db.query(TemplateModel).filter(
            TemplateModel.id == template_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"フォームテンプレートID {template_id} が見つかりません"
            )
        
        # 論理削除（is_active = False）
        template.is_active = False
        db.commit()
        
        return {"message": "フォームテンプレートを無効化しました"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フォームテンプレート削除エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="フォームテンプレートの削除に失敗しました"
        )

@router.get("/stats/summary")
def get_forms_stats_summary(
    db: Session = Depends(get_db)
):
    """
    フォーム送信統計サマリーを取得
    """
    try:
        from app.models.google_forms import FormSubmission as FormSubmissionModel
        from sqlalchemy import func
        
        # 基本統計
        total_submissions = db.query(FormSubmissionModel).count()
        
        # ステータス別集計
        status_stats = db.query(
            FormSubmissionModel.status,
            func.count(FormSubmissionModel.id).label('count')
        ).group_by(FormSubmissionModel.status).all()
        
        # 申請種別別集計
        type_stats = db.query(
            FormSubmissionModel.form_template.has(),
            func.count(FormSubmissionModel.id).label('count')
        ).join(FormSubmissionModel.form_template).group_by(
            'application_type'
        ).all()
        
        return {
            "total_submissions": total_submissions,
            "status_breakdown": {stat.status: stat.count for stat in status_stats},
            "type_breakdown": {stat[0]: stat.count for stat in type_stats} if type_stats else {},
            "success_rate": len([s for s in status_stats if s.status == 'submitted']) / max(total_submissions, 1) * 100
        }
        
    except Exception as e:
        logger.error(f"統計取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="統計情報の取得に失敗しました"
        )