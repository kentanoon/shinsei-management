/**
 * Supabase直接接続API クライアント
 */

import { supabase } from '../lib/supabase';
import type {
  Project,
  ProjectListResponse,
  ProjectsByStatusResponse,
  ProjectSummaryResponse,
} from '../types/project';

// プロジェクト管理API
export const supabaseProjectApi = {
  /**
   * プロジェクト一覧取得
   */
  getProjects: async (params: {
    skip?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ProjectListResponse> => {
    console.log('🔥 supabaseProjectApi.getProjects called with params:', params);
    const { skip = 0, limit = 20, status } = params;
    
    console.log('🔥 Supabase client URL:', supabase.supabaseUrl);
    console.log('🔥 Building query...');
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        customers(*),
        sites(*),
        buildings(*),
        applications(*)
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    console.log('🔥 Executing Supabase query...');
    const { data: projects, error, count } = await query
      .range(skip, skip + limit - 1);

    console.log('🔥 Supabase response:', { projects, error, count });

    if (error) {
      console.error('🔥 Supabase error:', error);
      throw new Error('データベースエラーが発生しました');
    }

    const result = {
      projects: projects || [],
      total: count || 0,
      skip,
      limit
    };
    
    console.log('🔥 Returning result:', result);
    return result;
  },

  /**
   * プロジェクト詳細取得
   */
  getProject: async (projectId: string): Promise<Project> => {
    // プロジェクトIDが数値の場合とコードの場合を両方サポート
    const isNumeric = !isNaN(Number(projectId));
    
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        customers(*),
        sites(*),
        buildings(*),
        applications(*)
      `)
      .eq(isNumeric ? 'id' : 'project_code', projectId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('プロジェクトが見つかりません');
    }

    return project;
  },

  /**
   * ステータス別プロジェクト取得
   */
  getProjectsByStatus: async (status: string): Promise<ProjectsByStatusResponse> => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('データベースエラーが発生しました');
    }

    return {
      projects: projects || [],
      status,
      count: projects?.length || 0
    };
  },

  /**
   * プロジェクトサマリー取得
   */
  getProjectsSummary: async (): Promise<ProjectSummaryResponse> => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status, created_at');

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('データベースエラーが発生しました');
    }

    // ステータス別カウント
    const statusCounts = projects?.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 今月の新規プロジェクト数
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const newThisMonth = projects?.filter(p => 
      p.created_at.startsWith(thisMonth)
    ).length || 0;

    return {
      status_counts: statusCounts,
      new_this_month: newThisMonth,
      total_projects: projects?.length || 0
    };
  },

  /**
   * プロジェクト作成
   */
  createProject: async (projectData: any): Promise<Project> => {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        project_name: projectData.project_name,
        project_code: `P${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        status: '事前相談',
        input_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('プロジェクトの作成に失敗しました');
    }

    return project;
  }
};

// ヘルスチェック
export const supabaseHealthApi = {
  /**
   * データベース接続チェック
   */
  checkHealth: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);

      if (error) {
        return {
          status: 'error',
          database: 'disconnected',
          error: error.message
        };
      }

      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'error',
        error: (error as Error).message
      };
    }
  }
};