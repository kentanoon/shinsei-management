# ui/events.py

import tkinter as tk
from tkinter import messagebox
from datetime import datetime, date
import sqlite3
import os
from dotenv import load_dotenv

# .env の読み込みと DB パス
load_dotenv()
DB_PATH = os.getenv("DB_PATH")

# モジュール外で共有される一覧ウィンドウを記憶
list_window = None

__all__ = [
    "register_project", "update_project", "delete_project", "show_project_list", "clear_form"
]

def is_db_readonly(path):
    return not os.access(path, os.W_OK)



def register_project(
    widgets, entries, land_entries, building_entries, disaster_entries,
    request_vars, juchu_entries, text_juchu_note,
    kessai_entries, kessai_check_vars, text_kessai_note,
    kouji_kanri_entries, text_kouji_memo,
    kanryo_entries, kanryo_check_vars, text_kanryo_note,
    clear_form_func, generate_project_code_func
):
    if is_db_readonly(DB_PATH):
        messagebox.showerror("保存エラー", "このデータベースは読み取り専用です。保存できません。")
        return
    
    project_code = generate_project_code_func()
    project_name = widgets["entry_project_name"].get().strip()
    if not project_name:
        messagebox.showwarning("入力エラー", "工事名称は必須です。")
        return

    if "entry_input_date" not in entries or not hasattr(entries["entry_input_date"], "get_date"):
        messagebox.showerror("エラー", "日付入力フィールド 'entry_input_date' が正しく初期化されていません。")
        return

    input_date = entries["entry_input_date"].get_date().strftime("%Y-%m-%d")

    jizen_vals = [entries[k].get() for k in [
        "entry_owner_name", "entry_owner_kana", "entry_owner_zip",
        "entry_owner_address", "entry_owner_phone", "entry_joint_name", "entry_joint_kana"
    ]]
    client_name = widgets["combo_client"].get()
    client_stuff = widgets["entry_client_stuff"].get()
    request_type = ""
    status = widgets["combo_status"].get() or "作成中"
    note = widgets["text_note"].get("1.0", tk.END).strip()
    land_vals = [land_entries[k].get() for k in [
        "entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning",
        "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"
    ]]
    building_vals = [building_entries[k].get() for k in [
        "entry_building_name", "entry_construction_type", "entry_primary_use",
        "entry_structure", "entry_floors", "entry_max_height",
        "entry_total_area", "entry_building_area"
    ]]

    disaster_vals = [disaster_entries[k].get() for k in [
        "entry_landslide_alert", "entry_flood_zone", "entry_tsunami_zone"
    ]]    
    
    def checked(name): return "申請" if request_vars[name].get() else "未定"
    sh_60 = checked("60条申請")
    sh_minado = checked("みなし道路協議")
    sh_chiku = checked("地区計画")
    sh_29 = checked("29条申請")
    sh_43 = checked("43条申請")
    sh_choki = checked("長期優良住宅申請")
    sh_zeh = checked("ZEH（BELS申請）")
    sh_gx = checked("GX基準（BELS申請）")
    sh_seinou = checked("性能評価")
    sh_other = checked("その他")
    confirmation = checked("確認申請")
    supervision = checked("工事監理")
    plan = checked("プラン")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        sql = """
        INSERT INTO projects_new (
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
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """

        params = [
            project_name, input_date
        ] + jizen_vals + [
            client_name, client_stuff, request_type, status, note
        ] + land_vals + building_vals + disaster_vals + [
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan
        ]

        contract_price = juchu_entries["entry_contract_price"].get()
        estimate_amount = juchu_entries["entry_estimate_amount"].get()
        construction_cost = juchu_entries["entry_construction_cost"].get()
        juchu_note = text_juchu_note.get("1.0", tk.END).strip()
        params += [contract_price, estimate_amount, construction_cost, juchu_note]

        kessai_date = kessai_entries["entry_kessai_date"].get_date().strftime("%Y-%m-%d")
        kessai_staff = kessai_entries["entry_kessai_staff"].get()
        kessai_amount = kessai_entries["entry_kessai_amount"].get()
        kessai_terms = kessai_entries["entry_kessai_terms"].get()
        kessai_note = text_kessai_note.get("1.0", tk.END).strip()
        params += [kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note]
        params += [int(kessai_check_vars[k].get()) for k in [
            "交付申請書", "検査予定表", "基礎伏図", "金物図", "請求書", "省エネ計算書", "決済データ"
        ]]

        params += [
            kouji_kanri_entries[k].get_date().strftime("%Y-%m-%d") for k in [
                "entry_haikin_yotei", "entry_haikin_jissi",
                "entry_chukan_yotei", "entry_chukan_jissi",
                "entry_kanryo_yotei", "entry_kanryo_jissi"
            ]
        ]
        kouji_memo = text_kouji_memo.get("1.0", tk.END).strip()
        params.append(kouji_memo)

        kanryo_inspection_date = kanryo_entries["entry_inspection_date"].get_date().strftime("%Y-%m-%d")
        kanryo_result = kanryo_entries["entry_inspection_result"].get()
        kanryo_correction = kanryo_entries["entry_corrections"].get()
        kanryo_final_report = kanryo_entries["entry_final_report_date"].get_date().strftime("%Y-%m-%d")
        kanryo_note = text_kanryo_note.get("1.0", tk.END).strip()
        params += [kanryo_inspection_date, kanryo_result, kanryo_correction, kanryo_final_report, kanryo_note]
        params += [int(kanryo_check_vars[k].get()) for k in [
            "確認申請書の返却", "工事監理報告書の送付", "返却物の確認"
        ]]

        cursor.execute(sql, params)
        print(f"DEBUG: update_project → cursor.rowcount = {cursor.rowcount}")
        conn.commit()
        messagebox.showinfo("登録完了", f"管理番号 {project_code} を登録しました。")
        clear_form_func()

    except sqlite3.IntegrityError:
        messagebox.showerror("登録エラー", "この管理番号はすでに存在しています。")
    finally:
        conn.close()


def update_project(
    widgets, entries, land_entries, building_entries, disaster_entries,
    request_vars, juchu_entries, text_juchu_note,
    kessai_entries, kessai_check_vars, text_kessai_note,
    kouji_kanri_entries, text_kouji_memo,
    kanryo_entries, kanryo_check_vars, text_kanryo_note,
    DB_PATH
):
    # DB が書き込み不可なら中断
    if is_db_readonly(DB_PATH):
        messagebox.showerror("保存エラー", "このデータベースは読み取り専用です。保存できません。")
        return

    # ─── デバッグ: project_code が正しく取れているか確認 ───
    project_code = widgets["entry_management_no"].get().strip()
    print(f"DEBUG: update_project 取得 project_code = [{project_code}]")

     # ─── デバッグ: DB にそのレコードがあるか確認 ───
    conn_dbg = sqlite3.connect(DB_PATH)
    cur_dbg  = conn_dbg.cursor()
    cur_dbg.execute(
         "SELECT COUNT(*) FROM projects_new WHERE project_code=?",
        (project_code,)
     )
    cnt = cur_dbg.fetchone()[0]
    conn_dbg.close()
    print(f"DEBUG: projects_new に {project_code} のレコード数 = {cnt}")

    # 必須フィールドの取得・チェック
    project_code = widgets["entry_management_no"].get().strip()
    project_name = widgets["entry_project_name"].get().strip()
    if not project_code or not project_name:
        messagebox.showwarning("入力エラー", "管理番号と工事名称は必須です。")
        return

    # 入力日
    input_date = entries["entry_input_date"].get_date().strftime("%Y-%m-%d")

    # 施主情報
    jizen_vals = [entries[k].get() for k in [
        "entry_owner_name", "entry_owner_kana", "entry_owner_zip",
        "entry_owner_address", "entry_owner_phone",
        "entry_joint_name", "entry_joint_kana"
    ]]
    owner_name, owner_kana, owner_zip, owner_address, owner_phone, joint_name, joint_kana = jizen_vals

    # 敷地情報
    land_vals = [land_entries[k].get() for k in [
        "entry_site_address", "entry_land_area", "entry_city_plan", "entry_zoning",
        "entry_fire_zone", "entry_slope_limit", "entry_setback", "entry_other_buildings"
    ]]
    site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings = land_vals

    # 建物情報
    building_vals = [building_entries[k].get() for k in [
        "entry_building_name", "entry_construction_type", "entry_primary_use",
        "entry_structure", "entry_floors", "entry_max_height",
        "entry_total_area", "entry_building_area"
    ]]
    building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area = building_vals

    # ─── ここで disaster_vals を定義 ───
    # 災害タブの各エントリから値を取得
    # disaster_entries は layout.py で定義したウィジェットの辞書です
    disaster_vals = [
        disaster_entries["entry_landslide_alert"].get(),
        disaster_entries["entry_flood_zone"].get(),
        disaster_entries["entry_tsunami_zone"].get()
    ]
    # ──────────────────────────────────
    # 発注者・ステータス・備考
    client_name  = widgets["combo_client"].get()
    client_stuff = widgets["entry_client_stuff"].get()
    request_type = ""  # 未使用
    status       = widgets["combo_status"].get()
    note         = widgets["text_note"].get("1.0", tk.END).strip()

    # 各種申請フラグ
    def checked(name): return "申請" if request_vars[name].get() else "未定"
    confirmation = checked("確認申請")
    supervision  = checked("工事監理")
    plan         = checked("プラン")
    sh_60        = checked("60条申請")
    sh_minado    = checked("みなし道路協議")
    sh_chiku     = checked("地区計画")
    sh_29        = checked("29条申請")
    sh_43        = checked("43条申請")
    sh_choki     = checked("長期優良住宅申請")
    sh_zeh       = checked("ZEH（BELS申請）")
    sh_gx        = checked("GX基準（BELS申請）")
    sh_seinou    = checked("性能評価")
    sh_other     = checked("その他")
    confirmation = checked("確認申請")
    supervision  = checked("工事監理")
    


    # 受注後データ
    contract_price    = juchu_entries["entry_contract_price"].get()
    estimate_amount   = juchu_entries["entry_estimate_amount"].get()
    construction_cost = juchu_entries["entry_construction_cost"].get()
    juchu_note        = text_juchu_note.get("1.0", tk.END).strip()

    # 決済後データ
    kessai_date  = kessai_entries["entry_kessai_date"].get_date().strftime("%Y-%m-%d")
    kessai_staff = kessai_entries["entry_kessai_staff"].get()
    kessai_amount= kessai_entries["entry_kessai_amount"].get()
    kessai_terms = kessai_entries["entry_kessai_terms"].get()
    kessai_note  = text_kessai_note.get("1.0", tk.END).strip()
    has_kofu         = int(kessai_check_vars["交付申請書"].get())
    has_yoteihyo     = int(kessai_check_vars["検査予定表"].get())
    has_fukuzu       = int(kessai_check_vars["基礎伏図"].get())
    has_kanamono     = int(kessai_check_vars["金物図"].get())
    has_seikyu       = int(kessai_check_vars["請求書"].get())
    has_shoene       = int(kessai_check_vars["省エネ計算書"].get())
    has_kessai_data  = int(kessai_check_vars["決済データ"].get())

    # 工事監理データ
    haikin_yotei_date = kouji_kanri_entries["entry_haikin_yotei"].get_date().strftime("%Y-%m-%d")
    haikin_date       = kouji_kanri_entries["entry_haikin_jissi"].get_date().strftime("%Y-%m-%d")
    chukan_yotei_date = kouji_kanri_entries["entry_chukan_yotei"].get_date().strftime("%Y-%m-%d")
    chukan_date       = kouji_kanri_entries["entry_chukan_jissi"].get_date().strftime("%Y-%m-%d")
    kanryo_yotei_date = kouji_kanri_entries["entry_kanryo_yotei"].get_date().strftime("%Y-%m-%d")
    kanryo_date       = kouji_kanri_entries["entry_kanryo_jissi"].get_date().strftime("%Y-%m-%d")
    kouji_memo        = text_kouji_memo.get("1.0", tk.END).strip()

    # 完了検査後データ
    kanryo_inspection_date = kanryo_entries["entry_inspection_date"].get_date().strftime("%Y-%m-%d")
    kanryo_result          = kanryo_entries["entry_inspection_result"].get()
    kanryo_correction      = kanryo_entries["entry_corrections"].get()
    kanryo_final_report    = kanryo_entries["entry_final_report_date"].get_date().strftime("%Y-%m-%d")
    kanryo_note            = text_kanryo_note.get("1.0", tk.END).strip()
    has_return_confirm     = int(kanryo_check_vars["確認申請書の返却"].get())
    has_report_sent        = int(kanryo_check_vars["工事監理報告書の送付"].get())
    has_returned_items     = int(kanryo_check_vars["返却物の確認"].get())

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        sql = """
        UPDATE projects_new SET
            project_name = ?, input_date = ?,
            owner_name = ?, owner_kana = ?, owner_zip = ?, owner_address = ?, owner_phone = ?,
            joint_name = ?, joint_kana = ?,
            client_name = ?, client_stuff = ?, request_type = ?, status = ?, note = ?,
            site_address = ?, land_area = ?, city_plan = ?, zoning = ?, fire_zone = ?, slope_limit = ?, setback = ?, other_buildings = ?,
            building_name = ?, construction_type = ?, primary_use = ?, structure = ?, floors = ?, max_height = ?, total_area = ?, building_area = ?,
            landslide_alert = ?, flood_zone = ?, tsunami_zone = ?,
            sh_60 = ?, sh_minado = ?, sh_chiku = ?, sh_29 = ?, sh_43 = ?, sh_choki = ?, sh_zeh = ?, sh_gx = ?, sh_seinou = ?, sh_other = ?,
            confirmation = ?, supervision = ?, plan = ?,
            contract_price = ?, estimate_amount = ?, construction_cost = ?, juchu_note = ?,
            kessai_date = ?, kessai_staff = ?, kessai_amount = ?, kessai_terms = ?, kessai_note = ?,
            has_kofu = ?, has_yoteihyo = ?, has_fukuzu = ?, has_kanamono = ?, has_seikyu = ?, has_shoene = ?, has_kessai_data = ?,
            haikin_yotei_date = ?, haikin_date = ?, chukan_yotei_date = ?, chukan_date = ?, kanryo_yotei_date = ?, kanryo_date = ?, kouji_memo = ?,
            kanryo_inspection_date = ?, kanryo_result = ?, kanryo_correction = ?, kanryo_final_report = ?, kanryo_note = ?,
            has_return_confirm = ?, has_report_sent = ?, has_returned_items = ?
        WHERE project_code = ?
        """
        
        params = (
        # 基本情報
        [
            project_name, input_date,
            owner_name, owner_kana, owner_zip, owner_address, owner_phone,
            joint_name, joint_kana,
            client_name, client_stuff, request_type, status, note,
            site_address, land_area, city_plan, zoning, fire_zone, slope_limit, setback, other_buildings,
            building_name, construction_type, primary_use, structure, floors, max_height, total_area, building_area
        ]
        + disaster_vals

        # 申請フラグ
        + [sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
           confirmation, supervision, plan,
        ]
        # 受注後タブ
        + [contract_price, estimate_amount, construction_cost, juchu_note,
        ]
        # 決済後タブ
        + [kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note,
           int(kessai_check_vars["交付申請書"].get()),
           int(kessai_check_vars["検査予定表"].get()),
           int(kessai_check_vars["基礎伏図"].get()),
           int(kessai_check_vars["金物図"].get()),
           int(kessai_check_vars["請求書"].get()),
           int(kessai_check_vars["省エネ計算書"].get()),
           int(kessai_check_vars["決済データ"].get()),
        ]
        # 工事監理タブ
        + [
            *[kouji_kanri_entries[k].get_date().strftime("%Y-%m-%d") for k in [
                "entry_haikin_yotei", "entry_haikin_jissi",
                "entry_chukan_yotei", "entry_chukan_jissi",
                "entry_kanryo_yotei", "entry_kanryo_jissi",
            ]],
            text_kouji_memo.get("1.0", tk.END).strip(),
        ]
        # 完了検査後タブ
        + [
            kanryo_inspection_date, kanryo_result, kanryo_correction, kanryo_final_report, kanryo_note,
            int(kanryo_check_vars["確認申請書の返却"].get()),
            int(kanryo_check_vars["工事監理報告書の送付"].get()),
            int(kanryo_check_vars["返却物の確認"].get()),
        ]
        # WHERE 用 project_code
        + [project_code]
        )
        cursor.execute(sql, params)
        conn.commit()
        messagebox.showinfo("更新完了", f"管理番号 {project_code} を更新しました。")
    except sqlite3.IntegrityError:
        messagebox.showerror("更新エラー", "データの更新に失敗しました。")
    finally:
        conn.close()


def delete_project(widgets, clear_form_func):
    project_code = widgets["entry_management_no"].get().strip()
    if not project_code:
        messagebox.showwarning("削除エラー", "管理番号未設定")
        return

    if messagebox.askyesno("確認", f"{project_code} を削除しますか?"):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM projects_new WHERE project_code=?", (project_code,))
        conn.commit()
        conn.close()
        messagebox.showinfo("削除完了", f"管理番号 {project_code} を削除しました。")
        clear_form_func()

def show_project_list(root, DB_PATH, load_selected_callback):
    global list_window
    if list_window is not None and list_window.winfo_exists():
        list_window.lift()
        return

    list_window = tk.Toplevel(root)
    list_window.title("案件一覧")

    listbox = tk.Listbox(list_window, font=("Arial", 11), width=45)
    listbox.pack(padx=10, pady=10, fill="both", expand=True)
    listbox.bind("<<ListboxSelect>>", load_selected_callback)

    def refresh_list():
        listbox.delete(0, tk.END)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT project_code, project_name FROM projects_new ORDER BY id DESC")
        for c, n in cursor.fetchall():
            listbox.insert(tk.END, f"{c}｜{n}")
        conn.close()
        list_window.after(10000, refresh_list)

    refresh_list()

def clear_form(widgets, entries, land_entries, building_entries, disaster_entries,
               request_vars, juchu_entries, text_juchu_note,
               kessai_entries, kessai_check_vars, text_kessai_note,
               kouji_kanri_entries, text_kouji_memo,
               kanryo_entries, kanryo_check_vars, text_kanryo_note):
    widgets.get("entry_management_no", tk.Entry()).delete(0, tk.END)
    widgets.get("entry_project_name", tk.Entry()).delete(0, tk.END)
    widgets.get("combo_client", tk.StringVar()).set("")
    if "entry_client_stuff" in widgets:
        widgets["entry_client_stuff"].delete(0, tk.END)
    widgets.get("combo_status", tk.StringVar()).set("")
    widgets.get("text_note", tk.Text()).delete("1.0", tk.END)

     # ── 入力日(DateEntry)を今日の日付にリセット ───────────
    if "entry_input_date" in entries:
        # DateEntry自身のdeleteを呼び出して一度クリアし、
        # そのあと今日の日付をセットします
        entries["entry_input_date"].delete(0, tk.END)
        entries["entry_input_date"].set_date(date.today())

    # ── 施主情報などの基本エントリをクリア ──────────────────
    for e in entries.values():
        e.delete(0, tk.END)
    

    for e in land_entries.values():
        e.delete(0, tk.END)
    for e in building_entries.values():
        e.delete(0, tk.END)
    for e in disaster_entries.values():
        e.delete(0, tk.END)

    for var in request_vars.values():
        var.set(0)

    for e in juchu_entries.values():
        e.delete(0, tk.END)
    text_juchu_note.delete("1.0", tk.END)

    for e in kessai_entries.values():
        e.delete(0, tk.END)

    for var in kessai_check_vars.values():
        var.set(0)
    text_kessai_note.delete("1.0", tk.END)

    for e in kouji_kanri_entries.values():
        e.delete(0, tk.END)


    text_kouji_memo.delete("1.0", tk.END)

    for e in kanryo_entries.values():
        e.delete(0, tk.END)

    for var in kanryo_check_vars.values():
        var.set(0)
    text_kanryo_note.delete("1.0", tk.END)

    # 管理番号フィールドも空にする
    widgets.get("entry_management_no", tk.Entry()).config(state="normal")
    widgets.get("entry_management_no", tk.Entry()).delete(0, tk.END)
    widgets.get("entry_management_no", tk.Entry()).config(state="readonly")