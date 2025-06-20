import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("DB_PATH")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 追加すべきカラム一覧（既に存在するものを除く）
new_columns = [
    ("construction_cost", "TEXT"),
    ("estimate_amount", "TEXT"),
    ("juchu_note", "TEXT"),
    ("kessai_date", "TEXT"),
    ("kessai_staff", "TEXT"),
    ("kessai_amount", "TEXT"),
    ("kessai_terms", "TEXT"),
    ("kessai_note", "TEXT"),
    ("has_kofu", "INTEGER"),
    ("has_yoteihyo", "INTEGER"),
    ("has_fukuzu", "INTEGER"),
    ("has_kanamono", "INTEGER"),
    ("has_seikyu", "INTEGER"),
    ("has_shoene", "INTEGER"),
    ("has_kessai_data", "INTEGER"),
    ("haikin_yotei_date", "TEXT"),
    ("haikin_date", "TEXT"),
    ("chukan_yotei_date", "TEXT"),
    ("chukan_date", "TEXT"),
    ("kanryo_yotei_date", "TEXT"),
    ("kanryo_date", "TEXT"),
    ("kouji_memo", "TEXT"),
    ("kanryo_inspection_date", "TEXT"),
    ("kanryo_result", "TEXT"),
    ("kanryo_correction", "TEXT"),
    ("kanryo_final_report", "TEXT"),
    ("kanryo_note", "TEXT"),
    ("has_return_confirm", "INTEGER"),
    ("has_report_sent", "INTEGER"),
    ("has_returned_items", "INTEGER")
]

# 既存カラム名を取得
cursor.execute("PRAGMA table_info(projects)")
existing_columns = {row[1] for row in cursor.fetchall()}

# 足りないカラムだけ追加
for col, dtype in new_columns:
    if col not in existing_columns:
        print(f"Adding column: {col}")
        cursor.execute(f"ALTER TABLE projects ADD COLUMN {col} {dtype}")

conn.commit()
conn.close()
print("必要なカラムをすべて追加しました。")
