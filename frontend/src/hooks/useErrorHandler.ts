import { useCallback } from 'react';
import { useToast } from '../components/Toast';
import { 
  normalizeError, 
  getUserFriendlyMessage, 
  getErrorSeverity,
  logError,
  type AppError 
} from '../utils/errorHandler';

interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}

export const useErrorHandler = () => {
  const { showError, showWarning, showSuccess } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    // 統一されたエラー形式に正規化
    const normalizedError = normalizeError(error);
    
    // 開発環境での詳細ログ
    logError(normalizedError, context);
    
    // ユーザーフレンドリーなメッセージを取得
    const userMessage = getUserFriendlyMessage(normalizedError);
    const severity = getErrorSeverity(normalizedError);

    // 重要度に応じて表示方法を変更
    switch (severity) {
      case 'critical':
      case 'high':
        showError(userMessage);
        break;
      case 'medium':
        showWarning(userMessage);
        break;
      case 'low':
        // 低重要度エラーは表示しない、またはコンソールのみ
        console.info('Low severity error:', userMessage);
        break;
    }

    return normalizedError;
  }, [showError, showWarning, showSuccess]);

  const handleWarning = useCallback((message: string) => {
    showWarning(message);
  }, [showWarning]);

  // 非同期関数をエラーハンドリングでラップ
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, context);
        throw error; // 呼び出し元でも処理できるように再スロー
      }
    };
  }, [handleError]);

  // Promise.catch で使用可能な形式
  const catchHandler = useCallback((context?: string) => {
    return (error: unknown) => {
      handleError(error, context);
      throw error;
    };
  }, [handleError]);

  return {
    handleError,
    handleWarning,
    wrapAsync,
    catchHandler,
    showError,
    showSuccess,
    showWarning
  };
};