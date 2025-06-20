/**
 * API関連の定数定義
 */

// API基本設定
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1',
  WEBSOCKET_URL: process.env.NODE_ENV === 'production' 
    ? `wss://${window.location.host}/api/v1/realtime/ws`
    : 'ws://127.0.0.1:8000/api/v1/realtime/ws',
  TIMEOUT: 10000, // 10秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1秒
} as const;

// HTTPステータスコード
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// APIエンドポイント
export const API_ENDPOINTS = {
  // プロジェクト関連
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: number) => `/projects/${id}`,
  PROJECT_BY_CODE: (code: string) => `/projects/${code}`,
  PROJECTS_SUMMARY: '/projects/summary',
  PROJECTS_BY_STATUS: (status: string) => `/projects/status/${status}`,
  
  // 申請関連
  APPLICATIONS: '/applications',
  APPLICATION_BY_ID: (id: number) => `/applications/${id}`,
  APPLICATIONS_SUMMARY: '/applications/summary',
  APPLICATION_SUBMIT: (id: number) => `/applications/${id}/submit`,
  APPLICATION_APPROVE: (id: number) => `/applications/${id}/approve`,
  APPLICATION_REJECT: (id: number) => `/applications/${id}/reject`,
  APPLICATION_WITHDRAW: (id: number) => `/applications/${id}/withdraw`,
  APPLICATION_AUDIT_TRAIL: (id: number) => `/applications/${id}/audit-trail`,
  
  // ユーティリティ
  POSTAL_CODE: (code: string) => `/utils/postal-code/${code}`,
  POSTAL_CODE_VALIDATE: (code: string) => `/utils/postal-code/validate/${code}`,
  CUSTOMERS_SEARCH: '/utils/customers/search',
  PREFECTURES: '/utils/prefectures',
  BUILDING_USES: '/utils/building-uses',
  STRUCTURES: '/utils/structures',
  
  // リアルタイム通信
  WEBSOCKET: '/realtime/ws',
  WEBSOCKET_STATS: '/realtime/ws/stats',
  
  // ヘルス関連
  HEALTH: '/health'
} as const;

// WebSocketメッセージタイプ
export const WEBSOCKET_MESSAGE_TYPES = {
  // クライアント→サーバー
  PING: 'ping',
  SUBSCRIBE: 'subscribe',
  GET_STATS: 'get_stats',
  
  // サーバー→クライアント
  PONG: 'pong',
  CONNECTION_STATUS: 'connection_status',
  PROJECT_UPDATE: 'project_update',
  APPLICATION_UPDATE: 'application_update',
  DASHBOARD_REFRESH: 'dashboard_refresh',
  NOTIFICATION: 'notification',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  STATS: 'stats',
  ERROR: 'error'
} as const;

// WebSocketアクション
export const WEBSOCKET_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
} as const;

// ページネーション設定
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

// ファイルアップロード設定
export const FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  CHUNK_SIZE: 1024 * 1024 // 1MB
} as const;

// キャッシュ設定
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5分
  CACHE_TIME: 10 * 60 * 1000, // 10分
  RETRY_DELAY: 1000,
  BACKGROUND_REFETCH: true
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  UNAUTHORIZED: '認証が必要です',
  FORBIDDEN: 'アクセス権限がありません',
  NOT_FOUND: 'リソースが見つかりません',
  VALIDATION_ERROR: '入力内容に誤りがあります',
  TIMEOUT: 'タイムアウトしました',
  WEBSOCKET_CONNECTION_FAILED: 'リアルタイム接続に失敗しました',
  FILE_TOO_LARGE: 'ファイルサイズが上限を超えています',
  INVALID_FILE_TYPE: 'サポートされていないファイル形式です'
} as const;