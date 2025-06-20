"""
メール送信サービス
SendGrid、AWS SES、SMTPに対応した統一メール送信インターフェース
"""

import smtplib
import logging
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from abc import ABC, abstractmethod

# 外部ライブラリ（オプション）
try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False

try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_SES_AVAILABLE = True
except ImportError:
    AWS_SES_AVAILABLE = False

logger = logging.getLogger(__name__)

class EmailProvider(ABC):
    """メール送信プロバイダーの抽象基底クラス"""
    
    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        pass

class SMTPProvider(EmailProvider):
    """SMTP経由でのメール送信"""
    
    def __init__(self, config: Dict[str, Any]):
        self.smtp_server = config.get('smtp_server', 'localhost')
        self.smtp_port = config.get('smtp_port', 587)
        self.username = config.get('username')
        self.password = config.get('password')
        self.use_tls = config.get('use_tls', True)
        self.default_from_email = config.get('from_email', 'noreply@example.com')
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        try:
            # メッセージ作成
            msg = MIMEMultipart()
            msg['From'] = from_email or self.default_from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # 本文設定
            content_type = 'html' if is_html else 'plain'
            msg.attach(MIMEText(body, content_type, 'utf-8'))
            
            # 添付ファイル処理
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(part)
            
            # SMTP送信
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                
                text = msg.as_string()
                server.sendmail(msg['From'], msg['To'], text)
            
            logger.info(f"SMTP経由でメール送信成功: {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP送信エラー: {e}")
            return False

class SendGridProvider(EmailProvider):
    """SendGrid経由でのメール送信"""
    
    def __init__(self, api_key: str, default_from_email: str):
        if not SENDGRID_AVAILABLE:
            raise ImportError("SendGridライブラリがインストールされていません")
        
        self.sg = sendgrid.SendGridAPIClient(api_key=api_key)
        self.default_from_email = default_from_email
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        try:
            from_email_obj = Email(from_email or self.default_from_email)
            to_email_obj = To(to_email)
            
            content_type = 'text/html' if is_html else 'text/plain'
            content = Content(content_type, body)
            
            mail = Mail(from_email_obj, to_email_obj, subject, content)
            
            # 添付ファイル処理（必要に応じて実装）
            if attachments:
                # SendGridの添付ファイル処理
                pass
            
            response = self.sg.send(mail)
            
            logger.info(f"SendGrid経由でメール送信成功: {to_email}, Status: {response.status_code}")
            return response.status_code in [200, 201, 202]
            
        except Exception as e:
            logger.error(f"SendGrid送信エラー: {e}")
            return False

class AWSEmailProvider(EmailProvider):
    """AWS SES経由でのメール送信"""
    
    def __init__(self, region: str, default_from_email: str):
        if not AWS_SES_AVAILABLE:
            raise ImportError("boto3ライブラリがインストールされていません")
        
        self.ses_client = boto3.client('ses', region_name=region)
        self.default_from_email = default_from_email
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        try:
            source = from_email or self.default_from_email
            
            # メッセージ構築
            destination = {'ToAddresses': [to_email]}
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {}
            }
            
            if is_html:
                message['Body']['Html'] = {'Data': body, 'Charset': 'UTF-8'}
            else:
                message['Body']['Text'] = {'Data': body, 'Charset': 'UTF-8'}
            
            # 送信実行
            response = self.ses_client.send_email(
                Source=source,
                Destination=destination,
                Message=message
            )
            
            logger.info(f"AWS SES経由でメール送信成功: {to_email}, MessageId: {response['MessageId']}")
            return True
            
        except ClientError as e:
            logger.error(f"AWS SES送信エラー: {e}")
            return False
        except Exception as e:
            logger.error(f"AWS SES送信エラー: {e}")
            return False

class EmailService:
    """統一メール送信サービス"""
    
    def __init__(self):
        self.provider = self._initialize_provider()
    
    def _initialize_provider(self) -> EmailProvider:
        """設定に基づいてメールプロバイダーを初期化"""
        email_provider = os.getenv('EMAIL_PROVIDER', 'smtp').lower()
        
        if email_provider == 'sendgrid' and SENDGRID_AVAILABLE:
            api_key = os.getenv('SENDGRID_API_KEY')
            from_email = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@example.com')
            if api_key:
                logger.info("SendGridプロバイダーを初期化")
                return SendGridProvider(api_key, from_email)
        
        elif email_provider == 'aws_ses' and AWS_SES_AVAILABLE:
            region = os.getenv('AWS_REGION', 'us-east-1')
            from_email = os.getenv('AWS_SES_FROM_EMAIL', 'noreply@example.com')
            logger.info("AWS SESプロバイダーを初期化")
            return AWSEmailProvider(region, from_email)
        
        # デフォルトはSMTP
        smtp_config = {
            'smtp_server': os.getenv('SMTP_SERVER', 'localhost'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'username': os.getenv('SMTP_USERNAME'),
            'password': os.getenv('SMTP_PASSWORD'),
            'use_tls': os.getenv('SMTP_USE_TLS', 'true').lower() == 'true',
            'from_email': os.getenv('SMTP_FROM_EMAIL', 'noreply@example.com')
        }
        
        logger.info("SMTPプロバイダーを初期化")
        return SMTPProvider(smtp_config)
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        メール送信
        
        Args:
            to_email: 送信先メールアドレス
            subject: 件名
            body: 本文
            from_email: 送信元メールアドレス（省略時はデフォルト）
            is_html: HTML形式かどうか
            attachments: 添付ファイルリスト
        
        Returns:
            送信成功時True、失敗時False
        """
        try:
            return self.provider.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                from_email=from_email,
                is_html=is_html,
                attachments=attachments
            )
        except Exception as e:
            logger.error(f"メール送信サービスエラー: {e}")
            return False
    
    def send_bulk_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        is_html: bool = False
    ) -> Dict[str, List[str]]:
        """
        一括メール送信
        
        Args:
            to_emails: 送信先メールアドレスリスト
            subject: 件名
            body: 本文
            from_email: 送信元メールアドレス
            is_html: HTML形式かどうか
        
        Returns:
            成功・失敗したメールアドレスのリスト
        """
        successful_emails = []
        failed_emails = []
        
        for email in to_emails:
            try:
                success = self.send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                    from_email=from_email,
                    is_html=is_html
                )
                
                if success:
                    successful_emails.append(email)
                else:
                    failed_emails.append(email)
                    
            except Exception as e:
                logger.error(f"一括送信中にエラー ({email}): {e}")
                failed_emails.append(email)
        
        return {
            'successful': successful_emails,
            'failed': failed_emails,
            'total_sent': len(successful_emails),
            'total_failed': len(failed_emails)
        }
    
    def send_template_email(
        self,
        to_email: str,
        template_name: str,
        template_variables: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> bool:
        """
        テンプレートメール送信（今後の拡張用）
        
        Args:
            to_email: 送信先
            template_name: テンプレート名
            template_variables: テンプレート変数
            from_email: 送信元
        
        Returns:
            送信成功時True
        """
        # この機能は今後の実装で詳細化
        logger.info(f"テンプレートメール送信: {template_name} -> {to_email}")
        return True

# グローバルインスタンス（シングルトン的な使用）
email_service = EmailService()

def get_email_service() -> EmailService:
    """EmailServiceインスタンスを取得"""
    return email_service