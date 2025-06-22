/**
 * API クライアント
 * バックエンドとSupabaseとの通信を担当
 */

import axios from 'axios';
import { ProjectService, checkSupabaseConnection } from './database';
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

if (supabaseUrl && supabaseAnonKey) {
  // 初期化時にSupabase接続をチェック
  checkSupabaseConnection().then(isConnected => {
    useSupabase = isConnected;
    if (isConnected) {
      console.log('Supabaseデータベースに接続しました。');
    } else {
      console.warn('Supabaseに接続できません。モックデータを使用します。');
    }
  });
} else {
  console.log('Supabase環境変数が設定されていません。モックデータを使用します。');
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
      if (useSupabase) {
        // Supabaseを使用
        const result = await ProjectService.getProjects(params);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data!;
      } else {
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
              total_floor_area: 120.8,
              use: '住宅'
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
              total_floor_area: 180.5,
              use: '住宅'
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
        
        return {
          projects: paginatedProjects,
          total: filteredProjects.length
        };
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
              total_floor_area: 120.8,
              use: '住宅'
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
        const { data } = await api.get(`/projects/status/${status}`);
        return data;
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
            ...projectData.customer
          } : undefined,
          site: projectData.site ? {
            id: id + 2,
            project_id: id,
            ...projectData.site
          } : undefined,
          building: projectData.building ? {
            id: id + 3,
            project_id: id,
            ...projectData.building
          } : undefined,
          financial: projectData.financial ? {
            id: id + 4,
            project_id: id,
            ...projectData.financial
          } : undefined,
          schedule: projectData.schedule ? {
            id: id + 5,
            project_id: id,
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
        const { data } = await api.put(`/projects/${projectId}`, projectData);
        return data;
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
        const { data } = await api.put(`/projects/${projectId}/financial`, financialData);
        return data;
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
        const { data } = await api.put(`/projects/${projectId}/schedule`, scheduleData);
        return data;
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
        await api.delete(`/projects/${projectId}`);
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
        const { data } = await api.get(`/projects/search/${encodeURIComponent(query)}`);
        return data;
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

// ヘルスチェック
export const healthApi = {
  /**
   * 基本ヘルスチェック
   */
  checkHealth: async () => {
    const { data } = await api.get('/health');
    return data;
  },

  /**
   * データベース接続チェック
   */
  checkDatabase: async () => {
    const { data } = await api.get('/health/db');
    return data;
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
    const { data } = await api.get('/applications/', { params });
    return data;
  },

  /**
   * 申請詳細取得
   */
  getApplication: async (applicationId: number) => {
    const { data } = await api.get(`/applications/${applicationId}`);
    return data;
  },

  /**
   * 申請作成
   */
  createApplication: async (applicationData: ApplicationCreateRequest): Promise<EnhancedApplication> => {
    const { data } = await api.post('/applications/', applicationData);
    return data;
  },

  /**
   * 申請更新
   */
  updateApplication: async (applicationId: number, applicationData: ApplicationUpdateRequest): Promise<EnhancedApplication> => {
    const { data } = await api.put(`/applications/${applicationId}`, applicationData);
    return data;
  },

  /**
   * 申請削除
   */
  deleteApplication: async (applicationId: number) => {
    await api.delete(`/applications/${applicationId}`);
  },

  /**
   * 申請種別一覧取得
   */
  getApplicationTypes: async () => {
    const { data } = await api.get('/applications/types/');
    return data;
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