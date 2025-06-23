/**
 * Supabaseデータベースサービス
 */

import { supabase, TABLES } from '../lib/supabase';
import type { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../types/project';

// エラーハンドリング用の型
interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * プロジェクト関連のデータベース操作
 */
export class ProjectService {
  /**
   * プロジェクト一覧を取得
   */
  static async getProjects(options?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<DatabaseResponse<{ projects: Project[]; total: number }>> {
    try {
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('*', { count: 'exact' });

      // フィルタリング
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.search) {
        query = query.or(`project_name.ilike.%${options.search}%,project_code.ilike.%${options.search}%`);
      }

      // ページネーション
      if (options?.skip !== undefined && options?.limit !== undefined) {
        query = query.range(options.skip, options.skip + options.limit - 1);
      }

      // 作成日でソート（新しい順）
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('プロジェクト取得エラー:', error);
        return {
          data: null,
          error: error.message || 'プロジェクトの取得に失敗しました'
        };
      }

      return {
        data: {
          projects: data || [],
          total: count || 0
        },
        error: null
      };
    } catch (err) {
      console.error('プロジェクト取得エラー:', err);
      return {
        data: null,
        error: 'プロジェクトの取得中にエラーが発生しました'
      };
    }
  }

  /**
   * プロジェクト詳細を取得
   */
  static async getProject(projectCode: string): Promise<DatabaseResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('project_code', projectCode)
        .single();

      if (error) {
        console.error('プロジェクト詳細取得エラー:', error);
        return {
          data: null,
          error: error.message || 'プロジェクトが見つかりません'
        };
      }

      return {
        data: data,
        error: null
      };
    } catch (err) {
      console.error('プロジェクト詳細取得エラー:', err);
      return {
        data: null,
        error: 'プロジェクトの取得中にエラーが発生しました'
      };
    }
  }

  /**
   * 新しいプロジェクトを作成
   */
  static async createProject(projectData: ProjectCreateRequest): Promise<DatabaseResponse<Project>> {
    try {
      const now = new Date().toISOString();
      
      // プロジェクトコードを自動生成（簡易版）
      const projectCode = `PRJ-${Date.now()}`;

      const insertData = {
        project_code: projectCode,
        project_name: projectData.project_name,
        status: projectData.status || '事前相談',
        created_at: now,
        updated_at: now,
        // 顧客情報
        customer: projectData.customer || {},
        // サイト情報  
        site: projectData.site || {},
        // 建物情報
        building: projectData.building || {},
        // 財務情報
        financial: projectData.financial || {},
        // スケジュール情報
        schedule: projectData.schedule || {}
      };

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('プロジェクト作成エラー:', error);
        return {
          data: null,
          error: error.message || 'プロジェクトの作成に失敗しました'
        };
      }

      return {
        data: data,
        error: null
      };
    } catch (err) {
      console.error('プロジェクト作成エラー:', err);
      return {
        data: null,
        error: 'プロジェクトの作成中にエラーが発生しました'
      };
    }
  }

  /**
   * プロジェクトを更新
   */
  static async updateProject(id: number, updates: ProjectUpdateRequest): Promise<DatabaseResponse<Project>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('プロジェクト更新エラー:', error);
        return {
          data: null,
          error: error.message || 'プロジェクトの更新に失敗しました'
        };
      }

      return {
        data: data,
        error: null
      };
    } catch (err) {
      console.error('プロジェクト更新エラー:', err);
      return {
        data: null,
        error: 'プロジェクトの更新中にエラーが発生しました'
      };
    }
  }

  /**
   * プロジェクトを削除
   */
  static async deleteProject(id: number): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('プロジェクト削除エラー:', error);
        return {
          data: null,
          error: error.message || 'プロジェクトの削除に失敗しました'
        };
      }

      return {
        data: true,
        error: null
      };
    } catch (err) {
      console.error('プロジェクト削除エラー:', err);
      return {
        data: null,
        error: 'プロジェクトの削除中にエラーが発生しました'
      };
    }
  }
}

/**
 * Supabaseの接続状況を確認
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('id')
      .limit(1);

    if (error) {
      // APIキーエラーの場合は明確にログ出力
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('❌ Supabase APIキーが無効です。環境変数を確認してください。');
      } else {
        console.warn('⚠️ Supabase接続確認に失敗:', error.message);
      }
      return false;
    }

    console.log('✅ Supabase接続確認成功');
    return true;
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch')) {
      console.warn('⚠️ ネットワークエラー - Supabaseへの接続に失敗');
    } else {
      console.warn('⚠️ Supabase接続確認エラー:', err);
    }
    return false;
  }
}