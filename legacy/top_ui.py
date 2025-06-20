import tkinter as tk
from tkinter import ttk, messagebox
from tkcalendar import Calendar
import subprocess
from datetime import datetime, timedelta
import sqlite3
import csv
import os
# top_ui.py の先頭付近
open_windows = {}
script_procs = {}    # ← ここを追加



DB_PATH = r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\application.db"
CSV_PATH = r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\company_holidays_2025.csv"  
TEMPLATE_DIR = r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\提出書類テンプレート"
SCRIPT_DIR = r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\テンプレ処理スクリプト"

# --- テンプレートとスクリプトの対応表（ここでテンプレと.pyを紐付け）---
TEMPLATE_TO_SCRIPT = {
    "案件概要書.xlsm": "akengaiyosyo.py",
    "工事監理記録簿.xlsm": "supervision_log.py",
    "重要事項説明書.xlsm": "juyozikosetsumesho.py",
    # 必要に応じてここに追加
}
# 
# タ・休日関連関数
# ============================
def load_holidays():
    holidays = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, newline='', encoding="cp932") as f:
            reader = csv.DictReader(f)
            for row in reader:
                date_str = row["date"]
                name = row["label"]  # 正しい列名に修正
                try:
                    holidays[datetime.strptime(date_str, "%Y/%m/%d").date()] = name
                except:
                    continue
    return holidays

# --- データ取得関数 ---
def get_recent_projects(limit=5):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT project_code, project_name FROM projects ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_alerts():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    alerts = []
    cursor.execute("SELECT project_code FROM projects WHERE status='' OR status IS NULL")
    for row in cursor.fetchall():
        alerts.append(f"⚠️ {row[0]}：ステータス未設定")
    conn.close()
    return alerts[:5]

# ============================
# アプリ起動・テンプレート処理
# ============================

# --- 起動関数 ---
def open_application_input():
    # ── ① 同種ウィンドウ（プロセス）が既に起動中ならダイアログを出して終了 ──
    key = "application_input"
    proc = script_procs.get(key)
    if proc and proc.poll() is None:
        messagebox.showinfo("Info", "申請情報の入力画面は既に開いています")
        return

    # ── ② 起動 ──
    try:
        import subprocess
        # プロセスを起動して、辞書に保持
        p = subprocess.Popen([
            "python",
            r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\main_ui.py"
        ])
        script_procs[key] = p

    except Exception as e:
        messagebox.showerror(
            "エラー",
            f"申請情報画面の起動に失敗しました：\n{e}"
        )

        # --- 見積書・請求書入力画面起動 ---
def open_見積作成_input():
    try:
        subprocess.Popen(["python", r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\見積作成_ui.py"])
    except Exception as e:
        messagebox.showerror("エラー", f"見積書・請求書画面の起動に失敗しました：\n{e}")

def open_new_case():
    try:
        subprocess.Popen(["python", r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\new_case.py"])
    except Exception as e:
        messagebox.showerror("エラー", f"申請案件画面の起動に失敗しました：\n{e}")

def open_kanri_case():
    try:
        subprocess.Popen(["python", r"G:\マイドライブ\5-01_業務シートテンプレ\申請管理システム\kanri_case.py"])
    except Exception as e:
        messagebox.showerror("エラー", f"監理案件画面の起動に失敗しました：\n{e}")


def open_template_selector():
    # ── ① 同種ウィンドウが既にあれば持ち上げて終了 ──
    key = "template_selector"
    if key in open_windows and open_windows[key].winfo_exists():
        open_windows[key].lift()
        return

    # ── ② 新規ウィンドウ生成 ──
    selector = tk.Toplevel(root)
    selector.title("📂 テンプレート選択")
    selector.geometry("500x200")

    # ── 辞書に登録 ──
    open_windows[key] = selector

    # ── 閉じたときに辞書から削除 ──
    def _on_close():
        open_windows.pop(key, None)
        selector.destroy()
    selector.protocol("WM_DELETE_WINDOW", _on_close)

    # ── ③ UI 部分 ──
    tk.Label(selector, text="出力テンプレートを選択してください", font=("Arial", 12)).pack(pady=10)
    template_var = tk.StringVar()
    template_combo = ttk.Combobox(selector, textvariable=template_var, width=50)
    template_combo['values'] = list(TEMPLATE_TO_SCRIPT.keys())
    template_combo.pack(pady=10)

    # ── ④ ボタン＆スクリプト実行ロジック ──
    def launch_script():
        template_filename = template_var.get()
        if not template_filename:
            messagebox.showwarning("未選択", "テンプレートを選んでください")
            return

        script_filename = TEMPLATE_TO_SCRIPT.get(template_filename)
        if not script_filename:
            messagebox.showerror("エラー", f"対応スクリプトが設定されていません：\n{template_filename}")
            return

        script_path = os.path.join(SCRIPT_DIR, script_filename)
        if not os.path.isfile(script_path):
            messagebox.showerror("エラー", f"スクリプトが見つかりません：\n{script_path}")
            return

        subprocess.Popen(["python", script_path])
        # 実行後はウィンドウを閉じる
        selector.destroy()

    tk.Button(
        selector,
        text="▶ 実行",
        command=launch_script,
        font=("Arial", 11, "bold")
    ).pack(pady=15)


# ============================
# メインウィンドウ構築
# ============================

# --- UI構築 ---
root = tk.Tk()
root.title("確認申請管理システム - TOP")
root.geometry("1200x750")
root.configure(bg="#fff")

# --- 検索バー（上部） ---
search_frame = tk.Frame(root, bg="#fff")
search_frame.pack(fill="x", pady=(10, 0))
tk.Label(search_frame, text="🔍 管理番号・施主名で検索", font=("Arial", 14, "bold"), bg="#fff").pack(side="left", padx=(20, 10))
tk.Entry(search_frame, font=("Arial", 14), width=40).pack(side="left", pady=5)

# --- メイン領域 ---
main_frame = tk.Frame(root, bg="#fff")
main_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))

# --- 左：メニュー ---
menu_frame = tk.Frame(main_frame, bg="#eef")
menu_frame.pack(side="left", fill="y", padx=(10, 10), pady=10)

btn_config = {
    "font": ("Arial", 12, "bold"),
    "width": 25,
    "height": 2,
    "padx": 5,
    "pady": 10
}

opened_window = None  # 一度に1つのウィンドウだけ表示用変数

def show_single_window(title):
    global opened_window
    if opened_window is not None and opened_window.winfo_exists():
        opened_window.lift()
        return

    opened_window = tk.Toplevel(root)
    opened_window.title(title)
    opened_window.geometry("400x300")
    tk.Label(opened_window, text=f"これは『{title}』ウィンドウです。", font=("Arial", 14)).pack(expand=True, pady=50)
    tk.Button(opened_window, text="閉じる", command=opened_window.destroy).pack(pady=10)

    def on_close():
        global opened_window
        opened_window = None

    opened_window.protocol("WM_DELETE_WINDOW", on_close)

buttons = [
    ("🏠 申請情報の入力", open_application_input),
    ("📋 見積書・請求書の作成", open_見積作成_input),
    ("📊 進捗・工程管理", lambda: messagebox.showinfo("未実装", "この機能はまだ未実装です")),
    ("📝 確認申請　出力書類", open_template_selector),
    ("♻️ 性能申請　出力書類", lambda: messagebox.showinfo("未実装", "この機能はまだ未実装です")),
    ("🚧  工事台帳", lambda: messagebox.showinfo("未実装", "この機能はまだ未実装です")),
]

for txt, cmd in buttons:
    tk.Button(menu_frame, text=txt, command=cmd, anchor="w", **btn_config).pack(pady=5, anchor="w")

# --- 中央エリア（center_frame）定義 ---
center_frame = tk.Frame(main_frame, bg="#fff")
center_frame.pack(side="left", expand=True, fill="both", padx=(0, 20), pady=10)

# --- お知らせ・通知 ---
tk.Label(center_frame, text="🔔 お知らせ・通知", font=("Arial", 13, "bold"), bg="#fff").pack(anchor="w")
alert_frame = tk.Frame(center_frame, bg="#fff")
alert_frame.pack(anchor="w", fill="x")
for alert in get_alerts():
    tk.Label(alert_frame, text=alert, font=("Arial", 11), fg="red", bg="#fff").pack(anchor="w")

# --- 最近の案件 ---
tk.Label(center_frame, text="📝 最近操作した案件", font=("Arial", 13, "bold"), bg="#fff", pady=10).pack(anchor="w")
recent_frame = tk.Frame(center_frame, bg="#fff")
recent_frame.pack(anchor="w")
for code, name in get_recent_projects():
    tk.Label(recent_frame, text=f"{code}：{name}", font=("Arial", 11), fg="blue", bg="#fff", cursor="hand2").pack(anchor="w")

# --- サマリー ---
tk.Label(center_frame, text="📊 案件状況サマリー", font=("Arial", 13, "bold"), bg="#fff", pady=10).pack(anchor="w")
tk.Label(center_frame, text="申請中：12件｜完了：8件｜停止：2件", font=("Arial", 11), bg="#fff").pack(anchor="w")

# --- 案件種別ボタン（中央に正方形で配置） ---
tk.Label(center_frame, text="案件種別", font=("Arial", 13, "bold"), bg="#fff", pady=15).pack()
case_button_frame = tk.Frame(center_frame, bg="#fff")
case_button_frame.pack()

tk.Button(
    case_button_frame,
    text="📝\n申請案件",
    font=("Arial", 12, "bold"),
    width=10,
    height=5,
    bg="#cce5ff",
    fg="black",
    relief="raised",
    bd=2,
    command=open_new_case  # ✅←これが変更ポイント！
).pack(side="left", padx=20, pady=10)


tk.Button(
    case_button_frame,
    text="📋\n監理案件",
    font=("Arial", 12, "bold"),  # ← これがエラーの元にならないように
    width=10,
    height=5,
    bg="#d4edda",
    fg="black",
    relief="raised",
    bd=2,
    command=open_kanri_case
).pack(side="left", padx=20, pady=10)



# --- 右：カレンダー ---
calendar_frame = tk.Frame(main_frame, bg="#fff")
calendar_frame.pack(side="right", anchor="n", padx=(0, 20), pady=(10, 0))

tk.Label(calendar_frame, text="📅 工程カレンダー", font=("Arial", 13, "bold"), bg="#fff").pack(anchor="w", pady=(0, 5))
calendar = Calendar(calendar_frame, selectmode='day',
                    year=datetime.now().year,
                    month=datetime.now().month,
                    day=datetime.now().day,
                    font=("メイリオ", 14),
                    foreground="black",
                    background="#fffff0",
                    selectbackground="#ff6666",
                    selectforeground="white",
                    weekendbackground="#e6f2ff",
                    weekendforeground="blue",
                    headersbackground="#c0c0c0",
                    headersforeground="black",
                    normalbackground="#fffff0",
                    normalforeground="black",
                   
                   )
                                      
calendar.pack()

def go_to_today():
    today = datetime.today()
    calendar.selection_set(today)
    calendar.see(today)

tk.Button(calendar_frame, text="📅 今日に戻る", command=go_to_today,
          font=("Arial", 11), bg="#eef", relief="solid", bd=1).pack(pady=10)

# --- カレンダーの色付け ---
def mark_calendar(cal, holidays):
    today = datetime.today().date()  # ← 今日を取得
    year = cal.selection_get().year if cal.selection_get() else datetime.today().year
    for month in range(1, 13):
        for day in range(1, 32):
            try:
                date = datetime(year, month, day).date()
                weekday = date.weekday()
                if date == today:
                    cal.calevent_create(date, '今日', 'today')
                elif date in holidays:
                    cal.calevent_create(date, holidays[date], 'holiday')
                elif weekday == 6:  # 日曜
                    cal.calevent_create(date, '日曜', 'sunday')
                elif weekday == 5:  # 土曜
                    if date not in holidays:
                        cal.calevent_create(date, '土曜', 'saturday')
            except:
                continue
    # 色をタグごとに設定
    cal.tag_config('today', background='#ffcc00', foreground='black')  # 今日だけ黄色
    cal.tag_config('holiday', background='red', foreground='white')
    cal.tag_config('sunday', background='red', foreground='white')
    cal.tag_config('saturday', background='blue', foreground='white')

# --- 色付け ---
holidays = load_holidays()
mark_calendar(calendar, holidays)

# --- カレンダー月移動時に休日を再マーク ---
def on_calendar_display(event):
    calendar.calevent_remove('all')
    mark_calendar(calendar, holidays)

calendar.bind("<<CalendarDisplayed>>", on_calendar_display)

# --- カレンダー日付選択時に祝日ポップアップ表示 ---
def show_holiday_info(event):
    selected_date = calendar.selection_get()
    if selected_date in holidays:
        holiday_name = holidays[selected_date]
        messagebox.showinfo("祝日・会社休み", f"{selected_date.strftime('%m月%d日')}：{holiday_name}")

calendar.bind("<<CalendarSelected>>", show_holiday_info)


# --- 色付け ---
holidays = load_holidays()
mark_calendar(calendar, holidays)

root.mainloop()

