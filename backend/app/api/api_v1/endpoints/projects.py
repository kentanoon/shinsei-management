"""
プロジェクト関連のエンドポイント
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.websocket_manager import manager
from app.models.project import Project
from app.services.project_service import ProjectService
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    FinancialUpdate, ScheduleUpdate
)

router = APIRouter()


@router.get("/", summary="プロジェクト一覧取得")
async def get_projects(
    skip: int = Query(0, ge=0, description="スキップする件数"),
    limit: int = Query(100, ge=1, le=1000, description="取得する件数"),
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    db: Session = Depends(get_db)
):
    """
    プロジェクト一覧を取得
    
    - **skip**: スキップする件数（ページネーション用）
    - **limit**: 取得する件数（最大1000件）
    - **status**: ステータスでフィルタリング
    """
    try:
        service = ProjectService(db)
        projects = service.get_projects(skip=skip, limit=limit, status=status)
        total = service.get_projects_count(status=status)
        
        return {
            "projects": projects,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", summary="プロジェクトサマリー取得")
async def get_projects_summary(
    db: Session = Depends(get_db)
):
    """
    プロジェクトのサマリー情報を取得
    
    - ステータス別の件数
    - 今月の新規案件数
    - 総プロジェクト数
    """
    try:
        service = ProjectService(db)
        summary = service.get_projects_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{status}", summary="ステータス別プロジェクト取得")
async def get_projects_by_status(
    status: str,
    db: Session = Depends(get_db)
):
    """
    指定されたステータスのプロジェクト一覧を取得
    
    利用可能なステータス:
    - 事前相談
    - 受注
    - 申請作業
    - 審査中
    - 配筋検査待ち
    - 中間検査待ち
    - 完了検査待ち
    - 完了
    - 失注
    """
    try:
        service = ProjectService(db)
        projects = service.get_projects_by_status(status)
        
        return {
            "status": status,
            "projects": projects,
            "count": len(projects)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ProjectResponse, summary="プロジェクト作成")
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    新しいプロジェクトを作成
    
    - **project_name**: プロジェクト名（必須）
    - **customer**: 顧客情報（必須）
    - **site**: 敷地情報（必須）
    - **building**: 建物情報（任意）
    """
    try:
        service = ProjectService(db)
        project = service.create_project(project_data)
        
        # WebSocket通知を送信
        await manager.send_project_update({
            "id": project.id,
            "project_code": project.project_code,
            "project_name": project.project_name,
            "status": project.status
        }, action="create")
        
        await manager.send_dashboard_refresh()
        
        return project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}", response_model=ProjectResponse, summary="プロジェクト更新")
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDのプロジェクトを更新（監査証跡付き）
    """
    try:
        service = ProjectService(db)
        project = service.update_project_with_audit(project_id, project_data)
        
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        # WebSocket通知を送信
        await manager.send_project_update({
            "id": project.id,
            "project_code": project.project_code,
            "project_name": project.project_name,
            "status": project.status
        }, action="update")
        
        await manager.send_dashboard_refresh()
            
        return project
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{project_id}", response_model=ProjectResponse, summary="プロジェクト部分更新（インライン編集用）")
async def patch_project(
    project_id: int,
    field_updates: dict,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDのプロジェクトを部分更新
    インライン編集機能で使用
    
    リクエスト例:
    {
        "project_name": "新しい案件名",
        "status": "受注"
    }
    """
    try:
        service = ProjectService(db)
        
        # 既存プロジェクトの確認
        existing_project = service.get_project_by_id(project_id)
        if not existing_project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        # ProjectUpdateスキーマを作成
        project_update = ProjectUpdate(**field_updates)
        
        # 更新実行
        project = service.update_project_with_audit(project_id, project_update)
        
        # WebSocket通知を送信
        await manager.send_project_update({
            "id": project.id,
            "project_code": project.project_code,
            "project_name": project.project_name,
            "status": project.status
        }, action="update")
        
        await manager.send_dashboard_refresh()
        
        return project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/", summary="プロジェクト一括更新")
async def bulk_update_projects(
    updates: dict,
    db: Session = Depends(get_db)
):
    """
    複数のプロジェクトを一括更新
    
    リクエスト例:
    {
        "project_ids": [1, 2, 3],
        "updates": {
            "status": "工事中"
        }
    }
    """
    try:
        project_ids = updates.get("project_ids", [])
        field_updates = updates.get("updates", {})
        
        if not project_ids or not field_updates:
            raise HTTPException(status_code=400, detail="project_idsとupdatesは必須です")
        
        service = ProjectService(db)
        updated_projects = []
        
        for project_id in project_ids:
            try:
                # ProjectUpdateスキーマを作成
                project_update = ProjectUpdate(**field_updates)
                
                # 更新実行
                project = service.update_project_with_audit(project_id, project_update)
                if project:
                    updated_projects.append(project)
            except Exception as e:
                print(f"プロジェクトID {project_id} の更新に失敗: {str(e)}")
                continue
        
        return {
            "message": f"{len(updated_projects)}件のプロジェクトを更新しました",
            "updated_projects": updated_projects,
            "updated_count": len(updated_projects),
            "requested_count": len(project_ids)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}/financial", summary="財務情報更新")
async def update_project_financial(
    project_id: int,
    financial_data: FinancialUpdate,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDの財務情報を更新
    """
    try:
        service = ProjectService(db)
        
        # プロジェクトの存在確認
        project = service.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        financial = service.update_financial(project_id, financial_data)
        return financial
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}/schedule", summary="スケジュール情報更新")
async def update_project_schedule(
    project_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDのスケジュール情報を更新
    """
    try:
        service = ProjectService(db)
        
        # プロジェクトの存在確認
        project = service.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        schedule = service.update_schedule(project_id, schedule_data)
        return schedule
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}", summary="プロジェクト削除")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDのプロジェクトを削除
    """
    try:
        service = ProjectService(db)
        success = service.delete_project(project_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
            
        return {"message": "プロジェクトが正常に削除されました"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/{query}", summary="プロジェクト検索")
async def search_projects(
    query: str,
    db: Session = Depends(get_db)
):
    """
    プロジェクトを検索
    
    - **query**: 検索クエリ（プロジェクト名、施主名、プロジェクトコードで検索）
    """
    try:
        service = ProjectService(db)
        projects = service.search_projects(query)
        
        return {
            "query": query,
            "projects": projects,
            "count": len(projects)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_code}", summary="プロジェクト詳細取得")
async def get_project(
    project_code: str,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトコードのプロジェクト詳細を取得
    """
    try:
        service = ProjectService(db)
        project = service.get_project_by_code(project_code)
        
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
            
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))