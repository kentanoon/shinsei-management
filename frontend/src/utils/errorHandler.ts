/**
 * 統一エラーハンドリングユーティリティ
 */

import { AxiosError } from 'axios';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  status?: number;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

/**
 * エラーオブジェクトを統一形式に変換
 */
export const normalizeError = (error: unknown): AppError => {
  const timestamp = new Date().toISOString();

  // AxiosError（API エラー）
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    if (axiosError.response) {
      // サーバーからのレスポンスがある場合
      const { status, data } = axiosError.response;
      
      return {
        code: data?.error?.code || `HTTP_${status}`,
        message: data?.error?.message || getHttpErrorMessage(status),
        details: data?.error?.details,
        status,
        timestamp,
      };
    } else if (axiosError.request) {
      // リクエストは送信されたがレスポンスがない場合
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
        timestamp,
      };
    } else {
      // リクエストセットアップエラー
      return {
        code: 'REQUEST_ERROR',
        message: axiosError.message || 'リクエストエラーが発生しました',
        timestamp,
      };
    }
  }

  // JavaScript標準エラー
  if (error instanceof Error) {
    return {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message || '不明なエラーが発生しました',
      timestamp,
    };
  }

  // 文字列エラー
  if (typeof error === 'string') {
    return {
      code: 'STRING_ERROR',
      message: error,
      timestamp,
    };
  }

  // その他のエラー
  return {
    code: 'UNKNOWN_ERROR',
    message: '不明なエラーが発生しました',
    details: { originalError: error },
    timestamp,
  };
};

/**
 * HTTPステータスコードに対応するエラーメッセージを取得
 */
const getHttpErrorMessage = (status: number): string => {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_MESSAGES.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return `HTTPエラー: ${status}`;
  }
};

/**
 * エラーの重要度を判定
 */
export const getErrorSeverity = (error: AppError): 'low' | 'medium' | 'high' | 'critical' => {
  if (error.status) {
    if (error.status >= 500) return 'critical';
    if (error.status >= 400) return 'high';
  }

  switch (error.code) {
    case 'NETWORK_ERROR':
    case 'WEBSOCKET_CONNECTION_FAILED':
      return 'high';
    case 'VALIDATION_ERROR':
    case 'NOT_FOUND':
      return 'medium';
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return 'high';
    default:
      return 'medium';
  }
};

/**
 * ユーザー向けエラーメッセージを生成
 */
export const getUserFriendlyMessage = (error: AppError): string => {
  // 特定のエラーコードに対するカスタムメッセージ
  const customMessages: Record<string, string> = {
    'PROJECT_NOT_FOUND': 'プロジェクトが見つかりません',
    'APPLICATION_NOT_FOUND': '申請が見つかりません',
    'INVALID_PROJECT_CODE': 'プロジェクトコードが無効です',
    'INVALID_STATUS_TRANSITION': 'この状態遷移は実行できません',
    'DUPLICATE_PROJECT_CODE': 'プロジェクトコードが重複しています',
    'FILE_TOO_LARGE': 'ファイルサイズが上限を超えています',
    'INVALID_FILE_TYPE': 'サポートされていないファイル形式です',
  };

  return customMessages[error.code] || error.message;
};

/**
 * 開発者向けの詳細エラー情報を生成
 */
export const getDetailedErrorInfo = (error: AppError): string => {
  const parts = [
    `エラーコード: ${error.code}`,
    `メッセージ: ${error.message}`,
    `発生時刻: ${error.timestamp}`,
  ];

  if (error.status) {
    parts.push(`HTTPステータス: ${error.status}`);
  }

  if (error.details) {
    parts.push(`詳細: ${JSON.stringify(error.details, null, 2)}`);
  }

  return parts.join('\n');
};

/**
 * エラーをコンソールに出力（開発環境のみ）
 */
export const logError = (error: AppError, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '[ERROR]';
    console.group(`${prefix} ${error.code}`);
    console.error('Message:', error.message);
    console.error('Timestamp:', error.timestamp);
    if (error.status) console.error('Status:', error.status);
    if (error.details) console.error('Details:', error.details);
    console.groupEnd();
  }
};

/**
 * エラー報告用のデータを生成
 */
export const createErrorReport = (error: AppError, context?: Record<string, any>) => {
  return {
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      timestamp: error.timestamp,
      details: error.details,
    },
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...context,
    },
  };
};

/**
 * エラーハンドリングのヘルパークラス
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * エラーリスナーを追加
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * エラーリスナーを削除
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * エラーを処理
   */
  handleError(error: unknown, context?: string): AppError {
    const normalizedError = normalizeError(error);
    
    // エラーをログに出力
    logError(normalizedError, context);

    // リスナーに通知
    this.errorListeners.forEach(listener => {
      try {
        listener(normalizedError);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });

    return normalizedError;
  }

  /**
   * 非同期関数をエラーハンドリングでラップ
   */
  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }
}

// デフォルトインスタンスをエクスポート
export const errorHandler = ErrorHandler.getInstance();