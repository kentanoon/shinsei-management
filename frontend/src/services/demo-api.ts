/**
 * デモ用API クライアント（DB連携なし）
 * 静的データを使用したモックAPI
 */

// 型定義は必要に応じてインポート

// デモデータ用の型定義
interface DemoProject {
  id: number;
  project_code: string;
  project_name: string;
  status: '事前相談' | '受注' | '申請作業' | '審査中' | '配筋検査待ち' | '中間検査待ち' | '完了検査待ち' | '完了' | '失注' | 'その他';
  input_date: string;
  created_at: string;
  updated_at: string;
  customer?: any;
  site?: any;
  building?: any;
  applications?: any[];
  financial?: any;
  schedule?: any;
}

// デモデータ
const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 1,
    project_code: 'P2024-001',
    project_name: '東京都港区マンション建設プロジェクト',
    status: '事前相談',
    input_date: '2024-01-15',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-06-20T15:30:00Z',
    customer: {
      id: 1,
      project_id: 1,
      owner_name: '東京建設株式会社',
      client_name: '東京建設株式会社',
      client_staff: '田中太郎'
    },
    site: {
      id: 1,
      project_id: 1,
      address: '東京都港区赤坂1-1-1'
    },
    building: {
      id: 1,
      project_id: 1,
      building_type: 'マンション',
      structure: 'RC造',
      floors_above: 15,
      floors_below: 2
    },
    applications: []
  },
  {
    id: 2,
    project_code: 'P2024-002',
    project_name: '大阪市中央区オフィスビル建設',
    status: '申請作業',
    input_date: '2024-02-01',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-06-20T14:00:00Z',
    customer: {
      id: 2,
      project_id: 2,
      owner_name: '関西デベロップメント',
      client_name: '関西デベロップメント',
      client_staff: '佐藤花子'
    },
    site: {
      id: 2,
      project_id: 2,
      address: '大阪市中央区本町2-2-2'
    },
    building: {
      id: 2,
      project_id: 2,
      building_type: 'オフィスビル',
      structure: 'S造',
      floors_above: 20,
      floors_below: 3
    },
    applications: []
  },
  {
    id: 3,
    project_code: 'P2024-003',
    project_name: '福岡市博多区商業施設改修',
    status: '完了',
    input_date: '2023-12-01',
    created_at: '2023-12-01T08:00:00Z',
    updated_at: '2024-05-31T18:00:00Z',
    customer: {
      id: 3,
      project_id: 3,
      owner_name: '九州商業開発',
      client_name: '九州商業開発',
      client_staff: '鈴木次郎'
    },
    site: {
      id: 3,
      project_id: 3,
      address: '福岡市博多区博多駅前3-3-3'
    },
    building: {
      id: 3,
      project_id: 3,
      building_type: '商業施設',
      structure: 'SRC造',
      floors_above: 8,
      floors_below: 2
    },
    applications: []
  }
];

const DEMO_APPLICATIONS: any[] = [
  {
    id: 1,
    project_id: 1,
    application_type_id: 1,
    status: '申請',
    submitted_date: '2024-06-01',
    approved_date: null,
    notes: '東京都港区マンション確認申請',
    application_type: {
      id: 1,
      name: '確認申請',
      description: '建築確認申請書の提出',
      is_active: true
    }
  },
  {
    id: 2,
    project_id: 2,
    application_type_id: 2,
    status: '未定',
    submitted_date: null,
    approved_date: null,
    notes: '大阪オフィスビル性能評価申請',
    application_type: {
      id: 2,
      name: '性能評価申請',
      description: '住宅性能評価申請書の作成・提出',
      is_active: true
    }
  }
];

// 遅延をシミュレートするヘルパー関数
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// デモAPI実装
export const demoApi = {
  // プロジェクト関連
  async getProjects(): Promise<{ projects: any[], total: number, skip: number, limit: number }> {
    await delay();
    return {
      projects: DEMO_PROJECTS as any[],
      total: DEMO_PROJECTS.length,
      skip: 0,
      limit: 20
    };
  },

  async getProject(id: number): Promise<any> {
    await delay();
    const project = DEMO_PROJECTS.find(p => p.id === id);
    if (!project) throw new Error('プロジェクトが見つかりません');
    return project as any;
  },

  async getProjectsByStatus(status: string): Promise<any> {
    await delay();
    const filteredProjects = DEMO_PROJECTS.filter(p => p.status === status);
    return {
      projects: filteredProjects as any[],
      status,
      count: filteredProjects.length
    };
  },

  async getProjectsSummary(): Promise<any> {
    await delay();
    const totalProjects = DEMO_PROJECTS.length;
    const statusCounts = DEMO_PROJECTS.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      status_counts: statusCounts,
      new_this_month: 2,
      total_projects: totalProjects
    };
  },

  async createProject(data: any): Promise<any> {
    await delay();
    const newProject = {
      id: Math.max(...DEMO_PROJECTS.map(p => p.id)) + 1,
      project_code: `P2024-${String(DEMO_PROJECTS.length + 1).padStart(3, '0')}`,
      project_name: data.project_name || 'New Project',
      status: '事前相談' as const,
      input_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      applications: []
    };
    DEMO_PROJECTS.push(newProject);
    return newProject;
  },

  async updateProject(id: number, data: any): Promise<any> {
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
  async getApplications(): Promise<any[]> {
    await delay();
    return DEMO_APPLICATIONS as any[];
  },

  async getApplication(id: number): Promise<any> {
    await delay();
    const application = DEMO_APPLICATIONS.find(a => a.id === id);
    if (!application) throw new Error('申請が見つかりません');
    return application as any;
  },

  async createApplication(data: any): Promise<any> {
    await delay();
    const newApplication = {
      id: Math.max(...DEMO_APPLICATIONS.map(a => a.id)) + 1,
      ...data,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    DEMO_APPLICATIONS.push(newApplication as any);
    return newApplication;
  },

  async updateApplication(id: number, data: any): Promise<any> {
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
  // 環境変数で明示的にデモモードが設定されている場合のみデモモード
  return process.env.REACT_APP_DEMO_MODE === 'true';
};