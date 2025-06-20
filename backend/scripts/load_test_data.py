#!/usr/bin/env python3
"""
テストデータを投入するスクリプト
"""

import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.project import (
    Project, Customer, Site, Building, ApplicationType, 
    Application, Financial, Schedule
)
from app.services.seed_data import seed_application_types


def create_test_projects(db: Session):
    """テストプロジェクトデータを作成"""
    
    test_projects_data = [
        {
            "project_name": "田中邸新築工事",
            "status": "申請作業",
            "input_date": date.today() - timedelta(days=30),
            "customer": {
                "owner_name": "田中太郎",
                "owner_kana": "タナカタロウ",
                "owner_zip": "123-4567",
                "owner_address": "東京都世田谷区田中町1-2-3",
                "owner_phone": "03-1234-5678",
                "joint_name": "田中花子",
                "joint_kana": "タナカハナコ",
                "client_name": "田中工務店",
                "client_staff": "田中社長"
            },
            "site": {
                "address": "東京都世田谷区田中町1-2-3",
                "land_area": Decimal("150.25"),
                "city_plan": "第一種住居地域",
                "zoning": "第一種住居地域",
                "fire_zone": "準防火地域",
                "slope_limit": "北側斜線制限あり",
                "setback": "道路境界より1m後退",
                "landslide_alert": "対象外",
                "flood_zone": "浸水想定区域外",
                "tsunami_zone": "対象外"
            },
            "building": {
                "building_name": "田中邸",
                "construction_type": "住宅",
                "primary_use": "一戸建ての住宅",
                "structure": "木造",
                "floors": "地上2階",
                "max_height": Decimal("8.5"),
                "total_area": Decimal("120.50"),
                "building_area": Decimal("70.25")
            },
            "financial": {
                "contract_price": Decimal("25000000"),
                "estimate_amount": Decimal("24500000"),
                "construction_cost": Decimal("22000000"),
                "settlement_date": date.today() + timedelta(days=90),
                "settlement_staff": "田中社長",
                "settlement_amount": Decimal("25000000"),
                "payment_terms": "着手金30%、中間金40%、完成時30%",
                "juchu_note": "省エネ基準適合住宅",
                "has_permit_application": True,
                "has_inspection_schedule": True,
                "has_foundation_plan": True
            },
            "schedule": {
                "reinforcement_scheduled": date.today() + timedelta(days=14),
                "interim_scheduled": date.today() + timedelta(days=45),
                "completion_scheduled": date.today() + timedelta(days=75),
                "inspection_result": "未実施",
                "has_permit_returned": False,
                "has_report_sent": False,
                "has_items_confirmed": False
            }
        },
        {
            "project_name": "佐藤商事倉庫建設",
            "status": "審査中",
            "input_date": date.today() - timedelta(days=45),
            "customer": {
                "owner_name": "佐藤商事株式会社",
                "owner_kana": "サトウショウジカブシキガイシャ",
                "owner_zip": "456-7890",
                "owner_address": "神奈川県横浜市港北区佐藤町4-5-6",
                "owner_phone": "045-123-4567",
                "client_name": "佐藤商事株式会社",
                "client_staff": "佐藤部長"
            },
            "site": {
                "address": "神奈川県横浜市港北区佐藤町4-5-6",
                "land_area": Decimal("800.00"),
                "city_plan": "工業地域",
                "zoning": "工業地域",
                "fire_zone": "準工業地域",
                "slope_limit": "制限なし",
                "setback": "道路境界より3m後退",
                "landslide_alert": "対象外",
                "flood_zone": "浸水想定区域",
                "tsunami_zone": "対象外"
            },
            "building": {
                "building_name": "佐藤商事第3倉庫",
                "construction_type": "倉庫",
                "primary_use": "倉庫業を営む倉庫",
                "structure": "鉄骨造",
                "floors": "地上1階",
                "max_height": Decimal("12.0"),
                "total_area": Decimal("500.00"),
                "building_area": Decimal("500.00")
            },
            "financial": {
                "contract_price": Decimal("45000000"),
                "estimate_amount": Decimal("44000000"),
                "construction_cost": Decimal("40000000"),
                "settlement_date": date.today() + timedelta(days=120),
                "settlement_staff": "佐藤部長",
                "settlement_amount": Decimal("45000000"),
                "payment_terms": "着手金20%、中間金50%、完成時30%",
                "juchu_note": "準防火地域対応",
                "has_permit_application": True,
                "has_inspection_schedule": False,
                "has_foundation_plan": False
            },
            "schedule": {
                "reinforcement_scheduled": date.today() + timedelta(days=30),
                "interim_scheduled": date.today() + timedelta(days=60),
                "completion_scheduled": date.today() + timedelta(days=90),
                "inspection_result": "未実施",
                "has_permit_returned": False,
                "has_report_sent": False,
                "has_items_confirmed": False
            }
        },
        {
            "project_name": "山田アパート改修工事",
            "status": "完了検査待ち",
            "input_date": date.today() - timedelta(days=90),
            "customer": {
                "owner_name": "山田花子",
                "owner_kana": "ヤマダハナコ",
                "owner_zip": "789-0123",
                "owner_address": "埼玉県さいたま市大宮区山田町7-8-9",
                "owner_phone": "048-987-6543",
                "client_name": "山田不動産",
                "client_staff": "山田専務"
            },
            "site": {
                "address": "埼玉県さいたま市大宮区山田町7-8-9",
                "land_area": Decimal("200.00"),
                "city_plan": "第一種住居地域",
                "zoning": "第一種住居地域",
                "fire_zone": "準防火地域",
                "slope_limit": "北側斜線制限あり",
                "setback": "道路境界より1m後退",
                "landslide_alert": "対象外",
                "flood_zone": "浸水想定区域外",
                "tsunami_zone": "対象外"
            },
            "building": {
                "building_name": "山田アパート",
                "construction_type": "共同住宅",
                "primary_use": "共同住宅",
                "structure": "鉄筋コンクリート造",
                "floors": "地上3階",
                "max_height": Decimal("10.5"),
                "total_area": Decimal("240.00"),
                "building_area": Decimal("80.00")
            },
            "financial": {
                "contract_price": Decimal("18000000"),
                "estimate_amount": Decimal("17500000"),
                "construction_cost": Decimal("16000000"),
                "settlement_date": date.today() - timedelta(days=30),
                "settlement_staff": "山田専務",
                "settlement_amount": Decimal("18000000"),
                "payment_terms": "着手金40%、完成時60%",
                "juchu_note": "既存建物改修",
                "has_permit_application": True,
                "has_inspection_schedule": True,
                "has_foundation_plan": False,
                "has_hardware_plan": True,
                "has_invoice": True
            },
            "schedule": {
                "reinforcement_scheduled": date.today() - timedelta(days=60),
                "reinforcement_actual": date.today() - timedelta(days=58),
                "interim_scheduled": date.today() - timedelta(days=30),
                "interim_actual": date.today() - timedelta(days=28),
                "completion_scheduled": date.today() + timedelta(days=5),
                "inspection_result": "中間検査合格",
                "has_permit_returned": True,
                "has_report_sent": False,
                "has_items_confirmed": False,
                "change_memo": "設備配置変更あり"
            }
        }
    ]
    
    created_projects = []
    
    for i, project_data in enumerate(test_projects_data, 1):
        # プロジェクトコード生成
        current_year = datetime.now().year
        project_code = f"{current_year}{i:03d}"
        
        # プロジェクト作成
        db_project = Project(
            project_code=project_code,
            project_name=project_data["project_name"],
            status=project_data["status"],
            input_date=project_data["input_date"]
        )
        db.add(db_project)
        db.flush()  # IDを取得するためにflush
        
        # 顧客情報作成
        customer_data = project_data["customer"]
        db_customer = Customer(
            project_id=db_project.id,
            **customer_data
        )
        db.add(db_customer)
        
        # 敷地情報作成
        site_data = project_data["site"]
        db_site = Site(
            project_id=db_project.id,
            **site_data
        )
        db.add(db_site)
        
        # 建物情報作成
        building_data = project_data["building"]
        db_building = Building(
            project_id=db_project.id,
            **building_data
        )
        db.add(db_building)
        
        # 財務情報作成
        financial_data = project_data["financial"]
        db_financial = Financial(
            project_id=db_project.id,
            **financial_data
        )
        db.add(db_financial)
        
        # スケジュール情報作成
        schedule_data = project_data["schedule"]
        db_schedule = Schedule(
            project_id=db_project.id,
            **schedule_data
        )
        db.add(db_schedule)
        
        created_projects.append(db_project)
    
    return created_projects


def create_test_applications(db: Session, projects: list):
    """テスト申請データを作成"""
    
    # 申請種別を取得
    app_types = db.query(ApplicationType).all()
    app_type_dict = {at.code: at for at in app_types}
    
    # プロジェクトごとに申請を作成
    for project in projects:
        if project.status in ["申請作業", "審査中", "完了検査待ち"]:
            # 確認申請
            if "KAKUNIN" in app_type_dict:
                db_app = Application(
                    project_id=project.id,
                    application_type_id=app_type_dict["KAKUNIN"].id,
                    status="申請済み" if project.status != "申請作業" else "作成中",
                    submitted_date=project.input_date + timedelta(days=7) if project.status != "申請作業" else None,
                    notes="確認申請書提出済み"
                )
                db.add(db_app)
        
        if project.status in ["完了検査待ち"]:
            # 完了検査
            if "KANRYO" in app_type_dict:
                db_app = Application(
                    project_id=project.id,
                    application_type_id=app_type_dict["KANRYO"].id,
                    status="申請済み",
                    submitted_date=project.input_date + timedelta(days=60),
                    notes="完了検査申請書提出済み"
                )
                db.add(db_app)


def main():
    """メイン関数"""
    print("テストデータを投入します...")
    
    # データベースセッション作成
    db = SessionLocal()
    
    try:
        # 申請種別マスタデータを投入
        print("申請種別マスタデータを投入...")
        seed_application_types(db)
        
        # 既存のテストデータを削除
        print("既存のテストデータを削除...")
        db.query(Application).delete()
        db.query(Schedule).delete()
        db.query(Financial).delete()
        db.query(Building).delete()
        db.query(Site).delete()
        db.query(Customer).delete()
        db.query(Project).delete()
        db.commit()
        
        # テストプロジェクトを作成
        print("テストプロジェクトを作成...")
        projects = create_test_projects(db)
        
        # テスト申請を作成
        print("テスト申請を作成...")
        create_test_applications(db, projects)
        
        db.commit()
        
        print(f"✅ テストデータの投入が完了しました。")
        print(f"   - プロジェクト: {len(projects)}件")
        print(f"   - 申請種別マスタ: {db.query(ApplicationType).count()}件")
        print(f"   - 申請: {db.query(Application).count()}件")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()