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
import { demoApi, isDemoMode } from './demo-api';
import { supabaseProjectApi, supabaseHealthApi } from './supabase-api';

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
    // 本番環境では強制的にSupabaseを使用
    console.log('🔧 API call: getProjects - PRODUCTION MODE FORCED');
    console.log('🔧 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname,
      REACT_APP_DEMO_MODE: process.env.REACT_APP_DEMO_MODE,
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT_SET'
    });
    
    try {
      console.log('🔧 Calling supabaseProjectApi.getProjects...');
      const result = await supabaseProjectApi.getProjects(params);
      console.log('🔧 Supabase result:', result);
      return result;
    } catch (error) {
      console.error('🔧 Supabase connection failed:', error);
      console.error('🔧 Error details:', error);
      throw error; // エラーをそのまま投げる
    }
  },

  /**
   * プロジェクト詳細取得
   */
  getProject: async (projectCode: string): Promise<Project> => {
    if (isDemoMode()) {
      const id = parseInt(projectCode) || 1;
      return demoApi.getProject(id);
    }
    try {
      return await supabaseProjectApi.getProject(projectCode);
    } catch (error) {
      console.warn('Supabase connection failed, falling back to demo mode');
      const id = parseInt(projectCode) || 1;
      return demoApi.getProject(id);
    }
  },

  /**
   * ステータス別プロジェクト取得
   */
  getProjectsByStatus: async (status: string): Promise<ProjectsByStatusResponse> => {
    if (isDemoMode()) {
      return demoApi.getProjectsByStatus(status);
    }
    try {
      return await supabaseProjectApi.getProjectsByStatus(status);
    } catch (error) {
      console.warn('Supabase connection failed, falling back to demo mode');
      return demoApi.getProjectsByStatus(status);
    }
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
    // 本番環境では強制的にSupabaseを使用
    console.log('API call: getProjectsSummary - using Supabase directly');
    try {
      return await supabaseProjectApi.getProjectsSummary();
    } catch (error) {
      console.error('Supabase connection failed:', error);
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
    if (isDemoMode()) {
      return demoApi.health();
    }
    try {
      return await supabaseHealthApi.checkHealth();
    } catch (error) {
      console.warn('Supabase health check failed, falling back to demo mode');
      return demoApi.health();
    }
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
    if (isDemoMode()) {
      return demoApi.getApplications();
    }
    const { data } = await api.get('/applications/', { params });
    return data;
  },

  /**
   * 申請詳細取得
   */
  getApplication: async (applicationId: number) => {
    if (isDemoMode()) {
      return demoApi.getApplication(applicationId);
    }
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
  updateApplicationStatus: async (applicationId: number, statusData: any) => {
    const { data } = await api.put(`/applications/${applicationId}/status`, statusData);
    return data;
  },
};

export default api;