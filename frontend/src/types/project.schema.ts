import { z } from 'zod';

// ProjectCreate.tsx からステータスオプションをインポートするか、ここで定義します
const statusOptions = [
  '事前相談',
  '受注',
  '申請作業',
  '審査中',
  '配筋検査待ち',
  '中間検査待ち',
  '完了検査待ち',
  '完了',
  '失注',
] as const;

export const projectCreateSchema = z.object({
  project_name: z.string().min(1, { message: 'プロジェクト名は必須です' }),
  status: z.enum(statusOptions),
  input_date: z.string().min(1, { message: '日付は必須です' }),
  customer: z.object({
    owner_name: z.string().min(1, { message: '施主名は必須です' }),
    owner_kana: z.string().optional(),
    owner_zip: z.string().optional().refine(val => !val || /^\d{3}-?\d{4}$/.test(val), {
      message: '郵便番号の形式が正しくありません (例: 123-4567)',
    }),
    owner_address: z.string().optional(),
    owner_phone: z.string().optional(),
    joint_name: z.string().optional(),
    joint_kana: z.string().optional(),
    client_name: z.string().optional(),
    client_staff: z.string().optional(),
  }),
  site: z.object({
    address: z.string().min(1, { message: '建設地住所は必須です' }),
    land_area: z.preprocess(
      (a) => (a === '' || a === null || a === undefined ? undefined : a),
      z.coerce.number({ invalid_type_error: '数値を入力してください' }).optional()
    ),
    city_plan: z.string().optional(),
    zoning: z.string().optional(),
    fire_zone: z.string().optional(),
    slope_limit: z.string().optional(),
    setback: z.string().optional(),
    other_buildings: z.string().optional(),
    landslide_alert: z.string().optional(),
    flood_zone: z.string().optional(),
    tsunami_zone: z.string().optional(),
  }),
  building: z.object({
    building_name: z.string().optional(),
    construction_type: z.string().optional(),
    primary_use: z.string().optional(),
    structure: z.string().optional(),
    floors: z.string().optional(),
    max_height: z.preprocess(
      (a) => (a === '' || a === null || a === undefined ? undefined : a),
      z.coerce.number({ invalid_type_error: '数値を入力してください' }).optional()
    ),
    total_area: z.preprocess(
      (a) => (a === '' || a === null || a === undefined ? undefined : a),
      z.coerce.number({ invalid_type_error: '数値を入力してください' }).optional()
    ),
    building_area: z.preprocess(
      (a) => (a === '' || a === null || a === undefined ? undefined : a),
      z.coerce.number({ invalid_type_error: '数値を入力してください' }).optional()
    ),
  }),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

// マルチステップフォームの各ステップに対応するフィールドの型定義
export const stepFields: (keyof ProjectCreateInput | keyof ProjectCreateInput['customer'] | keyof ProjectCreateInput['site'] | keyof ProjectCreateInput['building'])[][] = [
  ['project_name', 'status', 'input_date'], // Step 0
  ['customer'], // Step 1
  ['site'], // Step 2
  ['building'], // Step 3
];
