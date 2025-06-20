"""
財務関連のエンドポイント
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Financial

router = APIRouter()


@router.get("/", summary="全財務データ取得")
async def get_financials(db: Session = Depends(get_db)):
    """
    全プロジェクトの財務情報を取得
    """
    try:
        financials = db.query(Financial).all()
        return financials
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", summary="プロジェクト別財務データ取得")
async def get_financial_by_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    指定されたプロジェクトIDの財務情報を取得
    """
    try:
        financial = db.query(Financial).filter(Financial.project_id == project_id).first()
        
        if not financial:
            raise HTTPException(status_code=404, detail="財務データが見つかりません")
            
        return financial
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/totals", summary="財務サマリー取得")
async def get_financial_summary(db: Session = Depends(get_db)):
    """
    財務データのサマリー情報を取得
    """
    try:
        financials = db.query(Financial).all()
        
        total_contract = sum(f.contract_price or 0 for f in financials)
        total_estimate = sum(f.estimate_amount or 0 for f in financials)
        total_settlement = sum(f.settlement_amount or 0 for f in financials)
        
        pending_settlement = total_contract - total_settlement
        
        # 書類提出状況
        document_stats = {
            'permit_application': sum(1 for f in financials if f.has_permit_application),
            'inspection_schedule': sum(1 for f in financials if f.has_inspection_schedule),
            'foundation_plan': sum(1 for f in financials if f.has_foundation_plan),
            'hardware_plan': sum(1 for f in financials if f.has_hardware_plan),
            'invoice': sum(1 for f in financials if f.has_invoice),
            'energy_calculation': sum(1 for f in financials if f.has_energy_calculation),
            'settlement_data': sum(1 for f in financials if f.has_settlement_data),
        }
        
        return {
            "total_projects": len(financials),
            "total_contract_amount": total_contract,
            "total_estimate_amount": total_estimate,
            "total_settlement_amount": total_settlement,
            "pending_settlement_amount": pending_settlement,
            "document_submission_stats": document_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/settlement", summary="未決済案件取得")
async def get_pending_settlements(db: Session = Depends(get_db)):
    """
    未決済の案件一覧を取得
    """
    try:
        pending_financials = db.query(Financial).filter(
            Financial.settlement_amount.is_(None)
        ).all()
        
        return {
            "type": "pending_settlement",
            "financials": pending_financials,
            "count": len(pending_financials)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/missing", summary="書類未提出案件取得")
async def get_missing_documents(db: Session = Depends(get_db)):
    """
    必要書類が未提出の案件一覧を取得
    """
    try:
        # 重要な書類が未提出の案件を検索
        missing_docs = db.query(Financial).filter(
            (Financial.has_permit_application == False) |
            (Financial.has_inspection_schedule == False) |
            (Financial.has_foundation_plan == False)
        ).all()
        
        return {
            "type": "missing_documents",
            "financials": missing_docs,
            "count": len(missing_docs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))