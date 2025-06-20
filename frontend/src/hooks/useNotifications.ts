import { useState, useEffect } from 'react';
import { projectApi } from '../services/api';
import type { Project } from '../types/project';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  project?: Project;
  daysUntilDeadline?: number;
  priority: 'high' | 'medium' | 'low';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const checkInspectionDeadlines = async () => {
    setLoading(true);
    try {
      const { projects } = await projectApi.getProjects({ skip: 0, limit: 1000 });
      const today = new Date();
      const alerts: Notification[] = [];

      projects.forEach((project) => {
        if (!project.schedule) return;

        // 配筋検査期限チェック
        if (project.schedule.reinforcement_scheduled && !project.schedule.reinforcement_actual) {
          const deadline = new Date(project.schedule.reinforcement_scheduled);
          const diffTime = deadline.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            alerts.push({
              id: `reinforcement-overdue-${project.id}`,
              type: 'error',
              title: '配筋検査期限超過',
              message: `${project.project_name} の配筋検査予定日を過ぎています`,
              project,
              daysUntilDeadline: diffDays,
              priority: 'high'
            });
          } else if (diffDays <= 3) {
            alerts.push({
              id: `reinforcement-warning-${project.id}`,
              type: 'warning',
              title: '配筋検査期限間近',
              message: `${project.project_name} の配筋検査まであと${diffDays}日です`,
              project,
              daysUntilDeadline: diffDays,
              priority: diffDays <= 1 ? 'high' : 'medium'
            });
          }
        }

        // 中間検査期限チェック
        if (project.schedule.interim_scheduled && !project.schedule.interim_actual) {
          const deadline = new Date(project.schedule.interim_scheduled);
          const diffTime = deadline.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            alerts.push({
              id: `interim-overdue-${project.id}`,
              type: 'error',
              title: '中間検査期限超過',
              message: `${project.project_name} の中間検査予定日を過ぎています`,
              project,
              daysUntilDeadline: diffDays,
              priority: 'high'
            });
          } else if (diffDays <= 3) {
            alerts.push({
              id: `interim-warning-${project.id}`,
              type: 'warning',
              title: '中間検査期限間近',
              message: `${project.project_name} の中間検査まであと${diffDays}日です`,
              project,
              daysUntilDeadline: diffDays,
              priority: diffDays <= 1 ? 'high' : 'medium'
            });
          }
        }

        // 完了検査期限チェック
        if (project.schedule.completion_scheduled && !project.schedule.completion_actual) {
          const deadline = new Date(project.schedule.completion_scheduled);
          const diffTime = deadline.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            alerts.push({
              id: `completion-overdue-${project.id}`,
              type: 'error',
              title: '完了検査期限超過',
              message: `${project.project_name} の完了検査予定日を過ぎています`,
              project,
              daysUntilDeadline: diffDays,
              priority: 'high'
            });
          } else if (diffDays <= 3) {
            alerts.push({
              id: `completion-warning-${project.id}`,
              type: 'warning',
              title: '完了検査期限間近',
              message: `${project.project_name} の完了検査まであと${diffDays}日です`,
              project,
              daysUntilDeadline: diffDays,
              priority: diffDays <= 1 ? 'high' : 'medium'
            });
          }
        }

        // 必要書類未提出チェック
        if (project.financial) {
          const missingDocs = [];
          if (!project.financial.has_permit_application) missingDocs.push('交付申請書');
          if (!project.financial.has_inspection_schedule) missingDocs.push('検査予定表');
          if (!project.financial.has_foundation_plan) missingDocs.push('基礎伏図');

          if (missingDocs.length > 0 && ['申請作業', '審査中'].includes(project.status)) {
            alerts.push({
              id: `missing-docs-${project.id}`,
              type: 'warning',
              title: '必要書類未提出',
              message: `${project.project_name}: ${missingDocs.join('、')}が未提出です`,
              project,
              priority: 'medium'
            });
          }
        }

        // 長期間更新されていないプロジェクト
        if (project.updated_at) {
          const lastUpdate = new Date(project.updated_at);
          const daysSinceUpdate = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceUpdate > 30 && !['完了', '失注'].includes(project.status)) {
            alerts.push({
              id: `stale-project-${project.id}`,
              type: 'info',
              title: '長期間未更新',
              message: `${project.project_name} が${daysSinceUpdate}日間更新されていません`,
              project,
              priority: 'low'
            });
          }
        }
      });

      // 優先度順にソート
      alerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      setNotifications(alerts);
    } catch (error) {
      console.error('Failed to check deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getHighPriorityCount = () => {
    return notifications.filter(n => n.priority === 'high').length;
  };

  const getMediumPriorityCount = () => {
    return notifications.filter(n => n.priority === 'medium').length;
  };

  useEffect(() => {
    checkInspectionDeadlines();
    
    // 1時間ごとに再チェック
    const interval = setInterval(checkInspectionDeadlines, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    loading,
    dismissNotification,
    refreshNotifications: checkInspectionDeadlines,
    getHighPriorityCount,
    getMediumPriorityCount,
  };
};