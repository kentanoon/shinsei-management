"""
WebSocket Connection Manager for Real-time Updates
リアルタイム更新のためのWebSocket接続管理
"""

import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket接続を管理するクラス"""
    
    def __init__(self):
        # アクティブな接続を格納
        self.active_connections: List[WebSocket] = []
        # 接続ごとの情報を格納（ユーザーID、接続時刻など）
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        """新しいWebSocket接続を受け入れる"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.now(),
            "last_ping": datetime.now()
        }
        
        logger.info(f"WebSocket connection established. User: {user_id}, Total connections: {len(self.active_connections)}")
        
        # 接続確認メッセージを送信
        await self.send_personal_message({
            "type": "connection_status",
            "status": "connected",
            "message": "リアルタイム更新が有効になりました",
            "timestamp": datetime.now().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """WebSocket接続を切断する"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            user_info = self.connection_info.pop(websocket, {})
            logger.info(f"WebSocket connection closed. User: {user_info.get('user_id')}, Remaining connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """特定の接続にメッセージを送信"""
        try:
            await websocket.send_text(json.dumps(message, ensure_ascii=False))
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            # 接続が失効している場合は削除
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """すべての接続にメッセージをブロードキャスト"""
        if not self.active_connections:
            logger.debug("No active connections to broadcast to")
            return
        
        message["timestamp"] = datetime.now().isoformat()
        disconnected_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except WebSocketDisconnect:
                disconnected_connections.append(connection)
            except Exception as e:
                logger.error(f"Failed to broadcast message: {e}")
                disconnected_connections.append(connection)
        
        # 失効した接続を削除
        for connection in disconnected_connections:
            self.disconnect(connection)
        
        logger.info(f"Broadcasted message to {len(self.active_connections)} connections")
    
    async def broadcast_to_user(self, message: Dict[str, Any], user_id: str):
        """特定のユーザーの全接続にメッセージを送信"""
        user_connections = [
            conn for conn, info in self.connection_info.items() 
            if info.get("user_id") == user_id
        ]
        
        for connection in user_connections:
            await self.send_personal_message(message, connection)
    
    async def send_project_update(self, project_data: Dict[str, Any], action: str = "update"):
        """プロジェクト更新通知を送信"""
        message = {
            "type": "project_update",
            "action": action,  # create, update, delete
            "data": project_data
        }
        await self.broadcast(message)
    
    async def send_application_update(self, application_data: Dict[str, Any], action: str = "update"):
        """申請更新通知を送信"""
        message = {
            "type": "application_update", 
            "action": action,
            "data": application_data
        }
        await self.broadcast(message)
    
    async def send_dashboard_refresh(self):
        """ダッシュボードリフレッシュ通知を送信"""
        message = {
            "type": "dashboard_refresh",
            "message": "データが更新されました。ダッシュボードを更新してください。"
        }
        await self.broadcast(message)
    
    async def send_notification(self, notification_data: Dict[str, Any], user_id: str = None):
        """通知を送信"""
        message = {
            "type": "notification",
            "data": notification_data
        }
        
        if user_id:
            await self.broadcast_to_user(message, user_id)
        else:
            await self.broadcast(message)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """接続統計を取得"""
        return {
            "total_connections": len(self.active_connections),
            "connections_by_user": len(set(
                info.get("user_id") for info in self.connection_info.values() 
                if info.get("user_id")
            )),
            "average_connection_time": self._calculate_average_connection_time()
        }
    
    def _calculate_average_connection_time(self) -> float:
        """平均接続時間を計算"""
        if not self.connection_info:
            return 0.0
        
        now = datetime.now()
        total_time = sum(
            (now - info["connected_at"]).total_seconds()
            for info in self.connection_info.values()
        )
        
        return total_time / len(self.connection_info)


# グローバルな接続マネージャーインスタンス
manager = ConnectionManager()