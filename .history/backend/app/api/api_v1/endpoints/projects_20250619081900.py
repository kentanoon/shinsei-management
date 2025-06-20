"""
プロジェクト関連のエンドポイント
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
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
    指定されたプロジェクトIDのプロジェクトを更新
    """
    try:
        service = ProjectService(db)
        project = service.update_project(project_id, project_data)
        
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
            
        return project
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
        raise HTTPException(status_code=500, detail=str(e)