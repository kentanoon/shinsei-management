/**
 * プロジェクト関連の定数定義
 */

// プロジェクトステータス
export const PROJECT_STATUSES = [
  '事前相談',
  '受注', 
  '申請作業',
  '審査中',
  '配筋検査待ち',
  '中間検査待ち', 
  '完了検査待ち',
  '完了',
  '失注'
] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number];

// ステータス別の色定義
export const STATUS_COLORS: Record<ProjectStatus, string> = {
  '事前相談': '#6c757d',
  '受注': '#007bff',
  '申請作業': '#fd7e14',
  '審査中': '#ffc107',
  '配筋検査待ち': '#dc3545',
  '中間検査待ち': '#dc3545',
  '完了検査待ち': '#dc3545',
  '完了': '#28a745',
  '失注': '#6c757d'
};

// ステータス別の表示名（必要に応じて）
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  '事前相談': '事前相談',
  '受注': '受注',
  '申請作業': '申請作業中',
  '審査中': '審査中',
  '配筋検査待ち': '配筋検査待ち',
  '中間検査待ち': '中間検査待ち',
  '完了検査待ち': '完了検査待ち',
  '完了': '完了',
  '失注': '失注'
};

// 進行中ステータス
export const IN_PROGRESS_STATUSES: ProjectStatus[] = [
  '申請作業',
  '審査中'
];

// 検査待ちステータス
export const INSPECTION_PENDING_STATUSES: ProjectStatus[] = [
  '配筋検査待ち',
  '中間検査待ち',
  '完了検査待ち'
];

// 完了ステータス
export const COMPLETED_STATUSES: ProjectStatus[] = [
  '完了'
];

// アクティブステータス（失注以外）
export const ACTIVE_STATUSES: ProjectStatus[] = PROJECT_STATUSES.filter(
  status => status !== '失注'
);

// ステータス優先度（低い値ほど高優先度）
export const STATUS_PRIORITY: Record<ProjectStatus, number> = {
  '配筋検査待ち': 1,
  '中間検査待ち': 1,
  '完了検査待ち': 1,
  '審査中': 2,
  '申請作業': 3,
  '受注': 4,
  '事前相談': 5,
  '完了': 6,
  '失注': 7
};

// デフォルト値
export const DEFAULT_PROJECT_STATUS: ProjectStatus = '事前相談';

// バリデーション用ヘルパー
export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  return PROJECT_STATUSES.includes(status as ProjectStatus);
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as ProjectStatus] || STATUS_COLORS[DEFAULT_PROJECT_STATUS];
};

export const isInProgress = (status: string): boolean => {
  return IN_PROGRESS_STATUSES.includes(status as ProjectStatus);
};

export const isInspectionPending = (status: string): boolean => {
  return INSPECTION_PENDING_STATUSES.includes(status as ProjectStatus);
};

export const isCompleted = (status: string): boolean => {
  return COMPLETED_STATUSES.includes(status as ProjectStatus);
};

export const isActive = (status: string): boolean => {
  return ACTIVE_STATUSES.includes(status as ProjectStatus);
};