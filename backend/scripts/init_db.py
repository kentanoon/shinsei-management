"""
データベース初期化スクリプト
"""

import sys
import os

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.project import ApplicationType
from app.models import *  # Import all models


def create_application_types():
    """申請種別マスタデータを作成"""
    db = SessionLocal()
    try:
        # 既存データをチェック
        existing_count = db.query(ApplicationType).count()
        if existing_count > 0:
            print(f"申請種別マスタは既に {existing_count} 件存在します。")
            return

        # 申請種別データ
        application_types = [
            {"code": "confirmation", "name": "確認申請", "description": "建築確認申請"},
            {"code": "supervision", "name": "工事監理", "description": "工事監理業務"},
            {"code": "plan", "name": "プラン", "description": "設計プラン"},
            {"code": "art60", "name": "60条申請", "description": "建築基準法第60条申請"},
            {"code": "deemed_road", "name": "みなし道路協議", "description": "みなし道路に関する協議"},
            {"code": "district_plan", "name": "地区計画", "description": "地区計画に関する申請"},
            {"code": "art29", "name": "29条申請", "description": "建築基準法第29条申請"},
            {"code": "art43", "name": "43条申請", "description": "建築基準法第43条申請"},
            {"code": "long_life", "name": "長期優良住宅申請", "description": "長期優良住宅認定申請"},
            {"code": "zeh_bels", "name": "ZEH（BELS申請）", "description": "ZEH・BELS認定申請"},
            {"code": "gx_bels", "name": "GX基準（BELS申請）", "description": "GX基準・BELS認定申請"},
            {"code": "performance", "name": "性能評価", "description": "住宅性能評価"},
            {"code": "other", "name": "その他", "description": "その他の申請"},
        ]

        # データを挿入
        for app_type_data in application_types:
            app_type = ApplicationType(**app_type_data)
            db.add(app_type)

        db.commit()
        print(f"申請種別マスタを {len(application_types)} 件作成しました。")

    except Exception as e:
        print(f"申請種別マスタの作成中にエラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()


def init_database():
    """データベースを初期化"""
    print("データベースを初期化しています...")
    
    # テーブルを作成
    from app.core.database import Base
    Base.metadata.create_all(bind=engine)
    print("テーブルを作成しました。")
    
    # マスタデータを作成
    create_application_types()
    
    print("データベースの初期化が完了しました。")


if __name__ == "__main__":
    init_database()