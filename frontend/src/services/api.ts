/**
 * API クライアント
 * バックエンドとの通信を担当
 */

import axios from 'axios';
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

// API 関数群
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
      const queryParams = new URLSearchParams();
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      
      const url = `/projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const { data } = await api.get(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * プロジェクト詳細取得
   */
  getProject: async (projectCode: string): Promise<Project> => {
    const { data } = await api.get(`/projects/${projectCode}`);
    return data;
  },

  /**
   * ステータス別プロジェクト取得
   */
  getProjectsByStatus: async (status: string): Promise<ProjectsByStatusResponse> => {
    const { data } = await api.get(`/projects/status/${status}`);
    return data;
  },

  /**
   * プロジェクト作成
   */
  createProject: async (projectData: ProjectCreateRequest): Promise<Project> => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  /**
   * プロジェクト更新
   */
  updateProject: async (projectId: number, projectData: ProjectUpdateRequest): Promise<Project> => {
    const { data } = await api.put(`/projects/${projectId}`, projectData);
    return data;
  },

  /**
   * 財務情報更新
   */
  updateFinancial: async (projectId: number, financialData: FinancialUpdateRequest) => {
    const { data } = await api.put(`/projects/${projectId}/financial`, financialData);
    return data;
  },

  /**
   * スケジュール情報更新
   */
  updateSchedule: async (projectId: number, scheduleData: ScheduleUpdateRequest) => {
    const { data } = await api.put(`/projects/${projectId}/schedule`, scheduleData);
    return data;
  },

  /**
   * プロジェクト削除
   */
  deleteProject: async (projectId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  /**
   * プロジェクト検索
   */
  searchProjects: async (query: string) => {
    const { data } = await api.get(`/projects/search/${encodeURIComponent(query)}`);
    return data;
  },

  /**
   * プロジェクトサマリー取得
   */
  getProjectsSummary: async (): Promise<ProjectSummaryResponse> => {
    try {
      const { data } = await api.get('/projects/summary');
      return data;
    } catch (error) {
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