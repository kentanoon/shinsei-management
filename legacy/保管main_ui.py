import tkinter as tk
from tkinter import ttk, messagebox
from tkcalendar import DateEntry
import sqlite3
from datetime import datetime, date
import json
import os
from dotenv import load_dotenv
import os
load_dotenv()
DB_PATH = os.getenv("DB_PATH")

if not DB_PATH:
    raise ValueError("DB_PATHが.envに定義されていません。")


root = tk.Tk()
root.title("申請管理システム")  # 任意のタイトル
root.geometry("1200x800")     # ウィンドウサイズも指定できます

# --- 全体構造（body_frame）を作る ---
body_frame = tk.Frame(root, bg="#fff")
body_frame.pack(fill="both", expand=True)

# --- 左メニュー（固定） ---
menu_frame = tk.Frame(body_frame, bg="#fdd", width=200)
menu_frame.pack(side="left", fill="y")

# --- 中央タブ領域（Notebook） ---
notebook = ttk.Notebook(body_frame)
notebook.pack(side="left", fill="both", expand=True)

# --- 右フォーム（固定）--- ← notebookではなく body_frameに配置！
right_frame = tk.Frame(body_frame, bg="#fdd", width=400)
right_frame.pack(side="right", fill="y", padx=(10,20), pady=10)

# --- 各フレーム（タブ）の作成と登録 ---
frame_jizen  = tk.Frame(notebook, bg="white")
frame_juchu  = tk.Frame(notebook, bg="white")
frame_kessai = tk.Frame(notebook, bg="white")
frame_kanryo = tk.Frame(notebook, bg="white")


def generate_project_code():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(id) FROM projects")
    max_id = cursor.fetchone()[0]
    next_id = (max_id or 0) + 1
    today = datetime.now().strftime("%Y%m%d")
    code = f"{next_id:05d}-{today}"
    conn.close()
    return code

# 右側ウィジェット群（管理番号～備考欄）
widgets = {}
for i, (lbl, key, cls) in enumerate([
    ("管理番号",      "entry_id",           tk.Entry),
    ("工事名称",      "entry_project_name", tk.Entry),
    ("発注者",        "combo_client",       ttk.Combobox),
    ("担当者",        "entry_client_stuff", tk.Entry),
    ("依頼内容",      "combo_request",      ttk.Combobox),
    ("ステータス",    "combo_status",       ttk.Combobox),
]):
    tk.Label(right_frame, text=lbl, bg="#fdd", font=("Arial",11))\
      .grid(row=i*2, column=0, sticky="w")
    w = cls(right_frame, font=("Arial",12), width=30)
    w.grid(row=i*2+1, column=0, columnspan=2, sticky="w", pady=(0,10))
    widgets[key] = w



widgets["entry_id"].insert(0, generate_project_code())
widgets["entry_id"].config(state="readonly")

tk.Label(right_frame, text="連絡事項・備考欄", bg="#fdd", font=("Arial",11))\
  .grid(row=12, column=0, sticky="w")
widgets["text_note"] = tk.Text(right_frame, height=4, width=45, font=("Arial",12))
widgets["text_note"].grid(row=13, column=0, columnspan=2, sticky="w")

# 左側フォーム領域（施主情報など）
left_jizen = tk.Frame(frame_jizen, bg="white")
left_jizen.pack(side="left", fill="both", expand=True, padx=20, pady=10)

notebook.add(frame_jizen, text="事前業務(基本)")


# --- 切り替え関数 ---
def show_frame(frame):
    frame.lift()

# --- メニューボタン（Notebookのタブ切替） ---
buttons = [
    ("事前業務", 0),
    ("受注後", 1),
    ("決済後", 2),
    ("完了検査後", 3)
]
for label, index in buttons:
    tk.Button(menu_frame, text=label, width=18, font=("Arial", 12),
              command=lambda i=index: notebook.select(i)).pack(pady=10)



# --- DBが読み取り専用かチェック ---
def is_db_readonly(db_path):
    return not os.access(db_path, os.W_OK)

# --- データベース初期化 & カラム追加 ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_code TEXT UNIQUE,
        project_name TEXT,
        input_date TEXT,
        owner_name TEXT,
        owner_kana TEXT,
        owner_zip TEXT,
        owner_address TEXT,
        owner_phone TEXT,
        joint_name TEXT,
        joint_kana TEXT,
        client_name TEXT,
        request_type TEXT,
        status TEXT,
        note TEXT,
        site_address TEXT,
        land_area TEXT,
        city_plan TEXT,
        zoning TEXT,
        fire_zone TEXT,
        slope_limit TEXT,
        setback TEXT,
        other_buildings TEXT,
        building_name TEXT,
        construction_type TEXT,
        primary_use TEXT,
        structure TEXT,
        floors TEXT,
        max_height TEXT,
        total_area TEXT,
        building_area TEXT,
        application_types TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()
list_window = None

def generate_project_code():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(id) FROM projects")
    max_id = cursor.fetchone()[0]
    next_id = (max_id or 0) + 1
    today = datetime.now().strftime("%Y%m%d")
    code = f"{next_id:05d}-{today}"
    conn.close()
    return code


# --- フォームクリア ---
def clear_form():
    widgets["entry_id"].config(state="normal")
    widgets["entry_id"].delete(0, tk.END)
    widgets["entry_id"].insert(0, generate_project_code())
    widgets["entry_id"].config(state="readonly")

    widgets["entry_project_name"].delete(0, tk.END)
    widgets["text_note"].delete("1.0", tk.END)

    entries["entry_input_date"].set_date(date.today())
    for key, w in entries.items():
        if key != "entry_input_date":
            w.delete(0, tk.END)
    for w in land_entries.values():
        w.delete(0, tk.END)
    for w in building_entries.values():
        w.delete(0, tk.END)
    for combo_key in ("combo_client", "combo_request", "combo_status"):
        if combo_key in widgets:
            widgets[combo_key].set("")
    # 申請種類リセット
    for var in request_vars.values():
        var.set("未定")

# --- 保存（新規登録） ---
def register_project():
    if is_db_readonly(DB_PATH):
        messagebox.showerror("保存エラー", "このデータベースは読み取り専用です。保存できません。")
        return

    project_code = generate_project_code()
    project_name = widgets["entry_project_name"].get().strip()
    if not project_name:
        messagebox.showwarning("入力エラー", "工事名称は必須です。")
        return

    input_date = entries["entry_input_date"].get_date().strftime("%Y-%m-%d")
    jizen_vals = [entries[k].get() for k in ["entry_owner_name", "entry_owner_kana","entry_owner_zip","entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"]]
    client_name = widgets["combo_client"].get()
    request_type = widgets["combo_request"].get()
    status = widgets["combo_status"].get() or "作成中"
    note = widgets["text_note"].get("1.0", tk.END).strip()
    land_vals = [land_entries[k].get() for k in ["entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning", "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"]]
    building_vals = [building_entries[k].get() for k in ["entry_building_name", "entry_construction_type", "entry_primary_use", "entry_structure", "entry_floors", "entry_max_height", "entry_total_area", "entry_building_area"]]

    # ラジオボタン（申請種類）
    confirmation = request_vars["確認申請"].get()
    supervision = request_vars["工事監理"].get()
    plan = request_vars["プラン"].get()
    sh_60 = request_vars["60条申請"].get()
    sh_minado = request_vars["みなし道路協議"].get()
    sh_chiku = request_vars["地区計画"].get()
    sh_29 = request_vars["29条申請"].get()
    sh_43 = request_vars["43条申請"].get()
    sh_choki = request_vars["長期優良住宅申請"].get()
    sh_zeh = request_vars["ZEH（BELS申請）"].get()
    sh_gx = request_vars["GX基準（BELS申請）"].get()
    sh_seinou = request_vars["性能評価"].get()
    sh_other = request_vars["その他"].get()

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        sql = """
        INSERT INTO projects (
            project_code, project_name, input_date,
            owner_name, owner_kana, owner_zip, owner_address, owner_phone,
            joint_name, joint_kana,
            client_name, request_type, status, note,
            site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings,
            building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area,
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """
        params = [
            project_code, project_name, input_date
        ] + jizen_vals + [
            client_name, request_type, status, note
        ] + land_vals + building_vals + [
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan
        ]
        cursor.execute(sql, params)
        conn.commit()
        messagebox.showinfo("登録完了", f"管理番号 {project_code} を登録しました。")
        clear_form()
    except sqlite3.IntegrityError:
        messagebox.showerror("登録エラー", "この管理番号はすでに存在しています。")
    finally:
        conn.close()

# --- プロジェクト更新 ---# --- プロジェクト更新 ---
def update_project():
    if is_db_readonly(DB_PATH):
        messagebox.showerror("保存エラー", "このデータベースは読み取り専用です。保存できません。")
        return

    project_code = widgets["entry_id"].get().strip()
    project_name = widgets["entry_project_name"].get().strip()
    if not project_code or not project_name:
        messagebox.showwarning("入力エラー", "管理番号と工事名称は必須です。")
        return

    input_date = entries["entry_input_date"].get_date().strftime("%Y-%m-%d")
    jizen_vals = [entries[k].get() for k in ["entry_owner_name", "entry_owner_kana", "entry_owner_zip", "entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"]]
    client_name = widgets["combo_client"].get()
    request_type = widgets["combo_request"].get()
    status = widgets["combo_status"].get()
    note = widgets["text_note"].get("1.0", tk.END).strip()
    land_vals = [land_entries[k].get() for k in ["entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning", "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"]]
    building_vals = [building_entries[k].get() for k in ["entry_building_name", "entry_construction_type", "entry_primary_use", "entry_structure", "entry_floors", "entry_max_height", "entry_total_area", "entry_building_area"]]

    # ラジオボタン（申請種類）
    confirmation = request_vars["確認申請"].get()
    supervision = request_vars["工事監理"].get()
    plan = request_vars["プラン"].get()
    sh_60 = request_vars["60条申請"].get()
    sh_minado = request_vars["みなし道路協議"].get()
    sh_chiku = request_vars["地区計画"].get()
    sh_29 = request_vars["29条申請"].get()
    sh_43 = request_vars["43条申請"].get()
    sh_choki = request_vars["長期優良住宅申請"].get()
    sh_zeh = request_vars["ZEH（BELS申請）"].get()
    sh_gx = request_vars["GX基準（BELS申請）"].get()
    sh_seinou = request_vars["性能評価"].get()
    sh_other = request_vars["その他"].get()

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        sql = """
        UPDATE projects SET
            project_name=?, input_date=?,
            owner_name=?, owner_kana=?, owner_zip=?, owner_address=?, owner_phone=?, joint_name=?, joint_kana=?,
            client_name=?, request_type=?, status=?, note=?,
            site_address=?, land_area=?, city_plan=?, zoning=?, fire_zone=?, slope_limit=?, setback=?, other_buildings=?,
            building_name=?, construction_type=?, primary_use=?, structure=?, floors=?, max_height=?, total_area=?, building_area=?,
            sh_60=?, sh_minado=?, sh_chiku=?, sh_29=?, sh_43=?, sh_choki=?, sh_zeh=?, sh_gx=?, sh_seinou=?, sh_other=?,
            confirmation=?, supervision=?, plan=?
        WHERE project_code=?
        """
        params = [
            project_name, input_date
        ] + jizen_vals + [
            client_name, request_type, status, note
        ] + land_vals + building_vals + [
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan,
            project_code
        ]
        cursor.execute(sql, params)
        conn.commit()
        messagebox.showinfo("更新完了", f"管理番号 {project_code} を更新しました。")
    finally:
        conn.close()


# --- プロジェクト削除 ---
def delete_project():
    project_code = widgets["entry_id"].get().strip()
    if not project_code:
        messagebox.showwarning("削除エラー","管理番号未設定")
        return
    if messagebox.askyesno("確認", f"{project_code} を削除しますか?" ):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM projects WHERE project_code=?", (project_code,))
        conn.commit()
        conn.close()
        messagebox.showinfo("削除完了", f"管理番号 {project_code} を削除しました。")
        clear_form()

# --- 一覧表示 ---
def update_project():
    if is_db_readonly(DB_PATH):
        messagebox.showerror("保存エラー", "このデータベースは読み取り専用です。保存できません。")
        return

    project_code = widgets["entry_id"].get().strip()
    project_name = widgets["entry_project_name"].get().strip()
    if not project_code or not project_name:
        messagebox.showwarning("入力エラー", "管理番号と工事名称は必須です。")
        return

    input_date = entries["entry_input_date"].get_date().strftime("%Y-%m-%d")
    jizen_vals = [entries[k].get() for k in ["entry_owner_name", "entry_owner_kana", "entry_owner_zip", "entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"]]
    client_name = widgets["combo_client"].get()
    request_type = widgets["combo_request"].get()
    status = widgets["combo_status"].get()
    note = widgets["text_note"].get("1.0", tk.END).strip()
    land_vals = [land_entries[k].get() for k in ["entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning", "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"]]
    building_vals = [building_entries[k].get() for k in ["entry_building_name", "entry_construction_type", "entry_primary_use", "entry_structure", "entry_floors", "entry_max_height", "entry_total_area", "entry_building_area"]]

    # ラジオボタン（申請種類）
    confirmation = request_vars["確認申請"].get()
    supervision = request_vars["工事監理"].get()
    plan = request_vars["プラン"].get()
    sh_60 = request_vars["60条申請"].get()
    sh_minado = request_vars["みなし道路協議"].get()
    sh_chiku = request_vars["地区計画"].get()
    sh_29 = request_vars["29条申請"].get()
    sh_43 = request_vars["43条申請"].get()
    sh_choki = request_vars["長期優良住宅申請"].get()
    sh_zeh = request_vars["ZEH（BELS申請）"].get()
    sh_gx = request_vars["GX基準（BELS申請）"].get()
    sh_seinou = request_vars["性能評価"].get()
    sh_other = request_vars["その他"].get()

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        sql = """
        UPDATE projects SET
            project_name=?, input_date=?,
            owner_name=?, owner_kana=?, owner_zip=?, owner_address=?, owner_phone=?, joint_name=?, joint_kana=?,
            client_name=?, request_type=?, status=?, note=?,
            site_address=?, land_area=?, city_plan=?, zoning=?, fire_zone=?, slope_limit=?, setback=?, other_buildings=?,
            building_name=?, construction_type=?, primary_use=?, structure=?, floors=?, max_height=?, total_area=?, building_area=?,
            sh_60=?, sh_minado=?, sh_chiku=?, sh_29=?, sh_43=?, sh_choki=?, sh_zeh=?, sh_gx=?, sh_seinou=?, sh_other=?,
            confirmation=?, supervision=?, plan=?
        WHERE project_code=?
        """
        params = [
            project_name, input_date
        ] + jizen_vals + [
            client_name, request_type, status, note
        ] + land_vals + building_vals + [
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan,
            project_code
        ]
        cursor.execute(sql, params)
        conn.commit()
        messagebox.showinfo("更新完了", f"管理番号 {project_code} を更新しました。")
    finally:
        conn.close()

def load_selected(event):
    global listbox
    sel = listbox.curselection()
    if not sel:
        return
    code, _ = listbox.get(sel[0]).split("｜", 1)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT
        project_name,
        input_date,
        owner_name, owner_kana, owner_zip, owner_address, owner_phone, joint_name, joint_kana,
        client_name, request_type, status, note,
        site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings,
        building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area,
        sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
        confirmation, supervision, plan
    FROM projects
    WHERE project_code=?
    """, (code,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return

    # --- フォームに流し込み ---
    widgets["entry_id"].config(state="normal")
    widgets["entry_id"].delete(0, tk.END)
    widgets["entry_id"].insert(0, code)
    widgets["entry_id"].config(state="readonly")

    widgets["entry_project_name"].delete(0, tk.END)
    widgets["entry_project_name"].insert(0, row[0])

    entries["entry_input_date"].set_date(datetime.strptime(row[1], "%Y-%m-%d").date())

    for key, val in zip(
        ["entry_owner_name", "entry_owner_kana", "entry_owner_zip", "entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"],
        row[2:9]
    ):
        entries[key].delete(0, tk.END)
        entries[key].insert(0, val)

    widgets["combo_client"].set(row[9])
    widgets["combo_request"].set(row[10])
    widgets["combo_status"].set(row[11])

    widgets["text_note"].delete("1.0", tk.END)
    widgets["text_note"].insert("1.0", row[12])

    for key, val in zip(
        ["entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning", "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"],
        row[13:21]
    ):
        land_entries[key].delete(0, tk.END)
        land_entries[key].insert(0, val)

    for key, val in zip(
        ["entry_building_name", "entry_construction_type", "entry_primary_use", "entry_structure", "entry_floors", "entry_max_height", "entry_total_area", "entry_building_area"],
        row[21:29]
    ):
        building_entries[key].delete(0, tk.END)
        building_entries[key].insert(0, val)

    # --- ラジオボタン申請種類のセット ---
    sh_fields = [
        ("60条申請", row[29]),
        ("みなし道路協議", row[30]),
        ("地区計画", row[31]),
        ("29条申請", row[32]),
        ("43条申請", row[33]),
        ("長期優良住宅申請", row[34]),
        ("ZEH（BELS申請）", row[35]),
        ("GX基準（BELS申請）", row[36]),
        ("性能評価", row[37]),
        ("その他", row[38]),
    ]
    for name, value in sh_fields:
        if name in request_vars:
            request_vars[name].set(value if value else "未定")

    request_vars["確認申請"].set(row[39] if row[39] else "未定")
    request_vars["工事監理"].set(row[40] if row[40] else "未定")
    request_vars["プラン"].set(row[41] if row[41] else "未定")

def show_project_list():
    global list_window
    if list_window is not None and list_window.winfo_exists():
        list_window.lift()
        return

    list_window = tk.Toplevel(root)
    list_window.title("案件一覧")

    global listbox
    listbox = tk.Listbox(list_window, font=("Arial", 11), width=50)
    listbox.pack(padx=10, pady=10, fill="both", expand=True)
    listbox.bind("<<ListboxSelect>>", load_selected)

    def refresh_list():
        listbox.delete(0, tk.END)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT project_code, project_name FROM projects ORDER BY id DESC")
        for c, n in cursor.fetchall():
            listbox.insert(tk.END, f"{c}｜{n}")
        conn.close()
        list_window.after(10000, refresh_list)  # 10秒ごとに更新

    refresh_list()





# リセット
bottom = tk.Frame(root, bg="#fdd"); bottom.pack(side="bottom", fill="x", pady=10)
tk.Button(bottom, text="フォームをリセット", command=clear_form, font=("Arial",11)).pack()

# 入力関数
def create_labeled_entry(parent, label, row, width=40):
    tk.Label(parent, text=label, bg="white", font=("Arial",11)).grid(row=row*2, column=0, sticky="w")
    e = tk.Entry(parent, width=width, font=("Arial",12)); e.grid(row=row*2+1, column=0, sticky="w", pady=(0,10))
    return e
entries = {}
tk.Label(left_jizen, text="入力日", bg="white", font=("Arial",11)).grid(row=0, column=0, sticky="w")
date_entry = DateEntry(left_jizen, width=18, font=("Arial",12), background='darkblue', foreground='white', borderwidth=2, date_pattern='yyyy-mm-dd')
date_entry.grid(row=1, column=0, sticky="w", pady=(0,10)); entries["entry_input_date"] = date_entry
zizen_tubs = [("施主名","owner_name"),("施主フリガナ","owner_kana"),("施主フリガナ","owner_kana"),("施主郵便番号","owner_zip"),("施主住所","owner_address") ,("施主電話番号","owner_phone") ,
              ("連名者","joint_name"),("連名者フリガナ","joint_kana") ]
for i,(lbl,key) in enumerate(zizen_tubs, start=1): entries[key] = create_labeled_entry(left_jizen, lbl, i)

# 事前業務タブ(基本情報)
frame_land = tk.Frame(notebook, bg="white"); notebook.add(frame_land, text="事前業務(敷地)")
land_entries = {}
land_fields = [("建設地住所","entry_site_address"),("斜線制限","entry_slope_limit"),("外壁後退","entry_setback"),("他建物","entry_other_buildings"),
               ("都市計画","entry_city_plan"),("用途地域","entry_zoning"),("敷地面積","entry_land_area"),("防火地域","entry_fire_zone"),("主要用途","entry_primary_use")]
for i,(lbl,key) in enumerate(land_fields):
    tk.Label(frame_land, text=lbl, bg="white", font=("Arial",11)).grid(row=i*2, column=0, sticky="w", padx=20)
    land_entries[key] = tk.Entry(frame_land, width=50, font=("Arial",12)); land_entries[key].grid(row=i*2+1, column=0, sticky="w", padx=20, pady=(0,10))

# 事前業務タブ(敷地情報)
frame_land = tk.Frame(notebook, bg="white"); notebook.add(frame_land, text="事前業務(敷地)")
land_entries = {}
land_fields = [("建設地住所","entry_site_address"),("斜線制限","entry_slope_limit"),("外壁後退","entry_setback"),("他建物","entry_other_buildings"),
               ("都市計画","entry_city_plan"),("用途地域","entry_zoning"),("敷地面積","entry_land_area"),("防火地域","entry_fire_zone"),("主要用途","entry_primary_use")]
for i,(lbl,key) in enumerate(land_fields):
    tk.Label(frame_land, text=lbl, bg="white", font=("Arial",11)).grid(row=i*2, column=0, sticky="w", padx=20)
    land_entries[key] = tk.Entry(frame_land, width=50, font=("Arial",12)); land_entries[key].grid(row=i*2+1, column=0, sticky="w", padx=20, pady=(0,10))

# 事前業務タブ(建物情報)
frame_land = tk.Frame(notebook, bg="white"); notebook.add(frame_land, text="事前業務(建物)")
land_entries = {}
land_fields = [("階数","entry_floors"),("構造","entry_structure"),("延べ床面積","entry_total_area"),("建築面積","entry_building_area")]
for i,(lbl,key) in enumerate(land_fields):
    tk.Label(frame_land, text=lbl, bg="white", font=("Arial",11)).grid(row=i*2, column=0, sticky="w", padx=20)
    land_entries[key] = tk.Entry(frame_land, width=50, font=("Arial",12)); land_entries[key].grid(row=i*2+1, column=0, sticky="w", padx=20, pady=(0,10))

# 決済後タブ
frame_building = tk.Frame(notebook, bg="white"); notebook.add(frame_building, text="決済後")
building_entries = {}
building_fields = [("物件名","entry_building_name"),("工事種別","entry_construction_type"),("最高高さ","entry_max_height"),]
for i,(lbl,key) in enumerate(building_fields):
    tk.Label(frame_building, text=lbl, bg="white", font=("Arial",11)).grid(row=i*2, column=0, sticky="w", padx=20)
    building_entries[key] = tk.Entry(frame_building, width=50, font=("Arial",12)); building_entries[key].grid(row=i*2+1, column=0, sticky="w", padx=20, pady=(0,10))

# 完了検査後タブ
frame_application = tk.Frame(notebook, bg="white"); notebook.add(frame_application, text="完了検査後")
request_vars = {}
申請項目 = ["プラン","確認申請","工事監理","60条申請","みなし道路協議","地区計画","29条申請","43条申請","長期優良住宅申請","ZEH（BELS申請）","GX基準（BELS申請）","性能評価","その他"]
for i,項目 in enumerate(申請項目):
    var = tk.StringVar(value="未定"); request_vars[項目] = var
    tk.Label(frame_application, text=項目, bg="white", font=("Arial",11)).grid(row=i, column=0, sticky="w", padx=20, pady=5)
    fr = tk.Frame(frame_application, bg="white"); fr.grid(row=i, column=1, sticky="w", padx=20, pady=5)
    for val in ["有","無","未定"]: tk.Radiobutton(fr, text=val, variable=var, value=val, bg="white", font=("Arial",11)).pack(side="left", padx=5)

# 関連情報 他
for t in ["関連情報","申請工程","関連工程"]: notebook.add(tk.Frame(notebook, bg="white"), text=t)

root.mainloop()
