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
 * ApplicationTypeService - 申請種別関連のデータベース操作
 */
export class ApplicationTypeService {
  /**
   * 申請種別一覧を取得
   */
  static async getApplicationTypes(): Promise<DatabaseResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('申請種別取得エラー:', error);
        return {
          data: null,
          error: error.message || '申請種別の取得に失敗しました'
        };
      }

      return {
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('申請種別取得エラー:', err);
      return {
        data: null,
        error: '申請種別の取得中にエラーが発生しました'
      };
    }
  }
}

/**
 * DatabaseAdminService - データベース管理機能
 */
export class DatabaseAdminService {
  /**
   * データベース統計情報を取得
   */
  static async getDatabaseStats(): Promise<DatabaseResponse<any>> {
    try {
      console.log('[STATS] データベース統計情報を取得中...');
      
      // 存在するテーブルを動的に取得してチェック
      const existingTablesResult = await this.getExistingTables();
      const existingTables = existingTablesResult.data || [];
      
      const tables = [];
      for (const tableName of existingTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            tables.push({
              name: tableName,
              rows: count || 0,
              size: `推定: ${Math.max(1, Math.floor((count || 0) / 100))}KB`,
              last_updated: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn(`[WARNING] テーブル '${tableName}' の統計取得に失敗:`, err);
        }
      }

      const totalRows = tables.reduce((sum, table) => sum + table.rows, 0);
      const estimatedTotalSize = Math.max(1, Math.floor(totalRows / 100));

      const stats = {
        tables,
        total_size: `推定: ${estimatedTotalSize}KB`,
        connection_count: 1,
        performance_stats: {
          avg_query_time: '< 100ms',
          slow_queries: 0,
          cache_hit_ratio: '95%'
        }
      };

      console.log('[SUCCESS] データベース統計取得成功:', stats);
      return {
        data: stats,
        error: null
      };
    } catch (err) {
      console.error('[ERROR] データベース統計取得エラー:', err);
      return {
        data: null,
        error: 'データベース統計の取得中にエラーが発生しました'
      };
    }
  }

  /**
   * テーブルデータを取得
   */
  static async getTableData(tableName: string, page = 0, limit = 10): Promise<DatabaseResponse<any>> {
    try {
      console.log(`[LIST] テーブルデータ取得: ${tableName}, page: ${page}, limit: ${limit}`);
      
      const from = page * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, to);

      if (error) {
        console.error('テーブルデータ取得エラー:', error);
        return {
          data: null,
          error: error.message
        };
      }

      // カラム名を取得（最初の行から）
      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      // データを行配列に変換
      const rows = data ? data.map(row => columns.map(col => row[col])) : [];

      const result = {
        columns,
        rows,
        total_count: count || 0
      };

      console.log(`[SUCCESS] テーブルデータ取得成功: ${tableName}, ${rows.length}行`);
      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error('テーブルデータ取得エラー:', err);
      return {
        data: null,
        error: 'テーブルデータの取得中にエラーが発生しました'
      };
    }
  }

  /**
   * 実際に存在するテーブル一覧を取得
   */
  static async getExistingTables(): Promise<DatabaseResponse<string[]>> {
    try {
      const tablesToCheck = ['projects', 'applications', 'application_types'];
      const existingTables: string[] = [];

      for (const table of tablesToCheck) {
        try {
          // テーブルの存在確認（1件だけ取得を試行）
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error) {
            existingTables.push(table);
          } else {
            console.warn(`[WARNING] テーブル '${table}' は存在しません:`, error.message);
          }
        } catch (err) {
          console.warn(`[WARNING] テーブル '${table}' のチェックに失敗:`, err);
        }
      }

      console.log('[SUCCESS] 存在するテーブル:', existingTables);
      return {
        data: existingTables,
        error: null
      };
    } catch (err) {
      console.error('テーブル一覧取得エラー:', err);
      return {
        data: null,
        error: 'テーブル一覧の取得中にエラーが発生しました'
      };
    }
  }

  /**
   * テーブル一覧を取得（静的リスト）
   */
  static getAvailableTables(): string[] {
    return ['projects', 'applications', 'application_types'];
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
        console.error('[ERROR] Supabase APIキーが無効です。環境変数を確認してください。');
      } else {
        console.warn('[WARNING] Supabase接続確認に失敗:', error.message);
      }
      return false;
    }

    console.log('[SUCCESS] Supabase接続確認成功');
    return true;
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch')) {
      console.warn('[WARNING] ネットワークエラー - Supabaseへの接続に失敗');
    } else {
      console.warn('[WARNING] Supabase接続確認エラー:', err);
    }
    return false;
  }
}