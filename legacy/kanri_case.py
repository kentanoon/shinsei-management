import os
import sys
import tkinter as tk
from tkinter import ttk
import sqlite3
import subprocess

# スクリプトのあるディレクトリを基点にパスを動的に決定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'application.db')
MAIN_UI_PATH = os.path.join(BASE_DIR, 'main_ui.py')
TABLE_NAME = 'projects_new'

def fetch_projects_by_status(status):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT project_code, project_name FROM {TABLE_NAME} WHERE status = ?",
        (status,)
    )
    rows = cursor.fetchall()
    conn.close()
    return rows

def create_treeview(parent, status):
    tree = ttk.Treeview(parent, columns=("コード", "案件名"), show="headings", height=15)
    tree.heading("コード", text="案件コード")
    tree.heading("案件名", text="案件名")
    tree.pack(fill="both", expand=True, padx=10, pady=10)

    for code, name in fetch_projects_by_status(status):
        tree.insert("", "end", values=(code, name))

    tk.Label(
        parent,
        text="※案件をダブルクリックすると詳細が開きます",
        font=("Arial", 10),
        fg="gray"
    ).pack(pady=(0, 10))

    def on_double_click(event):
        selected = tree.selection()
        if not selected:
            return
        code = tree.item(selected[0], "values")[0]
        subprocess.Popen([
            sys.executable,
            MAIN_UI_PATH,
            code
        ])

    tree.bind("<Double-1>", on_double_click)
    return tree

def main():
    root = tk.Tk()
    root.title("📋 監理案件一覧")
    root.geometry("600x450")

    style = ttk.Style()
    style.configure("TNotebook.Tab", font=("Arial", 12, "bold"), padding=[20, 10])

    notebook = ttk.Notebook(root)
    notebook.pack(expand=True, fill="both")

    # タブ：配筋検査待ち
    frame1 = ttk.Frame(notebook)
    notebook.add(frame1, text="🔎 配筋検査待ち")
    create_treeview(frame1, "配筋検査待ち")

    # タブ：中間検査待ち
    frame2 = ttk.Frame(notebook)
    notebook.add(frame2, text="📄 中間検査待ち")
    create_treeview(frame2, "中間検査待ち")

    # タブ：完了検査待ち
    frame3 = ttk.Frame(notebook)
    notebook.add(frame3, text="✅ 完了検査待ち")
    create_treeview(frame3, "完了検査待ち")

    root.mainloop()

if __name__ == "__main__":
    main()
