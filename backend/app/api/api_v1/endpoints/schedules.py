"""
スケジュール関連のエンドポイント
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Schedule

router = APIRouter()


@router.get("/", summary="全スケジュール取得")
async def get_schedules(db: Session = Depends(get_db)):
    """
    全プロジェクトのスケジュール情報を取得
    """
    try:
        schedules = db.query(Schedule).all()
        return schedules
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", summary="プロジェクト別スケジュール取得")
async def get_schedule_by_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDのスケジュール情報を取得
    """
    try:
        schedule = db.query(Schedule).filter(Schedule.project_id == project_id).first()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="スケジュールが見つかりません")
            
        return schedule
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/reinforcement", summary="配筋検査待ち取得")
async def get_pending_reinforcement_inspections(db: Session = Depends(get_db)):
    """
    配筋検査待ちのプロジェクト一覧を取得
    """
    try:
        schedules = db.query(Schedule).filter(
            Schedule.reinforcement_scheduled.isnot(None),
            Schedule.reinforcement_actual.is_(None)
        ).all()
        
        return {
            "type": "reinforcement_inspection",
            "schedules": schedules,
            "count": len(schedules)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/interim", summary="中間検査待ち取得")
async def get_pending_interim_inspections(db: Session = Depends(get_db)):
    """
    中間検査待ちのプロジェクト一覧を取得
    """
    try:
        schedules = db.query(Schedule).filter(
            Schedule.interim_scheduled.isnot(None),
            Schedule.interim_actual.is_(None)
        ).all()
        
        return {
            "type": "interim_inspection",
            "schedules": schedules,
            "count": len(schedules)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/completion", summary="完了検査待ち取得")
async def get_pending_completion_inspections(db: Session = Depends(get_db)):
    """
    完了検査待ちのプロジェクト一覧を取得
    """
    try:
        schedules = db.query(Schedule).filter(
            Schedule.completion_scheduled.isnot(None),
            Schedule.completion_actual.is_(None)
        ).all()
        
        return {
            "type": "completion_inspection",
            "schedules": schedules,
            "count": len(schedules)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))