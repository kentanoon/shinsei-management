import tkinter as tk
from tkinter import ttk
from tkcalendar import DateEntry as _TKDateEntry

class DateEntry(_TKDateEntry):
    """
    DateEntry をフォーカスアウト時に自動リセットさせないサブクラス。
    """
    def __init__(self, master=None, **kw):
        super().__init__(master, **kw)
        # focusout 時のバリデーションを完全にオフにする
        self.configure(validate='none')



def create_main_layout(root):
    root.configure(bg="#fff")

    body_frame = tk.Frame(root, bg="#fff")
    body_frame.pack(fill="both", expand=True)

    menu_frame = tk.Frame(body_frame, bg="#fdd", width=200)
    menu_frame.pack(side="left", fill="y", padx=(10, 20), pady=10)

    right_frame = tk.Frame(body_frame, bg="#fdd", width=400)
    right_frame.pack(side="right", fill="y", padx=(10, 20), pady=10)

    style = ttk.Style()
    style.theme_use("default")
    style.configure("TNotebook.Tab", font=("Arial", 10), padding=[20, 10], background="#d0e6ff", foreground="black")
    style.map("TNotebook.Tab", background=[("selected", "#a0c4ff")], foreground=[("selected", "black")])

    notebook = ttk.Notebook(body_frame)
    notebook.pack(side="left", fill="both", expand=True)

    def create_labeled_entry(parent, label_text, row_index, key, store_dict):
        tk.Label(parent, text=label_text, bg="white", font=("Arial", 11)).grid(row=row_index * 2, column=0, sticky="w", padx=20)
        entry = tk.Entry(parent, width=45, font=("Arial", 12))
        entry.grid(row=row_index * 2 + 1, column=0, sticky="w", padx=20, pady=(0, 10))
        store_dict[key] = entry

    # タブフレーム
    frame_jizen_basic = tk.Frame(notebook, bg="white")
    frame_jizen_land = tk.Frame(notebook, bg="white")
    frame_jizen_building = tk.Frame(notebook, bg="white")
    frame_jizen_disaster = tk.Frame(notebook, bg="white")
    frame_juchu = tk.Frame(notebook, bg="white")
    frame_kessai = tk.Frame(notebook, bg="white")
    frame_kouji_kanri = tk.Frame(notebook, bg="white")
    frame_kanryo = tk.Frame(notebook, bg="white")

    entries = {}
    land_entries = {}
    building_entries = {}
    disaster_entries = {}

    owner_fields = [
        ("施主名", "entry_owner_name"),
        ("施主フリガナ", "entry_owner_kana"),
        ("施主郵便番号", "entry_owner_zip"),
        ("施主住所", "entry_owner_address"),
        ("施主電話番号", "entry_owner_phone"),
        ("連名者", "entry_joint_name"),
        ("連名者フリガナ", "entry_joint_kana")
    ]
    for i, (label, key) in enumerate(owner_fields):
        create_labeled_entry(frame_jizen_basic, label, i, key, entries)

    land_fields = [
        ("建設地住所", "entry_site_address"),
        ("敷地面積", "entry_land_area"),
        ("都市計画", "entry_city_plan"),
        ("用途地域", "entry_zoning"),
        ("防火地域", "entry_fire_zone"),
        ("斜線制限", "entry_slope_limit"),
        ("外壁後退", "entry_setback"),
        ("他建物", "entry_other_buildings")
    ]
    for i, (label, key) in enumerate(land_fields):
        create_labeled_entry(frame_jizen_land, label, i, key, land_entries)

    building_fields = [
        ("建物名称", "entry_building_name"),
        ("建築用途", "entry_construction_type"),
        ("建物主要用途", "entry_primary_use"),
        ("構造", "entry_structure"),
        ("階数", "entry_floors"),
        ("最高高さ", "entry_max_height"),
        ("延床面積", "entry_total_area"),
        ("建築面積", "entry_building_area")
    ]
    for i, (label, key) in enumerate(building_fields):
        create_labeled_entry(frame_jizen_building, label, i, key, building_entries)

    disaster_fields = [
        ("土砂災害警戒区域", "entry_landslide_alert"),
        ("洪水浸水想定区域", "entry_flood_zone"),
        ("津波災害警戒区域", "entry_tsunami_zone")
    ]
    for i, (label, key) in enumerate(disaster_fields):
        create_labeled_entry(frame_jizen_disaster, label, i, key, disaster_entries)

    # Right entries
    right_entries = {}

    def create_right_entry(label_text, key, row):
        tk.Label(right_frame, text=label_text, bg="#fdd", font=("Arial", 11)) \
            .grid(row=row, column=0, sticky="w", padx=10)
        entry = tk.Entry(right_frame, width=30, font=("Arial", 12))
        entry.grid(row=row+1, column=0, sticky="w", padx=10, pady=(0, 10))
        right_entries[key] = entry

    def create_right_combobox(label_text, key, row, values):
        tk.Label(right_frame, text=label_text, bg="#fdd", font=("Arial", 11)) \
            .grid(row=row, column=0, sticky="w", padx=10)
        combo = ttk.Combobox(right_frame, values=values, font=("Arial", 12), width=28)
        combo.grid(row=row+1, column=0, sticky="w", padx=10, pady=(0, 10))
        right_entries[key] = combo

    create_right_entry("管理番号", "entry_management_no", 0)
    create_right_entry("工事名称", "entry_project_name", 2)
    # 入力日用に DateEntry を直接生成
    tk.Label(right_frame, text="入力日", bg="#fdd", font=("Arial", 11))\
    .grid(row=4, column=0, sticky="w", padx=10)
    
    # 入力日
    entry_input_date = DateEntry(
        right_frame,
        width=30,
        font=("Arial", 12),
        date_pattern='yyyy-mm-dd',
        validate='none'
    )
    entry_input_date.grid(row=5, column=0, sticky="w", padx=10, pady=(0, 10))
    # DateEntry を entries に登録しないと KeyError になります
    entries["entry_input_date"] = entry_input_date
    entry_input_date.delete(0, tk.END)
    right_entries["entry_input_date"] = entry_input_date


    
    create_right_entry("発注者担当者", "entry_client_stuff", 6)

    # ─── 発注者コンボボックス ───
    create_right_combobox(
        "発注者",             # 表示ラベル
        "combo_client",       # widgets["combo_client"] として参照
        8,                    # グリッドの row 開始位置
        ["○○建設", "△△工業", "□□不動産"]  # 選択肢リスト
    )
    create_right_combobox("ステータス", "combo_status", 10, ["未着手", "進行中", "完了"])

 # 完了検査タブのウィジェットは専用関数に委譲
    kanryo_entries, kanryo_check_vars, text_kanryo_note = create_kanryo_tab(frame_kanryo)
    notebook.add(frame_kanryo, text="完了検査後")
    return {
            "body_frame": body_frame,
            "menu_frame": menu_frame,
            "right_frame": right_frame,
            "notebook": notebook,
            "entries": entries,
            "land_entries": land_entries,
            "building_entries": building_entries,
            "disaster_entries": disaster_entries,
            "right_entries": right_entries,
            "frame_jizen_basic": frame_jizen_basic,
            "frame_jizen_land": frame_jizen_land,
            "frame_jizen_building": frame_jizen_building,
            "frame_jizen_disaster": frame_jizen_disaster,
            "frame_juchu": frame_juchu,
            "frame_kessai": frame_kessai,
            "frame_kouji_kanri": frame_kouji_kanri,
            "frame_kanryo": frame_kanryo,
            "kanryo_entries": kanryo_entries,
            "kanryo_check_vars": kanryo_check_vars,
            "text_kanryo_note": text_kanryo_note
        }

def create_notes_section(parent):
    tk.Label(parent, text="連絡事項・備考欄", bg="#fdd", font=("Arial",11)).grid(row=13, column=0, sticky="w")
    text = tk.Text(parent, height=4, width=45, font=("Arial",12))
    text.grid(row=14, column=0, columnspan=2, sticky="w")
    return text

def create_request_type_section(parent):
    frame = tk.LabelFrame(parent, text="申請種類", bg="#fdd", font=("Arial", 11))
    frame.grid(row=12, column=0, columnspan=2, sticky="w", pady=(10, 0))

    types = [
        "確認申請", "工事監理", "プラン", "60条申請", "みなし道路協議", "地区計画",
        "29条申請", "43条申請", "長期優良住宅申請", "ZEH（BELS申請）", "GX基準（BELS申請）",
        "性能評価", "その他"
    ]
    vars = {}
    for i, name in enumerate(types):
        var = tk.BooleanVar(value=False)
        vars[name] = var
        cb = tk.Checkbutton(frame, text=name, variable=var, bg="#fdd", font=("Arial", 10))
        cb.grid(row=i//3, column=i%3, sticky="w", padx=5, pady=2)

    return frame, vars



def create_juchu_tab(frame):
    entries = {}

    def create_form_entry(parent, label, row, key, store_dict, is_date=False):
        tk.Label(parent, text=label, bg="white", font=("Arial", 11))\
            .grid(row=row*2, column=0, sticky="w", padx=20)
        if is_date:
            # DateEntry は検証無効化、起動時空欄、空白維持
            e = DateEntry(
                parent,
                width=18,
                font=("Arial", 12),
                date_pattern='yyyy-mm-dd',
                validate='none'
            )
            e.grid(row=row*2+1, column=0, sticky="w", padx=20, pady=(0, 10))
            e.delete(0, tk.END)
      
        else:
            # 通常の Entry
            e = tk.Entry(parent, width=45, font=("Arial", 12))
            e.grid(row=row*2+1, column=0, sticky="w", padx=20, pady=(0, 10))
        store_dict[key] = e

    create_form_entry(frame, "決済納期",   1, "entry_contract_price", entries, is_date=True)
    create_form_entry(frame, "見積金額",   2, "entry_estimate_amount", entries)
    create_form_entry(frame, "工事費用",   3, "entry_construction_cost", entries)

    tk.Label(frame, text="備考", bg="white", font=("Arial",11)).grid(row=10, column=0, sticky="w", padx=20)
    text = tk.Text(frame, height=4, width=45, font=("Arial",12))
    text.grid(row=11, column=0, padx=20, pady=(0,10))

    return entries, text

def create_kessai_tab(frame):
    entries = {}

    def create_form_entry(parent, label, row, key, store_dict, is_date=False):
        tk.Label(parent, text=label, bg="white", font=("Arial", 11))\
            .grid(row=row*2, column=0, sticky="w", padx=20)
        if is_date:
            # DateEntry は検証無効化、起動時空欄、空白維持
            e = DateEntry(
                parent,
                width=45,
                font=("Arial", 12),
                date_pattern='yyyy-mm-dd',
                validate='none'
            )
            e.grid(row=row*2+1, column=0, sticky="w", padx=20, pady=(0, 10))
            e.delete(0, tk.END)
            # フォーカスアウト後も空欄にする
         
        else:
            # 通常の Entry
            e = tk.Entry(parent, width=45, font=("Arial", 12))
            e.grid(row=row*2+1, column=0, sticky="w", padx=20, pady=(0, 10))
        store_dict[key] = e

    create_form_entry(frame, "決済日",       0, "entry_kessai_date", entries, is_date=True)
    create_form_entry(frame, "決済担当者",   1, "entry_kessai_staff", entries)
    create_form_entry(frame, "契約金額",     2, "entry_kessai_amount", entries)
    create_form_entry(frame, "支払条件",     3, "entry_kessai_terms", entries)

    lbl = tk.Label(frame, text="備考", bg="white", font=("Arial", 11))
    lbl.grid(row=10, column=0, sticky="w", padx=20)
    text = tk.Text(frame, height=4, width=45, font=("Arial", 12),
                   bd=2)
   # columnspan=1 にして、Entry と同じ indent で左揃え
    text.grid(row=11, column=0, sticky="w", padx=20, pady=(0, 10))

    return entries, text

def create_kouji_kanri_tab(frame):
    entries = {}

    def create_date_entry(label, row, key):
        tk.Label(frame, text=label, bg="white", font=("Arial",11)).grid(row=row*2, column=0, sticky="w", padx=20)
        e = DateEntry(
            frame,
            width=18,
            font=("Arial",12),
            date_pattern='yyyy-mm-dd',
            validate='none'
         )
        e.grid(row=row*2+1, column=0, sticky="w", padx=20, pady=(0,10))
      
        e.delete(0, tk.END)
        entries[key] = e

    create_date_entry("配筋検査予定日",  0, "entry_haikin_yotei")
    create_date_entry("配筋検査実施日",  1, "entry_haikin_jissi")
    create_date_entry("中間検査予定日",  2, "entry_chukan_yotei")
    create_date_entry("中間検査実施日",  3, "entry_chukan_jissi")
    create_date_entry("完了検査予定日",  4, "entry_kanryo_yotei")
    create_date_entry("完了検査実施日",  5, "entry_kanryo_jissi")

    return entries

def create_kanryo_tab(frame):
    """
    完了検査タブの
      ・DateEntry ウィジェット辞書 entries
      ・BooleanVar 辞書 check_vars
      ・Text ウィジェット text_note
    の３つを返します。
    """
    # ──────────── DateEntry 部分 ────────────
    entries = {}
    def create_date_entry(label_text, row, key):
        tk.Label(frame, text=label_text, bg="white", font=("Arial", 11))\
            .grid(row=row*3, column=0, sticky="w", padx=20, pady=(10,0))
        e = DateEntry(
            frame,
            width=18,
            font=("Arial", 12),
            date_pattern='yyyy-mm-dd',
            validate='none'
         )
        e.grid(row=row*3+1, column=0, sticky="w", padx=20, pady=(0, 10))
    
        e.delete(0, tk.END)
        entries[key] = e

    # 検査実施日
    create_date_entry("検査実施日", 0, "entry_inspection_date")
    # 完了報告日
    create_date_entry("完了報告日", 1, "entry_final_report_date")

    # ──────────── 検査結果 ────────────
    tk.Label(frame, text="検査結果", bg="white", font=("Arial", 11))\
        .grid(row=2*3, column=0, sticky="w", padx=20)
    entry_inspection_result = tk.Entry(frame, width=45, font=("Arial", 12))
    entry_inspection_result.grid(row=2*3+1, column=0, sticky="w", padx=20, pady=(0,10))
    entries["entry_inspection_result"] = entry_inspection_result

    # ──────────── Checkbutton 部分 ────────────
    check_vars = {
        "確認申請書の返却":      tk.BooleanVar(value=False),
        "工事監理報告書の送付":  tk.BooleanVar(value=False),
        "返却物の確認":          tk.BooleanVar(value=False),
    }
    tk.Checkbutton(frame, text="確認申請書の返却",      variable=check_vars["確認申請書の返却"])\
        .grid(row=8, column=0, sticky="w", padx=20, pady=(5,2))
    tk.Checkbutton(frame, text="返却物の確認",          variable=check_vars["返却物の確認"])\
        .grid(row=9, column=0, sticky="w", padx=20, pady=(5,2))
    tk.Checkbutton(frame, text="工事監理報告書の送付",  variable=check_vars["工事監理報告書の送付"])\
        .grid(row=10, column=0, sticky="w", padx=20, pady=(5,2))


    # ──────────── 是正内容 ────────────
    tk.Label(frame, text="是正内容", bg="white", font=("Arial", 11))\
        .grid(row=11, column=0, sticky="w", padx=20)
    entry_corrections = tk.Entry(frame, width=30, font=("Arial", 12))
    entry_corrections.grid(row=12, column=0, sticky="w", padx=20, pady=(0,10))
    entries["entry_corrections"] = entry_corrections

    # ──────────── 完了メモ Text 部分 ────────────
    tk.Label(frame, text="完了メモ:", bg="white", font=("Arial", 11))\
        .grid(row=13, column=0, sticky="w", padx=20, pady=(10,0))
    text_note = tk.Text(frame, height=4, width=40, font=("Arial", 12))
    text_note.grid(row=14, column=0, columnspan=2, padx=20, pady=(0,10), sticky="w")

    return entries, check_vars, text_note
