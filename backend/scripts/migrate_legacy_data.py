"""
既存データベースから新しいスキーマへのマイグレーションスクリプト
"""

import sys
import os
import sqlite3
from datetime import datetime, date

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import (
    Project, Customer, Site, Building, 
    ApplicationType, Application, 
    Financial, Schedule
)


def migrate_legacy_data():
    """レガシーデータベースから新しいスキーマにデータを移行"""
    
    # 既存のSQLiteデータベースに接続
    legacy_db_path = "../data/application.db"
    if not os.path.exists(legacy_db_path):
        print(f"レガシーデータベース {legacy_db_path} が見つかりません。")
        return
    
    legacy_conn = sqlite3.connect(legacy_db_path)
    legacy_conn.row_factory = sqlite3.Row
    legacy_cursor = legacy_conn.cursor()
    
    # 新しいデータベースセッション
    db = SessionLocal()
    
    try:
        # レガシーテーブルからデータを取得
        legacy_cursor.execute("SELECT * FROM projects_new")
        legacy_projects = legacy_cursor.fetchall()
        
        print(f"{len(legacy_projects)} 件のレガシーデータを発見しました。")
        
        # 申請種別のマッピングを取得
        application_types = {app_type.code: app_type for app_type in db.query(ApplicationType).all()}
        
        migrated_count = 0
        
        for legacy_project in legacy_projects:
            try:
                # 既存のプロジェクトコードをチェック
                existing_project = db.query(Project).filter(
                    Project.project_code == legacy_project["project_code"]
                ).first()
                
                if existing_project:
                    print(f"プロジェクト {legacy_project['project_code']} は既に存在します。スキップします。")
                    continue
                
                # 新しいプロジェクトを作成
                project = Project(
                    project_code=legacy_project["project_code"],
                    project_name=legacy_project["project_name"],
                    status=legacy_project["status"] or "事前相談",
                    input_date=datetime.strptime(legacy_project["input_date"], "%Y-%m-%d").date() if legacy_project["input_date"] else date.today(),
                )
                db.add(project)
                db.flush()  # IDを取得するためにフラッシュ
                
                # 顧客情報
                customer = Customer(
                    project_id=project.id,
                    owner_name=legacy_project["owner_name"] or "",
                    owner_kana=legacy_project["owner_kana"],
                    owner_zip=legacy_project["owner_zip"],
                    owner_address=legacy_project["owner_address"],
                    owner_phone=legacy_project["owner_phone"],
                    joint_name=legacy_project["joint_name"],
                    joint_kana=legacy_project["joint_kana"],
                    client_name=legacy_project["client_name"],
                    client_staff=legacy_project["client_stuff"],  # typo in legacy db
                )
                db.add(customer)
                
                # 敷地情報
                site = Site(
                    project_id=project.id,
                    address=legacy_project["site_address"] or "",
                    land_area=float(legacy_project["land_area"]) if legacy_project["land_area"] else None,
                    city_plan=legacy_project["city_plan"],
                    zoning=legacy_project["zoning"],
                    fire_zone=legacy_project["fire_zone"],
                    slope_limit=legacy_project["slope_limit"],
                    setback=legacy_project["setback"],
                    other_buildings=legacy_project["other_buildings"],
                    landslide_alert=legacy_project["landslide_alert"],
                    flood_zone=legacy_project["flood_zone"],
                    tsunami_zone=legacy_project["tsunami_zone"],
                )
                db.add(site)
                
                # 建物情報
                building = Building(
                    project_id=project.id,
                    building_name=legacy_project["building_name"],
                    construction_type=legacy_project["construction_type"],
                    primary_use=legacy_project["primary_use"],
                    structure=legacy_project["structure"],
                    floors=legacy_project["floors"],
                    max_height=float(legacy_project["max_height"]) if legacy_project["max_height"] else None,
                    total_area=float(legacy_project["total_area"]) if legacy_project["total_area"] else None,
                    building_area=float(legacy_project["building_area"]) if legacy_project["building_area"] else None,
                )
                db.add(building)
                
                # 申請情報
                application_mappings = [
                    ("sh_60", "art60"),
                    ("sh_minado", "deemed_road"),
                    ("sh_chiku", "district_plan"),
                    ("sh_29", "art29"),
                    ("sh_43", "art43"),
                    ("sh_choki", "long_life"),
                    ("sh_zeh", "zeh_bels"),
                    ("sh_gx", "gx_bels"),
                    ("sh_seinou", "performance"),
                    ("sh_other", "other"),
                    ("confirmation", "confirmation"),
                    ("supervision", "supervision"),
                    ("plan", "plan"),
                ]
                
                for legacy_field, app_type_code in application_mappings:
                    if legacy_project[legacy_field] == "申請":
                        app_type = application_types.get(app_type_code)
                        if app_type:
                            application = Application(
                                project_id=project.id,
                                application_type_id=app_type.id,
                                status="申請",
                            )
                            db.add(application)
                
                # 財務情報
                financial = Financial(
                    project_id=project.id,
                    contract_price=float(legacy_project["contract_price"]) if legacy_project["contract_price"] else None,
                    estimate_amount=float(legacy_project["estimate_amount"]) if legacy_project["estimate_amount"] else None,
                    construction_cost=float(legacy_project["construction_cost"]) if legacy_project["construction_cost"] else None,
                    juchu_note=legacy_project["juchu_note"],
                    settlement_date=datetime.strptime(legacy_project["kessai_date"], "%Y-%m-%d").date() if legacy_project["kessai_date"] else None,
                    settlement_staff=legacy_project["kessai_staff"],
                    settlement_amount=float(legacy_project["kessai_amount"]) if legacy_project["kessai_amount"] else None,
                    payment_terms=legacy_project["kessai_terms"],
                    settlement_note=legacy_project["kessai_note"],
                    has_permit_application=bool(legacy_project["has_kofu"]),
                    has_inspection_schedule=bool(legacy_project["has_yoteihyo"]),
                    has_foundation_plan=bool(legacy_project["has_fukuzu"]),
                    has_hardware_plan=bool(legacy_project["has_kanamono"]),
                    has_invoice=bool(legacy_project["has_seikyu"]),
                    has_energy_calculation=bool(legacy_project["has_shoene"]),
                    has_settlement_data=bool(legacy_project["has_kessai_data"]),
                )
                db.add(financial)
                
                # スケジュール情報
                schedule = Schedule(
                    project_id=project.id,
                    reinforcement_scheduled=datetime.strptime(legacy_project["haikin_yotei_date"], "%Y-%m-%d").date() if legacy_project["haikin_yotei_date"] else None,
                    reinforcement_actual=datetime.strptime(legacy_project["haikin_date"], "%Y-%m-%d").date() if legacy_project["haikin_date"] else None,
                    interim_scheduled=datetime.strptime(legacy_project["chukan_yotei_date"], "%Y-%m-%d").date() if legacy_project["chukan_yotei_date"] else None,
                    interim_actual=datetime.strptime(legacy_project["chukan_date"], "%Y-%m-%d").date() if legacy_project["chukan_date"] else None,
                    completion_scheduled=datetime.strptime(legacy_project["kanryo_yotei_date"], "%Y-%m-%d").date() if legacy_project["kanryo_yotei_date"] else None,
                    completion_actual=datetime.strptime(legacy_project["kanryo_date"], "%Y-%m-%d").date() if legacy_project["kanryo_date"] else None,
                    inspection_date=datetime.strptime(legacy_project["kanryo_inspection_date"], "%Y-%m-%d").date() if legacy_project["kanryo_inspection_date"] else None,
                    inspection_result=legacy_project["kanryo_result"],
                    corrections=legacy_project["kanryo_correction"],
                    final_report_date=datetime.strptime(legacy_project["kanryo_final_report"], "%Y-%m-%d").date() if legacy_project["kanryo_final_report"] else None,
                    completion_note=legacy_project["kanryo_note"],
                    has_permit_returned=bool(legacy_project["has_return_confirm"]),
                    has_report_sent=bool(legacy_project["has_report_sent"]),
                    has_items_confirmed=bool(legacy_project["has_returned_items"]),
                    change_memo=legacy_project["kouji_memo"],
                )
                db.add(schedule)
                
                migrated_count += 1
                print(f"プロジェクト {legacy_project['project_code']} を移行しました。")
                
            except Exception as e:
                print(f"プロジェクト {legacy_project['project_code']} の移行中にエラー: {e}")
                db.rollback()
                continue
        
        # 全体をコミット
        db.commit()
        print(f"合計 {migrated_count} 件のプロジェクトを移行しました。")
        
    except Exception as e:
        print(f"マイグレーション中にエラーが発生しました: {e}")
        db.rollback()
    finally:
        legacy_conn.close()
        db.close()


if __name__ == "__main__":
    migrate_legacy_data()