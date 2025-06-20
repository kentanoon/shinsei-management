/**
 * 定数のエクスポートインデックス
 */

// プロジェクト関連
export * from './project';

// 申請関連  
export * from './application';

// API関連
export * from './api';

// 共通的な定数
export const COMMON = {
  // 日付フォーマット
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE_FORMAT: 'YYYY年MM月DD日',
  DISPLAY_DATETIME_FORMAT: 'YYYY年MM月DD日 HH:mm',
  
  // 通貨フォーマット
  CURRENCY_FORMAT: '¥#,##0',
  
  // 電話番号フォーマット
  PHONE_FORMAT: '###-####-####',
  
  // 郵便番号フォーマット
  POSTAL_CODE_FORMAT: '###-####',
  
  // デフォルトページサイズ
  DEFAULT_PAGE_SIZE: 20,
  
  // デバウンス時間（ミリ秒）
  DEBOUNCE_DELAY: 300,
  
  // ローカルストレージキー
  STORAGE_KEYS: {
    DASHBOARD_LAYOUT: 'dashboard-layout',
    DASHBOARD_SETTINGS: 'dashboard-settings',
    USER_PREFERENCES: 'user-preferences',
    THEME: 'theme'
  }
} as const;