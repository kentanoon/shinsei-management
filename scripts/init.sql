-- 申請管理システム データベース初期化スクリプト
-- PostgreSQL用

-- データベースの初期設定
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 基本テーブルが存在しない場合のみ作成

-- プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(20) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT '計画中',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    site_address TEXT,
    building_use VARCHAR(100),
    structure VARCHAR(100),
    floors_above INTEGER,
    floors_below INTEGER,
    total_area DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 申請タイプテーブル
CREATE TABLE IF NOT EXISTS application_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    typical_duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 申請テーブル
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    application_type_id INTEGER REFERENCES application_types(id),
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT '下書き',
    priority VARCHAR(20) DEFAULT 'normal',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_date TIMESTAMP,
    response_deadline TIMESTAMP,
    approved_date TIMESTAMP,
    completed_date TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    applicant VARCHAR(255),
    reviewer VARCHAR(255),
    approver VARCHAR(255),
    notes TEXT,
    internal_notes TEXT,
    rejection_reason TEXT,
    conditions TEXT
);

-- 申請状態履歴テーブル
CREATE TABLE IF NOT EXISTS application_status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    documents_attached TEXT[]
);

-- 監査証跡テーブル
CREATE TABLE IF NOT EXISTS audit_trails (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Google フォームテンプレートテーブル
CREATE TABLE IF NOT EXISTS application_form_templates (
    id SERIAL PRIMARY KEY,
    application_type VARCHAR(100) NOT NULL,
    form_category VARCHAR(100) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    google_form_url TEXT NOT NULL,
    description TEXT,
    required_fields TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- フォーム送信履歴テーブル
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    form_template_id INTEGER REFERENCES application_form_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent', -- sent, opened, submitted, failed
    email_subject VARCHAR(500),
    email_body TEXT,
    response_received_at TIMESTAMP,
    form_response_data JSONB,
    notes TEXT
);

-- 初期データの挿入

-- 申請タイプの初期データ
INSERT INTO application_types (code, name, category, description, typical_duration_days) VALUES
    ('KENTIKU_KAKUNIN', '建築確認申請', '確認申請', '建築基準法に基づく確認申請', 35),
    ('CHOUKI_YUURYOU', '長期優良住宅認定申請', '長期優良住宅', '長期優良住宅の普及の促進に関する法律', 45),
    ('FLAT35', 'フラット35適合証明申請', 'フラット35', '住宅金融支援機構の技術基準適合証明', 21),
    ('BELS', 'BELS評価申請', 'BELS', '建築物省エネルギー性能表示制度', 30),
    ('SHOUENE_TEKIGOU', '省エネ適合性判定', '省エネ適合性判定', '建築物省エネ法に基づく適合性判定', 21),
    ('KOUZOU_TEKIGOU', '構造適合性判定', '構造適合性判定', '建築基準法に基づる構造適合性判定', 35)
ON CONFLICT (code) DO NOTHING;

-- Google フォームテンプレートの初期データ
INSERT INTO application_form_templates (application_type, form_category, form_name, google_form_url, description) VALUES
    ('建築確認申請', '基本情報', '建築確認申請 基本情報フォーム', 'https://forms.gle/example1', '建築確認申請に必要な基本情報を収集'),
    ('建築確認申請', '図面関係', '建築確認申請 図面チェックリスト', 'https://forms.gle/example2', '必要図面の確認と提出状況管理'),
    ('長期優良住宅認定申請', '基本情報', '長期優良住宅 基本情報フォーム', 'https://forms.gle/example3', '長期優良住宅認定に必要な基本情報'),
    ('BELS', '省エネ性能', 'BELS評価 省エネ性能フォーム', 'https://forms.gle/example4', 'BELS評価に必要な省エネ性能データ')
ON CONFLICT DO NOTHING;

-- サンプルプロジェクトデータ
INSERT INTO projects (project_code, project_name, status, customer_name, customer_phone, customer_address, site_address, building_use, structure, floors_above, floors_below, total_area) VALUES
    ('2024001', 'サンプル住宅A', '実行中', '田中太郎', '090-1234-5678', '東京都渋谷区1-1-1', '東京都渋谷区2-2-2', '専用住宅', '木造', 2, 0, 120.50),
    ('2024002', 'サンプルマンションB', '計画中', '佐藤花子', '080-9876-5432', '神奈川県横浜市1-1-1', '神奈川県横浜市3-3-3', '共同住宅', 'RC造', 5, 1, 2500.00)
ON CONFLICT (project_code) DO NOTHING;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trails_table_record ON audit_trails(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_changed_at ON audit_trails(changed_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_project_id ON form_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_sent_at ON form_submissions(sent_at);

-- 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時自動更新のトリガー
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_templates_updated_at ON application_form_templates;
CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON application_form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期化完了ログ
DO $$
BEGIN
    RAISE NOTICE '申請管理システム データベース初期化完了 - %', CURRENT_TIMESTAMP;
END $$;