#!/usr/bin/env python3
"""
申請種別の初期データを投入するスクリプト
"""

import sys
import os
from pathlib import Path

# プロジェクトルートを追加
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import engine, get_db
from app.models.project import ApplicationType

def init_application_types():
    """申請種別の初期データを作成"""
    db = Session(bind=engine)
    
    try:
        # 既存のデータをチェック
        existing_count = db.query(ApplicationType).count()
        if existing_count > 0:
            print(f"申請種別データが既に存在します ({existing_count}件)")
            return
        
        # 申請種別の初期データ
        application_types = [
            {
                "code": "KENCHIKU",
                "name": "建築確認申請",
                "description": "建築基準法に基づく確認申請"
            },
            {
                "code": "HAIKIN",
                "name": "配筋検査申請",
                "description": "鉄筋コンクリート造の配筋検査"
            },
            {
                "code": "CHUUKAN", 
                "name": "中間検査申請",
                "description": "工事中の中間検査"
            },
            {
                "code": "KANRYOU",
                "name": "完了検査申請", 
                "description": "建築工事完了検査"
            },
            {
                "code": "HENKOU",
                "name": "計画変更申請",
                "description": "建築計画の変更申請"
            },
            {
                "code": "KEIBI",
                "name": "軽微な変更届",
                "description": "軽微な変更の届出"
            },
            {
                "code": "SHINPO",
                "name": "進捗報告書",
                "description": "工事進捗の報告"
            },
            {
                "code": "KANRI",
                "name": "工事監理報告書",
                "description": "工事監理の報告書"
            }
        ]
        
        # データを挿入
        for app_type_data in application_types:
            app_type = ApplicationType(**app_type_data)
            db.add(app_type)
        
        db.commit()
        print(f"申請種別データを {len(application_types)} 件作成しました")
        
        # 作成されたデータを確認
        for app_type in db.query(ApplicationType).all():
            print(f"  - {app_type.code}: {app_type.name}")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_application_types()