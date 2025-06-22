/**
 * ステータス関連のユーティリティ関数
 */

import { APPLICATION_STATUSES, PROJECT_STATUSES } from '../constants';

export type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/**
 * プロジェクトステータスに基づく色を取得
 */
export const getProjectStatusColor = (status: string): StatusColor => {
  switch (status) {
    case '事前相談':
      return 'info';
    case '受注':
      return 'primary';
    case '申請作業':
      return 'warning';
    case '審査中':
    case '配筋検査待ち':
    case '中間検査待ち':
    case '完了検査待ち':
      return 'secondary';
    case '完了':
      return 'success';
    case '失注':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * 申請ステータスに基づく色を取得
 */
export const getApplicationStatusColor = (status: string): StatusColor => {
  switch (status) {
    case '未定':
      return 'default';
    case '申請':
      return 'warning';
    case '承認':
      return 'success';
    case '却下':
      return 'error';
    case '完了':
      return 'success';
    default:
      return 'default';
  }
};

/**
 * 汎用ステータス色取得（後方互換性のため）
 */
export const getStatusColor = (status: string): StatusColor => {
  // プロジェクトステータスかチェック
  if (PROJECT_STATUSES.includes(status as any)) {
    return getProjectStatusColor(status);
  }
  
  // 申請ステータスかチェック
  if (APPLICATION_STATUSES.includes(status as any)) {
    return getApplicationStatusColor(status);
  }

  // テンプレートステータス用
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * ステータスラベルの日本語変換
 */
export const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    // テンプレートステータス
    'active': '有効',
    'draft': '下書き',
    'archived': 'アーカイブ',
    
    // プロジェクト・申請ステータスはそのまま
    ...Object.fromEntries(
      [...PROJECT_STATUSES, ...APPLICATION_STATUSES].map(s => [s, s])
    ),
  };

  return statusLabels[status] || status;
};