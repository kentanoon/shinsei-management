"""
サンプルデータ作成スクリプト
"""

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.models.project import (
    Project, Customer, Site, Building, Application, ApplicationType,
    Financial, Schedule
)


def seed_application_types(db: Session):
    """申請種別マスタデータを投入"""
    
    # 既存の申請種別をチェック
    existing_count = db.query(ApplicationType).count()
    if existing_count > 0:
        print(f"申請種別マスタデータは既に存在します ({existing_count}件)")
        return
    
    # 申請種別マスタデータ
    application_types = [
        ApplicationType(code="KAKUNIN", name="建築確認申請", description="建築確認申請書", is_active=True),
        ApplicationType(code="KOUZOU", name="構造計算", description="構造計算書", is_active=True),
        ApplicationType(code="ENERGY", name="省エネ計算", description="省エネルギー計算書", is_active=True),
        ApplicationType(code="BARRIER", name="バリアフリー", description="バリアフリー法対応", is_active=True),
        ApplicationType(code="CHOUKI", name="長期優良住宅", description="長期優良住宅認定申請", is_active=True),
        ApplicationType(code="TEITANSO", name="低炭素建築物", description="低炭素建築物認定申請", is_active=True),
        ApplicationType(code="HAIKIN", name="配筋検査", description="配筋検査申請", is_active=True),
        ApplicationType(code="CHUUKAN", name="中間検査", description="中間検査申請", is_active=True),
        ApplicationType(code="KANRYO", name="完了検査", description="完了検査申請", is_active=True),
        ApplicationType(code="KEIMI", name="軽微な変更", description="軽微な変更届", is_active=True),
        ApplicationType(code="KEIKAKU", name="計画変更", description="計画変更申請", is_active=True),
    ]
    
    for app_type in application_types:
        db.add(app_type)
    
    db.commit()
    print(f"申請種別マスタデータを{len(application_types)}件投入しました")


def create_sample_data():
    """サンプルデータを作成"""
    
    # データベースセッション取得
    db = next(get_db())
    
    try:
        # 既存データがある場合はスキップ
        if db.query(Project).count() > 0:
            print("既にデータが存在します")
            return
        
        # 申請種別マスタデータ
        application_types = [
            ApplicationType(code="KENPERMIT", name="建築確認申請", description="建築確認申請書"),
            ApplicationType(code="STRUCTURE", name="構造計算", description="構造計算書"),
            ApplicationType(code="ENERGY", name="省エネ計算", description="省エネルギー計算書"),
            ApplicationType(code="BARRIER", name="バリアフリー", description="バリアフリー法対応"),
        ]
        
        for app_type in application_types:
            db.add(app_type)
        
        # サンプルプロジェクトデータ
        projects_data = [
            {
                "project_code": "PRJ2024001",
                "project_name": "サンプル邸新築工事",
                "status": "申請作業",
                "input_date": date(2024, 1, 15),
                "customer": {
                    "owner_name": "サンプル太郎",
                    "owner_kana": "サンプルタロウ",
                    "owner_zip": "000-0000",
                    "owner_address": "東京都○○区サンプル町1-1-1",
                    "owner_phone": "000-0000-0000",
                },
                "site": {
                    "address": "東京都○○区サンプル町1-1-1",
                    "land_area": 150.50,
                    "city_plan": "市街化区域",
                    "zoning": "第一種低層住居専用地域",
                    "fire_zone": "準防火地域",
                },
                "building": {
                    "building_name": "サンプル邸",
                    "construction_type": "専用住宅",
                    "primary_use": "戸建住宅",
                    "structure": "木造2階建",
                    "floors": "地上2階",
                    "max_height": 8.5,
                    "total_area": 120.00,
                    "building_area": 70.00,
                },
                "financial": {
                    "contract_price": 25000000,
                    "estimate_amount": 24500000,
                    "has_permit_application": True,
                    "has_inspection_schedule": True,
                    "has_foundation_plan": False,
                },
                "schedule": {
                    "reinforcement_scheduled": date(2024, 3, 15),
                    "interim_scheduled": date(2024, 5, 20),
                    "completion_scheduled": date(2024, 8, 30),
                }
            },
            {
                "project_code": "PRJ2024002", 
                "project_name": "テストマンション建設",
                "status": "審査中",
                "input_date": date(2024, 2, 1),
                "customer": {
                    "owner_name": "テスト花子",
                    "owner_kana": "テストハナコ",
                    "owner_zip": "111-1111",
                    "owner_address": "神奈川県××市テスト区2-2-2",
                    "owner_phone": "XXX-XXXX-XXXX",
                },
                "site": {
                    "address": "神奈川県××市テスト区2-2-2",
                    "land_area": 300.00,
                    "city_plan": "市街化区域",
                    "zoning": "第一種中高層住居専用地域",
                    "fire_zone": "準防火地域",
                },
                "building": {
                    "building_name": "テストマンション",
                    "construction_type": "共同住宅",
                    "primary_use": "共同住宅",
                    "structure": "鉄筋コンクリート造3階建",
                    "floors": "地上3階",
                    "max_height": 12.0,
                    "total_area": 450.00,
                    "building_area": 180.00,
                },
                "financial": {
                    "contract_price": 85000000,
                    "estimate_amount": 82000000,
                    "has_permit_application": True,
                    "has_inspection_schedule": True,
                    "has_foundation_plan": True,
                    "has_hardware_plan": True,
                },
                "schedule": {
                    "reinforcement_scheduled": date(2024, 4, 10),
                    "interim_scheduled": date(2024, 7, 15),
                    "completion_scheduled": date(2024, 12, 20),
                }
            },
            {
                "project_code": "PRJ2024003",
                "project_name": "山田商店改築工事", 
                "status": "配筋検査待ち",
                "input_date": date(2024, 1, 20),
                "customer": {
                    "owner_name": "山田次郎",
                    "owner_kana": "ヤマダジロウ",
                    "owner_zip": "789-0123",
                    "owner_address": "大阪府大阪市○○区□□3-4-5",
                    "owner_phone": "06-3456-7890",
                },
                "site": {
                    "address": "大阪府大阪市○○区□□3-4-5",
                    "land_area": 200.00,
                    "city_plan": "市街化区域",
                    "zoning": "商業地域",
                    "fire_zone": "防火地域",
                },
                "building": {
                    "building_name": "山田商店",
                    "construction_type": "店舗併用住宅",
                    "primary_use": "店舗併用住宅",
                    "structure": "鉄骨造2階建",
                    "floors": "地上2階",
                    "max_height": 9.5,
                    "total_area": 180.00,
                    "building_area": 100.00,
                },
                "financial": {
                    "contract_price": 45000000,
                    "estimate_amount": 43000000,
                    "settlement_amount": 22500000,
                    "settlement_date": date(2024, 2, 28),
                    "settlement_staff": "経理担当A",
                    "has_permit_application": True,
                    "has_inspection_schedule": True,
                    "has_foundation_plan": True,
                    "has_hardware_plan": False,
                },
                "schedule": {
                    "reinforcement_scheduled": date(2024, 3, 1),
                    "interim_scheduled": date(2024, 5, 1),
                    "completion_scheduled": date(2024, 8, 1),
                }
            },
            {
                "project_code": "PRJ2024004",
                "project_name": "鈴木邸リノベーション",
                "status": "完了",
                "input_date": date(2023, 11, 10),
                "customer": {
                    "owner_name": "鈴木三郎",
                    "owner_kana": "スズキサブロウ",
                    "owner_zip": "234-5678",
                    "owner_address": "愛知県名古屋市○○区◇◇4-5-6",
                    "owner_phone": "052-4567-8901",
                },
                "site": {
                    "address": "愛知県名古屋市○○区◇◇4-5-6",
                    "land_area": 180.00,
                    "city_plan": "市街化区域",
                    "zoning": "第一種住居地域",
                    "fire_zone": "指定なし",
                },
                "building": {
                    "building_name": "鈴木邸",
                    "construction_type": "専用住宅",
                    "primary_use": "戸建住宅",
                    "structure": "木造2階建",
                    "floors": "地上2階",
                    "max_height": 8.0,
                    "total_area": 110.00,
                    "building_area": 65.00,
                },
                "financial": {
                    "contract_price": 18000000,
                    "estimate_amount": 17500000,
                    "settlement_amount": 18000000,
                    "settlement_date": date(2024, 1, 31),
                    "settlement_staff": "経理担当B",
                    "has_permit_application": True,
                    "has_inspection_schedule": True,
                    "has_foundation_plan": True,
                    "has_hardware_plan": True,
                    "has_invoice": True,
                    "has_energy_calculation": True,
                },
                "schedule": {
                    "reinforcement_scheduled": date(2023, 12, 15),
                    "reinforcement_actual": date(2023, 12, 16),
                    "interim_scheduled": date(2024, 1, 10),
                    "interim_actual": date(2024, 1, 12),
                    "completion_scheduled": date(2024, 1, 25),
                    "completion_actual": date(2024, 1, 26),
                    "inspection_date": date(2024, 1, 26),
                    "inspection_result": "合格",
                    "final_report_date": date(2024, 1, 30),
                }
            },
            {
                "project_code": "PRJ2024005",
                "project_name": "高橋オフィスビル",
                "status": "事前相談",
                "input_date": date(2024, 3, 1),
                "customer": {
                    "owner_name": "高橋建設株式会社",
                    "owner_kana": "タカハシケンセツカブシキガイシャ",
                    "owner_zip": "567-8901",
                    "owner_address": "福岡県福岡市○○区△△5-6-7",
                    "owner_phone": "092-5678-9012",
                    "client_name": "高橋建設株式会社",
                    "client_staff": "高橋社長",
                },
                "site": {
                    "address": "福岡県福岡市○○区△△5-6-7",
                    "land_area": 500.00,
                    "city_plan": "市街化区域",
                    "zoning": "商業地域",
                    "fire_zone": "防火地域",
                },
                "building": {
                    "building_name": "高橋オフィスビル",
                    "construction_type": "事務所",
                    "primary_use": "事務所",
                    "structure": "鉄筋コンクリート造5階建",
                    "floors": "地上5階",
                    "max_height": 20.0,
                    "total_area": 1200.00,
                    "building_area": 280.00,
                },
                "financial": {
                    "estimate_amount": 150000000,
                    "has_permit_application": False,
                    "has_inspection_schedule": False,
                    "has_foundation_plan": False,
                },
                "schedule": {
                    "reinforcement_scheduled": date(2024, 6, 1),
                    "interim_scheduled": date(2024, 9, 1),
                    "completion_scheduled": date(2025, 2, 1),
                }
            }
        ]
        
        # プロジェクトデータの作成
        for proj_data in projects_data:
            # プロジェクト作成
            project = Project(
                project_code=proj_data["project_code"],
                project_name=proj_data["project_name"],
                status=proj_data["status"],
                input_date=proj_data["input_date"]
            )
            db.add(project)
            db.flush()  # IDを取得するため
            
            # 顧客情報作成
            customer = Customer(
                project_id=project.id,
                **proj_data["customer"]
            )
            db.add(customer)
            
            # 敷地情報作成
            site = Site(
                project_id=project.id,
                **proj_data["site"]
            )
            db.add(site)
            
            # 建物情報作成
            building = Building(
                project_id=project.id,
                **proj_data["building"]
            )
            db.add(building)
            
            # 財務情報作成
            financial = Financial(
                project_id=project.id,
                **proj_data["financial"]
            )
            db.add(financial)
            
            # スケジュール情報作成
            schedule = Schedule(
                project_id=project.id,
                **proj_data["schedule"]
            )
            db.add(schedule)
        
        # 申請情報のサンプル作成
        applications_data = [
            {"project_id": 1, "application_type_id": 1, "status": "申請", "submitted_date": date(2024, 1, 20)},
            {"project_id": 1, "application_type_id": 3, "status": "申請", "submitted_date": date(2024, 1, 25)},
            {"project_id": 2, "application_type_id": 1, "status": "申請", "submitted_date": date(2024, 2, 5)},
            {"project_id": 2, "application_type_id": 2, "status": "申請", "submitted_date": date(2024, 2, 10)},
            {"project_id": 3, "application_type_id": 1, "status": "申請", "submitted_date": date(2024, 1, 25)},
            {"project_id": 4, "application_type_id": 1, "status": "申請", "submitted_date": date(2023, 11, 15), "approved_date": date(2023, 12, 1)},
        ]
        
        for app_data in applications_data:
            application = Application(**app_data)
            db.add(application)
        
        db.commit()
        print("サンプルデータの作成が完了しました")
        
    except Exception as e:
        db.rollback()
        print(f"エラーが発生しました: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()