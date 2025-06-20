"""
Google Forms 連携サービス
プロジェクトと申請種別に応じたフォームの自動送信機能
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.google_forms import ApplicationFormTemplate, FormSubmission
from app.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class GoogleFormsService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
    
    def get_form_templates(
        self, 
        application_type: Optional[str] = None,
        form_category: Optional[str] = None
    ) -> List[ApplicationFormTemplate]:
        """
        フォームテンプレート一覧を取得
        
        Args:
            application_type: 申請種別（任意）
            form_category: フォームカテゴリ（任意）
            
        Returns:
            フォームテンプレートのリスト
        """
        query = self.db.query(ApplicationFormTemplate).filter(
            ApplicationFormTemplate.is_active == True
        )
        
        if application_type:
            query = query.filter(ApplicationFormTemplate.application_type == application_type)
            
        if form_category:
            query = query.filter(ApplicationFormTemplate.form_category == form_category)
            
        return query.order_by(ApplicationFormTemplate.application_type, ApplicationFormTemplate.form_name).all()
    
    def get_forms_by_project_type(self, project_type: str) -> List[ApplicationFormTemplate]:
        """
        プロジェクトタイプに適したフォームを取得
        
        Args:
            project_type: プロジェクトの種別
            
        Returns:
            適用可能なフォームテンプレートのリスト
        """
        # プロジェクトタイプに基づいてフォームをマッピング
        type_mapping = {
            "住宅": ["建築確認申請", "長期優良住宅認定申請", "BELS"],
            "マンション": ["建築確認申請", "省エネ適合性判定", "構造適合性判定"],
            "商業建築": ["建築確認申請", "構造適合性判定", "BELS"],
            "工場": ["建築確認申請", "構造適合性判定"],
        }
        
        applicable_types = type_mapping.get(project_type, ["建築確認申請"])
        
        return self.db.query(ApplicationFormTemplate).filter(
            ApplicationFormTemplate.application_type.in_(applicable_types),
            ApplicationFormTemplate.is_active == True
        ).all()
    
    def send_application_forms(
        self,
        project_id: int,
        form_template_ids: List[int],
        recipient_emails: List[str],
        custom_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        申請フォームをメールで送信
        
        Args:
            project_id: プロジェクトID
            form_template_ids: 送信するフォームテンプレートのIDリスト
            recipient_emails: 送信先メールアドレスのリスト
            custom_message: カスタムメッセージ（任意）
            
        Returns:
            送信結果の詳細
        """
        results = {
            "success": [],
            "failed": [],
            "total_sent": 0,
            "total_failed": 0
        }
        
        # フォームテンプレートを取得
        templates = self.db.query(ApplicationFormTemplate).filter(
            ApplicationFormTemplate.id.in_(form_template_ids),
            ApplicationFormTemplate.is_active == True
        ).all()
        
        if not templates:
            logger.warning(f"No active form templates found for IDs: {form_template_ids}")
            return results
        
        for template in templates:
            for email in recipient_emails:
                try:
                    # メール内容を構築
                    subject = f"【申請書類】{template.form_name} - プロジェクト#{project_id}"
                    
                    body = self._build_email_body(template, project_id, custom_message)
                    
                    # メール送信
                    success = self.email_service.send_email(
                        to_email=email,
                        subject=subject,
                        body=body,
                        is_html=True
                    )
                    
                    # 送信履歴を記録
                    submission = FormSubmission(
                        project_id=project_id,
                        form_template_id=template.id,
                        recipient_email=email,
                        status="sent" if success else "failed",
                        email_subject=subject,
                        email_body=body
                    )
                    
                    self.db.add(submission)
                    
                    if success:
                        results["success"].append({
                            "template_id": template.id,
                            "template_name": template.form_name,
                            "email": email
                        })
                        results["total_sent"] += 1
                        logger.info(f"Form sent successfully: {template.form_name} to {email}")
                    else:
                        results["failed"].append({
                            "template_id": template.id,
                            "template_name": template.form_name,
                            "email": email,
                            "error": "Email delivery failed"
                        })
                        results["total_failed"] += 1
                        logger.error(f"Failed to send form: {template.form_name} to {email}")
                        
                except Exception as e:
                    logger.error(f"Error sending form {template.form_name} to {email}: {str(e)}")
                    results["failed"].append({
                        "template_id": template.id,
                        "template_name": template.form_name,
                        "email": email,
                        "error": str(e)
                    })
                    results["total_failed"] += 1
        
        # データベースに変更をコミット
        self.db.commit()
        
        return results
    
    def _build_email_body(
        self, 
        template: ApplicationFormTemplate, 
        project_id: int, 
        custom_message: Optional[str] = None
    ) -> str:
        """
        メール本文を構築
        
        Args:
            template: フォームテンプレート
            project_id: プロジェクトID
            custom_message: カスタムメッセージ
            
        Returns:
            HTML形式のメール本文
        """
        base_message = custom_message or "プロジェクトに関連する申請書類のフォームをお送りします。"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    📋 申請書類フォーム送付
                </h2>
                
                <p>いつもお世話になっております。</p>
                
                <p>{base_message}</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">📄 フォーム詳細</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        <li><strong>プロジェクト番号:</strong> #{project_id}</li>
                        <li><strong>申請種別:</strong> {template.application_type}</li>
                        <li><strong>フォーム名:</strong> {template.form_name}</li>
                        <li><strong>カテゴリ:</strong> {template.form_category}</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{template.google_form_url}" 
                       style="display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        📝 フォームを開く
                    </a>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #27ae60; margin-top: 0;">📝 ご記入にあたって</h4>
                    <p style="margin-bottom: 0;">
                        {template.description or 'フォームにアクセスして必要事項をご記入ください。'}
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                    <p>このメールは申請管理システムから自動送信されています。</p>
                    <p>ご不明な点がございましたら、担当者までお問い合わせください。</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_body
    
    def get_submission_history(
        self, 
        project_id: Optional[int] = None,
        limit: int = 100
    ) -> List[FormSubmission]:
        """
        フォーム送信履歴を取得
        
        Args:
            project_id: プロジェクトID（任意）
            limit: 取得件数の上限
            
        Returns:
            送信履歴のリスト
        """
        query = self.db.query(FormSubmission)
        
        if project_id:
            query = query.filter(FormSubmission.project_id == project_id)
            
        return query.order_by(FormSubmission.sent_at.desc()).limit(limit).all()
    
    def update_submission_status(
        self, 
        submission_id: int, 
        status: str, 
        response_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        送信履歴のステータスを更新
        
        Args:
            submission_id: 送信履歴ID
            status: 新しいステータス
            response_data: レスポンスデータ（任意）
            
        Returns:
            更新成功の可否
        """
        try:
            submission = self.db.query(FormSubmission).filter(
                FormSubmission.id == submission_id
            ).first()
            
            if not submission:
                logger.warning(f"Submission not found: {submission_id}")
                return False
            
            submission.status = status
            if response_data:
                submission.form_response_data = response_data
                submission.response_received_at = submission.sent_at  # 現在時刻を設定
            
            self.db.commit()
            logger.info(f"Submission status updated: {submission_id} -> {status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update submission status: {str(e)}")
            self.db.rollback()
            return False
    
    def create_form_template(
        self,
        application_type: str,
        form_category: str,
        form_name: str,
        google_form_url: str,
        description: Optional[str] = None,
        required_fields: Optional[List[str]] = None
    ) -> ApplicationFormTemplate:
        """
        新しいフォームテンプレートを作成
        
        Args:
            application_type: 申請種別
            form_category: フォームカテゴリ
            form_name: フォーム名
            google_form_url: GoogleフォームのURL
            description: 説明（任意）
            required_fields: 必須フィールドのリスト（任意）
            
        Returns:
            作成されたフォームテンプレート
        """
        template = ApplicationFormTemplate(
            application_type=application_type,
            form_category=form_category,
            form_name=form_name,
            google_form_url=google_form_url,
            description=description,
            required_fields=required_fields or [],
            is_active=True
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        logger.info(f"Created new form template: {form_name}")
        return template