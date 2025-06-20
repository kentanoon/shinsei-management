"""
プロジェクト関連のデータモデル
正規化されたテーブル設計
"""

from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Numeric, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ApplicationStatusEnum(enum.Enum):
    """申請ステータス列挙型"""
    DRAFT = "下書き"
    IN_REVIEW = "レビュー中"
    APPROVED = "承認済"
    REJECTED = "差戻し"
    WITHDRAWN = "取下げ"
    COMPLETED = "完了"


class AuditTrail(Base):
    """監査証跡テーブル"""
    __tablename__ = "audit_trails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # 将来のユーザー管理用
    target_model = Column(String(50), nullable=False, index=True)
    target_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    action = Column(String(20), nullable=False)  # CREATE, UPDATE, DELETE
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # 複合インデックス用
    __table_args__ = (
        {"comment": "システム内のデータ変更履歴を記録"}
    )


class Project(Base):
    """プロジェクト基本情報"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(20), unique=True, index=True, nullable=False)
    project_name = Column(String(200), nullable=False)
    status = Column(String(50), nullable=False, default="事前相談")
    input_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # リレーション
    customer = relationship("Customer", back_populates="projects", uselist=False)
    site = relationship("Site", back_populates="project", uselist=False)
    building = relationship("Building", back_populates="project", uselist=False)
    applications = relationship("Application", back_populates="project")
    financial = relationship("Financial", back_populates="project", uselist=False)
    schedule = relationship("Schedule", back_populates="project", uselist=False)


class Customer(Base):
    """顧客情報"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    # 施主情報
    owner_name = Column(String(100), nullable=False)
    owner_kana = Column(String(100))
    owner_zip = Column(String(10))
    owner_address = Column(Text)
    owner_phone = Column(String(20))
    
    # 連名者
    joint_name = Column(String(100))
    joint_kana = Column(String(100))
    
    # 発注者
    client_name = Column(String(100))
    client_staff = Column(String(100))
    
    # リレーション
    projects = relationship("Project", back_populates="customer")


class Site(Base):
    """敷地情報"""
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    # 敷地基本情報
    address = Column(Text, nullable=False)
    land_area = Column(Numeric(10, 2))
    
    # 法的制限
    city_plan = Column(String(100))  # 都市計画
    zoning = Column(String(100))     # 用途地域
    fire_zone = Column(String(100))  # 防火地域
    slope_limit = Column(String(100))  # 斜線制限
    setback = Column(String(100))    # 外壁後退
    other_buildings = Column(Text)   # 他建物
    
    # 災害区域
    landslide_alert = Column(String(100))  # 土砂災害警戒区域
    flood_zone = Column(String(100))       # 洪水浸水想定区域
    tsunami_zone = Column(String(100))     # 津波災害警戒区域
    
    # リレーション
    project = relationship("Project", back_populates="site")


class Building(Base):
    """建物情報"""
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    # 建物基本情報
    building_name = Column(String(200))
    construction_type = Column(String(100))  # 建築用途
    primary_use = Column(String(100))        # 主要用途
    structure = Column(String(100))          # 構造
    floors = Column(String(50))              # 階数
    max_height = Column(Numeric(5, 2))       # 最高高さ
    total_area = Column(Numeric(10, 2))      # 延床面積
    building_area = Column(Numeric(10, 2))   # 建築面積
    
    # リレーション
    project = relationship("Project", back_populates="building")


class ApplicationType(Base):
    """申請種別マスタ"""
    __tablename__ = "application_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # リレーション
    applications = relationship("Application", back_populates="application_type")


class Application(Base):
    """申請情報"""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    application_type_id = Column(Integer, ForeignKey("application_types.id"))
    
    # ワークフロー管理
    status = Column(Enum(ApplicationStatusEnum), nullable=False, default=ApplicationStatusEnum.DRAFT)
    workflow_step = Column(Integer, default=0)  # ワークフローの進行段階
    submitted_date = Column(Date)    # 提出日
    approved_date = Column(Date)     # 承認日
    rejected_date = Column(Date)     # 差戻し日
    completed_date = Column(Date)    # 完了日
    
    # コメントとドキュメント
    notes = Column(Text)                    # 備考
    rejection_reason = Column(Text)         # 差戻し理由
    approval_comment = Column(Text)         # 承認コメント
    generated_document_path = Column(String(500))  # 生成されたドキュメントのパス
    
    # メタデータ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)     # 作成者ID（将来の拡張用）
    updated_by = Column(Integer, nullable=True)     # 更新者ID（将来の拡張用）
    
    # リレーション
    project = relationship("Project", back_populates="applications")
    application_type = relationship("ApplicationType", back_populates="applications")


class Financial(Base):
    """財務情報"""
    __tablename__ = "financials"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    # 受注後
    contract_price = Column(Numeric(12, 0))     # 契約金額
    estimate_amount = Column(Numeric(12, 0))    # 見積金額
    construction_cost = Column(Numeric(12, 0))  # 工事費用
    juchu_note = Column(Text)                   # 受注備考
    
    # 決済後
    settlement_date = Column(Date)              # 決済日
    settlement_staff = Column(String(100))      # 決済担当者
    settlement_amount = Column(Numeric(12, 0))  # 決済金額
    payment_terms = Column(Text)                # 支払条件
    settlement_note = Column(Text)              # 決済備考
    
    # 提出書類フラグ
    has_permit_application = Column(Boolean, default=False)  # 交付申請書
    has_inspection_schedule = Column(Boolean, default=False) # 検査予定表
    has_foundation_plan = Column(Boolean, default=False)     # 基礎伏図
    has_hardware_plan = Column(Boolean, default=False)       # 金物図
    has_invoice = Column(Boolean, default=False)             # 請求書
    has_energy_calculation = Column(Boolean, default=False)  # 省エネ計算書
    has_settlement_data = Column(Boolean, default=False)     # 決済データ
    
    # リレーション
    project = relationship("Project", back_populates="financial")


class Schedule(Base):
    """工程管理"""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    # 検査予定・実施日
    reinforcement_scheduled = Column(Date)    # 配筋検査予定日
    reinforcement_actual = Column(Date)       # 配筋検査実施日
    interim_scheduled = Column(Date)          # 中間検査予定日
    interim_actual = Column(Date)             # 中間検査実施日
    completion_scheduled = Column(Date)       # 完了検査予定日
    completion_actual = Column(Date)          # 完了検査実施日
    
    # 完了検査後
    inspection_date = Column(Date)            # 完了検査日
    inspection_result = Column(String(100))   # 検査結果
    corrections = Column(Text)                # 是正内容
    final_report_date = Column(Date)          # 完了報告日
    completion_note = Column(Text)            # 完了メモ
    
    # 返却・送付確認
    has_permit_returned = Column(Boolean, default=False)     # 確認申請書の返却
    has_report_sent = Column(Boolean, default=False)         # 工事監理報告書の送付
    has_items_confirmed = Column(Boolean, default=False)     # 返却物の確認
    
    # 軽微な変更・計画変更
    change_memo = Column(Text)                # 変更概要
    
    # リレーション
    project = relationship("Project", back_populates="schedule")