"""
申請関連のエンドポイント
ワークフロー管理機能を含む
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.project import Application, ApplicationType, ApplicationStatusEnum
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    ApplicationTypeResponse, ApplicationStatusUpdate, ApplicationWorkflowAction,
    ApplicationListResponse, AuditTrailResponse
)
from app.services.application_service import ApplicationService

router = APIRouter()


@router.get("/", response_model=ApplicationListResponse, summary="申請一覧取得")
async def get_applications(
    skip: int = Query(0, ge=0, description="スキップする件数"),
    limit: int = Query(100, ge=1, le=1000, description="取得する件数"),
    project_id: Optional[int] = Query(None, description="プロジェクトIDでフィルタ"),
    status: Optional[ApplicationStatusEnum] = Query(None, description="ステータスでフィルタ"),
    db: Session = Depends(get_db)
):
    """
    申請一覧を取得
    
    - **skip**: スキップする件数（ページネーション用）
    - **limit**: 取得する件数（最大1000件）
    - **project_id**: プロジェクトIDでフィルタ（任意）
    - **status**: ステータスでフィルタ（任意）
    """
    try:
        service = ApplicationService(db)
        applications = service.get_applications(
            skip=skip, 
            limit=limit, 
            status=status, 
            project_id=project_id
        )
        total = service.get_applications_count(status=status, project_id=project_id)
        
        return ApplicationListResponse(
            applications=applications,
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", summary="申請サマリー取得")
async def get_applications_summary(
    db: Session = Depends(get_db)
):
    """
    申請のサマリー情報を取得
    
    - ステータス別の件数
    - 今月の新規申請数
    - 承認待ち件数
    """
    try:
        service = ApplicationService(db)
        summary = service.get_applications_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{application_id}", response_model=ApplicationResponse, summary="申請詳細取得")
async def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """
    指定された申請IDの申請詳細を取得
    """
    try:
        service = ApplicationService(db)
        application = service.get_application_by_id(application_id)
        
        if not application:
            raise HTTPException(status_code=404, detail="申請が見つかりません")
            
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ApplicationResponse, summary="申請作成")
async def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """
    新しい申請を作成
    """
    try:
        service = ApplicationService(db)
        application = service.create_application(application_data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{application_id}", response_model=ApplicationResponse, summary="申請更新")
async def update_application(
    application_id: int,
    application_data: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """
    指定された申請IDの申請を更新
    """
    try:
        service = ApplicationService(db)
        application = service.update_application(application_id, application_data)
        
        if not application:
            raise HTTPException(status_code=404, detail="申請が見つかりません")
        
        return application
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{application_id}/submit", response_model=ApplicationResponse, summary="申請を提出")
async def submit_application(
    application_id: int,
    action_data: ApplicationWorkflowAction,
    db: Session = Depends(get_db)
):
    """
    申請を提出（下書き → レビュー中）
    """
    try:
        action_data.action = "submit"
        service = ApplicationService(db)
        application = service.execute_workflow_action(application_id, action_data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{application_id}/approve", response_model=ApplicationResponse, summary="申請を承認")
async def approve_application(
    application_id: int,
    action_data: ApplicationWorkflowAction,
    db: Session = Depends(get_db)
):
    """
    申請を承認（レビュー中 → 承認済）
    自動的にドキュメント生成ジョブが開始されます
    """
    try:
        action_data.action = "approve"
        service = ApplicationService(db)
        application = service.execute_workflow_action(application_id, action_data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{application_id}/reject", response_model=ApplicationResponse, summary="申請を差戻し")
async def reject_application(
    application_id: int,
    action_data: ApplicationWorkflowAction,
    db: Session = Depends(get_db)
):
    """
    申請を差戻し（レビュー中 → 差戻し）
    """
    try:
        action_data.action = "reject"
        service = ApplicationService(db)
        application = service.execute_workflow_action(application_id, action_data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{application_id}/withdraw", response_model=ApplicationResponse, summary="申請を取下げ")
async def withdraw_application(
    application_id: int,
    action_data: ApplicationWorkflowAction,
    db: Session = Depends(get_db)
):
    """
    申請を取下げ（任意のステータス → 取下げ）
    """
    try:
        action_data.action = "withdraw"
        service = ApplicationService(db)
        application = service.execute_workflow_action(application_id, action_data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{application_id}/audit-trail", response_model=List[AuditTrailResponse], summary="監査証跡取得")
async def get_application_audit_trail(
    application_id: int,
    db: Session = Depends(get_db)
):
    """
    指定された申請IDの監査証跡を取得
    """
    try:
        service = ApplicationService(db)
        
        # 申請の存在確認
        application = service.get_application_by_id(application_id)
        if not application:
            raise HTTPException(status_code=404, detail="申請が見つかりません")
        
        audit_trails = service.get_audit_trail("Application", application_id)
        return audit_trails
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{application_id}", summary="申請削除")
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """
    指定された申請IDの申請を削除
    """
    try:
        service = ApplicationService(db)
        success = service.delete_application(application_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="申請が見つかりません")
        
        return {"message": "申請が正常に削除されました"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 申請種別エンドポイント
@router.get("/types/", summary="申請種別一覧取得")
async def get_application_types(
    db: Session = Depends(get_db)
):
    """
    申請種別の一覧を取得
    """
    try:
        types = db.query(ApplicationType).filter(ApplicationType.is_active == True).all()
        
        return {
            "types": types,
            "total": len(types)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/types/", response_model=ApplicationTypeResponse, summary="申請種別作成")
async def create_application_type(
    type_data: dict,
    db: Session = Depends(get_db)
):
    """
    新しい申請種別を作成
    """
    try:
        app_type = ApplicationType(**type_data)
        db.add(app_type)
        db.commit()
        db.refresh(app_type)
        
        return app_type
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))