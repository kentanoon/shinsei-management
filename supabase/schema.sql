-- 申請管理システム データベーススキーマ
-- Supabase PostgreSQL用

-- プロジェクトテーブル
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT '事前相談',
    input_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 顧客情報テーブル
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    owner_name VARCHAR(100) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    client_staff VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 敷地情報テーブル
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    area_sqm DECIMAL(10,2),
    zoning VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建物情報テーブル
CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    building_type VARCHAR(50) NOT NULL,
    structure VARCHAR(50) NOT NULL,
    floors_above INTEGER DEFAULT 1,
    floors_below INTEGER DEFAULT 0,
    total_area_sqm DECIMAL(10,2),
    height_m DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請種別テーブル
CREATE TABLE application_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請テーブル
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    application_type_id BIGINT REFERENCES application_types(id),
    status VARCHAR(50) DEFAULT '未定',
    submitted_date DATE,
    approved_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_input_date ON projects(input_date);
CREATE INDEX idx_customers_project_id ON customers(project_id);
CREATE INDEX idx_sites_project_id ON sites(project_id);
CREATE INDEX idx_buildings_project_id ON buildings(project_id);
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_status ON applications(status);

-- RLS (Row Level Security) 設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（認証済みユーザーのみアクセス可能）
CREATE POLICY "Enable read access for authenticated users" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- 他のテーブルにも同様のポリシーを適用
CREATE POLICY "Enable all access for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON sites FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON buildings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON application_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON applications FOR ALL USING (auth.role() = 'authenticated');

-- 初期データ投入
INSERT INTO application_types (name, description) VALUES
    ('確認申請', '建築確認申請書の提出'),
    ('性能評価申請', '住宅性能評価申請書の作成・提出'),
    ('構造計算適合性判定', '構造計算書の適合性判定申請'),
    ('工事完了検査', '工事完了検査申請'),
    ('中間検査', '中間検査申請'),
    ('配筋検査', '配筋検査申請');

-- サンプルデータ投入（開発用）
INSERT INTO projects (project_code, project_name, status, input_date) VALUES
    ('P2024-001', '東京都港区マンション建設プロジェクト', '事前相談', '2024-01-15'),
    ('P2024-002', '大阪市中央区オフィスビル建設', '申請作業', '2024-02-01'),
    ('P2024-003', '福岡市博多区商業施設改修', '完了', '2023-12-01');

-- 顧客情報サンプル
INSERT INTO customers (project_id, owner_name, client_name, client_staff) VALUES
    (1, '東京建設株式会社', '東京建設株式会社', '田中太郎'),
    (2, '関西デベロップメント', '関西デベロップメント', '佐藤花子'),
    (3, '九州商業開発', '九州商業開発', '鈴木次郎');

-- 敷地情報サンプル
INSERT INTO sites (project_id, address) VALUES
    (1, '東京都港区赤坂1-1-1'),
    (2, '大阪市中央区本町2-2-2'),
    (3, '福岡市博多区博多駅前3-3-3');

-- 建物情報サンプル
INSERT INTO buildings (project_id, building_type, structure, floors_above, floors_below) VALUES
    (1, 'マンション', 'RC造', 15, 2),
    (2, 'オフィスビル', 'S造', 20, 3),
    (3, '商業施設', 'SRC造', 8, 2);