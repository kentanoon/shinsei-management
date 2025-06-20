"""
プロジェクト関連のPydanticスキーマ
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, validator, Field
from decimal import Decimal


class CustomerBase(BaseModel):
    """顧客情報ベース"""
    owner_name: str = Field(..., min_length=1, max_length=100, description="施主名")
    owner_kana: Optional[str] = Field(None, max_length=100, description="施主フリガナ")
    owner_zip: Optional[str] = Field(None, max_length=10, description="郵便番号")
    owner_address: Optional[str] = Field(None, description="住所")
    owner_phone: Optional[str] = Field(None, max_length=20, description="電話番号")
    joint_name: Optional[str] = Field(None, max_length=100, description="連名者")
    joint_kana: Optional[str] = Field(None, max_length=100, description="連名者フリガナ")
    client_name: Optional[str] = Field(None, max_length=100, description="発注者名")
    client_staff: Optional[str] = Field(None, max_length=100, description="発注者担当者")

    @validator('owner_zip')
    def validate_zip(cls, v):
        if v:
            # ハイフンを除去して数字のみチェック
            digits_only = v.replace('-', '')
            if not digits_only.isdigit() or len(digits_only) != 7:
                raise ValueError('郵便番号は7桁の数字で入力してください（例：123-4567）')
        return v

    @validator('owner_phone')
    def validate_phone(cls, v):
        if v:
            # 数字、ハイフン、括弧、スペースのみ許可
            allowed_chars = v.replace('-', '').replace('(', '').replace(')', '').replace(' ', '').replace('　', '')
            if not allowed_chars.isdigit():
                raise ValueError('電話番号は数字、ハイフン、括弧のみ使用可能です')
            if len(allowed_chars) < 10 or len(allowed_chars) > 11:
                raise ValueError('電話番号は10桁または11桁で入力してください')
        return v

    @validator('owner_name')
    def validate_owner_name(cls, v):
        if not v or not v.strip():
            raise ValueError('施主名は必須です')
        if len(v.strip()) > 100:
            raise ValueError('施主名は100文字以内で入力してください')
        return v.strip()


class CustomerCreate(CustomerBase):
    """顧客情報作成"""
    pass


class CustomerUpdate(BaseModel):
    """顧客情報更新"""
    owner_name: Optional[str] = Field(None, min_length=1, max_length=100)
    owner_kana: Optional[str] = Field(None, max_length=100)
    owner_zip: Optional[str] = Field(None, max_length=10)
    owner_address: Optional[str] = None
    owner_phone: Optional[str] = Field(None, max_length=20)
    joint_name: Optional[str] = Field(None, max_length=100)
    joint_kana: Optional[str] = Field(None, max_length=100)
    client_name: Optional[str] = Field(None, max_length=100)
    client_staff: Optional[str] = Field(None, max_length=100)


class SiteBase(BaseModel):
    """敷地情報ベース"""
    address: str = Field(..., min_length=1, description="建設地住所")
    land_area: Optional[Decimal] = Field(None, ge=0, le=999999.99, description="敷地面積")
    city_plan: Optional[str] = Field(None, max_length=100, description="都市計画")
    zoning: Optional[str] = Field(None, max_length=100, description="用途地域")
    fire_zone: Optional[str] = Field(None, max_length=100, description="防火地域")
    slope_limit: Optional[str] = Field(None, max_length=100, description="斜線制限")
    setback: Optional[str] = Field(None, max_length=100, description="外壁後退")
    other_buildings: Optional[str] = Field(None, description="他建物")
    landslide_alert: Optional[str] = Field(None, max_length=100, description="土砂災害警戒区域")
    flood_zone: Optional[str] = Field(None, max_length=100, description="洪水浸水想定区域")
    tsunami_zone: Optional[str] = Field(None, max_length=100, description="津波災害警戒区域")

    @validator('address')
    def validate_address(cls, v):
        if not v or not v.strip():
            raise ValueError('建設地住所は必須です')
        if len(v.strip()) > 500:
            raise ValueError('建設地住所は500文字以内で入力してください')
        return v.strip()

    @validator('land_area')
    def validate_land_area(cls, v):
        if v is not None and v <= 0:
            raise ValueError('敷地面積は0より大きい値を入力してください')
        return v


class SiteCreate(SiteBase):
    """敷地情報作成"""
    pass


class SiteUpdate(BaseModel):
    """敷地情報更新"""
    address: Optional[str] = Field(None, min_length=1)
    land_area: Optional[Decimal] = Field(None, ge=0)
    city_plan: Optional[str] = Field(None, max_length=100)
    zoning: Optional[str] = Field(None, max_length=100)
    fire_zone: Optional[str] = Field(None, max_length=100)
    slope_limit: Optional[str] = Field(None, max_length=100)
    setback: Optional[str] = Field(None, max_length=100)
    other_buildings: Optional[str] = None
    landslide_alert: Optional[str] = Field(None, max_length=100)
    flood_zone: Optional[str] = Field(None, max_length=100)
    tsunami_zone: Optional[str] = Field(None, max_length=100)


class BuildingBase(BaseModel):
    """建物情報ベース"""
    building_name: Optional[str] = Field(None, max_length=200, description="建物名称")
    construction_type: Optional[str] = Field(None, max_length=100, description="建築用途")
    primary_use: Optional[str] = Field(None, max_length=100, description="主要用途")
    structure: Optional[str] = Field(None, max_length=100, description="構造")
    floors: Optional[str] = Field(None, max_length=50, description="階数")
    max_height: Optional[Decimal] = Field(None, ge=0, le=999.99, description="最高高さ(m)")
    total_area: Optional[Decimal] = Field(None, ge=0, le=999999.99, description="延床面積(㎡)")
    building_area: Optional[Decimal] = Field(None, ge=0, le=999999.99, description="建築面積(㎡)")

    @validator('max_height')
    def validate_max_height(cls, v):
        if v is not None and v <= 0:
            raise ValueError('最高高さは0より大きい値を入力してください')
        return v

    @validator('total_area', 'building_area')
    def validate_areas(cls, v):
        if v is not None and v <= 0:
            raise ValueError('面積は0より大きい値を入力してください')
        return v


class BuildingCreate(BuildingBase):
    """建物情報作成"""
    pass


class BuildingUpdate(BuildingBase):
    """建物情報更新"""
    pass


class ProjectBase(BaseModel):
    """プロジェクトベース"""
    project_name: str = Field(..., min_length=1, max_length=200, description="プロジェクト名")
    status: str = Field(default="事前相談", description="ステータス")
    input_date: Optional[date] = Field(default_factory=date.today, description="入力日")

    @validator('project_name')
    def validate_project_name(cls, v):
        if not v or not v.strip():
            raise ValueError('プロジェクト名は必須です')
        if len(v.strip()) > 200:
            raise ValueError('プロジェクト名は200文字以内で入力してください')
        # 特殊文字チェック
        forbidden_chars = ['<', '>', '"', "'", '&']
        if any(char in v for char in forbidden_chars):
            raise ValueError('プロジェクト名に使用できない文字が含まれています')
        return v.strip()

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = [
            "事前相談", "受注", "申請作業", "審査中", 
            "配筋検査待ち", "中間検査待ち", "完了検査待ち", "完了", "失注"
        ]
        if v not in valid_statuses:
            raise ValueError(f'ステータスは {", ".join(valid_statuses)} のいずれかである必要があります')
        return v

    @validator('input_date')
    def validate_input_date(cls, v):
        if v and v > date.today():
            raise ValueError('入力日は今日以前の日付を指定してください')
        return v


class ProjectCreate(ProjectBase):
    """プロジェクト作成"""
    customer: CustomerCreate
    site: SiteCreate
    building: Optional[BuildingCreate] = None


class ProjectUpdate(BaseModel):
    """プロジェクト更新"""
    project_name: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[str] = None
    input_date: Optional[date] = None
    customer: Optional[CustomerUpdate] = None
    site: Optional[SiteUpdate] = None
    building: Optional[BuildingUpdate] = None

    @validator('status')
    def validate_status(cls, v):
        if v is None:
            return v
        valid_statuses = [
            "事前相談", "受注", "申請作業", "審査中", 
            "配筋検査待ち", "中間検査待ち", "完了検査待ち", "完了", "失注"
        ]
        if v not in valid_statuses:
            raise ValueError(f'ステータスは {", ".join(valid_statuses)} のいずれかである必要があります')
        return v


# Response schemas
class CustomerResponse(CustomerBase):
    """顧客情報レスポンス"""
    id: int

    class Config:
        from_attributes = True


class SiteResponse(SiteBase):
    """敷地情報レスポンス"""
    id: int

    class Config:
        from_attributes = True


class BuildingResponse(BuildingBase):
    """建物情報レスポンス"""
    id: int

    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    """プロジェクトレスポンス"""
    id: int
    project_code: str
    created_at: datetime
    updated_at: Optional[datetime]
    customer: Optional[CustomerResponse] = None
    site: Optional[SiteResponse] = None
    building: Optional[BuildingResponse] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """プロジェクト一覧レスポンス"""
    projects: List[ProjectResponse]
    total: int
    skip: int
    limit: int


class FinancialBase(BaseModel):
    """財務情報ベース"""
    contract_price: Optional[Decimal] = Field(None, ge=0, description="契約金額")
    estimate_amount: Optional[Decimal] = Field(None, ge=0, description="見積金額")
    construction_cost: Optional[Decimal] = Field(None, ge=0, description="工事費用")
    settlement_date: Optional[date] = Field(None, description="決済日")
    settlement_staff: Optional[str] = Field(None, max_length=100, description="決済担当者")
    settlement_amount: Optional[Decimal] = Field(None, ge=0, description="決済金額")
    payment_terms: Optional[str] = Field(None, description="支払条件")
    juchu_note: Optional[str] = Field(None, description="受注備考")
    settlement_note: Optional[str] = Field(None, description="決済備考")
    has_permit_application: bool = Field(default=False, description="交付申請書")
    has_inspection_schedule: bool = Field(default=False, description="検査予定表")
    has_foundation_plan: bool = Field(default=False, description="基礎伏図")
    has_hardware_plan: bool = Field(default=False, description="金物図")
    has_invoice: bool = Field(default=False, description="請求書")
    has_energy_calculation: bool = Field(default=False, description="省エネ計算書")
    has_settlement_data: bool = Field(default=False, description="決済データ")


class FinancialCreate(FinancialBase):
    """財務情報作成"""
    pass


class FinancialUpdate(FinancialBase):
    """財務情報更新"""
    pass


class ScheduleBase(BaseModel):
    """スケジュール情報ベース"""
    reinforcement_scheduled: Optional[date] = Field(None, description="配筋検査予定日")
    reinforcement_actual: Optional[date] = Field(None, description="配筋検査実施日")
    interim_scheduled: Optional[date] = Field(None, description="中間検査予定日")
    interim_actual: Optional[date] = Field(None, description="中間検査実施日")
    completion_scheduled: Optional[date] = Field(None, description="完了検査予定日")
    completion_actual: Optional[date] = Field(None, description="完了検査実施日")
    inspection_date: Optional[date] = Field(None, description="完了検査日")
    inspection_result: Optional[str] = Field(None, max_length=100, description="検査結果")
    corrections: Optional[str] = Field(None, description="是正内容")
    final_report_date: Optional[date] = Field(None, description="完了報告日")
    completion_note: Optional[str] = Field(None, description="完了メモ")
    has_permit_returned: bool = Field(default=False, description="確認申請書の返却")
    has_report_sent: bool = Field(default=False, description="工事監理報告書の送付")
    has_items_confirmed: bool = Field(default=False, description="返却物の確認")
    change_memo: Optional[str] = Field(None, description="変更概要")


class ScheduleCreate(ScheduleBase):
    """スケジュール情報作成"""
    pass


class ScheduleUpdate(ScheduleBase):
    """スケジュール情報更新"""
    pass