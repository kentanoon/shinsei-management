/**
 * Supabaseクライアント設定
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数から設定を取得
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.');
}

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// データベーステーブル名の定数
export const TABLES = {
  PROJECTS: 'projects',
  APPLICATIONS: 'applications',
  APPLICATION_TYPES: 'application_types',
  USERS: 'users'
} as const;