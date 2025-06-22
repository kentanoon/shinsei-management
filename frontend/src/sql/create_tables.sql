-- 申請管理システム用のテーブル作成スクリプト
-- Supabaseコンソールのクエリエディタで実行してください

-- プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT '事前相談',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 顧客情報（JSONB形式）
    customer JSONB DEFAULT '{}',
    
    -- サイト情報（JSONB形式）
    site JSONB DEFAULT '{}',
    
    -- 建物情報（JSONB形式）
    building JSONB DEFAULT '{}',
    
    -- 財務情報（JSONB形式）
    financial JSONB DEFAULT '{}',
    
    -- スケジュール情報（JSONB形式）
    schedule JSONB DEFAULT '{}'
);

-- 申請種別マスタ
CREATE TABLE IF NOT EXISTS application_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    typical_duration_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請テーブル
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    application_type_id INTEGER REFERENCES application_types(id),
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT '未定',
    priority VARCHAR(20) DEFAULT 'normal',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_date TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion_date TIMESTAMPTZ,
    applicant VARCHAR(255),
    reviewer VARCHAR(255),
    notes TEXT
);

-- ユーザーテーブル（基本的な情報のみ）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);

CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_category ON applications(category);

-- プロジェクトのupdated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_types_updated_at BEFORE UPDATE ON application_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) の設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーに対してCRUD操作を許可（開発用の設定）
-- 本番環境では適切な権限設定に変更してください
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on applications" ON applications FOR ALL USING (true);
CREATE POLICY "Allow all operations on application_types" ON application_types FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- サンプルデータの挿入
INSERT INTO application_types (code, name, category, description, typical_duration_days) VALUES
('KAKUNIN', '確認申請', '確認申請', '建築確認申請', 35),
('CHOUKI', '長期優良住宅', '長期優良住宅', '長期優良住宅認定申請', 45),
('FLAT35', 'フラット35', 'フラット35', 'フラット35適合証明申請', 21),
('BELS', 'BELS', 'BELS', 'BELS評価申請', 14),
('SHOUENE', '省エネ適合性判定', '省エネ適合性判定', '省エネ基準適合性判定', 21)
ON CONFLICT (code) DO NOTHING;

-- サンプルプロジェクトの挿入
INSERT INTO projects (
    project_code, 
    project_name, 
    status,
    customer,
    site,
    building,
    financial,
    schedule
) VALUES 
(
    'PRJ-SAMPLE-001',
    'サンプル住宅A棟新築工事',
    '申請作業',
    '{"name": "田中建設株式会社", "contact_person": "田中太郎", "phone": "03-1234-5678", "email": "tanaka@example.com"}',
    '{"address": "東京都新宿区西新宿1-1-1", "land_area": 200.5, "building_coverage_ratio": 60}',
    '{"structure": "木造", "floors": 2, "total_floor_area": 120.8, "use": "住宅"}',
    '{"estimated_amount": 25000000, "contract_amount": null, "payment_schedule": []}',
    '{"start_date": "2024-01-15", "completion_date": "2024-06-30", "reinforcement_scheduled": "2024-03-15"}'
)
ON CONFLICT (project_code) DO NOTHING;