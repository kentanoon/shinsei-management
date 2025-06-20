import { useState, useEffect } from 'react';
import { projectApi } from '../services/api';

export interface Alert {
  id: string;
  type: 'inspection' | 'application' | 'financial';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  projectCode: string;
  projectName: string;
  dueDate: string;
  daysRemaining: number;
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const projects = await projectApi.getProjects({ skip: 0, limit: 1000 });
      const generatedAlerts = generateAlerts(projects.projects);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (projects: any[]): Alert[] => {
    const alerts: Alert[] = [];
    const today = new Date();

    projects.forEach((project) => {
      // 検査スケジュールアラート
      if (project.schedule) {
        const scheduleChecks = [
          {
            field: 'reinforcement_scheduled',
            title: '配筋検査',
            type: 'inspection' as const
          },
          {
            field: 'interim_scheduled',
            title: '中間検査',
            type: 'inspection' as const
          },
          {
            field: 'completion_scheduled',
            title: '完了検査',
            type: 'inspection' as const
          }
        ];

        scheduleChecks.forEach(({ field, title, type }) => {
          const scheduledDate = project.schedule[field];
          if (scheduledDate) {
            const dueDate = new Date(scheduledDate);
            const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysRemaining <= 7 && daysRemaining >= 0) {
              alerts.push({
                id: `${project.id}-${field}`,
                type,
                severity: daysRemaining <= 2 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low',
                title: `${title}予定日が近づいています`,
                message: `${project.project_name}の${title}予定日まで${daysRemaining}日です。`,
                projectCode: project.project_code,
                projectName: project.project_name,
                dueDate: scheduledDate,
                daysRemaining
              });
            }
          }
        });
      }

      // 申請期限アラート
      if (project.applications) {
        project.applications.forEach((application: any) => {
          if (application.status === '申請' && !application.approved_date) {
            // 申請から30日経過でアラート
            const submittedDate = new Date(application.submitted_date);
            const daysSinceSubmitted = Math.ceil((today.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceSubmitted >= 25) {
              alerts.push({
                id: `${application.id}-approval`,
                type: 'application',
                severity: daysSinceSubmitted >= 30 ? 'high' : 'medium',
                title: '申請の承認が遅れています',
                message: `${application.application_type.name}の承認が${daysSinceSubmitted}日経過しています。`,
                projectCode: project.project_code,
                projectName: project.project_name,
                dueDate: application.submitted_date,
                daysRemaining: -daysSinceSubmitted
              });
            }
          }
        });
      }

      // 財務関連アラート
      if (project.financial) {
        // 契約から決済まで90日経過でアラート
        if (project.financial.contract_price && !project.financial.settlement_date) {
          // 仮に契約日をプロジェクト作成日とする
          const contractDate = new Date(project.created_at);
          const daysSinceContract = Math.ceil((today.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceContract >= 80) {
            alerts.push({
              id: `${project.id}-settlement`,
              type: 'financial',
              severity: daysSinceContract >= 90 ? 'high' : 'medium',
              title: '決済が遅れています',
              message: `契約から${daysSinceContract}日経過していますが、まだ決済されていません。`,
              projectCode: project.project_code,
              projectName: project.project_name,
              dueDate: project.created_at,
              daysRemaining: -daysSinceContract
            });
          }
        }
      }
    });

    // 重要度でソート
    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    fetchAlerts();
    // 1時間ごとに更新
    const interval = setInterval(fetchAlerts, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    loading,
    refreshAlerts: fetchAlerts,
    dismissAlert
  };
};