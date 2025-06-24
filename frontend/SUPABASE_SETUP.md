# Supabaseセットアップガイド

## 概要
このアプリケーションはSupabaseをバックエンドデータベースとして使用します。このガイドでは、Supabaseプロジェクトのセットアップとアプリケーションの設定方法を説明します。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. データベースパスワードを設定（忘れずに記録してください）
4. リージョンを選択（日本の場合は ap-northeast-1 推奨）

## 2. データベースの設定

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `src/sql/create_tables.sql` ファイルの内容をコピー&ペーストして実行
3. テーブルが正常に作成されたことを「Table Editor」で確認

## 3. APIキーの取得

1. Supabaseダッシュボードの「Settings」→「API」を開く
2. 以下の値をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxxxxxxxxxxxxxxxx...`（実際のキーは他の箇所に記載しないこと）

## 4. 環境変数の設定

### ローカル開発環境
`.env.local` ファイルを作成して以下を設定：

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_API_URL=https://your-api-url.com/api/v1
REACT_APP_DEMO_MODE=false
```

### Netlify本番環境
Netlifyダッシュボードの「Site settings」→「Environment variables」で以下を設定：

- `REACT_APP_SUPABASE_URL`: SupabaseのProject URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabaseのanon public key
- `REACT_APP_API_URL`: APIのベースURL
- `REACT_APP_DEMO_MODE`: `false`

## 5. データベース操作の確認

### プロジェクトの作成テスト
アプリケーションで以下をテスト：

1. 新規プロジェクト作成フォームに入力
2. 「作成」ボタンをクリック
3. データがSupabaseの`projects`テーブルに保存されることを確認

### データの確認方法
- Supabaseダッシュボードの「Table Editor」でデータを確認
- 「Database」→「Tables」→「projects」でデータを表示

## 6. セキュリティ設定（本番環境用）

現在は開発用に全てのCRUD操作を許可していますが、本番環境では適切な権限設定が必要です：

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;

-- ユーザー認証ベースのポリシーを作成
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (true);
```

## 7. トラブルシューティング

### 接続エラーの場合
1. 環境変数が正しく設定されているか確認
2. SupabaseのProject URLとAPI Keyが正しいか確認
3. Supabaseプロジェクトが稼働しているか確認

### CORS エラーの場合
1. Supabaseダッシュボードの「Authentication」→「Settings」を確認
2. 「Site URL」にNetlifyのドメインを追加

### RLS（Row Level Security）エラーの場合
1. ポリシーが正しく設定されているか確認
2. 必要に応じてポリシーを更新

## 8. データベーススキーマ

### projects テーブル
- `id`: 主キー
- `project_code`: プロジェクトコード（ユニーク）
- `project_name`: プロジェクト名
- `status`: ステータス
- `customer`: 顧客情報（JSONB）
- `site`: サイト情報（JSONB）
- `building`: 建物情報（JSONB）
- `financial`: 財務情報（JSONB）
- `schedule`: スケジュール情報（JSONB）
- `created_at`, `updated_at`: タイムスタンプ

### applications テーブル
- `id`: 主キー
- `project_id`: プロジェクトID（外部キー）
- `application_type_id`: 申請種別ID（外部キー）
- `status`: ステータス
- `title`: タイトル
- `description`: 説明
- その他の申請関連フィールド

## 9. バックアップとメンテナンス

### 定期バックアップ
- Supabaseは自動バックアップ機能があります
- 重要なデータは定期的に手動エクスポートを推奨

### モニタリング
- Supabaseダッシュボードでデータベースの使用状況を監視
- API使用量とストレージ使用量を定期的に確認

## サポート

問題が発生した場合は：
1. このドキュメントの設定を再確認
2. Supabaseの公式ドキュメントを参照
3. アプリケーションのコンソールログを確認