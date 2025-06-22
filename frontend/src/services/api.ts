/**
 * API クライアント
 * バックエンドとSupabaseとの通信を担当
 */

import axios from 'axios';
import { ProjectService, checkSupabaseConnection } from './database';
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
let useSupabase = true;

// 初期化時にSupabase接続をチェック
checkSupabaseConnection().then(isConnected => {
  useSupabase = isConnected;
  if (!isConnected) {
    console.warn('Supabaseに接続できません。モックデータを使用します。');
  }
});

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
        // 従来のAPI（モック）を使用
        const queryParams = new URLSearchParams();
        if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params.status) queryParams.append('status', params.status);
        
        const url = `/projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const { data } = await api.get(url);
        return data;
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
        const { data } = await api.get(`/projects/${projectCode}`);
        return data;
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
        const { data } = await api.post('/projects', projectData);
        return data;
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
        const { data } = await api.get('/projects/summary');
        return data;
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