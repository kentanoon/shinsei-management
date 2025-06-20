import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

// デモモードかどうかを判定
const isDemoMode = (): boolean => {
  return process.env.REACT_APP_DEMO_MODE === 'true' || 
         window.location.hostname.includes('github.io');
};

interface WebSocketMessage {
  type: string;
  action?: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  userId?: string;
  onProjectUpdate?: (data: any, action: string) => void;
  onApplicationUpdate?: (data: any, action: string) => void;
  onDashboardRefresh?: () => void;
  onNotification?: (notification: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    userId,
    onProjectUpdate,
    onApplicationUpdate,
    onDashboardRefresh,
    onNotification,
    onConnectionChange,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      // WebSocket URLを構築
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/api/v1/realtime/ws${userId ? `?user_id=${userId}` : ''}`
        : `ws://127.0.0.1:8000/api/v1/realtime/ws${userId ? `?user_id=${userId}` : ''}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectCount(0);
        onConnectionChange?.(true);

        // ピング開始
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            }));
          }
        }, 30000); // 30秒ごとにピング
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // メッセージタイプに応じて処理
          switch (message.type) {
            case 'project_update':
              if (onProjectUpdate && message.data && message.action) {
                onProjectUpdate(message.data, message.action);
              }
              break;

            case 'application_update':
              if (onApplicationUpdate && message.data && message.action) {
                onApplicationUpdate(message.data, message.action);
              }
              break;

            case 'dashboard_refresh':
              if (onDashboardRefresh) {
                onDashboardRefresh();
              }
              break;

            case 'notification':
              if (onNotification && message.data) {
                onNotification(message.data);
              }
              break;

            case 'connection_status':
              console.log('Connection status:', message.message);
              break;

            case 'pong':
              // ピング応答 - 特に処理不要
              break;

            case 'error':
              console.error('WebSocket error:', message.message);
              setConnectionError(message.message || 'Unknown error');
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        onConnectionChange?.(false);
        
        // ピング停止
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // 自動再接続
        if (reconnectCount < reconnectAttempts && !event.wasClean) {
          const timeout = reconnectInterval * Math.pow(2, reconnectCount); // 指数バックオフ
          console.log(`Reconnecting in ${timeout}ms... (attempt ${reconnectCount + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, timeout);
        } else if (reconnectCount >= reconnectAttempts) {
          setConnectionError('Maximum reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [userId, onProjectUpdate, onApplicationUpdate, onDashboardRefresh, onNotification, onConnectionChange, reconnectAttempts, reconnectInterval, reconnectCount]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User requested disconnection');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    setReconnectCount(0);
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, []);

  const subscribe = useCallback((eventTypes: string[]) => {
    return sendMessage({
      type: 'subscribe',
      data: { events: eventTypes }
    });
  }, [sendMessage]);

  const getStats = useCallback(() => {
    return sendMessage({
      type: 'get_stats'
    });
  }, [sendMessage]);

  // 初期接続（デモモードでは無効）
  useEffect(() => {
    if (!isDemoMode()) {
      connect();
    } else {
      // デモモードでは接続状態をシミュレート
      setIsConnected(false);
      setConnectionError(null);
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    lastMessage,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    getStats,
  };
};