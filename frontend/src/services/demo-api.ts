/**
 * デモ用API クライアント（DB連携なし）
 * 静的データを使用したモックAPI
 */

import type {
  Project,
  ProjectListResponse,
  ProjectsByStatusResponse,
  ProjectSummaryResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  FinancialUpdateRequest,
  ScheduleUpdateRequest,
} from '../types/project';
import type { 
  EnhancedApplication, 
  ApplicationCreateRequest, 
  ApplicationUpdateRequest,
} from '../types/application';

// デモデータ
const DEMO_PROJECTS: Project[] = [
  {
    id: 1,
    code: 'P2024-001',
    name: '東京都港区マンション建設プロジェクト',
    description: '地上15階建て分譲マンション',
    customer_name: '東京建設株式会社',
    status: 'planning',
    priority: 'high',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-06-20T15:30:00Z',
    building_type: 'マンション',
    structure: 'RC造',
    floors_above: 15,
    floors_below: 2,
    site_area: 1200.5,
    building_area: 800.3,
    total_floor_area: 12000.0,
    building_coverage_ratio: 66.7,
    floor_area_ratio: 1000.0,
    location: '東京都港区赤坂1-1-1',
    contact_person: '田中太郎',
    phone: '03-1234-5678',
    email: 'tanaka@tokyo-kensetsu.co.jp',
    estimated_amount: 5000000000,
    contract_amount: 4800000000,
    actual_amount: null,
    start_date: '2024-04-01',
    end_date: '2026-03-31',
    applications: []
  },
  {
    id: 2,
    code: 'P2024-002',
    name: '大阪市中央区オフィスビル建設',
    description: '地上20階建て賃貸オフィスビル',
    customer_name: '関西デベロップメント',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-06-20T14:00:00Z',
    building_type: 'オフィスビル',
    structure: 'S造',
    floors_above: 20,
    floors_below: 3,
    site_area: 2000.0,
    building_area: 1400.0,
    total_floor_area: 28000.0,
    building_coverage_ratio: 70.0,
    floor_area_ratio: 1400.0,
    location: '大阪市中央区本町2-2-2',
    contact_person: '佐藤花子',
    phone: '06-9876-5432',
    email: 'sato@kansai-dev.co.jp',
    estimated_amount: 8000000000,
    contract_amount: 7500000000,
    actual_amount: null,
    start_date: '2024-06-01',
    end_date: '2027-05-31',
    applications: []
  },
  {
    id: 3,
    code: 'P2024-003',
    name: '福岡市博多区商業施設改修',
    description: '既存商業施設の大規模改修工事',
    customer_name: '九州商業開発',
    status: 'completed',
    priority: 'low',
    created_at: '2023-12-01T08:00:00Z',
    updated_at: '2024-05-31T18:00:00Z',
    building_type: '商業施設',
    structure: 'SRC造',
    floors_above: 8,
    floors_below: 2,
    site_area: 1500.0,
    building_area: 1200.0,
    total_floor_area: 9600.0,
    building_coverage_ratio: 80.0,
    floor_area_ratio: 640.0,
    location: '福岡市博多区博多駅前3-3-3',
    contact_person: '鈴木次郎',
    phone: '092-1111-2222',
    email: 'suzuki@kyushu-dev.co.jp',
    estimated_amount: 1200000000,
    contract_amount: 1150000000,
    actual_amount: 1180000000,
    start_date: '2024-01-15',
    end_date: '2024-05-30',
    applications: []
  }
];

const DEMO_APPLICATIONS: EnhancedApplication[] = [
  {
    id: 1,
    project_id: 1,
    type: '確認申請',
    title: '東京都港区マンション確認申請',
    description: '建築確認申請書の提出',
    status: 'submitted',
    priority: 'high',
    due_date: '2024-07-15',
    submitted_date: '2024-06-01',
    created_at: '2024-05-20T09:00:00Z',
    updated_at: '2024-06-20T15:30:00Z',
    assigned_to: '田中建築士',
    estimated_hours: 40,
    actual_hours: null,
    documents: [],
    project: DEMO_PROJECTS[0]
  },
  {
    id: 2,
    project_id: 2,
    type: '性能評価申請',
    title: '大阪オフィスビル性能評価申請',
    description: '住宅性能評価申請書の作成・提出',
    status: 'in_review',
    priority: 'medium',
    due_date: '2024-08-30',
    submitted_date: null,
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-20T14:00:00Z',
    assigned_to: '佐藤設計士',
    estimated_hours: 25,
    actual_hours: null,
    documents: [],
    project: DEMO_PROJECTS[1]
  }
];

// 遅延をシミュレートするヘルパー関数
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// デモAPI実装
export const demoApi = {
  // プロジェクト関連
  async getProjects(): Promise<ProjectListResponse> {
    await delay();
    return {
      projects: DEMO_PROJECTS,
      total: DEMO_PROJECTS.length,
      page: 1,
      size: 20
    };
  },

  async getProject(id: number): Promise<Project> {
    await delay();
    const project = DEMO_PROJECTS.find(p => p.id === id);
    if (!project) throw new Error('プロジェクトが見つかりません');
    return project;
  },

  async getProjectsByStatus(status: string): Promise<ProjectsByStatusResponse> {
    await delay();
    const filteredProjects = DEMO_PROJECTS.filter(p => p.status === status);
    return {
      projects: filteredProjects,
      status,
      count: filteredProjects.length
    };
  },

  async getProjectsSummary(): Promise<ProjectSummaryResponse> {
    await delay();
    const totalProjects = DEMO_PROJECTS.length;
    const statusCounts = DEMO_PROJECTS.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_projects: totalProjects,
      by_status: statusCounts,
      total_value: DEMO_PROJECTS.reduce((sum, p) => sum + (p.contract_amount || 0), 0),
      active_projects: DEMO_PROJECTS.filter(p => p.status === 'in_progress').length
    };
  },

  async createProject(data: ProjectCreateRequest): Promise<Project> {
    await delay();
    const newProject: Project = {
      id: Math.max(...DEMO_PROJECTS.map(p => p.id)) + 1,
      code: `P2024-${String(DEMO_PROJECTS.length + 1).padStart(3, '0')}`,
      ...data,
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      applications: []
    };
    DEMO_PROJECTS.push(newProject);
    return newProject;
  },

  async updateProject(id: number, data: ProjectUpdateRequest): Promise<Project> {
    await delay();
    const index = DEMO_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('プロジェクトが見つかりません');
    
    DEMO_PROJECTS[index] = {
      ...DEMO_PROJECTS[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return DEMO_PROJECTS[index];
  },

  async deleteProject(id: number): Promise<void> {
    await delay();
    const index = DEMO_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('プロジェクトが見つかりません');
    DEMO_PROJECTS.splice(index, 1);
  },

  // 申請関連
  async getApplications(): Promise<EnhancedApplication[]> {
    await delay();
    return DEMO_APPLICATIONS;
  },

  async getApplication(id: number): Promise<EnhancedApplication> {
    await delay();
    const application = DEMO_APPLICATIONS.find(a => a.id === id);
    if (!application) throw new Error('申請が見つかりません');
    return application;
  },

  async createApplication(data: ApplicationCreateRequest): Promise<EnhancedApplication> {
    await delay();
    const project = DEMO_PROJECTS.find(p => p.id === data.project_id);
    if (!project) throw new Error('プロジェクトが見つかりません');

    const newApplication: EnhancedApplication = {
      id: Math.max(...DEMO_APPLICATIONS.map(a => a.id)) + 1,
      ...data,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_date: null,
      actual_hours: null,
      documents: [],
      project
    };
    DEMO_APPLICATIONS.push(newApplication);
    return newApplication;
  },

  async updateApplication(id: number, data: ApplicationUpdateRequest): Promise<EnhancedApplication> {
    await delay();
    const index = DEMO_APPLICATIONS.findIndex(a => a.id === id);
    if (index === -1) throw new Error('申請が見つかりません');
    
    DEMO_APPLICATIONS[index] = {
      ...DEMO_APPLICATIONS[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return DEMO_APPLICATIONS[index];
  },

  // ヘルスチェック
  async health(): Promise<{ status: string }> {
    await delay(100);
    return { status: 'healthy' };
  },

  // ユーティリティ
  async searchCustomers(query: string): Promise<string[]> {
    await delay();
    const customers = ['東京建設株式会社', '関西デベロップメント', '九州商業開発'];
    return customers.filter(c => c.includes(query));
  },

  async validatePostalCode(code: string): Promise<{ valid: boolean; prefecture?: string; city?: string }> {
    await delay();
    // 簡単なバリデーション
    if (code === '100-0001') {
      return { valid: true, prefecture: '東京都', city: '千代田区' };
    }
    return { valid: false };
  }
};

// デモモードかどうかを判定
export const isDemoMode = (): boolean => {
  return process.env.REACT_APP_DEMO_MODE === 'true' || 
         window.location.hostname.includes('github.io');
};