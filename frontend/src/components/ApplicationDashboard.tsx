import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../utils/statusUtils';
import type { 
  EnhancedApplication, 
  ApplicationSummary, 
  ApplicationStatus,
  ApplicationCategory,
  ApplicationPriority 
} from '../types/application';

interface ApplicationDashboardProps {
  applications: EnhancedApplication[];
  summary: ApplicationSummary;
  onViewApplication: (application: EnhancedApplication) => void;
  onEditApplication: (application: EnhancedApplication) => void;
}

const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({
  applications,
  summary,
  onViewApplication,
  onEditApplication
}) => {
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ApplicationCategory | 'all'>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // フィルタリングされた申請
  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterCategory !== 'all' && app.category !== filterCategory) return false;
    if (showOverdueOnly) {
      const isOverdue = app.response_deadline && 
        new Date(app.response_deadline) < new Date() && 
        !['承認', '却下', '取り下げ'].includes(app.status);
      if (!isOverdue) return false;
    }
    return true;
  });


  const getPriorityColor = (priority: ApplicationPriority): 'default' | 'primary' | 'secondary' | 'error' | 'warning' => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high'): 'success' | 'warning' | 'error' => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // 統計カード
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error';
    trend?: number;
  }> = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: `${color}.main`, fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon 
                  fontSize="small" 
                  color={trend > 0 ? 'success' : trend < 0 ? 'error' : 'inherit'}
                />
                <Typography 
                  variant="caption" 
                  color={trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'inherit'}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* 統計概要 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <StatCard
          title="総申請数"
          value={summary.total_count}
          icon={<TimelineIcon fontSize="large" />}
          color="primary"
        />
        
        <StatCard
          title="緊急案件"
          value={summary.urgent_count}
          subtitle="要注意案件"
          icon={<WarningIcon fontSize="large" />}
          color="error"
        />
        
        <StatCard
          title="期限超過"
          value={summary.overdue_count}
          subtitle="期限を過ぎた案件"
          icon={<ScheduleIcon fontSize="large" />}
          color="warning"
        />
        
        <StatCard
          title="承認率"
          value={`${summary.approval_rate.toFixed(1)}%`}
          subtitle={`平均 ${summary.avg_completion_days}日`}
          icon={<CheckCircleIcon fontSize="large" />}
          color="success"
        />
      </Box>

      {/* ステータス別統計 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ステータス別分布
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
            {Object.entries(summary.by_status).map(([status, count]) => (
              <Box key={status} sx={{ textAlign: 'center', p: 1 }}>
                <Chip
                  label={status}
                  color={getStatusColor(status as ApplicationStatus)}
                  sx={{ mb: 1, minWidth: 80 }}
                />
                <Typography variant="h6" component="p">
                  {count}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* フィルタ・検索 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">フィルタ</Typography>
            
            <Button
              variant={showOverdueOnly ? 'contained' : 'outlined'}
              color="warning"
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              startIcon={<WarningIcon />}
            >
              期限超過のみ
            </Button>
            
            <Typography variant="body2" color="textSecondary">
              {filteredApplications.length} / {applications.length} 件表示
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 申請一覧テーブル */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            申請一覧
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>申請タイトル</TableCell>
                  <TableCell>プロジェクト</TableCell>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>優先度</TableCell>
                  <TableCell>進捗</TableCell>
                  <TableCell>期限</TableCell>
                  <TableCell>リスク</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.slice(0, 20).map((app) => {
                  const daysUntilDeadline = getDaysUntilDeadline(app.response_deadline);
                  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;
                  
                  return (
                    <TableRow key={app.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {app.title}
                          </Typography>
                          {app.reference_number && (
                            <Typography variant="caption" color="textSecondary">
                              {app.reference_number}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {app.project.project_code}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {app.project.project_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip label={app.category} size="small" variant="outlined" />
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={app.status}
                          color={getStatusColor(app.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={app.priority}
                          color={getPriorityColor(app.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ minWidth: 100 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={app.progress_percentage}
                              sx={{ flexGrow: 1, mr: 1 }}
                              color={app.progress_percentage >= 80 ? 'success' : 'primary'}
                            />
                            <Typography variant="caption">
                              {app.progress_percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        {app.response_deadline ? (
                          <Box>
                            <Typography 
                              variant="body2"
                              color={isOverdue ? 'error' : daysUntilDeadline! <= 3 ? 'warning.main' : 'inherit'}
                            >
                              {formatDate(app.response_deadline)}
                            </Typography>
                            {daysUntilDeadline !== null && (
                              <Typography variant="caption" color="textSecondary">
                                {isOverdue ? `${Math.abs(daysUntilDeadline)}日超過` : `あと${daysUntilDeadline}日`}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">---</Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={app.risk_level}
                          color={getRiskColor(app.risk_level)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="詳細表示">
                            <IconButton 
                              size="small"
                              onClick={() => onViewApplication(app)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="編集">
                            <IconButton 
                              size="small"
                              onClick={() => onEditApplication(app)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredApplications.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              条件に一致する申請がありません。
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplicationDashboard;