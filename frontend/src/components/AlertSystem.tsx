import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Badge,
  Fab,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../services/api';
import type { Project } from '../types/project';

interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  project?: Project;
  daysUntilDeadline?: number;
  priority: 'high' | 'medium' | 'low';
}

const AlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-alerts'],
    queryFn: () => projectApi.getProjects({ limit: 1000 }),
    refetchInterval: 5 * 60 * 1000, // 5分ごとに更新
  });

  useEffect(() => {
    if (projectsData?.projects) {
      generateAlerts(projectsData.projects);
    }
  }, [projectsData]);

  const generateAlerts = (projects: Project[]) => {
    const newAlerts: AlertItem[] = [];
    const today = new Date();

    projects.forEach((project) => {
      // 検査期限アラート
      if (project.schedule) {
        const checkInspectionDate = (
          scheduledDate: string | undefined,
          actualDate: string | undefined,
          inspectionType: string,
          urgencyDays: number = 3
        ) => {
          if (scheduledDate && !actualDate) {
            const scheduled = new Date(scheduledDate);
            const diffTime = scheduled.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              // 期限超過
              newAlerts.push({
                id: `overdue-${project.id}-${inspectionType}`,
                type: 'danger',
                title: `${inspectionType}期限超過`,
                message: `${project.project_name} (${project.project_code})`,
                project,
                daysUntilDeadline: diffDays,
                priority: 'high',
              });
            } else if (diffDays <= urgencyDays) {
              // 期限が近い
              newAlerts.push({
                id: `upcoming-${project.id}-${inspectionType}`,
                type: diffDays === 0 ? 'danger' : 'warning',
                title: `${inspectionType}期限${diffDays === 0 ? '当日' : `${diffDays}日前`}`,
                message: `${project.project_name} (${project.project_code})`,
                project,
                daysUntilDeadline: diffDays,
                priority: diffDays === 0 ? 'high' : 'medium',
              });
            }
          }
        };

        checkInspectionDate(
          project.schedule.reinforcement_scheduled,
          project.schedule.reinforcement_actual,
          '配筋検査'
        );
        checkInspectionDate(
          project.schedule.interim_scheduled,
          project.schedule.interim_actual,
          '中間検査'
        );
        checkInspectionDate(
          project.schedule.completion_scheduled,
          project.schedule.completion_actual,
          '完了検査'
        );
      }

      // ステータス別アラート
      if (project.status === '申請作業' && project.created_at) {
        const createdDate = new Date(project.created_at);
        const diffTime = today.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          newAlerts.push({
            id: `long-pending-${project.id}`,
            type: 'warning',
            title: '申請作業長期化',
            message: `${project.project_name} - ${diffDays}日経過`,
            project,
            priority: 'medium',
          });
        }
      }

      // 財務アラート
      if (project.financial && project.status === '受注') {
        if (!project.financial.contract_price) {
          newAlerts.push({
            id: `missing-contract-${project.id}`,
            type: 'warning',
            title: '契約金額未設定',
            message: `${project.project_name}`,
            project,
            priority: 'medium',
          });
        }
      }
    });

    // 優先度順にソート
    newAlerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setAlerts(newAlerts.filter(alert => !dismissedAlerts.has(alert.id)));
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertSeverity = (type: AlertItem['type']) => {
    switch (type) {
      case 'danger': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');
  const hasUrgentAlerts = highPriorityAlerts.length > 0;

  return (
    <>
      {/* フローティングアラートボタン */}
      <Fab
        color={hasUrgentAlerts ? 'error' : alerts.length > 0 ? 'warning' : 'default'}
        aria-label="alerts"
        onClick={() => setShowAlerts(!showAlerts)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Badge badgeContent={alerts.length} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </Fab>

      {/* アラート表示エリア */}
      <Collapse in={showAlerts}>
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 24,
            width: 400,
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 999,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                アラート通知 ({alerts.length})
              </Typography>
              <IconButton size="small" onClick={() => setShowAlerts(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 'calc(70vh - 80px)', overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography color="textSecondary">
                  現在、アラートはありません
                </Typography>
              </Box>
            ) : (
              <List dense>
                {alerts.map((alert) => (
                  <ListItem
                    key={alert.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <Alert
                      severity={getAlertSeverity(alert.type)}
                      sx={{ width: '100%', mb: 1 }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <AlertTitle>{alert.title}</AlertTitle>
                      {alert.message}
                      
                      {alert.daysUntilDeadline !== undefined && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={
                              alert.daysUntilDeadline < 0
                                ? `${Math.abs(alert.daysUntilDeadline)}日超過`
                                : alert.daysUntilDeadline === 0
                                ? '本日期限'
                                : `${alert.daysUntilDeadline}日後`
                            }
                            color={
                              alert.daysUntilDeadline < 0 ? 'error' :
                              alert.daysUntilDeadline === 0 ? 'error' : 'warning'
                            }
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={alert.priority === 'high' ? '高' : alert.priority === 'medium' ? '中' : '低'}
                          color={alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Alert>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* 緊急アラートのポップアップ表示 */}
      {hasUrgentAlerts && (
        <Box sx={{ position: 'fixed', top: 16, right: 16, width: 350, zIndex: 1001 }}>
          {highPriorityAlerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.id}
              severity="error"
              sx={{ mb: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <AlertTitle>{alert.title}</AlertTitle>
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}
    </>
  );
};

export default AlertSystem;