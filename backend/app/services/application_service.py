"""
申請関連のビジネスロジック
ワークフロー管理、監査証跡、ドキュメント生成を含む
"""

from datetime import date, datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func

from app.models.project import Application, ApplicationType, ApplicationStatusEnum, AuditTrail, Project
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationWorkflowAction,
    ApplicationStatusUpdate, ApplicationListResponse
)


class ApplicationService:
    """申請管理サービス"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_applications(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[ApplicationStatusEnum] = None,
        project_id: Optional[int] = None
    ) -> List[Application]:
        """申請一覧を取得"""
        query = self.db.query(Application).options(
            joinedload(Application.application_type),
            joinedload(Application.project)
        )
        
        if status:
            query = query.filter(Application.status == status)
        if project_id:
            query = query.filter(Application.project_id == project_id)
            
        return query.order_by(desc(Application.updated_at)).offset(skip).limit(limit).all()
    
    def get_applications_count(
        self, 
        status: Optional[ApplicationStatusEnum] = None,
        project_id: Optional[int] = None
    ) -> int:
        """申請総数を取得"""
        query = self.db.query(func.count(Application.id))
        
        if status:
            query = query.filter(Application.status == status)
        if project_id:
            query = query.filter(Application.project_id == project_id)
            
        return query.scalar()
    
    def get_application_by_id(self, application_id: int) -> Optional[Application]:
        """IDで申請を取得"""
        return self.db.query(Application).options(
            joinedload(Application.application_type),
            joinedload(Application.project)
        ).filter(Application.id == application_id).first()
    
    def create_application(self, application_data: ApplicationCreate) -> Application:
        """申請を作成"""
        # プロジェクトの存在確認
        project = self.db.query(Project).filter(Project.id == application_data.project_id).first()
        if not project:
            raise ValueError("指定されたプロジェクトが存在しません")
        
        # 申請種別の存在確認
        app_type = self.db.query(ApplicationType).filter(
            ApplicationType.id == application_data.application_type_id
        ).first()
        if not app_type:
            raise ValueError("指定された申請種別が存在しません")
        
        # 申請作成
        db_application = Application(**application_data.dict())
        self.db.add(db_application)
        self.db.commit()
        self.db.refresh(db_application)
        
        # 監査証跡記録
        self._record_audit_trail(
            target_model="Application",
            target_id=db_application.id,
            action="CREATE",
            field_name="status",
            new_value=db_application.status.value
        )
        
        return db_application
    
    def update_application(self, application_id: int, application_data: ApplicationUpdate) -> Optional[Application]:
        """申請を更新"""
        db_application = self.get_application_by_id(application_id)
        if not db_application:
            return None
        
        # 変更前の値を記録
        old_values = {}
        for field, value in application_data.dict(exclude_unset=True).items():
            if hasattr(db_application, field):
                old_value = getattr(db_application, field)
                if old_value != value:
                    old_values[field] = (old_value, value if value is not None else "")
                    setattr(db_application, field, value)
        
        if old_values:
            self.db.commit()
            self.db.refresh(db_application)
            
            # 監査証跡記録
            for field, (old_val, new_val) in old_values.items():
                self._record_audit_trail(
                    target_model="Application",
                    target_id=application_id,
                    action="UPDATE",
                    field_name=field,
                    old_value=str(old_val) if old_val is not None else "",
                    new_value=str(new_val)
                )
        
        return db_application
    
    def execute_workflow_action(
        self, 
        application_id: int, 
        action_data: ApplicationWorkflowAction
    ) -> Application:
        """ワークフローアクションを実行"""
        db_application = self.get_application_by_id(application_id)
        if not db_application:
            raise ValueError("申請が見つかりません")
        
        old_status = db_application.status
        action = action_data.action
        comment = action_data.comment
        
        # 状態遷移のバリデーション
        if not self._validate_status_transition(old_status, action):
            raise ValueError(f"現在のステータス '{old_status.value}' からアクション '{action}' は実行できません")
        
        # ステータス更新
        new_status = self._get_new_status_by_action(action)
        db_application.status = new_status
        
        # 日付の更新
        today = date.today()
        if action == "submit":
            db_application.submitted_date = today
            db_application.workflow_step = 1
        elif action == "approve":
            db_application.approved_date = today
            db_application.approval_comment = comment
            db_application.workflow_step = 2
        elif action == "reject":
            db_application.rejected_date = today
            db_application.rejection_reason = comment
            db_application.workflow_step = 0
        elif action == "withdraw":
            db_application.workflow_step = 0
        
        self.db.commit()
        self.db.refresh(db_application)
        
        # 監査証跡記録
        self._record_audit_trail(
            target_model="Application",
            target_id=application_id,
            action="WORKFLOW",
            field_name="status",
            old_value=old_status.value,
            new_value=new_status.value
        )
        
        # ドキュメント生成（承認時）
        if action == "approve":
            self._generate_documents(db_application)
        
        return db_application
    
    def delete_application(self, application_id: int) -> bool:
        """申請を削除"""
        db_application = self.get_application_by_id(application_id)
        if not db_application:
            return False
        
        # 削除前に監査証跡記録
        self._record_audit_trail(
            target_model="Application",
            target_id=application_id,
            action="DELETE",
            field_name="status",
            old_value=db_application.status.value
        )
        
        self.db.delete(db_application)
        self.db.commit()
        return True
    
    def get_applications_by_status(self, status: ApplicationStatusEnum) -> List[Application]:
        """ステータス別申請取得"""
        return self.db.query(Application).options(
            joinedload(Application.application_type),
            joinedload(Application.project)
        ).filter(Application.status == status).all()
    
    def get_audit_trail(self, target_model: str, target_id: int) -> List[AuditTrail]:
        """監査証跡を取得"""
        return self.db.query(AuditTrail).filter(
            and_(AuditTrail.target_model == target_model, AuditTrail.target_id == target_id)
        ).order_by(desc(AuditTrail.timestamp)).all()
    
    def _validate_status_transition(self, current_status: ApplicationStatusEnum, action: str) -> bool:
        """状態遷移のバリデーション"""
        valid_transitions = {
            ApplicationStatusEnum.DRAFT: ["submit", "withdraw"],
            ApplicationStatusEnum.IN_REVIEW: ["approve", "reject", "withdraw"],
            ApplicationStatusEnum.APPROVED: ["withdraw"],
            ApplicationStatusEnum.REJECTED: ["submit", "withdraw"],
            ApplicationStatusEnum.WITHDRAWN: ["submit"],
            ApplicationStatusEnum.COMPLETED: []
        }
        
        return action in valid_transitions.get(current_status, [])
    
    def _get_new_status_by_action(self, action: str) -> ApplicationStatusEnum:
        """アクションに基づく新しいステータスを取得"""
        status_map = {
            "submit": ApplicationStatusEnum.IN_REVIEW,
            "approve": ApplicationStatusEnum.APPROVED,
            "reject": ApplicationStatusEnum.REJECTED,
            "withdraw": ApplicationStatusEnum.WITHDRAWN
        }
        
        return status_map.get(action, ApplicationStatusEnum.DRAFT)
    
    def _record_audit_trail(
        self,
        target_model: str,
        target_id: int,
        action: str,
        field_name: str,
        old_value: str = "",
        new_value: str = ""
    ):
        """監査証跡を記録"""
        audit_trail = AuditTrail(
            target_model=target_model,
            target_id=target_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            action=action
        )
        
        self.db.add(audit_trail)
        # コミットは呼び出し元で行う
    
    def _generate_documents(self, application: Application):
        """ドキュメント生成（承認時）"""
        # TODO: 非同期ドキュメント生成ジョブを実装
        # 現在はダミー実装
        try:
            # python-docx, openpyxlを使用したテンプレート処理をここに実装
            document_path = f"documents/application_{application.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
            application.generated_document_path = document_path
            # 実際のファイル生成処理はここに追加
            print(f"ドキュメント生成: {document_path}")
        except Exception as e:
            print(f"ドキュメント生成エラー: {str(e)}")
    
    def get_applications_summary(self) -> Dict[str, Any]:
        """申請サマリーを取得"""
        total_count = self.db.query(func.count(Application.id)).scalar()
        
        # ステータス別件数
        status_counts = {}
        for status in ApplicationStatusEnum:
            count = self.db.query(func.count(Application.id)).filter(
                Application.status == status
            ).scalar()
            status_counts[status.value] = count
        
        # 今月の新規申請数
        today = date.today()
        first_day_of_month = today.replace(day=1)
        new_this_month = self.db.query(func.count(Application.id)).filter(
            Application.created_at >= first_day_of_month
        ).scalar()
        
        return {
            "total_applications": total_count,
            "status_counts": status_counts,
            "new_this_month": new_this_month,
            "pending_approvals": status_counts.get(ApplicationStatusEnum.IN_REVIEW.value, 0)
        }