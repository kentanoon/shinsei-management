import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';
import AlertPanel from '../components/AlertPanel';
import InspectionCalendar from '../components/InspectionCalendar';
import InteractiveDashboard from '../components/dashboard/InteractiveDashboard';
import ClassicDashboardView from '../components/dashboard/ClassicDashboardView';
import { getStatusColor } from '../utils/statusUtils';
import { projectApi } from '../services/api';
import type { Project } from '../types/project';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { getHighPriorityCount, getMediumPriorityCount } = useNotifications();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getProjects({ skip: 0, limit: 1000 });
        setProjects(response.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    projects.forEach(project => {
      counts[project.status] = (counts[project.status] || 0) + 1;
    });
    return counts;
  };

  const getChartData = () => {
    const statusCounts = getStatusCounts();
    return Object.entries(statusCounts).map(([status, count]) => {
      const statusColor = getStatusColor(status);
      // Convert Material-UI color names to hex colors for chart
      const colorMap: Record<string, string> = {
        'info': '#6c757d',
        'primary': '#007bff',
        'warning': '#fd7e14',
        'secondary': '#ffc107',
        'success': '#28a745',
        'error': '#dc3545',
        'default': '#6c757d'
      };
      return {
        name: status,
        value: count,
        color: colorMap[statusColor] || '#6c757d'
      };
    });
  };


  const getMonthlyTrend = () => {
    const monthlyData: Record<string, number> = {};
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    months.forEach(month => {
      monthlyData[month] = 0;
    });
    
    projects.forEach(project => {
      if (project.created_at) {
        const date = new Date(project.created_at);
        const month = months[date.getMonth()];
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      }
    });
    
    return months.map(month => ({
      month,
      projects: monthlyData[month] || 0
    }));
  };

  const getPriorityData = () => {
    const highPriority = getHighPriorityCount();
    const mediumPriority = getMediumPriorityCount();
    const lowPriority = Math.max(0, projects.length - highPriority - mediumPriority);
    
    return [
      { name: '高優先度', value: highPriority, color: '#dc3545' },
      { name: '中優先度', value: mediumPriority, color: '#ffc107' },
      { name: '低優先度', value: lowPriority, color: '#28a745' }
    ].filter(item => item.value > 0);
  };

  const statusCounts = getStatusCounts();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5">読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#495057', mb: 3 }}>
        📊 ダッシュボード
      </Typography>

      {/* アラートパネル */}
      <Box sx={{ mb: 4 }}>
        <AlertPanel maxHeight={300} />
      </Box>

      {/* タブ切り替え */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="📊 インタラクティブビュー" />
          <Tab label="📈 クラシックビュー" />
          <Tab label="📅 カレンダービュー" />
        </Tabs>
      </Paper>

      {/* タブコンテンツ */}
      {tabValue === 0 && (
        <InteractiveDashboard projects={projects} loading={loading} />
      )}

      {tabValue === 1 && (
        <ClassicDashboardView 
          projects={projects} 
          statusCounts={getStatusCounts()}
          chartData={getChartData()}
          monthlyTrend={getMonthlyTrend()}
          priorityData={getPriorityData()}
        />
      )}

      {tabValue === 2 && (
        <Box>
          <InspectionCalendar />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;