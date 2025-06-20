"""
Google Forms 関連のデータベースモデル
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ApplicationFormTemplate(Base):
    """
    申請フォームテンプレート
    Google Forms の URL と関連情報を管理
    """
    __tablename__ = "application_form_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    application_type = Column(String(100), nullable=False, index=True)  # 申請種別
    form_category = Column(String(100), nullable=False)  # フォームカテゴリ
    form_name = Column(String(255), nullable=False)  # フォーム名
    google_form_url = Column(Text, nullable=False)  # Google フォームのURL
    description = Column(Text)  # 説明
    required_fields = Column(JSON)  # 必須フィールドのリスト
    is_active = Column(Boolean, default=True, nullable=False)  # アクティブ状態
    
    # タイムスタンプ
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # リレーション
    form_submissions = relationship("FormSubmission", back_populates="form_template")

class FormSubmission(Base):
    """
    フォーム送信履歴
    どのフォームをいつ誰に送信したかを記録
    """
    __tablename__ = "form_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    form_template_id = Column(Integer, ForeignKey("application_form_templates.id"), nullable=False)
    recipient_email = Column(String(255), nullable=False)  # 送信先メールアドレス
    
    # 送信状況
    status = Column(String(50), default="sent", nullable=False)  # sent, opened, submitted, failed
    sent_at = Column(DateTime, server_default=func.now(), nullable=False)
    response_received_at = Column(DateTime)  # フォーム回答受信日時
    
    # メール内容
    email_subject = Column(String(500))  # メール件名
    email_body = Column(Text)  # メール本文
    
    # フォーム回答データ
    form_response_data = Column(JSON)  # フォームの回答データ（JSON形式）
    notes = Column(Text)  # 備考
    
    # リレーション
    form_template = relationship("ApplicationFormTemplate", back_populates="form_submissions")
    # project = relationship("Project", back_populates="form_submissions")  # プロジェクトとの関連は必要に応じて