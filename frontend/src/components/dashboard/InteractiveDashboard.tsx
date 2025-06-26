import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from '@mui/icons-material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { projectApi } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Fab,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import { 
  Add as AddIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Widget Components
import ProjectSummaryWidget from './widgets/ProjectSummaryWidget';
import ProjectStatusWidget from './widgets/ProjectStatusWidget';
import MonthlyTrendWidget from './widgets/MonthlyTrendWidget';
import RecentProjectsWidget from './widgets/RecentProjectsWidget';
import KPIMetricsWidget from './widgets/KPIMetricsWidget';
import DashboardSettingsDialog, { DashboardSettings } from './DashboardSettings';
import { getStatusColor, IN_PROGRESS_STATUSES, INSPECTION_PENDING_STATUSES, COMPLETED_STATUSES } from '../../constants';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetType {
  id: string;
  type: 'summary' | 'status' | 'trend' | 'recent' | 'kpi';
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface DashboardLayout extends Layout {
  widgetType: string;
}

interface InteractiveDashboardProps {
  projects: any[];
  loading?: boolean;
}

const AVAILABLE_WIDGETS: WidgetType[] = [
  {
    id: 'summary',
    type: 'summary',
    title: 'プロジェクト概要',
    icon: <DashboardIcon />,
    description: '案件数と進捗の概要を表示',
  },
  {
    id: 'status',
    type: 'status',
    title: 'ステータス分布',
    icon: <PieChartIcon />,
    description: 'プロジェクトのステータス別分布を円グラフで表示',
  },
  {
    id: 'trend',
    type: 'trend',
    title: '月別推移',
    icon: <TrendingUpIcon />,
    description: '新規案件と完了案件の月別推移を表示',
  },
  {
    id: 'recent',
    type: 'recent',
    title: '最近のプロジェクト',
    icon: <AssignmentIcon />,
    description: '最近作成されたプロジェクトのリストを表示',
  },
  {
    id: 'kpi',
    type: 'kpi',
    title: 'KPI指標',
    icon: <AnalyticsIcon />,
    description: '重要業績評価指標の進捗状況を表示',
  },
];

const DEFAULT_LAYOUTS: DashboardLayout[] = [
  { i: 'summary-1', x: 0, y: 0, w: 12, h: 3, widgetType: 'summary' },
  { i: 'status-1', x: 0, y: 3, w: 6, h: 4, widgetType: 'status' },
  { i: 'trend-1', x: 6, y: 3, w: 6, h: 4, widgetType: 'trend' },
  { i: 'recent-1', x: 0, y: 7, w: 12, h: 4, widgetType: 'recent' },
];

const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  projects: initialProjects,
  loading = false,
}) => {
  const [projects, setProjects] = useState(initialProjects);
  const [layouts, setLayouts] = useState<DashboardLayout[]>(() => {
    const saved = localStorage.getItem('dashboard-layout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUTS;
  });
  
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Dashboard settings
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(() => {
    const saved = localStorage.getItem('dashboard-settings');
    return saved ? JSON.parse(saved) : {
      autoRefresh: true,
      refreshInterval: 30,
      showAnimations: true,
      compactMode: false,
      defaultView: 'interactive',
      showConnectionStatus: true,
      enableNotifications: true,
      theme: 'auto',
    };
  });

  // WebSocket handlers
  const handleProjectUpdate = useCallback((data: any, action: string) => {
    setLastUpdateTime(new Date());
    
    if (action === 'create') {
      setProjects(prev => [...prev, data]);
    } else if (action === 'update') {
      setProjects(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
    } else if (action === 'delete') {
      setProjects(prev => prev.filter(p => p.id !== data.id));
    }
  }, []);

  const handleDashboardRefresh = useCallback(async () => {
    try {
      const response = await projectApi.getProjects({ skip: 0, limit: 1000 });
      setProjects(response.projects || []);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }, []);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    await handleDashboardRefresh();
  }, [handleDashboardRefresh]);

  const handleNotification = useCallback((notification: any) => {
    // ここで通知の表示処理を実装
  }, []);

  // WebSocket connection
  const { isConnected, connectionError, reconnectCount } = useWebSocket({
    userId: 'dashboard-user', // 実際のアプリではユーザーIDを使用
    onProjectUpdate: handleProjectUpdate,
    onDashboardRefresh: handleDashboardRefresh,
    onNotification: handleNotification,
  });

  // Update projects when initial projects change
  useEffect(() => {
    setProjects(initialProjects);
    if (initialProjects.length > 0) {
      setLastUpdateTime(new Date());
    }
  }, [initialProjects]);

  // Initial data load and periodic refresh when WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      // Fallback: refresh every 2 minutes when WebSocket is disconnected
      const fallbackInterval = setInterval(() => {
        handleDashboardRefresh();
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearInterval(fallbackInterval);
    }
  }, [isConnected, handleDashboardRefresh]);

  // Data processing functions
  const getStatusCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    projects.forEach(project => {
      counts[project.status] = (counts[project.status] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const getStatusChartData = useCallback(() => {
    const statusCounts = getStatusCounts();

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status)
    }));
  }, [getStatusCounts]);

  const getSummaryData = useCallback(() => {
    const statusCounts = getStatusCounts();
    
    const inProgress = IN_PROGRESS_STATUSES.reduce((sum, status) => sum + (statusCounts[status] || 0), 0);
    const pending = INSPECTION_PENDING_STATUSES.reduce((sum, status) => sum + (statusCounts[status] || 0), 0);
    const completed = COMPLETED_STATUSES.reduce((sum, status) => sum + (statusCounts[status] || 0), 0);
    
    return {
      total: projects.length,
      inProgress,
      pending,
      completed,
    };
  }, [projects.length, getStatusCounts]);

  const getMonthlyTrendData = useCallback(() => {
    const monthlyData: Record<string, { projects: number; completed: number }> = {};
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    months.forEach(month => {
      monthlyData[month] = { projects: 0, completed: 0 };
    });
    
    projects.forEach(project => {
      if (project.created_at) {
        const date = new Date(project.created_at);
        const month = months[date.getMonth()];
        monthlyData[month].projects += 1;
        
        if (project.status === '完了') {
          monthlyData[month].completed += 1;
        }
      }
    });
    
    return months.map(month => ({
      month,
      projects: monthlyData[month].projects,
      completed: monthlyData[month].completed,
    }));
  }, [projects]);

  const getKPIData = useCallback(() => {
    const total = projects.length;
    const completed = getStatusCounts()['完了'] || 0;
    const inProgress = (getStatusCounts()['申請作業'] || 0) + (getStatusCounts()['審査中'] || 0);
    
    // Sample KPI data - in a real app, this would come from analytics APIs
    return [
      {
        name: '完了率',
        value: total > 0 ? (completed / total) * 100 : 0,
        target: 80,
        unit: '%',
        trend: 'up' as const,
        trendValue: 2.5,
        color: '#4caf50',
      },
      {
        name: '平均処理時間',
        value: 12.5,
        target: 15,
        unit: '日',
        trend: 'down' as const,
        trendValue: -8.2,
        color: '#2196f3',
      },
      {
        name: '進行中案件',
        value: inProgress,
        target: 20,
        unit: '件',
        trend: 'up' as const,
        trendValue: 15.3,
        color: '#ff9800',
      },
      {
        name: 'エラー率',
        value: 2.1,
        target: 5,
        unit: '%',
        trend: 'down' as const,
        trendValue: -12.4,
        color: '#f44336',
      },
    ];
  }, [projects, getStatusCounts]);

  // Layout management
  const handleLayoutChange = useCallback((newLayouts: Layout[]) => {
    const updatedLayouts = newLayouts.map(layout => {
      const existingLayout = layouts.find(l => l.i === layout.i);
      return {
        ...layout,
        widgetType: existingLayout?.widgetType || 'summary',
      } as DashboardLayout;
    });
    
    setLayouts(updatedLayouts);
    localStorage.setItem('dashboard-layout', JSON.stringify(updatedLayouts));
  }, [layouts]);

  const addWidget = useCallback((widgetType: string) => {
    const timestamp = Date.now();
    const newWidget: DashboardLayout = {
      i: `${widgetType}-${timestamp}`,
      x: 0,
      y: Math.max(...layouts.map(l => l.y + l.h), 0),
      w: widgetType === 'summary' ? 12 : 6,
      h: widgetType === 'summary' ? 3 : 4,
      widgetType,
    };
    
    const updatedLayouts = [...layouts, newWidget];
    setLayouts(updatedLayouts);
    localStorage.setItem('dashboard-layout', JSON.stringify(updatedLayouts));
    setShowAddWidget(false);
  }, [layouts]);

  const removeWidget = useCallback((widgetId: string) => {
    const updatedLayouts = layouts.filter(layout => layout.i !== widgetId);
    setLayouts(updatedLayouts);
    localStorage.setItem('dashboard-layout', JSON.stringify(updatedLayouts));
  }, [layouts]);

  // Settings management
  const handleSettingsChange = useCallback((newSettings: DashboardSettings) => {
    setDashboardSettings(newSettings);
    localStorage.setItem('dashboard-settings', JSON.stringify(newSettings));
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    localStorage.setItem('dashboard-layout', JSON.stringify(DEFAULT_LAYOUTS));
  }, []);

  const handleExportLayout = useCallback(() => {
    const exportData = {
      layouts,
      settings: dashboardSettings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [layouts, dashboardSettings]);

  const handleImportLayout = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.layouts) {
          setLayouts(importData.layouts);
          localStorage.setItem('dashboard-layout', JSON.stringify(importData.layouts));
        }
        
        if (importData.settings) {
          setDashboardSettings(importData.settings);
          localStorage.setItem('dashboard-settings', JSON.stringify(importData.settings));
        }
        
        console.log('Layout imported successfully');
      } catch (error) {
        console.error('Failed to import layout:', error);
        alert('レイアウトファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!dashboardSettings.autoRefresh) return;

    const interval = setInterval(() => {
      handleDashboardRefresh();
    }, dashboardSettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [dashboardSettings.autoRefresh, dashboardSettings.refreshInterval, handleDashboardRefresh]);

  const renderWidget = useCallback((layout: DashboardLayout) => {
    const commonProps = {
      id: layout.i,
      onRemove: removeWidget,
    };

    switch (layout.widgetType) {
      case 'summary':
        return (
          <ProjectSummaryWidget
            {...commonProps}
            data={getSummaryData()}
          />
        );
      case 'status':
        return (
          <ProjectStatusWidget
            {...commonProps}
            data={getStatusChartData()}
          />
        );
      case 'trend':
        return (
          <MonthlyTrendWidget
            {...commonProps}
            data={getMonthlyTrendData()}
          />
        );
      case 'recent':
        return (
          <RecentProjectsWidget
            {...commonProps}
            projects={projects}
          />
        );
      case 'kpi':
        return (
          <KPIMetricsWidget
            {...commonProps}
            data={getKPIData()}
          />
        );
      default:
        return <div>Unknown widget type</div>;
    }
  }, [getSummaryData, getStatusChartData, getMonthlyTrendData, getKPIData, projects, removeWidget]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography variant="h6">ダッシュボードを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ position: 'relative', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ color: '#495057' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Dashboard sx={{ fontSize: '1.25rem' }} />
                インタラクティブダッシュボード
              </Box>
            </Typography>
            {dashboardSettings.showConnectionStatus && (
              <Chip
                icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
                label={isConnected ? 'リアルタイム接続中' : '接続なし'}
                color={isConnected ? 'success' : 'error'}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            {lastUpdateTime && (
              <Typography variant="caption" color="textSecondary">
                最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP')}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleManualRefresh}
              size="small"
            >
              更新
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowSettings(true)}
              size="small"
            >
              設定
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddWidget(true)}
              sx={{ bgcolor: '#007bff' }}
            >
              ウィジェット追加
            </Button>
          </Box>
        </Box>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            リアルタイム接続エラー: {connectionError}
            {reconnectCount > 0 && ` (再接続試行中: ${reconnectCount})`}
          </Alert>
        )}

        <ResponsiveGridLayout
          className={`layout ${dashboardSettings.compactMode ? 'compact' : ''}`}
          layouts={{ lg: layouts }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={dashboardSettings.compactMode ? 40 : 60}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          margin={dashboardSettings.compactMode ? [8, 8] : [16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={dashboardSettings.showAnimations}
        >
          {layouts.map((layout) => (
            <div key={layout.i}>
              {renderWidget(layout)}
            </div>
          ))}
        </ResponsiveGridLayout>

        {/* Add Widget Dialog */}
        <Dialog
          open={showAddWidget}
          onClose={() => setShowAddWidget(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>ウィジェットを追加</DialogTitle>
          <DialogContent>
            <List>
              {AVAILABLE_WIDGETS.map((widget) => (
                <ListItem key={widget.id}>
                  <ListItemButton
                    onClick={() => addWidget(widget.type)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>{widget.icon}</ListItemIcon>
                    <ListItemText
                      primary={widget.title}
                      secondary={widget.description}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddWidget(false)}>キャンセル</Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <DashboardSettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={dashboardSettings}
          onSettingsChange={handleSettingsChange}
          onResetLayout={handleResetLayout}
          onExportLayout={handleExportLayout}
          onImportLayout={handleImportLayout}
        />
      </Box>
    </DndProvider>
  );
};

export default InteractiveDashboard;