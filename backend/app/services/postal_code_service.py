"""
郵便番号API連携サービス
住所の自動入力機能を提供
"""

import requests
from typing import Optional, Dict, Any
import re
from functools import lru_cache


class PostalCodeService:
    """郵便番号から住所を取得するサービス"""
    
    # 郵便番号APIのエンドポイント（無料で利用可能）
    ZIPCLOUD_API_URL = "https://zipcloud.ibsnet.co.jp/api/search"
    
    @staticmethod
    def normalize_postal_code(postal_code: str) -> str:
        """
        郵便番号を正規化
        
        Args:
            postal_code: 入力された郵便番号
            
        Returns:
            正規化された郵便番号（ハイフンなし7桁）
        """
        # ハイフン、スペース、全角文字を除去
        normalized = re.sub(r'[-\s　]', '', postal_code)
        
        # 全角数字を半角に変換
        normalized = normalized.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
        
        return normalized
    
    @staticmethod
    def validate_postal_code(postal_code: str) -> bool:
        """
        郵便番号のバリデーション
        
        Args:
            postal_code: 郵便番号
            
        Returns:
            有効な郵便番号かどうか
        """
        normalized = PostalCodeService.normalize_postal_code(postal_code)
        return len(normalized) == 7 and normalized.isdigit()
    
    @staticmethod
    @lru_cache(maxsize=1000)
    def get_address_by_postal_code(postal_code: str) -> Optional[Dict[str, str]]:
        """
        郵便番号から住所情報を取得
        
        Args:
            postal_code: 郵便番号（7桁）
            
        Returns:
            住所情報のディクショナリまたはNone
            {
                "prefecture": "都道府県",
                "city": "市区町村",
                "town": "町域",
                "full_address": "完全な住所"
            }
        """
        # 郵便番号の正規化とバリデーション
        normalized_code = PostalCodeService.normalize_postal_code(postal_code)
        if not PostalCodeService.validate_postal_code(normalized_code):
            return None
        
        try:
            # zipcloud APIにリクエスト
            response = requests.get(
                PostalCodeService.ZIPCLOUD_API_URL,
                params={"zipcode": normalized_code},
                timeout=10
            )
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            # APIレスポンスの確認
            if data.get("status") != 200 or not data.get("results"):
                return None
            
            # 最初の結果を使用（通常は1つのみ）
            result = data["results"][0]
            
            return {
                "prefecture": result.get("address1", ""),  # 都道府県
                "city": result.get("address2", ""),       # 市区町村
                "town": result.get("address3", ""),       # 町域
                "full_address": "".join([
                    result.get("address1", ""),
                    result.get("address2", ""),
                    result.get("address3", "")
                ])
            }
            
        except requests.RequestException:
            # ネットワークエラーの場合はNoneを返す
            return None
        except Exception:
            # その他のエラーの場合もNoneを返す
            return None
    
    @staticmethod
    def format_postal_code(postal_code: str) -> str:
        """
        郵便番号をハイフン付きの形式でフォーマット
        
        Args:
            postal_code: 郵便番号
            
        Returns:
            フォーマットされた郵便番号（例：123-4567）
        """
        normalized = PostalCodeService.normalize_postal_code(postal_code)
        if len(normalized) == 7:
            return f"{normalized[:3]}-{normalized[3:]}"
        return postal_code
    
    @staticmethod
    def search_postal_codes_by_address(address: str, limit: int = 10) -> list:
        """
        住所から郵便番号を検索（逆引き）
        
        注意: この機能は実装コストが高いため、必要に応じて後で実装
        現在はプレースホルダー
        
        Args:
            address: 住所
            limit: 取得件数の上限
            
        Returns:
            郵便番号のリスト
        """
        # TODO: 逆引き検索の実装
        # 実装例：
        # - 住所データベースの構築
        # - 部分一致検索の実装
        # - あいまい検索の実装
        return []


class CustomerSearchService:
    """顧客検索サービス"""
    
    def __init__(self, db):
        self.db = db
    
    def search_customers(self, query: str, limit: int = 10) -> list:
        """
        顧客をインクリメンタル検索
        
        Args:
            query: 検索クエリ
            limit: 取得件数の上限
            
        Returns:
            マッチした顧客のリスト
        """
        from app.models.project import Customer
        
        if not query or len(query) < 2:
            return []
        
        search_pattern = f"%{query}%"
        
        customers = self.db.query(Customer).filter(
            (Customer.owner_name.ilike(search_pattern)) |
            (Customer.owner_kana.ilike(search_pattern)) |
            (Customer.client_name.ilike(search_pattern))
        ).limit(limit).all()
        
        return [
            {
                "id": customer.id,
                "owner_name": customer.owner_name,
                "owner_kana": customer.owner_kana,
                "owner_phone": customer.owner_phone,
                "owner_address": customer.owner_address,
                "client_name": customer.client_name
            }
            for customer in customers
        ]