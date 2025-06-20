"""
プロジェクト関連のビジネスロジック
"""

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date
import uuid

from app.models.project import (
    Project, Customer, Site, Building, 
    Application, Financial, Schedule, AuditTrail
)
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, CustomerUpdate, 
    SiteUpdate, BuildingUpdate, FinancialCreate, 
    FinancialUpdate, ScheduleCreate, ScheduleUpdate
)


class ProjectService:
    """プロジェクト関連のサービスクラス"""
    
    def __init__(self, db: Session):
        self.db = db

    def get_projects(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        status: Optional[str] = None
    ) -> List[Project]:
        """
        プロジェクト一覧を取得
        
        Args:
            skip: スキップする件数
            limit: 取得する件数
            status: フィルタ用ステータス
            
        Returns:
            プロジェクトのリスト
        """
        query = self.db.query(Project).options(
            joinedload(Project.customer),
            joinedload(Project.site),
            joinedload(Project.building),
        )
        
        if status:
            query = query.filter(Project.status == status)
            
        return query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()

    def get_projects_count(self, status: Optional[str] = None) -> int:
        """
        プロジェクトの総数を取得
        
        Args:
            status: フィルタ用ステータス
            
        Returns:
            プロジェクトの総数
        """
        query = self.db.query(func.count(Project.id))
        
        if status:
            query = query.filter(Project.status == status)
            
        return query.scalar()

    def get_project_by_code(self, project_code: str) -> Optional[Project]:
        """
        プロジェクトコードでプロジェクトを取得
        
        Args:
            project_code: プロジェクトコード
            
        Returns:
            プロジェクト、または None
        """
        return self.db.query(Project).options(
            joinedload(Project.customer),
            joinedload(Project.site),
            joinedload(Project.building),
            joinedload(Project.applications),
            joinedload(Project.financial),
            joinedload(Project.schedule),
        ).filter(Project.project_code == project_code).first()

    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        """
        プロジェクトIDでプロジェクトを取得
        
        Args:
            project_id: プロジェクトID
            
        Returns:
            プロジェクト、または None
        """
        return self.db.query(Project).options(
            joinedload(Project.customer),
            joinedload(Project.site),
            joinedload(Project.building),
            joinedload(Project.applications),
            joinedload(Project.financial),
            joinedload(Project.schedule),
        ).filter(Project.id == project_id).first()

    def get_projects_by_status(self, status: str) -> List[Project]:
        """
        指定されたステータスのプロジェクト一覧を取得
        
        Args:
            status: ステータス
            
        Returns:
            プロジェクトのリスト
        """
        return self.db.query(Project).options(
            joinedload(Project.customer),
            joinedload(Project.site),
        ).filter(Project.status == status).order_by(Project.updated_at.desc()).all()

    def get_projects_summary(self) -> dict:
        """
        プロジェクトのサマリー情報を取得
        
        Returns:
            ステータス別の件数など
        """
        # ステータス別件数を取得
        status_counts = self.db.query(
            Project.status,
            func.count(Project.id).label('count')
        ).group_by(Project.status).all()
        
        # 今月の新規案件数
        from datetime import datetime, date
        current_month = date.today().replace(day=1)
        new_this_month = self.db.query(func.count(Project.id)).filter(
            Project.input_date >= current_month
        ).scalar()
        
        return {
            "status_counts": {status: count for status, count in status_counts},
            "new_this_month": new_this_month,
            "total_projects": sum(count for _, count in status_counts),
        }

    def search_projects(self, query: str) -> List[Project]:
        """
        プロジェクトを検索
        
        Args:
            query: 検索クエリ（プロジェクト名、施主名、プロジェクトコード）
            
        Returns:
            マッチしたプロジェクトのリスト
        """
        search_pattern = f"%{query}%"
        
        return self.db.query(Project).options(
            joinedload(Project.customer),
            joinedload(Project.site),
        ).join(Customer).filter(
            (Project.project_name.ilike(search_pattern)) |
            (Project.project_code.ilike(search_pattern)) |
            (Customer.owner_name.ilike(search_pattern))
        ).order_by(Project.updated_at.desc()).all()

    def generate_project_code(self) -> str:
        """
        プロジェクトコードを自動生成
        
        Returns:
            一意のプロジェクトコード（例: 2024001）
        """
        current_year = datetime.now().year
        
        # 今年度の最大連番を取得
        max_code = self.db.query(
            func.max(Project.project_code)
        ).filter(
            Project.project_code.like(f"{current_year}%")
        ).scalar()
        
        if max_code:
            # 既存の最大番号から1つ増やす
            current_number = int(max_code[4:]) + 1
        else:
            # 今年度初の案件
            current_number = 1
            
        return f"{current_year}{current_number:03d}"

    def create_project(self, project_data: ProjectCreate) -> Project:
        """
        新しいプロジェクトを作成
        
        Args:
            project_data: プロジェクト作成データ
            
        Returns:
            作成されたプロジェクト
        """
        try:
            # プロジェクトコード生成
            project_code = self.generate_project_code()
            
            # プロジェクト本体を作成
            db_project = Project(
                project_code=project_code,
                project_name=project_data.project_name,
                status=project_data.status,
                input_date=project_data.input_date or date.today()
            )
            self.db.add(db_project)
            self.db.flush()  # IDを取得するためにflush

            # 顧客情報を作成
            db_customer = Customer(
                project_id=db_project.id,
                **project_data.customer.dict()
            )
            self.db.add(db_customer)

            # 敷地情報を作成
            db_site = Site(
                project_id=db_project.id,
                **project_data.site.dict()
            )
            self.db.add(db_site)

            # 建物情報を作成（任意）
            if project_data.building:
                db_building = Building(
                    project_id=db_project.id,
                    **project_data.building.dict()
                )
                self.db.add(db_building)

            # 初期の財務情報とスケジュール情報を作成
            db_financial = Financial(project_id=db_project.id)
            db_schedule = Schedule(project_id=db_project.id)
            self.db.add(db_financial)
            self.db.add(db_schedule)

            self.db.commit()
            self.db.refresh(db_project)
            
            # 監査証跡記録
            self._record_audit_trail(
                target_model="Project",
                target_id=db_project.id,
                action="CREATE",
                field_name="project_name",
                new_value=db_project.project_name
            )
            
            return self.get_project_by_id(db_project.id)
            
        except Exception as e:
            self.db.rollback()
            raise e

    def update_project(self, project_id: int, project_data: ProjectUpdate) -> Optional[Project]:
        """
        プロジェクトを更新
        
        Args:
            project_id: プロジェクトID
            project_data: 更新データ
            
        Returns:
            更新されたプロジェクト、または None
        """
        try:
            db_project = self.get_project_by_id(project_id)
            if not db_project:
                return None

            # プロジェクト基本情報の更新
            update_data = project_data.dict(exclude_unset=True, exclude={'customer', 'site', 'building'})
            for field, value in update_data.items():
                setattr(db_project, field, value)

            # 顧客情報の更新
            if project_data.customer and db_project.customer:
                customer_data = project_data.customer.dict(exclude_unset=True)
                for field, value in customer_data.items():
                    setattr(db_project.customer, field, value)

            # 敷地情報の更新
            if project_data.site and db_project.site:
                site_data = project_data.site.dict(exclude_unset=True)
                for field, value in site_data.items():
                    setattr(db_project.site, field, value)

            # 建物情報の更新
            if project_data.building:
                if db_project.building:
                    # 既存の建物情報を更新
                    building_data = project_data.building.dict(exclude_unset=True)
                    for field, value in building_data.items():
                        setattr(db_project.building, field, value)
                else:
                    # 新規建物情報を作成
                    db_building = Building(
                        project_id=project_id,
                        **project_data.building.dict()
                    )
                    self.db.add(db_building)

            self.db.commit()
            self.db.refresh(db_project)
            
            return self.get_project_by_id(project_id)
            
        except Exception as e:
            self.db.rollback()
            raise e

    def update_financial(self, project_id: int, financial_data: FinancialUpdate) -> Optional[Financial]:
        """
        財務情報を更新
        
        Args:
            project_id: プロジェクトID
            financial_data: 財務更新データ
            
        Returns:
            更新された財務情報、または None
        """
        try:
            db_financial = self.db.query(Financial).filter(
                Financial.project_id == project_id
            ).first()
            
            if not db_financial:
                # 財務情報が存在しない場合は新規作成
                db_financial = Financial(
                    project_id=project_id,
                    **financial_data.dict()
                )
                self.db.add(db_financial)
            else:
                # 既存の財務情報を更新
                update_data = financial_data.dict(exclude_unset=True)
                for field, value in update_data.items():
                    setattr(db_financial, field, value)

            self.db.commit()
            self.db.refresh(db_financial)
            
            return db_financial
            
        except Exception as e:
            self.db.rollback()
            raise e

    def update_schedule(self, project_id: int, schedule_data: ScheduleUpdate) -> Optional[Schedule]:
        """
        スケジュール情報を更新
        
        Args:
            project_id: プロジェクトID
            schedule_data: スケジュール更新データ
            
        Returns:
            更新されたスケジュール情報、または None
        """
        try:
            db_schedule = self.db.query(Schedule).filter(
                Schedule.project_id == project_id
            ).first()
            
            if not db_schedule:
                # スケジュール情報が存在しない場合は新規作成
                db_schedule = Schedule(
                    project_id=project_id,
                    **schedule_data.dict()
                )
                self.db.add(db_schedule)
            else:
                # 既存のスケジュール情報を更新
                update_data = schedule_data.dict(exclude_unset=True)
                for field, value in update_data.items():
                    setattr(db_schedule, field, value)

            self.db.commit()
            self.db.refresh(db_schedule)
            
            return db_schedule
            
        except Exception as e:
            self.db.rollback()
            raise e

    def delete_project(self, project_id: int) -> bool:
        """
        プロジェクトを削除
        
        Args:
            project_id: プロジェクトID
            
        Returns:
            削除が成功したかどうか
        """
        try:
            db_project = self.get_project_by_id(project_id)
            if not db_project:
                return False

            # 監査証跡記録
            self._record_audit_trail(
                target_model="Project",
                target_id=project_id,
                action="DELETE",
                field_name="project_name",
                old_value=db_project.project_name
            )

            # 関連データも一緒に削除される（CASCADE設定による）
            self.db.delete(db_project)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
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
    
    def update_project_with_audit(self, project_id: int, project_data: ProjectUpdate) -> Optional[Project]:
        """
        プロジェクトを更新（監査証跡付き）
        
        Args:
            project_id: プロジェクトID
            project_data: 更新データ
            
        Returns:
            更新されたプロジェクト、または None
        """
        try:
            db_project = self.get_project_by_id(project_id)
            if not db_project:
                return None

            # プロジェクト基本情報の更新と監査証跡記録
            update_data = project_data.dict(exclude_unset=True, exclude={'customer', 'site', 'building'})
            for field, value in update_data.items():
                if hasattr(db_project, field) and value is not None:
                    old_value = getattr(db_project, field)
                    if old_value != value:
                        self._record_audit_trail(
                            target_model="Project",
                            target_id=project_id,
                            action="UPDATE",
                            field_name=field,
                            old_value=str(old_value) if old_value is not None else "",
                            new_value=str(value)
                        )
                        setattr(db_project, field, value)

            # 関連テーブルの更新
            if project_data.customer:
                self._update_customer_with_audit(project_id, project_data.customer)
            if project_data.site:
                self._update_site_with_audit(project_id, project_data.site)
            if project_data.building:
                self._update_building_with_audit(project_id, project_data.building)

            self.db.commit()
            self.db.refresh(db_project)
            
            return self.get_project_by_id(db_project.id)
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def _update_customer_with_audit(self, project_id: int, customer_data: CustomerUpdate):
        """顧客情報を更新（監査証跡付き）"""
        db_customer = self.db.query(Customer).filter(Customer.project_id == project_id).first()
        if not db_customer:
            return
        
        update_data = customer_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_customer, field) and value is not None:
                old_value = getattr(db_customer, field)
                if old_value != value:
                    self._record_audit_trail(
                        target_model="Customer",
                        target_id=db_customer.id,
                        action="UPDATE",
                        field_name=field,
                        old_value=str(old_value) if old_value is not None else "",
                        new_value=str(value)
                    )
                    setattr(db_customer, field, value)
    
    def _update_site_with_audit(self, project_id: int, site_data: SiteUpdate):
        """敷地情報を更新（監査証跡付き）"""
        db_site = self.db.query(Site).filter(Site.project_id == project_id).first()
        if not db_site:
            return
        
        update_data = site_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_site, field) and value is not None:
                old_value = getattr(db_site, field)
                if old_value != value:
                    self._record_audit_trail(
                        target_model="Site",
                        target_id=db_site.id,
                        action="UPDATE",
                        field_name=field,
                        old_value=str(old_value) if old_value is not None else "",
                        new_value=str(value)
                    )
                    setattr(db_site, field, value)
    
    def _update_building_with_audit(self, project_id: int, building_data: BuildingUpdate):
        """建物情報を更新（監査証跡付き）"""
        db_building = self.db.query(Building).filter(Building.project_id == project_id).first()
        if not db_building:
            # 建物情報が存在しない場合は新規作成
            db_building = Building(
                project_id=project_id,
                **building_data.dict(exclude_unset=True)
            )
            self.db.add(db_building)
            self._record_audit_trail(
                target_model="Building",
                target_id=project_id,
                action="CREATE",
                field_name="building_info",
                new_value="建物情報作成"
            )
            return
        
        update_data = building_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_building, field) and value is not None:
                old_value = getattr(db_building, field)
                if old_value != value:
                    self._record_audit_trail(
                        target_model="Building",
                        target_id=db_building.id,
                        action="UPDATE",
                        field_name=field,
                        old_value=str(old_value) if old_value is not None else "",
                        new_value=str(value)
                    )
                    setattr(db_building, field, value)