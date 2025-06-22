// 申請管理の型定義

export type ApplicationStatus = 
  | '未定'
  | '申請'
  | '承認'
  | '却下'
  | '完了';

export type ApplicationPriority = 'urgent' | 'high' | 'normal' | 'low';

export type ApplicationCategory = 
  | '確認申請'
  | '長期優良住宅'
  | 'フラット35'
  | 'BELS'
  | '省エネ適合性判定'
  | '構造適合性判定'
  | '建築士事務所登録'
  | 'その他';

export interface ApplicationStatusHistory {
  id: number;
  application_id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: string;
  changed_at: string;
  comment?: string;
  documents_attached?: string[];
}

export interface ApplicationRequirement {
  id: number;
  name: string;
  description: string;
  is_required: boolean;
  template_url?: string;
  order_index: number;
}

export interface ApplicationDocument {
  id: number;
  application_id: number;
  requirement_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  uploaded_by: string;
  uploaded_at: string;
  is_current: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  review_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface ApplicationDeadline {
  id: number;
  application_id: number;
  deadline_type: 'submission' | 'response' | 'review' | 'completion';
  deadline_date: string;
  description: string;
  is_critical: boolean;
  reminder_days: number[];
  is_met: boolean;
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  status: string;
}

export interface ApplicationType {
  id: number;
  code: string;
  name: string;
  category: ApplicationCategory;
  description: string;
  typical_duration_days: number;
  is_active: boolean;
}

export interface EnhancedApplication {
  id: number;
  project_id: number;
  application_type_id: number;
  category: ApplicationCategory;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  
  // 基本情報
  title: string;
  description?: string;
  reference_number?: string;
  
  // 日程管理
  created_at: string;
  updated_at: string;
  submitted_date?: string;
  response_deadline?: string;
  approved_date?: string;
  completed_date?: string;
  
  // 進捗管理
  progress_percentage: number;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  
  // 関係者
  applicant: string;
  reviewer?: string;
  approver?: string;
  
  // 書類・コメント
  notes?: string;
  internal_notes?: string;
  rejection_reason?: string;
  conditions?: string;
  
  // 関連データ
  application_type: ApplicationType;
  project: Project;
  
  // 拡張データ
  status_history: ApplicationStatusHistory[];
  documents: ApplicationDocument[];
  requirements: ApplicationRequirement[];
  deadlines: ApplicationDeadline[];
  
  // 統計・メタデータ
  days_in_current_status: number;
  total_days_elapsed: number;
  risk_level: 'low' | 'medium' | 'high';
  completion_score: number;
}

export interface ApplicationWorkflowAction {
  id: string;
  name: string;
  from_status: ApplicationStatus[];
  to_status: ApplicationStatus;
  required_role?: string;
  requires_comment: boolean;
  requires_documents: boolean;
  auto_deadline_update: boolean;
  notification_recipients: string[];
}

export interface ApplicationFilter {
  status?: ApplicationStatus[];
  category?: ApplicationCategory[];
  priority?: ApplicationPriority[];
  project_id?: number;
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
  my_applications_only?: boolean;
  search_query?: string;
}

export interface ApplicationSummary {
  total_count: number;
  by_status: Record<ApplicationStatus, number>;
  by_category: Record<ApplicationCategory, number>;
  by_priority: Record<ApplicationPriority, number>;
  overdue_count: number;
  urgent_count: number;
  avg_completion_days: number;
  approval_rate: number;
}

export interface ApplicationCreateRequest {
  project_id: number;
  application_type_id: number;
  category: ApplicationCategory;
  priority: ApplicationPriority;
  title: string;
  description?: string;
  response_deadline?: string;
  notes?: string;
}

export interface ApplicationUpdateRequest {
  status?: ApplicationStatus;
  priority?: ApplicationPriority;
  title?: string;
  description?: string;
  response_deadline?: string;
  estimated_completion_date?: string;
  notes?: string;
  internal_notes?: string;
  rejection_reason?: string;
  conditions?: string;
  progress_percentage?: number;
}

export interface ApplicationStatusChangeRequest {
  to_status: ApplicationStatus;
  comment?: string;
  documents?: File[];
  update_deadlines?: boolean;
}