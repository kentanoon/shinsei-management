/**
 * プロジェクト関連の型定義
 */

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  status: ProjectStatus;
  input_date: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  site?: Site;
  building?: Building;
  applications?: Application[];
  financial?: Financial;
  schedule?: Schedule;
}

export type ProjectStatus = 
  | '事前相談'
  | '受注'
  | '申請作業'
  | '審査中'
  | '配筋検査待ち'
  | '中間検査待ち'
  | '完了検査待ち'
  | '完了'
  | '失注'
  | 'その他';

export interface Customer {
  id: number;
  project_id: number;
  owner_name: string;
  owner_kana?: string;
  owner_zip?: string;
  owner_address?: string;
  owner_phone?: string;
  joint_name?: string;
  joint_kana?: string;
  client_name?: string;
  client_staff?: string;
}

export interface Site {
  id: number;
  project_id: number;
  address: string;
  land_area?: number;
  city_plan?: string;
  zoning?: string;
  fire_zone?: string;
  slope_limit?: string;
  setback?: string;
  other_buildings?: string;
  landslide_alert?: string;
  flood_zone?: string;
  tsunami_zone?: string;
}

export interface Building {
  id: number;
  project_id: number;
  building_name?: string;
  construction_type?: string;
  primary_use?: string;
  structure?: string;
  floors?: string;
  max_height?: number;
  total_area?: number;
  building_area?: number;
}

export interface ApplicationType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Application {
  id: number;
  project_id: number;
  application_type_id: number;
  status: ApplicationStatus;
  submitted_date?: string;
  approved_date?: string;
  notes?: string;
  application_type: ApplicationType;
}

export type ApplicationStatus = '申請' | '未定';

export interface Financial {
  id: number;
  project_id: number;
  contract_price?: number;
  estimate_amount?: number;
  construction_cost?: number;
  tax_rate?: number;
  juchu_note?: string;
  settlement_date?: string;
  settlement_staff?: string;
  settlement_amount?: number;
  payment_terms?: string;
  settlement_note?: string;
  has_permit_application: boolean;
  has_inspection_schedule: boolean;
  has_foundation_plan: boolean;
  has_hardware_plan: boolean;
  has_invoice: boolean;
  has_energy_calculation: boolean;
  has_settlement_data: boolean;
}

export interface Schedule {
  id: number;
  project_id: number;
  reinforcement_scheduled?: string;
  reinforcement_actual?: string;
  interim_scheduled?: string;
  interim_actual?: string;
  completion_scheduled?: string;
  completion_actual?: string;
  inspection_date?: string;
  inspection_result?: string;
  corrections?: string;
  final_report_date?: string;
  completion_note?: string;
  has_permit_returned: boolean;
  has_report_sent: boolean;
  has_items_confirmed: boolean;
  change_memo?: string;
}

// API レスポンス型
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  skip?: number;
  limit?: number;
}

export interface ProjectsByStatusResponse {
  status: string;
  projects: Project[];
  count?: number;
  total?: number;
}

export interface ProjectSummaryResponse {
  status_counts?: Record<string, number>;
  by_status?: Record<string, number>;
  new_this_month?: number;
  total_projects: number;
  active_projects?: number;
}

// API リクエスト型
export interface ProjectCreateRequest {
  project_name: string;
  status?: ProjectStatus;
  input_date?: string;
  customer?: Partial<Omit<Customer, 'id' | 'project_id'>>;
  site?: Partial<Omit<Site, 'id' | 'project_id'>>;
  building?: Partial<Omit<Building, 'id' | 'project_id'>>;
  financial?: Partial<Omit<Financial, 'id' | 'project_id'>>;
  schedule?: Partial<Omit<Schedule, 'id' | 'project_id'>>;
}

export interface ProjectUpdateRequest {
  project_name?: string;
  status?: ProjectStatus;
  input_date?: string;
  customer?: Partial<Omit<Customer, 'id' | 'project_id'>>;
  site?: Partial<Omit<Site, 'id' | 'project_id'>>;
  building?: Partial<Omit<Building, 'id' | 'project_id'>>;
  financial?: Partial<Omit<Financial, 'id' | 'project_id'>>;
  schedule?: Partial<Omit<Schedule, 'id' | 'project_id'>>;
  // その他の動的フィールド用
  metadata?: Record<string, string | number | boolean>;
}

export interface FinancialUpdateRequest {
  contract_price?: number;
  estimate_amount?: number;
  construction_cost?: number;
  tax_rate?: number;
  settlement_date?: string;
  settlement_staff?: string;
  settlement_amount?: number;
  payment_terms?: string;
  juchu_note?: string;
  settlement_note?: string;
  has_permit_application?: boolean;
  has_inspection_schedule?: boolean;
  has_foundation_plan?: boolean;
  has_hardware_plan?: boolean;
  has_invoice?: boolean;
  has_energy_calculation?: boolean;
  has_settlement_data?: boolean;
}

export interface ScheduleUpdateRequest {
  reinforcement_scheduled?: string;
  reinforcement_actual?: string;
  interim_scheduled?: string;
  interim_actual?: string;
  completion_scheduled?: string;
  completion_actual?: string;
  inspection_date?: string;
  inspection_result?: string;
  corrections?: string;
  final_report_date?: string;
  completion_note?: string;
  has_permit_returned?: boolean;
  has_report_sent?: boolean;
  has_items_confirmed?: boolean;
  change_memo?: string;
}