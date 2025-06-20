import tkinter as tk
from tkinter import ttk, messagebox
#from tkcalendar import DateEntry
import sqlite3
from datetime import datetime, date
import os
import sys
from dotenv import load_dotenv
from ui.layout import (
    create_main_layout,
    create_request_type_section,
    create_notes_section,
    create_juchu_tab,
    create_kessai_tab,
    create_kouji_kanri_tab,
    create_kanryo_tab
)
from ui.events import register_project, update_project, delete_project
from ui.events import show_project_list
from ui.events import clear_form

# --- 環境変数の読み込み (モジュール起動時に１回だけ) ---
load_dotenv()
DB_PATH = os.getenv("DB_PATH")
if not DB_PATH:
    raise ValueError("DB_PATHが.envに定義されていません")

def fill_form_from_row(row):
    """DB から取得した row を各ウィジェットにセットする"""
    i = 0
    widgets["entry_management_no"].delete(0, tk.END)
    widgets["entry_management_no"].insert(0, str(row[i])); i += 1
    widgets["entry_project_name"].delete(0, tk.END)
    widgets["entry_project_name"].insert(0, str(row[i])); i += 1
    entries["entry_input_date"].set_date(row[i]); i += 1
    # 以下、load_selected の中身を丸ごとここにインデントして移動…

# --- メインウィンドウ ---
root = tk.Tk()
root.withdraw()   
root.title("申請管理システム")
root.geometry("1200x800")

# --- UIレイアウトを構築 ---
layout = create_main_layout(root)
widgets = layout["right_entries"]
entries = layout["entries"]
land_entries = layout["land_entries"]
building_entries = layout["building_entries"]
disaster_entries = layout["disaster_entries"]
body_frame = layout["body_frame"]
menu_frame = layout["menu_frame"]
right_frame = layout["right_frame"]
notebook = layout["notebook"]


# --- 申請チェックボックスと備考欄 ---
request_frame, request_vars = create_request_type_section(right_frame)
text_note = create_notes_section(right_frame)
widgets["text_note"] = text_note

# --- 各タブのフォーム構築 ---
juchu_entries, text_juchu_note = create_juchu_tab(layout["frame_juchu"])
kessai_entries, text_kessai_note = create_kessai_tab(layout["frame_kessai"])
kouji_kanri_entries = create_kouji_kanri_tab(layout["frame_kouji_kanri"])
kanryo_entries, kanryo_check_vars, text_kanryo_note = create_kanryo_tab(layout["frame_kanryo"])


# --- タブフレーム（存在チェック付き） ---
frame_jizen_basic = layout.get("frame_jizen_basic")
frame_jizen_land = layout.get("frame_jizen_land")
frame_jizen_building = layout.get("frame_jizen_building")
frame_jizen_disaster = layout.get("frame_jizen_disaster")
frame_juchu = layout.get("frame_juchu")
frame_kessai = layout.get("frame_kessai")
frame_kouji_kanri = layout.get("frame_kouji_kanri")
frame_kanryo = layout.get("frame_kanryo")

if "combo_status" in widgets:
    widgets["combo_status"]["values"] = [
        "事前相談", "受注", "申請作業", "審査中", "配筋検査待ち",
        "中間検査待ち", "完了検査待ち", "完了", "失注", "その他"
    ]
else:
    print("⚠ combo_status が layout に含まれていません")

# --- タブ切替関数 ---
def show_tabs(mode):
    for tab_id in notebook.tabs():
        notebook.forget(tab_id)
    if mode == 0:
        notebook.add(frame_jizen_basic, text="施主情報")
        notebook.add(frame_jizen_land, text="敷地情報")
        notebook.add(frame_jizen_building, text="建物情報")
        notebook.add(frame_jizen_disaster, text="災害区域")
    elif mode == 1 and frame_juchu:
        notebook.add(frame_juchu, text="受注後")
    elif mode == 2 and frame_kessai:
        notebook.add(frame_kessai, text="決済後")
    elif mode == 3 and frame_kanryo:
        notebook.add(frame_kanryo, text="完了検査後")
    elif mode == 4 and frame_kouji_kanri:
        notebook.add(frame_kouji_kanri, text="工事監理")
    if notebook.tabs():
        notebook.select(0)

# --- メニューのボタンで切り替え ---
buttons = [
    ("事前業務", 0),
    ("受注後", 1),
    ("決済後", 2),
    ("工事監理", 4),
    ("完了検査後", 3),
]
for label, mode in buttons:
    tk.Button(
        menu_frame, text=label, width=18, font=("Arial", 12), command=lambda m=mode: show_tabs(m)
    ).pack(pady=10)

# 初期表示
def generate_project_code():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row


    cursor = conn.cursor()
    cursor.execute("SELECT MAX(id) FROM projects_new")
    max_id = cursor.fetchone()[0]
    next_id = (max_id or 0) + 1
    today = datetime.now().strftime("%Y%m%d")
    code = f"{next_id:05d}-{today}"
    conn.close()
    return code

widgets["entry_management_no"].insert(0, generate_project_code())
widgets["entry_management_no"].config(state="readonly")


# タブ切替関数
def show_tabs(mode):
    for tab_id in notebook.tabs():
        notebook.forget(tab_id)
    if mode == 0:
        notebook.add(frame_jizen_land,     text="敷地情報")
        notebook.add(frame_jizen_building, text="建物情報")
        notebook.add(frame_jizen_disaster, text="災害区域")
    elif mode == 1:
        notebook.add(frame_jizen_basic,    text="施主情報")
        notebook.add(frame_juchu,  text="受注後")
    elif mode == 2:
        notebook.add(frame_kessai, text="決済後")
    elif mode == 3:
        notebook.add(frame_kanryo, text="完了検査後")
    if notebook.tabs():
        notebook.select(0)
    elif mode == 4:
            notebook.add(frame_kouji_kanri, text="工事監理")


# 初期表示 & 実行
show_tabs(0)

# --- DBが読み取り専用かチェック ---
def is_db_readonly(db_path):
    return not os.access(db_path, os.W_OK)

# --- データベース初期化 & カラム追加 ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,id INTEGER PRIMARY KEY AUTOINCREMENT,project_code TEXT UNIQUE,
        project_name TEXT,input_date TEXT,owner_name TEXT,owner_kana TEXT,owner_zip TEXT,owner_address TEXT,
        owner_phone TEXT,joint_name TEXT,joint_kana TEXT,client_name TEXT,client_stuff TEXT,
        request_type TEXT,status TEXT,note TEXT,site_address TEXT,land_area TEXT,city_plan TEXT,
        zoning TEXT,fire_zone TEXT,slope_limit TEXT,setback TEXT,other_buildings TEXT,
        building_name TEXT,construction_type TEXT,primary_use TEXT,structure TEXT,
        floors TEXT,max_height TEXT,total_area TEXT,building_area TEXT,landslide_alert TEXT,
        flood_zone TEXT,tsunami_zone TEXT,sh_60 TEXT,
        sh_minado TEXT,sh_chiku TEXT,sh_29 TEXT,sh_43 TEXT,sh_choki TEXT,sh_zeh TEXT,
        sh_gx TEXT,sh_seinou TEXT,sh_other TEXT,confirmation TEXT,supervision TEXT,
        plan TEXT,contract_price TEXT,estimate_amount TEXT,construction_cost TEXT,
        juchu_note TEXT,kessai_date TEXT,kessai_staff TEXT,kessai_amount TEXT,
        kessai_terms TEXT,kessai_note TEXT,has_kofu INTEGER,has_yoteihyo INTEGER,
        has_fukuzu INTEGER,has_kanamono INTEGER,has_seikyu INTEGER,has_shoene INTEGER,
        has_kessai_data INTEGER,haikin_yotei_date TEXT,haikin_date TEXT,chukan_yotei_date TEXT,
        chukan_date TEXT,kanryo_yotei_date TEXT,kanryo_date TEXT,kouji_memo TEXT,
        kanryo_inspection_date TEXT,kanryo_result TEXT,kanryo_correction TEXT,
        kanryo_final_report TEXT,kanryo_note TEXT,has_return_confirm INTEGER,
        has_report_sent INTEGER,has_returned_items INTEGER
    )
    """)
    conn.commit()
    conn.close()

init_db()
list_window = None


# --- フォームクリア ---
from datetime import date
        
def load_selected(event):
    sel = event.widget.curselection()
    if not sel:
        return
    item_text = event.widget.get(sel[0])
    project_code = item_text.split("｜", 1)[0].strip()
    # …後はこれまで通り fetch & fill_form_from_row(row) …
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects_new WHERE project_code=?", (project_code,))
    row = cursor.fetchone()
    conn.close()
    
    
    

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                project_code, project_name, input_date,
                owner_name, owner_kana, owner_zip, owner_address, owner_phone,
                joint_name, joint_kana,
                client_name, client_stuff, request_type, status, note,
                site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings,
                building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area,
                landslide_alert, flood_zone, tsunami_zone,
                sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
                confirmation, supervision, plan,
                contract_price, estimate_amount, construction_cost, juchu_note,
                kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note,
                has_kofu, has_yoteihyo, has_fukuzu, has_kanamono, has_seikyu, has_shoene, has_kessai_data,
                haikin_yotei_date, haikin_date, chukan_yotei_date, chukan_date, kanryo_yotei_date, kanryo_date, kouji_memo,
                kanryo_inspection_date, kanryo_result, kanryo_correction, kanryo_final_report, kanryo_note,
                has_return_confirm, has_report_sent, has_returned_items
            FROM projects_new
            WHERE project_code = ?
        """, (project_code,))
        row = cursor.fetchone()
        
        i = 0
        # 管理番号フィールドを一旦編集可能にしてコピー → 再度 readonly に
        widgets["entry_management_no"].config(state="normal")
        widgets["entry_management_no"].delete(0, tk.END)
        widgets["entry_management_no"].insert(0, str(row[i]))
        widgets["entry_management_no"].config(state="readonly")
        i += 1
        widgets["entry_project_name"].delete(0, tk.END)
        widgets["entry_project_name"].insert("0", str(row[i]))
        i += 1
        entries["entry_input_date"].set_date(row[i]); i += 1

    
        for key in ["entry_owner_name", "entry_owner_kana", "entry_owner_zip", "entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"]:
            entries[key].delete(0, tk.END)
            entries[key].insert("0", str(row[i]))
            i += 1
        
        # 発注者（コンボ）
        widgets["combo_client"].set(str(row[i]))
        i += 1
        # 発注者担当者
        widgets["entry_client_stuff"].delete(0, tk.END)
        widgets["entry_client_stuff"].insert("0", str(row[i]))
        i += 1
        # request_type をスキップ
        i += 1
        # ステータス
        widgets["combo_status"].set(str(row[i]))
        i += 1
        # 備考
        text_note.delete("1.0", tk.END)
        text_note.insert("1.0", str(row[i]))
        i += 1

        for key in ["entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning", "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"]:
            land_entries[key].delete(0, tk.END)
            land_entries[key].insert("0", str(row[i]))
            i += 1
        for key in ["entry_building_name", "entry_construction_type", "entry_primary_use", "entry_structure", "entry_floors", "entry_max_height", "entry_total_area", "entry_building_area"]:
            building_entries[key].delete(0, tk.END)
            building_entries[key].insert("0", str(row[i]))
            i += 1
        # 災害区域タブの読み込み
        for key in ["entry_landslide_alert", "entry_flood_zone", "entry_tsunami_zone"]:
            disaster_entries[key].delete(0, tk.END)
            disaster_entries[key].insert("0", str(row[i]))
            i += 1    
        # 申請チェック系
        request_names = ["60条申請", "みなし道路協議", "地区計画", "29条申請", "43条申請", "長期優良住宅申請", "ZEH（BELS申請）", "GX基準（BELS申請）", "性能評価", "その他"]
        for name in request_names:
            request_vars[name].set(1 if row[i] == "申請" else 0); i += 1

        for name in ["確認申請", "工事監理", "プラン"]:
            request_vars[name].set(1 if row[i] == "申請" else 0); i += 1

        # --- 受注後 ---
        juchu_keys = ["entry_contract_price", "entry_estimate_amount", "entry_construction_cost"]
        for key in juchu_keys:
            juchu_entries[key].delete(0, tk.END)
            juchu_entries[key].insert("0", str(row[i]))
            i += 1
        
        text_juchu_note.delete("1.0", tk.END)
        text_juchu_note.insert("1.0", str(row[i]))
        i += 1
        # --- 決済後 ---
        kessai_entries["entry_kessai_date"].set_date(row[i])
        i += 1
        kessai_entries["entry_kessai_staff"].delete(0, tk.END)
        kessai_entries["entry_kessai_staff"].insert("0", str(row[i]))
        i += 1
        kessai_entries["entry_kessai_amount"].delete(0, tk.END)
        kessai_entries["entry_kessai_amount"].insert("0", str(row[i]))
        i += 1
        kessai_entries["entry_kessai_terms"].delete(0, tk.END)
        kessai_entries["entry_kessai_terms"].insert("0", str(row[i]))
        i += 1

        text_kessai_note.delete("1.0", tk.END)
        text_kessai_note.insert("1.0", str(row[i]))
        i += 1

        for name in ["交付申請書", "検査予定表", "基礎伏図", "金物図", "請求書", "省エネ計算書", "決済データ"]:
        # kessai_check_vars[name] は IntVar などで定義されている想定
            kessai_check_vars[name].set(1 if row[i] in (1, "1") else 0)
            i += 1

        # --- 工事監理 ---
        for key in ["entry_haikin_yotei", "entry_haikin_jissi", "entry_chukan_yotei", "entry_chukan_jissi", "entry_kanryo_yotei", "entry_kanryo_jissi"]:
            kouji_kanri_entries[key].set_date(row[i]); i += 1

       
        text_kouji_memo.delete("1.0", tk.END)
        text_kouji_memo.insert("1.0", str(row[i])) 
        i += 1

        # --- 完了検査後 ---
        kanryo_entries["entry_inspection_date"].set_date(row[i])
        i += 1

        # 検査結果
        kanryo_entries["entry_inspection_result"].delete(0, tk.END)
        kanryo_entries["entry_inspection_result"].insert("0", str(row[i]))
        i += 1

        # 是正内容
        kanryo_entries["entry_corrections"].delete(0, tk.END)
        kanryo_entries["entry_corrections"].insert("0", str(row[i]))
        i += 1

        # 完了報告日
        kanryo_entries["entry_final_report_date"].set_date(row[i])
        i += 1

        # 完了報告メモ
        text_kanryo_note.delete("1.0", tk.END)
        text_kanryo_note.insert("1.0", str(row[i]))
        i += 1

        # 返却・送付・確認チェックボックス
        for name in ["確認申請書の返却", "工事監理報告書の送付", "返却物の確認"]:
            kanryo_check_vars[name].set(1 if str(row[i]) == "1" else 0)
            i += 1

    finally:
        conn.close()


# リセット
bottom = tk.Frame(root)
bottom.pack(pady=10)

tk.Button(
        text="フォームをリセット",
        command=lambda: clear_form(
            widgets, entries, land_entries, building_entries, disaster_entries,
            request_vars, juchu_entries, text_juchu_note,
            kessai_entries, kessai_check_vars, text_kessai_note,
            kouji_kanri_entries, text_kouji_memo,
            kanryo_entries, kanryo_check_vars, text_kanryo_note
        ),
        font=("Arial", 11)
    ).pack()



if False:
    # 関連情報 他
    for t in ["関連情報","申請工程","関連工程"]: notebook.add(tk.Frame(notebook, bg="white"), text=t)

# --- 操作用ボタン（登録・更新・削除・一覧表示） ---
# ボタン配置用フレーム
btn_frame = tk.Frame(right_frame, bg="#fdd")
btn_frame.grid(row=16, column=0, columnspan=2, pady=20, sticky="ew")

# 登録ボタン（すでに追加済）
tk.Button(
    btn_frame,
    text="登録",
    command=lambda: register_project(
        widgets, entries, land_entries, building_entries, disaster_entries,
        request_vars, juchu_entries, text_juchu_note,
        kessai_entries, kessai_check_vars, text_kessai_note,
        kouji_kanri_entries, text_kouji_memo,
        kanryo_entries, kanryo_check_vars, text_kanryo_note,
        clear_form, generate_project_code
    ),
    font=("Arial", 12),
    width=10
).grid(row=0, column=0, padx=5)

# 更新ボタン（ここが今回の変更ポイント！）
tk.Button(
    btn_frame,
    text="更新",
    command=lambda: update_project(
        widgets, entries, land_entries, building_entries, disaster_entries,
        request_vars, juchu_entries, text_juchu_note,
        kessai_entries, kessai_check_vars, text_kessai_note,
        kouji_kanri_entries, text_kouji_memo,
        kanryo_entries, kanryo_check_vars, text_kanryo_note,
        DB_PATH
    ),
    font=("Arial", 12),
    width=10
).grid(row=0, column=1, padx=5)

tk.Button(
    btn_frame,
    text="削除",
    command=lambda: delete_project(widgets, clear_form),
    font=("Arial", 12),
    width=10
).grid(row=0, column=2, padx=5)

tk.Button(
    btn_frame,
    text="一覧表示",
    command=lambda: show_project_list(root, DB_PATH, load_selected),
    font=("Arial", 12),
    width=10
).grid(row=0, column=3, padx=5)




notebook.add(frame_juchu, text="受注後")  # ← ここを先に呼ぶ！


# --- チェックボックスグループ（支払条件と備考の間） ---
kessai_check_frame = tk.LabelFrame(frame_kessai, text="提出書類", bg="white", font=("Arial",11))
kessai_check_frame.grid(row=8, column=0, sticky="w", padx=20, pady=(10, 0))

kessai_check_vars = {}
kessai_check_items = [
    "交付申請書", "検査予定表", "基礎伏図",
    "金物図", "請求書", "省エネ計算書", "決済データ"
]

for i, name in enumerate(kessai_check_items):
    var = tk.BooleanVar()
    kessai_check_vars[name] = var
    cb = tk.Checkbutton(
        kessai_check_frame,
        text=name,
        variable=var,
        bg="white",
        font=("Arial", 10)
    )
    cb.grid(row=i//3, column=i%3, sticky="w", padx=10, pady=2)


# 軽微な変更・計画変更の概要（テキスト欄）
tk.Label(frame_kouji_kanri, text="軽微な変更・計画変更の概要", bg="white", font=("Arial",11)).grid(row=12, column=0, sticky="w", padx=20)
text_kouji_memo = tk.Text(frame_kouji_kanri, height=4, width=45, font=("Arial",12))
text_kouji_memo.grid(row=13, column=0, padx=20, pady=(0,10))


show_tabs(0)

# --- 引数から案件を読み込む処理 ---
import sys

def load_selected_from_code(code):
    """
    コマンドライン引数 code を使って、projects_new から該当レコードを取得し、
    fill_form_from_row でフォームに展開する。
    """
    # DBに接続
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ここに必ず「?」が１つ入っていること！
    cursor.execute("""
         SELECT project_code, project_name, input_date,
               owner_name, owner_kana, owner_zip, owner_address, owner_phone,
               joint_name, joint_kana,
               client_name, client_stuff, request_type, status, note,
               site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings,
               building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area,
               landslide_alert, flood_zone, tsunami_zone,
               sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
               confirmation, supervision, plan,
               contract_price, estimate_amount, construction_cost, juchu_note,
               kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note,
               has_kofu, has_yoteihyo, has_fukuzu, has_kanamono, has_seikyu, has_shoene, has_kessai_data,
               haikin_yotei_date, haikin_date, chukan_yotei_date, chukan_date,
               kanryo_yotei_date, kanryo_date, kouji_memo,
               kanryo_inspection_date, kanryo_result, kanryo_correction, kanryo_final_report, kanryo_note,
               has_return_confirm, has_report_sent, has_returned_items
        FROM projects_new
        WHERE project_code = ?
    """, (code,))
    row = cursor.fetchone()
    conn.close()

    # レコードが見つからなかったら警告を出して終了
    if not row:
        messagebox.showwarning(
            "未検出",
            f"管理番号 {code} は見つかりませんでした。"
        )
        return

    # 取得したレコードをフォームへ一括展開
    fill_form_from_row(row)
    def safe_val(val):
        return "" if val is None else str(val)

    # 管理番号（読み取り専用）
    widgets["entry_management_no"].config(state="normal")
    widgets["entry_management_no"].delete(0, tk.END)
    widgets["entry_management_no"].insert(0, code)
    widgets["entry_management_no"].config(state="readonly")

    # 工事名称
    widgets["entry_project_name"].delete(0, tk.END)
    widgets["entry_project_name"].insert(0, safe_val(row[1]))

    # ── 敷地情報（site_address～other_buildings）──
    land_keys = [
        "entry_site_address", "entry_land_area", "entry_city_plan",
        "entry_zoning", "entry_fire_zone", "entry_slope_limit",
        "entry_setback", "entry_other_buildings"
    ]
    for key, val in zip(land_keys, row[15:23]):
        land_entries[key].delete(0, tk.END)
        land_entries[key].insert(0, safe_val(val))

    # ── 建物情報（building_name～building_area）──
    bld_keys = [
        "entry_building_name", "entry_construction_type", "entry_primary_use",
        "entry_structure", "entry_floors", "entry_max_height",
        "entry_total_area", "entry_building_area"
    ]
    for key, val in zip(bld_keys, row[23:31]):
        building_entries[key].delete(0, tk.END)
        building_entries[key].insert(0, safe_val(val))

    # ── 災害区域（landslide_alert～tsunami_zone）──
    dis_keys = ["entry_landslide_alert", "entry_flood_zone", "entry_tsunami_zone"]
    for key, val in zip(dis_keys, row[31:34]):
        disaster_entries[key].delete(0, tk.END)
        disaster_entries[key].insert(0, safe_val(val))

    # 入力日
    if row[2]:
        try:
            entries["entry_input_date"].set_date(datetime.strptime(row[2], "%Y-%m-%d").date())
        except:
            entries["entry_input_date"].set_date(date.today())

    # 施主情報（7項目）→ インデックスを3～9に修正
    owner_keys = [
        "entry_owner_name", "entry_owner_kana", "entry_owner_zip",
        "entry_owner_address", "entry_owner_phone",
        "entry_joint_name", "entry_joint_kana"
    ]
    for key, val in zip(owner_keys, row[3:10]):
        entries[key].delete(0, tk.END)
        entries[key].insert(0, safe_val(val))

    # 発注者
    widgets["combo_client"].set(safe_val(row[10]))

    # ステータス
    widgets["combo_status"].set(safe_val(row[13]))

    # 備考
    widgets["text_note"].delete("1.0", tk.END)
    widgets["text_note"].insert("1.0", safe_val(row[14]))

    # ── 受注後情報（契約金額／見積金額／工事原価／備考）──
    juchu_keys = ["entry_contract_price", "entry_estimate_amount", "entry_construction_cost"]
    for key, val in zip(juchu_keys, row[47:50]):
        juchu_entries[key].delete(0, tk.END)
        juchu_entries[key].insert(0, safe_val(val))
    text_juchu_note.delete("1.0", tk.END)
    text_juchu_note.insert("1.0", safe_val(row[50]))

    # ── 決済後情報（決済日／担当／金額／支払条件／備考／チェックボックス）──
    # 日付(DateEntry)と通常のEntryで分けてセット
    kessai_keys = ["entry_kessai_date", "entry_kessai_staff", "entry_kessai_amount", "entry_kessai_terms"]
    for idx, key in enumerate(kessai_keys, start=51):
        val = row[idx]
        if key == "entry_kessai_date":
            if val:
                try:
                    kessai_entries[key].set_date(datetime.strptime(val, "%Y-%m-%d").date())
                except:
                    pass
        else:
            kessai_entries[key].delete(0, tk.END)
            kessai_entries[key].insert(0, safe_val(val))

    # ── 工事監理日程（予定/実施、中間予定/実施、完了予定/実施）──
    kouji_dates = [
        "entry_haikin_yotei", "entry_haikin_jissi",
        "entry_chukan_yotei", "entry_chukan_jissi",
        "entry_kanryo_yotei", "entry_kanryo_jissi"
    ]
    # テーブルのカラムでは row[63]～row[68] に対応
    for key, val in zip(kouji_dates, row[63:69]):
        if val:
            try:
                kouji_kanri_entries[key].set_date(
                    datetime.strptime(val, "%Y-%m-%d").date()
                )
            except:
                pass

    # メモ（軽微な変更・計画変更の概要。kouji_memo は index=69）
    text_kouji_memo.delete("1.0", tk.END)
    text_kouji_memo.insert("1.0", safe_val(row[69]))



    # 備考
    text_kessai_note.delete("1.0", tk.END)
    text_kessai_note.insert("1.0", safe_val(row[55]))

    # 提出書類チェックボックス
    kessai_items = ["交付申請書", "検査予定表", "基礎伏図", "金物図", "請求書", "省エネ計算書", "決済データ"]
    for idx, name in enumerate(kessai_items, start=56):
        kessai_check_vars[name].set(bool(row[idx]))

    # ── 完了検査後情報（検査日／結果／修正／完了報告日）──
    # SQLでのカラム位置：inspection_date=70, result=71, correction=72, final_report=73
    inspection_keys = [
        "entry_inspection_date",  # row[70]
        "entry_inspection_result",# row[71]
        "entry_corrections",      # row[72]
        "entry_final_report_date" # row[73]
    ]
    start_idx = 70
    for idx, key in enumerate(inspection_keys):
        val = row[start_idx + idx]
        widget = kanryo_entries[key]
        if key.endswith("_date") and val:
            try:
                widget.set_date(datetime.strptime(val, "%Y-%m-%d").date())
            except:
                pass
        else:
            widget.delete(0, tk.END)
            widget.insert(0, safe_val(val))

    # メモ（index=74）
    memo_idx = start_idx + len(inspection_keys)
    text_kanryo_note.delete("1.0", tk.END)
    text_kanryo_note.insert("1.0", safe_val(row[memo_idx]))

    # ── 返却・送付・確認チェック（index=75～77）──
    check_start = memo_idx + 1
    for idx, name in enumerate(["確認申請書の返却", "工事監理報告書の送付", "返却物の確認"]):
        kanryo_check_vars[name].set(bool(row[check_start + idx]))

# コマンドライン引数があれば読み込む
# コマンドライン引数があれば読み込んでフォームに反映
if len(sys.argv) > 1:
    received_code = sys.argv[1]
    load_selected_from_code(received_code)    # ← ここで実際にデータを読み込む

root.deiconify()
root.mainloop()

