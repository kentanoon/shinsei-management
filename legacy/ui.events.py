# ui/events.py

import tkinter as tk
from tkinter import messagebox
from datetime import datetime
import sqlite3
import os
from dotenv import load_dotenv

# .env の読み込みと DB パス
load_dotenv()
DB_PATH = os.getenv("DB_PATH")


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

    # 申請チェック
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
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan,
            contract_price, estimate_amount, construction_cost, juchu_note,
            kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note,
            has_kofu, has_yoteihyo, has_fukuzu, has_kanamono, has_seikyu, has_shoene, has_kessai_data,
            haikin_yotei_date, haikin_date, chukan_yotei_date, chukan_date, kanryo_yotei_date, kanryo_date, kouji_memo,
            kanryo_inspection_date, kanryo_result, kanryo_correction, kanryo_final_report, kanryo_note,
            has_return_confirm, has_report_sent, has_returned_items
        )
        VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """

        # 値の準備
        params = [
            project_code, project_name, input_date
        ] + jizen_vals + [
            client_name, client_stuff, request_type, status, note
        ] + land_vals + building_vals + [
            sh_60, sh_minado, sh_chiku, sh_29, sh_43, sh_choki, sh_zeh, sh_gx, sh_seinou, sh_other,
            confirmation, supervision, plan
        ]

        # 受注後
        contract_price = juchu_entries["entry_contract_price"].get()
        estimate_amount = juchu_entries["entry_payment_terms"].get()
        construction_cost = juchu_entries["entry_payment_terms"].get()
        juchu_note = text_juchu_note.get("1.0", tk.END).strip()
        params += [contract_price, estimate_amount, construction_cost, juchu_note]

        # 決済後
        kessai_date = kessai_entries["entry_kessai_date"].get_date().strftime("%Y-%m-%d")
        kessai_staff = kessai_entries["entry_kessai_staff"].get()
        kessai_amount = kessai_entries["entry_kessai_amount"].get()
        kessai_terms = kessai_entries["entry_kessai_terms"].get()
        kessai_note = text_kessai_note.get("1.0", tk.END).strip()
        params += [kessai_date, kessai_staff, kessai_amount, kessai_terms, kessai_note]
        params += [int(kessai_check_vars[k].get()) for k in [
            "交付申請書", "検査予定表", "基礎伏図", "金物図", "請求書", "省エネ計算書", "決済データ"
        ]]

        # 工事監理
        params += [
            kouji_kanri_entries[k].get_date().strftime("%Y-%m-%d") for k in [
                "entry_haikin_yotei", "entry_haikin_jissi",
                "entry_chukan_yotei", "entry_chukan_jissi",
                "entry_kanryo_yotei", "entry_kanryo_jissi"
            ]
        ]
        kouji_memo = text_kouji_memo.get("1.0", tk.END).strip()
        params.append(kouji_memo)

        # 完了検査後
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
        conn.commit()

        messagebox.showinfo("登録完了", f"管理番号 {project_code} を登録しました。")
        clear_form_func()

    except sqlite3.IntegrityError:
        messagebox.showerror("登録エラー", "この管理番号はすでに存在しています。")
    finally:
        conn.close()
