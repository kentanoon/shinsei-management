#!/usr/bin/env python3
"""
Googleフォーム連携システム用初期データ投入スクリプト
"""

import sys
import os
from pathlib import Path

# パスを追加してappモジュールを読み込み可能にする
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
sys.path.append(str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import google_forms
from app.models.google_forms import ApplicationFormTemplate, EmailTemplate
import datetime

def create_tables():
    """テーブル作成"""
    print("🗃️  データベーステーブルを作成中...")
    google_forms.Base.metadata.create_all(bind=engine)
    print("[SUCCESS] テーブル作成完了")

def init_email_templates(db: Session):
    """メールテンプレートの初期データ投入"""
    print("[EMAIL] メールテンプレートを初期化中...")
    
    # デフォルトメールテンプレート
    default_template = EmailTemplate(
        template_name="default_form_notification",
        subject_template="【{{form.form_name}}】申請書類のご提出について - {{project.project_name}}",
        body_template="""
        <html>
        <body>
            <h2>申請書類提出のお願い</h2>
            
            <p>いつもお世話になっております。</p>
            
            <p>下記プロジェクトに関する申請書類のご提出をお願いいたします。</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3>プロジェクト情報</h3>
                <ul>
                    <li><strong>プロジェクト名:</strong> {{project.project_name}}</li>
                    <li><strong>プロジェクトコード:</strong> {{project.project_code}}</li>
                    <li><strong>申請種別:</strong> {{form.application_type}}</li>
                    <li><strong>書類名:</strong> {{form.form_name}}</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{form.google_form_url}}" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    フォームに入力する
                </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4>ご注意事項</h4>
                <ul>
                    <li>フォームの入力期限は送信から <strong>7日間</strong> です</li>
                    <li>入力内容に不明な点がございましたら、お気軽にお問い合わせください</li>
                    <li>このメールは自動送信されています</li>
                </ul>
            </div>
            
            <p>ご不明な点がございましたら、下記までお問い合わせください。</p>
            
            <hr style="margin: 30px 0;">
            <div style="color: #666; font-size: 12px;">
                <p>申請管理システム<br>
                Email: support@example.com<br>
                Tel: 03-1234-5678</p>
            </div>
        </body>
        </html>
        """,
        template_variables={
            "project": ["project_name", "project_code"],
            "form": ["form_name", "application_type", "google_form_url"],
            "submission": ["custom_message"]
        },
        is_active=True
    )
    
    # 既存チェック
    existing = db.query(EmailTemplate).filter(
        EmailTemplate.template_name == "default_form_notification"
    ).first()
    
    if not existing:
        db.add(default_template)
        db.commit()
        db.refresh(default_template)
        print(f"[SUCCESS] デフォルトメールテンプレート作成完了 (ID: {default_template.id})")
        return default_template.id
    else:
        print(f"[INFO] デフォルトメールテンプレート既存 (ID: {existing.id})")
        return existing.id

def init_form_templates(db: Session, email_template_id: int):
    """フォームテンプレートの初期データ投入"""
    print("[FORM] フォームテンプレートを初期化中...")
    
    # サンプルフォームテンプレート
    form_templates = [
        # 建築確認申請
        {
            "application_type": "building_permit",
            "form_category": "basic_application",
            "form_name": "建築確認申請書（第一面）",
            "google_form_id": "1FAIpQLSe_sample_building_permit_basic",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_building_permit_basic/viewform",
            "description": "建築確認申請の基本情報を入力するフォームです",
            "required_fields": {
                "owner_name": "施主名",
                "site_address": "敷地所在地",
                "building_use": "建物用途",
                "structure": "構造",
                "floors": "階数"
            }
        },
        {
            "application_type": "building_permit",
            "form_category": "drawings",
            "form_name": "図面提出フォーム",
            "google_form_id": "1FAIpQLSe_sample_building_permit_drawings",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_building_permit_drawings/viewform",
            "description": "配置図、各階平面図、立面図等の提出フォームです",
            "required_fields": {
                "site_plan": "配置図",
                "floor_plans": "各階平面図",
                "elevations": "立面図",
                "sections": "断面図"
            }
        },
        {
            "application_type": "building_permit",
            "form_category": "structural",
            "form_name": "構造計算書提出フォーム",
            "google_form_id": "1FAIpQLSe_sample_building_permit_structural",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_building_permit_structural/viewform",
            "description": "構造計算書および構造図面の提出フォームです",
            "required_fields": {
                "structural_calculation": "構造計算書",
                "structural_drawings": "構造図",
                "foundation_plan": "基礎伏図"
            }
        },
        
        # 完了検査申請
        {
            "application_type": "completion_inspection",
            "form_category": "completion_form",
            "form_name": "完了検査申請書",
            "google_form_id": "1FAIpQLSe_sample_completion_inspection_form",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_completion_inspection_form/viewform",
            "description": "完了検査申請に必要な基本情報の入力フォームです",
            "required_fields": {
                "completion_date": "工事完了日",
                "inspection_request_date": "検査希望日",
                "contact_person": "立会者"
            }
        },
        {
            "application_type": "completion_inspection",
            "form_category": "completion_documents",
            "form_name": "完了検査必要書類提出フォーム",
            "google_form_id": "1FAIpQLSe_sample_completion_documents",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_completion_documents/viewform",
            "description": "完了検査に必要な各種書類の提出フォームです",
            "required_fields": {
                "completion_report": "工事完了報告書",
                "photos": "完成写真",
                "certificates": "各種証明書"
            }
        },
        
        # 中間検査申請
        {
            "application_type": "interim_inspection",
            "form_category": "interim_form",
            "form_name": "中間検査申請書",
            "google_form_id": "1FAIpQLSe_sample_interim_inspection_form",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_interim_inspection_form/viewform",
            "description": "中間検査申請の基本情報入力フォームです",
            "required_fields": {
                "inspection_stage": "検査工程",
                "inspection_date": "検査希望日",
                "progress_status": "工事進捗状況"
            }
        },
        {
            "application_type": "interim_inspection",
            "form_category": "progress_photos",
            "form_name": "工事進捗写真提出フォーム",
            "google_form_id": "1FAIpQLSe_sample_interim_photos",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_interim_photos/viewform",
            "description": "中間検査用の工事進捗写真提出フォームです",
            "required_fields": {
                "foundation_photos": "基礎工事写真",
                "framing_photos": "躯体工事写真",
                "progress_notes": "工事進捗メモ"
            }
        },
        
        # BELS申請
        {
            "application_type": "bels_application",
            "form_category": "bels_basic",
            "form_name": "BELS基本情報入力フォーム",
            "google_form_id": "1FAIpQLSe_sample_bels_basic",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_bels_basic/viewform",
            "description": "BELS申請の基本情報を入力するフォームです",
            "required_fields": {
                "building_info": "建物概要",
                "energy_class": "エネルギー消費性能",
                "evaluation_method": "評価方法"
            }
        },
        {
            "application_type": "bels_application",
            "form_category": "energy_calculation",
            "form_name": "省エネ計算書提出フォーム",
            "google_form_id": "1FAIpQLSe_sample_bels_energy",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_bels_energy/viewform",
            "description": "BELS申請用の省エネルギー計算書提出フォームです",
            "required_fields": {
                "energy_calculation": "省エネ計算書",
                "equipment_specifications": "設備仕様書",
                "thermal_performance": "断熱性能計算書"
            }
        },
        {
            "application_type": "bels_application",
            "form_category": "consent_form",
            "form_name": "評価物件掲載承諾書",
            "google_form_id": "1FAIpQLSe_sample_bels_consent",
            "google_form_url": "https://docs.google.com/forms/d/e/1FAIpQLSe_sample_bels_consent/viewform",
            "description": "BELS評価物件の掲載に関する承諾書フォームです",
            "required_fields": {
                "consent_status": "掲載承諾",
                "owner_signature": "施主署名",
                "publication_scope": "公開範囲"
            }
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for template_data in form_templates:
        # 既存チェック
        existing = db.query(ApplicationFormTemplate).filter(
            ApplicationFormTemplate.application_type == template_data["application_type"],
            ApplicationFormTemplate.form_category == template_data["form_category"]
        ).first()
        
        if existing:
            # 既存の場合は更新
            for key, value in template_data.items():
                setattr(existing, key, value)
            existing.email_template_id = email_template_id
            existing.updated_at = datetime.datetime.utcnow()
            updated_count += 1
            print(f"🔄 更新: {template_data['form_name']}")
        else:
            # 新規作成
            template = ApplicationFormTemplate(
                **template_data,
                email_template_id=email_template_id
            )
            db.add(template)
            created_count += 1
            print(f"[SUCCESS] 作成: {template_data['form_name']}")
    
    db.commit()
    print(f"[FORM] フォームテンプレート初期化完了: 新規作成 {created_count}件, 更新 {updated_count}件")

def verify_data(db: Session):
    """データ確認"""
    print("\n[VERIFY] 初期化されたデータを確認中...")
    
    # メールテンプレート数
    email_templates_count = db.query(EmailTemplate).count()
    print(f"[EMAIL] メールテンプレート: {email_templates_count}件")
    
    # フォームテンプレート数
    form_templates_count = db.query(ApplicationFormTemplate).count()
    print(f"[FORM] フォームテンプレート: {form_templates_count}件")
    
    # 申請種別別集計
    from sqlalchemy import func
    type_stats = db.query(
        ApplicationFormTemplate.application_type,
        func.count(ApplicationFormTemplate.id).label('count')
    ).group_by(ApplicationFormTemplate.application_type).all()
    
    print("\n[STATS] 申請種別別フォーム数:")
    for stat in type_stats:
        print(f"  - {stat.application_type}: {stat.count}件")
    
    print("\n[SUCCESS] データ確認完了")

def main():
    """メイン処理"""
    print("[START] Googleフォーム連携システム初期化開始")
    print("=" * 50)
    
    # テーブル作成
    create_tables()
    
    # データベースセッション作成
    db = SessionLocal()
    
    try:
        # メールテンプレート初期化
        email_template_id = init_email_templates(db)
        
        # フォームテンプレート初期化
        init_form_templates(db, email_template_id)
        
        # データ確認
        verify_data(db)
        
        print("\n[COMPLETE] 初期化完了!")
        print("\n[NEXT] 次のステップ:")
        print("1. 実際のGoogleフォームを作成")
        print("2. フォームIDとURLを正しい値に更新")
        print("3. メール送信設定を環境変数で設定")
        print("4. フロントエンドでGoogleFormsManagerコンポーネントを使用")
        
    except Exception as e:
        print(f"[ERROR] エラーが発生しました: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)