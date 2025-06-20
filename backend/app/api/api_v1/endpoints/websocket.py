"""
WebSocket endpoints for real-time updates
リアルタイム更新のためのWebSocketエンドポイント
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from app.core.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None, description="ユーザーID")
):
    """
    WebSocket接続エンドポイント
    
    リアルタイム更新を受信するためのWebSocket接続を確立します。
    接続後、以下のタイプのメッセージを受信できます：
    - project_update: プロジェクトの作成/更新/削除
    - application_update: 申請の作成/更新/削除  
    - dashboard_refresh: ダッシュボードの更新要求
    - notification: 通知メッセージ
    """
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # クライアントからのメッセージを受信
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_client_message(websocket, message, user_id)
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, websocket)
            except Exception as e:
                logger.error(f"Error handling client message: {e}")
                await manager.send_personal_message({
                    "type": "error", 
                    "message": "Internal server error"
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def handle_client_message(websocket: WebSocket, message: dict, user_id: Optional[str]):
    """
    クライアントからのメッセージを処理
    """
    message_type = message.get("type")
    
    if message_type == "ping":
        # ピング/ポンでの接続確認
        await manager.send_personal_message({
            "type": "pong",
            "timestamp": message.get("timestamp")
        }, websocket)
        
    elif message_type == "subscribe":
        # 特定のイベントタイプの購読
        event_types = message.get("events", [])
        # 購読処理（将来の機能拡張用）
        await manager.send_personal_message({
            "type": "subscription_confirmed",
            "events": event_types
        }, websocket)
        
    elif message_type == "get_stats":
        # 接続統計の要求
        if user_id:  # 認証されたユーザーのみ
            stats = manager.get_connection_stats()
            await manager.send_personal_message({
                "type": "stats",
                "data": stats
            }, websocket)
        else:
            await manager.send_personal_message({
                "type": "error",
                "message": "Authentication required for stats"
            }, websocket)
            
    else:
        await manager.send_personal_message({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }, websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """WebSocket接続統計を取得"""
    return manager.get_connection_stats()