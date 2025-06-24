/**
 * API クライアント
 * バックエンドとSupabaseとの通信を担当
 */

import axios from 'axios';
import { ProjectService, ApplicationTypeService, checkSupabaseConnection } from './database';
import type {
  Project,
  ProjectStatus,
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
  ApplicationUpdateRequest
} from '../types/application';
import { API_CONFIG } from '../constants';

// Axios インスタンスの作成
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // 認証トークンがあれば追加
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // エラーハンドリング
    if (error.response?.status === 401) {
      // 認証エラーの場合、ローカルストレージをクリア
      localStorage.removeItem('auth_token');
      // ログインページにリダイレクト（必要に応じて）
    }
    return Promise.reject(error);
  }
);

// Supabaseが利用可能かチェック
let useSupabase = false; // デフォルトでSupabase無効（環境変数が設定されている場合のみ有効）

// 環境変数が設定されている場合のみSupabase接続をチェック
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const demoMode = process.env.REACT_APP_DEMO_MODE === 'true';

console.log('🔧 API初期化: 環境変数確認');
console.log('- SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'なし');
console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'なし');
console.log('- DEMO_MODE:', demoMode);

if (demoMode) {
  console.log('🎭 デモモードが有効です。モックデータを使用します。');
  useSupabase = false;
} else if (supabaseUrl && supabaseAnonKey) {
  // 初期化時にSupabase接続をチェック
  checkSupabaseConnection().then(isConnected => {
    useSupabase = isConnected;
    if (isConnected) {
      console.log('✅ Supabaseデータベースに接続しました。');
    } else {
      console.warn('⚠️ Supabaseに接続できません。モックデータを使用します。');
    }
  });
} else {
  console.log('📝 Supabase環境変数が設定されていません。モックデータを使用します。');
}

// API 関数群（Supabase対応版）
export const projectApi = {
  /**
   * プロジェクト一覧取得
   */
  getProjects: async (params: {
    skip?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ProjectListResponse> => {
    try {
      console.log('📋 プロジェクト取得開始:', { useSupabase, params });
      if (useSupabase) {
        console.log('🔗 Supabaseからプロジェクトを取得中...');
        // Supabaseを使用
        const result = await ProjectService.getProjects(params);
        if (result.error) {
          throw new Error(result.error);
        }
        console.log('✅ Supabaseプロジェクト取得成功:', result.data?.projects?.length, '件');
        return result.data!;
      } else {
        console.log('🎭 モックデータからプロジェクトを取得中...');
        // モックデータを使用
        const mockProjects: Project[] = [
          {
            id: 1,
            project_code: 'PRJ-SAMPLE-001',
            project_name: 'サンプル住宅A棟新築工事',
            status: '申請作業' as ProjectStatus,
            created_at: '2024-12-01T09:00:00Z',
            updated_at: '2024-12-15T14:30:00Z',
            input_date: '2024-12-01',
            customer: {
              id: 1,
              project_id: 1,
              owner_name: '田中太郎',
              owner_address: '東京都新宿区西新宿1-1-1',
              owner_phone: '03-1234-5678'
            },
            site: {
              id: 1,
              project_id: 1,
              address: '東京都新宿区西新宿1-1-1',
              land_area: 200.5
            },
            building: {
              id: 1,
              project_id: 1,
              structure: '木造',
              floors: '2',
              total_area: 120.8,
              building_area: 100.0
            }
          },
          {
            id: 2,
            project_code: 'PRJ-SAMPLE-002',
            project_name: 'サンプル住宅B棟新築工事',
            status: '審査中' as ProjectStatus,
            created_at: '2024-11-15T10:00:00Z',
            updated_at: '2024-12-10T16:00:00Z',
            input_date: '2024-11-15',
            customer: {
              id: 2,
              project_id: 2,
              owner_name: '佐藤花子',
              owner_address: '大阪府大阪市北区梅田1-1-1',
              owner_phone: '06-5678-9012'
            },
            site: {
              id: 2,
              project_id: 2,
              address: '大阪府大阪市北区梅田1-1-1',
              land_area: 150.0
            },
            building: {
              id: 2,
              project_id: 2,
              structure: '鉄骨造',
              floors: '3',
              total_area: 180.5,
              building_area: 100.0
            }
          }
        ];
        
        // フィルタリング
        let filteredProjects = mockProjects;
        if (params.status) {
          filteredProjects = mockProjects.filter(p => p.status === params.status);
        }
        
        // ページネーション
        const skip = params.skip || 0;
        const limit = params.limit || 1000;
        const paginatedProjects = filteredProjects.slice(skip, skip + limit);
        
        const result = {
          projects: paginatedProjects,
          total: filteredProjects.length
        };
        console.log('✅ モックプロジェクト取得成功:', result.projects.length, '件');
        return result;
      }
    } catch (error) {
      console.error('プロジェクト一覧取得エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクト詳細取得
   */
  getProject: async (projectCode: string): Promise<Project> => {
    try {
      if (useSupabase) {
        const result = await ProjectService.getProject(projectCode);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        // モックデータから検索
        const mockProjects: Project[] = [
          {
            id: 1,
            project_code: 'PRJ-SAMPLE-001',
            project_name: 'サンプル住宅A棟新築工事',
            status: '申請作業' as ProjectStatus,
            created_at: '2024-12-01T09:00:00Z',
            updated_at: '2024-12-15T14:30:00Z',
            input_date: '2024-12-01',
            customer: {
              id: 1,
              project_id: 1,
              owner_name: '田中太郎',
              owner_address: '東京都新宿区西新宿1-1-1',
              owner_phone: '03-1234-5678'
            },
            site: {
              id: 1,
              project_id: 1,
              address: '東京都新宿区西新宿1-1-1',
              land_area: 200.5
            },
            building: {
              id: 1,
              project_id: 1,
              structure: '木造',
              floors: '2',
              total_area: 120.8,
              building_area: 100.0
            }
          }
        ];
        
        const project = mockProjects.find(p => p.project_code === projectCode);
        if (!project) {
          throw new Error('プロジェクトが見つかりません');
        }
        return project;
      }
    } catch (error) {
      console.error('プロジェクト詳細取得エラー:', error);
      throw error;
    }
  },

  /**
   * ステータス別プロジェクト取得
   */
  getProjectsByStatus: async (status: string): Promise<ProjectsByStatusResponse> => {
    try {
      if (useSupabase) {
        const result = await ProjectService.getProjects({ status });
        if (result.error) {
          throw new Error(result.error);
        }
        return {
          projects: result.data!.projects,
          total: result.data!.total,
          status
        };
      } else {
        // モックデータを返す
        return {
          projects: [],
          total: 0,
          status
        };
      }
    } catch (error) {
      console.error('ステータス別プロジェクト取得エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクト作成
   */
  createProject: async (projectData: ProjectCreateRequest): Promise<Project> => {
    try {
      if (useSupabase) {
        const result = await ProjectService.createProject(projectData);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        // モックデータでプロジェクト作成をシミュレート
        const id = Date.now();
        const newProject: Project = {
          id: id,
          project_code: `PRJ-${id}`,
          project_name: projectData.project_name,
          status: (projectData.status || '事前相談') as ProjectStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          input_date: projectData.input_date || new Date().toISOString().split('T')[0],
          customer: projectData.customer ? {
            id: id + 1,
            project_id: id,
            owner_name: projectData.customer.owner_name || '',
            owner_address: projectData.customer.owner_address || '',
            owner_phone: projectData.customer.owner_phone || '',
            ...projectData.customer
          } : undefined,
          site: projectData.site ? {
            id: id + 2,
            project_id: id,
            address: projectData.site.address || '',
            land_area: projectData.site.land_area || 0,
            ...projectData.site
          } : undefined,
          building: projectData.building ? {
            id: id + 3,
            project_id: id,
            structure: projectData.building.structure || '',
            floors: projectData.building.floors || '',
            total_area: projectData.building.total_area || 0,
            building_area: projectData.building.building_area || 0,
            ...projectData.building
          } : undefined,
          financial: projectData.financial ? {
            id: id + 4,
            project_id: id,
            has_permit_application: false,
            has_inspection_schedule: false,
            has_foundation_plan: false,
            has_hardware_plan: false,
            has_invoice: false,
            has_energy_calculation: false,
            has_settlement_data: false,
            ...projectData.financial
          } : undefined,
          schedule: projectData.schedule ? {
            id: id + 5,
            project_id: id,
            has_permit_returned: false,
            has_report_sent: false,
            has_items_confirmed: false,
            ...projectData.schedule
          } : undefined
        };
        
        console.log('モックプロジェクトを作成しました:', newProject);
        return newProject;
      }
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクト更新
   */
  updateProject: async (projectId: number, projectData: ProjectUpdateRequest): Promise<Project> => {
    try {
      if (useSupabase) {
        const result = await ProjectService.updateProject(projectId, projectData);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        // モック更新
        console.log('🎭 モックプロジェクト更新:', projectId, projectData);
        throw new Error('プロジェクト更新機能は準備中です（Supabase対応予定）');
      }
    } catch (error) {
      console.error('プロジェクト更新エラー:', error);
      throw error;
    }
  },

  /**
   * 財務情報更新
   */
  updateFinancial: async (projectId: number, financialData: FinancialUpdateRequest) => {
    try {
      if (useSupabase) {
        const result = await ProjectService.updateProject(projectId, { financial: financialData });
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        console.log('🎭 モック財務情報更新:', projectId, financialData);
        throw new Error('財務情報更新機能は準備中です（Supabase対応予定）');
      }
    } catch (error) {
      console.error('財務情報更新エラー:', error);
      throw error;
    }
  },

  /**
   * スケジュール情報更新
   */
  updateSchedule: async (projectId: number, scheduleData: ScheduleUpdateRequest) => {
    try {
      if (useSupabase) {
        const result = await ProjectService.updateProject(projectId, { schedule: scheduleData });
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        console.log('🎭 モックスケジュール更新:', projectId, scheduleData);
        throw new Error('スケジュール更新機能は準備中です（Supabase対応予定）');
      }
    } catch (error) {
      console.error('スケジュール情報更新エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクト削除
   */
  deleteProject: async (projectId: number): Promise<void> => {
    try {
      if (useSupabase) {
        const result = await ProjectService.deleteProject(projectId);
        if (result.error) {
          throw new Error(result.error);
        }
      } else {
        console.log('🎭 モックプロジェクト削除:', projectId);
        throw new Error('プロジェクト削除機能は準備中です（Supabase対応予定）');
      }
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクト検索
   */
  searchProjects: async (query: string) => {
    try {
      if (useSupabase) {
        const result = await ProjectService.getProjects({ search: query });
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
        console.log('🎭 モックプロジェクト検索:', query);
        return { projects: [], total: 0 };
      }
    } catch (error) {
      console.error('プロジェクト検索エラー:', error);
      throw error;
    }
  },

  /**
   * プロジェクトサマリー取得
   */
  getProjectsSummary: async (): Promise<ProjectSummaryResponse> => {
    try {
      if (useSupabase) {
        // Supabaseからサマリーデータを計算して取得
        const result = await ProjectService.getProjects({ limit: 1000 });
        if (result.error) {
          throw new Error(result.error);
        }
        
        const projects = result.data!.projects;
        const statusCounts: { [key: string]: number } = {};
        
        projects.forEach(project => {
          statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        });

        return {
          total_projects: projects.length,
          by_status: statusCounts,
          active_projects: projects.filter(p => 
            !['完了', '失注'].includes(p.status)
          ).length
        };
      } else {
        // モックサマリーデータを返す
        return {
          total_projects: 2,
          by_status: {
            '申請作業': 1,
            '審査中': 1,
            '完了': 0
          },
          active_projects: 2
        };
      }
    } catch (error) {
      console.error('プロジェクトサマリー取得エラー:', error);
      throw error;
    }
  },
};

// 申請種別API
export const applicationTypeApi = {
  /**
   * 申請種別一覧取得
   */
  getApplicationTypes: async () => {
    try {
      console.log('📝 申請種別取得開始:', { useSupabase });
      if (useSupabase) {
        console.log('🔗 Supabaseから申請種別を取得中...');
        const result = await ApplicationTypeService.getApplicationTypes();
        if (result.error) {
          throw new Error(result.error);
        }
        console.log('✅ Supabase申請種別取得成功:', result.data?.length, '件');
        return result.data!;
      } else {
        console.log('🎭 モックデータから申請種別を取得中...');
        // モックデータを返す
        const mockTypes = [
          { id: 1, name: '通常申請', code: 'NORMAL', category: '確認申請', description: '', typical_duration_days: 5, is_active: true },
          { id: 2, name: '緊急申請', code: 'URGENT', category: '確認申請', description: '', typical_duration_days: 1, is_active: true },
          { id: 3, name: '情報開示請求', code: 'DISCLOSURE', category: 'その他', description: '', typical_duration_days: 14, is_active: true },
        ];
        console.log('✅ モック申請種別取得成功:', mockTypes.length, '件');
        return mockTypes;
      }
    } catch (error) {
      console.error('申請種別取得エラー:', error);
      throw error;
    }
  },
};

// ヘルスチェック
export const healthApi = {
  /**
   * 基本ヘルスチェック
   */
  checkHealth: async () => {
    console.log('💚 ヘルスチェック（モック）');
    return { status: 'ok', timestamp: new Date().toISOString() };
  },

  /**
   * データベース接続チェック
   */
  checkDatabase: async () => {
    console.log('💚 データベースヘルスチェック（モック）');
    return { status: 'ok', database: 'supabase', timestamp: new Date().toISOString() };
  },
};

// 申請管理API
export const applicationApi = {
  /**
   * 申請一覧取得
   */
  getApplications: async (params: {
    project_id?: number;
    status?: string;
  } = {}) => {
    try {
      console.log('📝 申請一覧取得開始:', { useSupabase, params });
      if (useSupabase) {
        console.log('🔗 Supabaseから申請一覧を取得中...');
        // TODO: Supabase申請取得を実装
        console.log('⚠️ Supabase申請取得は未実装、モックデータを返します');
        return { applications: [] };
      } else {
        console.log('🎭 モックデータから申請一覧を取得中...');
        // モックデータを返す
        return { applications: [] };
      }
    } catch (error) {
      console.error('申請一覧取得エラー:', error);
      throw error;
    }
  },

  /**
   * 申請詳細取得
   */
  getApplication: async (applicationId: number) => {
    console.log('📄 申請詳細取得:', applicationId);
    // TODO: Supabase実装
    return { id: applicationId, title: 'モック申請', status: '未定' };
  },

  /**
   * 申請作成
   */
  createApplication: async (applicationData: ApplicationCreateRequest): Promise<EnhancedApplication> => {
    console.log('📝 申請作成:', applicationData);
    // TODO: Supabase実装
    throw new Error('申請作成機能は準備中です（Supabase対応予定）');
  },

  /**
   * 申請更新
   */
  updateApplication: async (applicationId: number, applicationData: ApplicationUpdateRequest): Promise<EnhancedApplication> => {
    console.log('📝 申請更新:', applicationId, applicationData);
    // TODO: Supabase実装
    throw new Error('申請更新機能は準備中です（Supabase対応予定）');
  },

  /**
   * 申請削除
   */
  deleteApplication: async (applicationId: number) => {
    console.log('🗑 申請削除:', applicationId);
    // TODO: Supabase実装
    throw new Error('申請削除機能は準備中です（Supabase対応予定）');
  },

  /**
   * 申請種別一覧取得（applicationTypeApiにリダイレクト）
   */
  getApplicationTypes: async () => {
    console.log('🔀 applicationApi.getApplicationTypes は applicationTypeApi.getApplicationTypes にリダイレクトします');
    return applicationTypeApi.getApplicationTypes();
  },

  /**
   * 申請ステータス更新
   */
  updateApplicationStatus: async (applicationId: number, statusData: { status: string; notes?: string }) => {
    const { data } = await api.put(`/applications/${applicationId}/status`, statusData);
    return data;
  },
};

export default api;