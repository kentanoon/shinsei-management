"""
ユーティリティエンドポイント
郵便番号検索、顧客検索など
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.postal_code_service import PostalCodeService, CustomerSearchService

router = APIRouter()


@router.get("/postal-code/{postal_code}", summary="郵便番号から住所を取得")
async def get_address_by_postal_code(
    postal_code: str
):
    """
    郵便番号から住所情報を取得
    
    - **postal_code**: 郵便番号（7桁、ハイフンあり/なし両方対応）
    
    レスポンス例:
    ```json
    {
        "postal_code": "123-4567",
        "prefecture": "東京都",
        "city": "渋谷区",
        "town": "渋谷",
        "full_address": "東京都渋谷区渋谷"
    }
    ```
    """
    try:
        # 郵便番号のバリデーション
        if not PostalCodeService.validate_postal_code(postal_code):
            raise HTTPException(
                status_code=400, 
                detail="無効な郵便番号です。7桁の数字で入力してください。"
            )
        
        # 住所情報を取得
        address_info = PostalCodeService.get_address_by_postal_code(postal_code)
        
        if not address_info:
            raise HTTPException(
                status_code=404,
                detail="指定された郵便番号に対応する住所が見つかりません。"
            )
        
        return {
            "postal_code": PostalCodeService.format_postal_code(postal_code),
            **address_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="住所検索中にエラーが発生しました。"
        )


@router.get("/postal-code/validate/{postal_code}", summary="郵便番号バリデーション")
async def validate_postal_code(
    postal_code: str
):
    """
    郵便番号の形式をバリデーション
    
    - **postal_code**: 検証する郵便番号
    """
    is_valid = PostalCodeService.validate_postal_code(postal_code)
    formatted_code = PostalCodeService.format_postal_code(postal_code) if is_valid else None
    
    return {
        "postal_code": postal_code,
        "is_valid": is_valid,
        "formatted": formatted_code,
        "normalized": PostalCodeService.normalize_postal_code(postal_code) if is_valid else None
    }


@router.get("/customers/search", summary="顧客検索")
async def search_customers(
    q: str = Query(..., min_length=2, description="検索クエリ（2文字以上）"),
    limit: int = Query(10, ge=1, le=50, description="取得件数の上限"),
    db: Session = Depends(get_db)
):
    """
    顧客をインクリメンタル検索
    
    - **q**: 検索クエリ（施主名、フリガナ、発注者名で検索）
    - **limit**: 取得件数の上限（最大50件）
    
    レスポンス例:
    ```json
    {
        "query": "田中",
        "results": [
            {
                "id": 1,
                "owner_name": "田中太郎",
                "owner_kana": "タナカタロウ",
                "owner_phone": "03-1234-5678",
                "owner_address": "東京都渋谷区...",
                "client_name": "株式会社ABC"
            }
        ],
        "count": 1
    }
    ```
    """
    try:
        service = CustomerSearchService(db)
        results = service.search_customers(q, limit)
        
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="顧客検索中にエラーが発生しました。"
        )


@router.get("/prefectures", summary="都道府県一覧を取得")
async def get_prefectures():
    """
    都道府県の一覧を取得
    """
    prefectures = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ]
    
    return {
        "prefectures": [
            {"value": pref, "label": pref} for pref in prefectures
        ]
    }


@router.get("/building-uses", summary="建物用途一覧を取得")
async def get_building_uses():
    """
    建物用途の一覧を取得
    """
    building_uses = [
        "一戸建ての住宅", "共同住宅", "長屋", "寄宿舎", "下宿",
        "事務所", "店舗", "工場", "倉庫", "自動車車庫",
        "物品販売業を営む店舗", "飲食店", "図書館", "博物館",
        "病院", "診療所", "学校", "体育館", "劇場", "映画館",
        "その他"
    ]
    
    return {
        "building_uses": [
            {"value": use, "label": use} for use in building_uses
        ]
    }


@router.get("/structures", summary="構造種別一覧を取得")
async def get_structures():
    """
    構造種別の一覧を取得
    """
    structures = [
        "木造", "鉄骨造", "鉄筋コンクリート造", "鉄骨鉄筋コンクリート造",
        "コンクリートブロック造", "れんが造", "石造", "土造", "その他"
    ]
    
    return {
        "structures": [
            {"value": structure, "label": structure} for structure in structures
        ]
    }