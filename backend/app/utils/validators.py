"""
バリデーション関連のユーティリティ
"""

import re
from typing import Optional, List, Any
from datetime import date, datetime
from decimal import Decimal, InvalidOperation


class ValidationError(Exception):
    """バリデーションエラー"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(message)


class ProjectValidator:
    """プロジェクト関連のバリデーター"""
    
    @staticmethod
    def validate_project_name(name: str) -> str:
        """プロジェクト名のバリデーション"""
        if not name or not name.strip():
            raise ValidationError("プロジェクト名は必須です", "project_name")
        
        if len(name.strip()) > 200:
            raise ValidationError("プロジェクト名は200文字以内で入力してください", "project_name")
        
        return name.strip()
    
    @staticmethod
    def validate_status(status: str) -> str:
        """ステータスのバリデーション"""
        valid_statuses = [
            "事前相談", "受注", "申請作業", "審査中", 
            "配筋検査待ち", "中間検査待ち", "完了検査待ち", "完了", "失注"
        ]
        
        if status not in valid_statuses:
            raise ValidationError(f"無効なステータスです: {status}", "status")
        
        return status
    
    @staticmethod
    def validate_phone_number(phone: Optional[str]) -> Optional[str]:
        """電話番号のバリデーション"""
        if not phone:
            return None
        
        # ハイフン、括弧、スペースを除去して数字のみにする
        cleaned = re.sub(r'[-\(\)\s]', '', phone)
        
        if not re.match(r'^\d{10,11}$', cleaned):
            raise ValidationError("電話番号の形式が正しくありません", "phone")
        
        return phone
    
    @staticmethod
    def validate_zip_code(zip_code: Optional[str]) -> Optional[str]:
        """郵便番号のバリデーション"""
        if not zip_code:
            return None
        
        # ハイフンを除去
        cleaned = zip_code.replace('-', '')
        
        if not re.match(r'^\d{7}$', cleaned):
            raise ValidationError("郵便番号は7桁の数字で入力してください", "zip_code")
        
        return zip_code
    
    @staticmethod
    def validate_positive_number(value: Optional[float], field_name: str) -> Optional[float]:
        """正の数値のバリデーション"""
        if value is None:
            return None
        
        if value < 0:
            raise ValidationError(f"{field_name}は0以上の値を入力してください", field_name)
        
        return value
    
    @staticmethod
    def validate_date(date_str: Optional[str], field_name: str) -> Optional[date]:
        """日付のバリデーション"""
        if not date_str:
            return None
        
        try:
            if isinstance(date_str, str):
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            elif isinstance(date_str, date):
                return date_str
            else:
                raise ValidationError(f"{field_name}の形式が正しくありません", field_name)
        except ValueError:
            raise ValidationError(f"{field_name}の形式が正しくありません (YYYY-MM-DD)", field_name)
    
    @staticmethod
    def validate_date_range(start_date: Optional[date], end_date: Optional[date], 
                          start_field: str, end_field: str) -> tuple[Optional[date], Optional[date]]:
        """日付範囲のバリデーション"""
        if start_date and end_date and start_date > end_date:
            raise ValidationError(f"{start_field}は{end_field}より前の日付である必要があります")
        
        return start_date, end_date
    
    @staticmethod
    def validate_currency(amount: Optional[float], field_name: str) -> Optional[Decimal]:
        """通貨金額のバリデーション"""
        if amount is None:
            return None
        
        if amount < 0:
            raise ValidationError(f"{field_name}は0以上の値を入力してください", field_name)
        
        # 小数点以下の桁数制限
        try:
            decimal_amount = Decimal(str(amount))
            if decimal_amount.as_tuple().exponent < -2:  # 小数点以下2桁まで
                raise ValidationError(f"{field_name}は小数点以下2桁まで入力可能です", field_name)
            
            return decimal_amount
        except InvalidOperation:
            raise ValidationError(f"{field_name}の形式が正しくありません", field_name)


class CustomerValidator:
    """顧客情報のバリデーター"""
    
    @staticmethod
    def validate_owner_name(name: str) -> str:
        """施主名のバリデーション"""
        if not name or not name.strip():
            raise ValidationError("施主名は必須です", "owner_name")
        
        if len(name.strip()) > 100:
            raise ValidationError("施主名は100文字以内で入力してください", "owner_name")
        
        return name.strip()
    
    @staticmethod
    def validate_kana(kana: Optional[str], field_name: str) -> Optional[str]:
        """カナ名のバリデーション"""
        if not kana:
            return None
        
        if len(kana.strip()) > 100:
            raise ValidationError(f"{field_name}は100文字以内で入力してください", field_name)
        
        # ひらがな・カタカナ・長音記号・スペースのみ許可
        if not re.match(r'^[あ-んア-ンー\s]+$', kana.strip()):
            raise ValidationError(f"{field_name}はひらがな・カタカナで入力してください", field_name)
        
        return kana.strip()


class SiteValidator:
    """敷地情報のバリデーター"""
    
    @staticmethod
    def validate_address(address: str) -> str:
        """住所のバリデーション"""
        if not address or not address.strip():
            raise ValidationError("建設地住所は必須です", "address")
        
        if len(address.strip()) > 500:
            raise ValidationError("住所は500文字以内で入力してください", "address")
        
        return address.strip()
    
    @staticmethod
    def validate_land_area(area: Optional[float]) -> Optional[float]:
        """敷地面積のバリデーション"""
        if area is None:
            return None
        
        if area <= 0:
            raise ValidationError("敷地面積は0より大きい値を入力してください", "land_area")
        
        if area > 100000:  # 10万㎡を上限とする
            raise ValidationError("敷地面積が大きすぎます", "land_area")
        
        return area


class BuildingValidator:
    """建物情報のバリデーター"""
    
    @staticmethod
    def validate_height(height: Optional[float]) -> Optional[float]:
        """建物高さのバリデーション"""
        if height is None:
            return None
        
        if height <= 0:
            raise ValidationError("建物高さは0より大きい値を入力してください", "max_height")
        
        if height > 200:  # 200mを上限とする
            raise ValidationError("建物高さが大きすぎます", "max_height")
        
        return height
    
    @staticmethod
    def validate_area(area: Optional[float], field_name: str) -> Optional[float]:
        """建物面積のバリデーション"""
        if area is None:
            return None
        
        if area <= 0:
            raise ValidationError(f"{field_name}は0より大きい値を入力してください", field_name)
        
        if area > 50000:  # 5万㎡を上限とする
            raise ValidationError(f"{field_name}が大きすぎます", field_name)
        
        return area
    
    @staticmethod
    def validate_building_areas(building_area: Optional[float], 
                               total_area: Optional[float]) -> tuple[Optional[float], Optional[float]]:
        """建築面積と延床面積の関係チェック"""
        if building_area and total_area and building_area > total_area:
            raise ValidationError("建築面積は延床面積以下である必要があります")
        
        return building_area, total_area


class FinancialValidator:
    """財務情報のバリデーター"""
    
    @staticmethod
    def validate_amounts(contract_price: Optional[float],
                        estimate_amount: Optional[float],
                        settlement_amount: Optional[float]) -> tuple[Optional[Decimal], Optional[Decimal], Optional[Decimal]]:
        """金額の相互関係チェック"""
        contract = ProjectValidator.validate_currency(contract_price, "契約金額")
        estimate = ProjectValidator.validate_currency(estimate_amount, "見積金額")
        settlement = ProjectValidator.validate_currency(settlement_amount, "決済金額")
        
        # 決済金額は契約金額を超えないようにチェック
        if contract and settlement and settlement > contract:
            raise ValidationError("決済金額は契約金額を超えることはできません")
        
        return contract, estimate, settlement


class ScheduleValidator:
    """スケジュール情報のバリデーター"""
    
    @staticmethod
    def validate_inspection_schedule(reinforcement_scheduled: Optional[date],
                                   interim_scheduled: Optional[date],
                                   completion_scheduled: Optional[date]) -> tuple[Optional[date], Optional[date], Optional[date]]:
        """検査スケジュールの順序チェック"""
        dates = []
        names = []
        
        if reinforcement_scheduled:
            dates.append(reinforcement_scheduled)
            names.append("配筋検査予定日")
        
        if interim_scheduled:
            dates.append(interim_scheduled)
            names.append("中間検査予定日")
        
        if completion_scheduled:
            dates.append(completion_scheduled)
            names.append("完了検査予定日")
        
        # 日付の順序チェック
        for i in range(len(dates) - 1):
            if dates[i] > dates[i + 1]:
                raise ValidationError(f"{names[i]}は{names[i + 1]}より前の日付である必要があります")
        
        return reinforcement_scheduled, interim_scheduled, completion_scheduled
    
    @staticmethod
    def validate_actual_vs_scheduled(scheduled: Optional[date], 
                                   actual: Optional[date], 
                                   inspection_type: str) -> tuple[Optional[date], Optional[date]]:
        """予定日と実施日のチェック"""
        if actual and not scheduled:
            raise ValidationError(f"{inspection_type}の実施日が入力されていますが、予定日が設定されていません")
        
        return scheduled, actual


def validate_project_data(project_data: dict) -> dict:
    """プロジェクトデータの包括的バリデーション"""
    validated_data = {}
    
    # 基本情報のバリデーション
    if 'project_name' in project_data:
        validated_data['project_name'] = ProjectValidator.validate_project_name(project_data['project_name'])
    
    if 'status' in project_data:
        validated_data['status'] = ProjectValidator.validate_status(project_data['status'])
    
    if 'input_date' in project_data:
        validated_data['input_date'] = ProjectValidator.validate_date(project_data['input_date'], "入力日")
    
    return validated_data