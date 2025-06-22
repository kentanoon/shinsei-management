/**
 * 申請関連の定数定義
 */

// 申請ステータス
export const APPLICATION_STATUSES = [
  '未定',
  '申請',
  '承認',
  '却下',
  '完了'
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

// 申請優先度
export const APPLICATION_PRIORITIES = [
  'urgent',
  'high', 
  'normal',
  'low'
] as const;

export type ApplicationPriority = typeof APPLICATION_PRIORITIES[number];

// 申請カテゴリ
export const APPLICATION_CATEGORIES = [
  '確認申請',
  '長期優良住宅',
  'フラット35',
  'BELS',
  '省エネ適合性判定',
  '構造適合性判定',
  '建築士事務所登録',
  'その他'
] as const;

export type ApplicationCategory = typeof APPLICATION_CATEGORIES[number];

// ステータス別の色定義
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  '未定': '#6c757d',
  '申請': '#ffc107',
  '承認': '#28a745',
  '却下': '#dc3545',
  '完了': '#17a2b8'
};

// 優先度別の色定義
export const PRIORITY_COLORS: Record<ApplicationPriority, string> = {
  'urgent': '#dc3545',
  'high': '#fd7e14',
  'normal': '#28a745',
  'low': '#6c757d'
};

// カテゴリ別の色定義
export const CATEGORY_COLORS: Record<ApplicationCategory, string> = {
  '確認申請': '#007bff',
  '長期優良住宅': '#28a745',
  'フラット35': '#17a2b8',
  'BELS': '#ffc107',
  '省エネ適合性判定': '#fd7e14',
  '構造適合性判定': '#e83e8c',
  '建築士事務所登録': '#6f42c1',
  'その他': '#6c757d'
};

// 優先度表示名
export const PRIORITY_LABELS: Record<ApplicationPriority, string> = {
  'urgent': '緊急',
  'high': '高',
  'normal': '普通',
  'low': '低'
};

// ワークフロー状態遷移可能マップ
export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  '未定': ['申請'],
  '申請': ['承認', '却下'],
  '承認': ['完了'],
  '却下': ['申請'],
  '完了': []
};

// アクティブステータス
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  '未定',
  '申請',
  '承認',
  '却下'
];

// 完了ステータス
export const FINISHED_APPLICATION_STATUSES: ApplicationStatus[] = [
  '完了'
];

// デフォルト値
export const DEFAULT_APPLICATION_STATUS: ApplicationStatus = '未定';
export const DEFAULT_APPLICATION_PRIORITY: ApplicationPriority = 'normal';

// バリデーション用ヘルパー
export const isValidApplicationStatus = (status: string): status is ApplicationStatus => {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus);
};

export const isValidApplicationPriority = (priority: string): priority is ApplicationPriority => {
  return APPLICATION_PRIORITIES.includes(priority as ApplicationPriority);
};

export const isValidApplicationCategory = (category: string): category is ApplicationCategory => {
  return APPLICATION_CATEGORIES.includes(category as ApplicationCategory);
};

export const canTransitionTo = (fromStatus: ApplicationStatus, toStatus: ApplicationStatus): boolean => {
  return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

export const getApplicationStatusColor = (status: string): string => {
  return APPLICATION_STATUS_COLORS[status as ApplicationStatus] || APPLICATION_STATUS_COLORS[DEFAULT_APPLICATION_STATUS];
};

export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as ApplicationPriority] || PRIORITY_COLORS[DEFAULT_APPLICATION_PRIORITY];
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category as ApplicationCategory] || CATEGORY_COLORS['その他'];
};

export const isActiveApplication = (status: string): boolean => {
  return ACTIVE_APPLICATION_STATUSES.includes(status as ApplicationStatus);
};

export const isFinishedApplication = (status: string): boolean => {
  return FINISHED_APPLICATION_STATUSES.includes(status as ApplicationStatus);
};