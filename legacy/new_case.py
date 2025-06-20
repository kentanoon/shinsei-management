import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import subprocess

# スクリプトのあるディレクトリを基点にパスを動的に決定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'application.db')
MAIN_UI_PATH = os.path.join(BASE_DIR, 'main_ui.py')
TABLE_NAME = 'projects_new'
# 表示するカラムと見出しラベルのマッピング
DISPLAY_COLS = ['project_name', 'client_name']
HEADER_LABELS = {'project_name': '工事名称', 'client_name': '発注者'}
# フィルタ用ステージ
STAGES = ['事前相談', '受注', '申請作業', '審査中']


def fetch_all_new_projects():
    """
    TABLE_NAME から全行を取得し、カラム名とデータを返します。
    """
    if not os.path.exists(DB_PATH):
        messagebox.showerror('データベースエラー', f'DBファイルが見つかりません:\n{DB_PATH}')
        sys.exit(1)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f'SELECT * FROM {TABLE_NAME}')
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
    except sqlite3.OperationalError as e:
        messagebox.showerror('SQLエラー', f"テーブル'{TABLE_NAME}'読み込み中にエラー:\n{e}")
        sys.exit(1)
    finally:
        conn.close()
    return columns, rows


def create_treeview(parent, stage=None):
    """
    全データを取得し、ステージでフィルタした後、DISPLAY_COLS のみ表示します。
    ダブルクリックで main_ui.py に project_code を渡して起動します。
    """
    columns, rows = fetch_all_new_projects()
    idx_map = {col: idx for idx, col in enumerate(columns)}
    status_key = next((k for k in ('ステータス', 'status', 'stage') if k in idx_map), None)
    status_idx = idx_map.get(status_key) if status_key else None

    # ステージでフィルタ
    filtered = rows
    if stage and status_idx is not None:
        filtered = [r for r in rows if r[status_idx] == stage]

    # Treeview 作成（内部には全カラム保持、表示は DISPLAY_COLS）
    tree = ttk.Treeview(
        parent,
        columns=columns,
        displaycolumns=DISPLAY_COLS,
        show='headings'
    )
    # 見出し設定
    for col in DISPLAY_COLS:
        tree.heading(col, text=HEADER_LABELS.get(col, col))
        tree.column(col, width=200, anchor='w')
    tree.pack(fill='both', expand=True, padx=10, pady=10)

    # データ挿入
    for r in filtered:
        tree.insert('', 'end', values=r)

    tk.Label(parent, text='※ダブルクリックで詳細を開きます', font=('Arial', 10), fg='gray').pack(pady=(0,10))

    def on_double_click(event):
        sel = tree.selection()
        if not sel:
            return
        vals = tree.item(sel[0], 'values')
        project_code = vals[idx_map.get('project_code', 0)]
        if not os.path.exists(MAIN_UI_PATH):
            messagebox.showerror('ファイルエラー', f'main_ui.pyが見つかりません:\n{MAIN_UI_PATH}')
            return
        # main_ui.py のあるフォルダをカレントディレクトリにして起動する
        subprocess.Popen(
            [sys.executable, MAIN_UI_PATH, project_code],
            cwd=BASE_DIR
        )

    tree.bind('<Double-1>', on_double_click)
    return tree


def main():
    root = tk.Tk()
    root.title(f'📝 {TABLE_NAME} 一覧')
    root.geometry('900x600')

    # タブサイズ（パディング・フォント）を大きくするスタイル設定
    style = ttk.Style()
    style.theme_use('default')
    style.configure('TNotebook.Tab', padding=(20, 10), font=('Arial', 12, 'bold'))

    notebook = ttk.Notebook(root)
    notebook.pack(expand=True, fill='both')
    for stage in STAGES:
        frame = ttk.Frame(notebook)
        notebook.add(frame, text=stage)
        create_treeview(frame, stage)

    root.mainloop()


if __name__ == '__main__':
    main()
