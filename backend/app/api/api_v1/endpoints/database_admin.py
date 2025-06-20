"""
データベース管理API エンドポイント
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.core.database import get_db, engine
import pandas as pd
import json
import os
import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/stats")
def get_database_stats(db: Session = Depends(get_db)):
    """
    データベース統計情報を取得
    """
    try:
        stats = {}
        
        # テーブル情報取得
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        tables_info = []
        total_rows = 0
        
        for table_name in table_names:
            try:
                # テーブルの行数取得
                result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                row_count = result.scalar()
                total_rows += row_count
                
                # テーブルサイズ取得（PostgreSQL用）
                try:
                    size_result = db.execute(text(f"SELECT pg_size_pretty(pg_total_relation_size('{table_name}'))"))
                    table_size = size_result.scalar()
                except:
                    table_size = "不明"
                
                # 最終更新日時取得（カラムが存在する場合）
                try:
                    last_updated_result = db.execute(text(f"SELECT MAX(updated_at) FROM {table_name}"))
                    last_updated = last_updated_result.scalar()
                    if last_updated:
                        last_updated = last_updated.isoformat()
                    else:
                        last_updated = "不明"
                except:
                    last_updated = "不明"
                
                tables_info.append({
                    "name": table_name,
                    "rows": row_count,
                    "size": table_size,
                    "last_updated": last_updated
                })
                
            except Exception as e:
                logger.warning(f"テーブル {table_name} の統計取得に失敗: {e}")
                tables_info.append({
                    "name": table_name,
                    "rows": 0,
                    "size": "不明",
                    "last_updated": "不明"
                })
        
        # データベース全体サイズ
        try:
            db_size_result = db.execute(text("SELECT pg_size_pretty(pg_database_size(current_database()))"))
            total_size = db_size_result.scalar()
        except:
            total_size = "不明"
        
        # アクティブ接続数
        try:
            connection_result = db.execute(text("SELECT count(*) FROM pg_stat_activity"))
            connection_count = connection_result.scalar()
        except:
            connection_count = 0
        
        # パフォーマンス統計
        try:
            # 平均クエリ時間
            avg_time_result = db.execute(text("""
                SELECT ROUND(AVG(mean_exec_time), 2) 
                FROM pg_stat_statements 
                WHERE calls > 0
            """))
            avg_query_time = avg_time_result.scalar() or 0
            
            # 低速クエリ数
            slow_queries_result = db.execute(text("""
                SELECT COUNT(*) 
                FROM pg_stat_statements 
                WHERE mean_exec_time > 1000
            """))
            slow_queries = slow_queries_result.scalar() or 0
            
            # キャッシュヒット率
            cache_hit_result = db.execute(text("""
                SELECT ROUND(
                    100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2
                ) FROM pg_stat_database WHERE datname = current_database()
            """))
            cache_hit_ratio = cache_hit_result.scalar() or 0
            
        except Exception as e:
            logger.warning(f"パフォーマンス統計の取得に失敗: {e}")
            avg_query_time = 0
            slow_queries = 0
            cache_hit_ratio = 0
        
        return {
            "tables": tables_info,
            "total_size": total_size,
            "connection_count": connection_count,
            "total_rows": total_rows,
            "performance_stats": {
                "avg_query_time": f"{avg_query_time}ms",
                "slow_queries": slow_queries,
                "cache_hit_ratio": f"{cache_hit_ratio}%"
            }
        }
        
    except Exception as e:
        logger.error(f"データベース統計取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="データベース統計の取得に失敗しました"
        )

@router.get("/tables/{table_name}")
def get_table_data(
    table_name: str,
    db: Session = Depends(get_db),
    page: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """
    特定テーブルのデータを取得
    """
    try:
        # テーブル存在確認
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"テーブル '{table_name}' が見つかりません"
            )
        
        # カラム情報取得
        columns_info = inspector.get_columns(table_name)
        column_names = [col['name'] for col in columns_info]
        
        # 総レコード数取得
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        total_count = count_result.scalar()
        
        # データ取得（ページング）
        offset = page * limit
        data_result = db.execute(text(f"""
            SELECT * FROM {table_name} 
            ORDER BY 1 
            LIMIT {limit} OFFSET {offset}
        """))
        
        rows = []
        for row in data_result:
            # 値を適切な型に変換
            converted_row = []
            for value in row:
                if isinstance(value, datetime.datetime):
                    converted_row.append(value.isoformat())
                elif isinstance(value, datetime.date):
                    converted_row.append(value.isoformat())
                else:
                    converted_row.append(value)
            rows.append(converted_row)
        
        return {
            "columns": column_names,
            "rows": rows,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "has_next": (offset + limit) < total_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"テーブルデータ取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="テーブルデータの取得に失敗しました"
        )

@router.delete("/tables/{table_name}/rows/{row_id}")
def delete_table_row(
    table_name: str,
    row_id: int,
    db: Session = Depends(get_db)
):
    """
    テーブルの特定行を削除
    """
    try:
        # テーブル存在確認
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"テーブル '{table_name}' が見つかりません"
            )
        
        # 主キーカラム取得
        pk_constraint = inspector.get_pk_constraint(table_name)
        if not pk_constraint or not pk_constraint['constrained_columns']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="主キーが定義されていないテーブルです"
            )
        
        pk_column = pk_constraint['constrained_columns'][0]
        
        # 削除実行
        result = db.execute(text(f"DELETE FROM {table_name} WHERE {pk_column} = :row_id"), {"row_id": row_id})
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="削除対象のレコードが見つかりません"
            )
        
        db.commit()
        
        return {"message": f"レコードを削除しました (ID: {row_id})"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"レコード削除エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="レコードの削除に失敗しました"
        )

@router.get("/export/{table_name}")
def export_table_data(
    table_name: str,
    format: str = Query("csv", regex="^(csv|json)$"),
    db: Session = Depends(get_db)
):
    """
    テーブルデータをエクスポート
    """
    try:
        # テーブル存在確認
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"テーブル '{table_name}' が見つかりません"
            )
        
        # データ取得
        result = db.execute(text(f"SELECT * FROM {table_name}"))
        
        # pandasでデータ処理
        df = pd.DataFrame(result.fetchall(), columns=result.keys())
        
        # datetime型を文字列に変換
        for col in df.columns:
            if df[col].dtype == 'datetime64[ns]':
                df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # エクスポートディレクトリ作成
        export_dir = Path("exports")
        export_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format == "csv":
            filename = f"{table_name}_{timestamp}.csv"
            filepath = export_dir / filename
            df.to_csv(filepath, index=False, encoding='utf-8-sig')
            
            # ファイルレスポンス
            from fastapi.responses import FileResponse
            return FileResponse(
                path=filepath,
                filename=filename,
                media_type='text/csv'
            )
            
        elif format == "json":
            filename = f"{table_name}_{timestamp}.json"
            filepath = export_dir / filename
            df.to_json(filepath, orient='records', force_ascii=False, indent=2)
            
            from fastapi.responses import FileResponse
            return FileResponse(
                path=filepath,
                filename=filename,
                media_type='application/json'
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"エクスポートエラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="エクスポートに失敗しました"
        )

@router.post("/backup")
def create_database_backup(db: Session = Depends(get_db)):
    """
    データベースバックアップを作成
    """
    try:
        # バックアップディレクトリ作成
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # SQLiteの場合
        if "sqlite" in str(engine.url):
            import shutil
            db_path = str(engine.url).replace("sqlite:///", "")
            backup_filename = f"backup_{timestamp}.db"
            backup_path = backup_dir / backup_filename
            shutil.copy2(db_path, backup_path)
            
        # PostgreSQLの場合
        else:
            import subprocess
            backup_filename = f"backup_{timestamp}.sql"
            backup_path = backup_dir / backup_filename
            
            # pg_dumpコマンド実行
            cmd = [
                "pg_dump",
                "--no-password",
                "--format=custom",
                "--file", str(backup_path),
                str(engine.url)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")
        
        return {
            "message": "バックアップが完了しました",
            "filename": backup_filename,
            "path": str(backup_path),
            "size": os.path.getsize(backup_path)
        }
        
    except Exception as e:
        logger.error(f"バックアップエラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="バックアップに失敗しました"
        )

@router.get("/health")
def check_database_health(db: Session = Depends(get_db)):
    """
    データベースヘルスチェック
    """
    try:
        # 接続テスト
        db.execute(text("SELECT 1"))
        
        # 基本統計
        inspector = inspect(engine)
        table_count = len(inspector.get_table_names())
        
        return {
            "status": "healthy",
            "connection": "ok",
            "table_count": table_count,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"ヘルスチェックエラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="データベースに接続できません"
        )

@router.post("/vacuum")
def vacuum_database(db: Session = Depends(get_db)):
    """
    データベース最適化（VACUUM）実行
    """
    try:
        # PostgreSQLの場合
        if "postgresql" in str(engine.url):
            db.execute(text("VACUUM ANALYZE"))
            db.commit()
            message = "VACUUM ANALYZE を実行しました"
        else:
            # SQLiteの場合
            db.execute(text("VACUUM"))
            db.commit()
            message = "VACUUM を実行しました"
        
        return {"message": message}
        
    except Exception as e:
        logger.error(f"VACUUM エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="データベース最適化に失敗しました"
        )

@router.get("/tables")
def list_all_tables(db: Session = Depends(get_db)):
    """
    全テーブル一覧を取得
    """
    try:
        inspector = inspect(engine)
        tables = []
        
        for table_name in inspector.get_table_names():
            # カラム情報取得
            columns = inspector.get_columns(table_name)
            
            # インデックス情報取得
            indexes = inspector.get_indexes(table_name)
            
            tables.append({
                "name": table_name,
                "columns": [{"name": col["name"], "type": str(col["type"])} for col in columns],
                "column_count": len(columns),
                "index_count": len(indexes)
            })
        
        return {"tables": tables}
        
    except Exception as e:
        logger.error(f"テーブル一覧取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="テーブル一覧の取得に失敗しました"
        )