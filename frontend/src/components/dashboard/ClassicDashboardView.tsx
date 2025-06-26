import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Box, Paper, Typography, Card, CardContent } from '@mui/material';
import { Assignment as AssignmentIcon, Sync as SyncIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface ClassicDashboardViewProps {
  projects: any[];
  statusCounts: Record<string, number>;
  chartData: Array<{ name: string; value: number; color: string }>;
  monthlyTrend: Array<{ month: string; projects: number }>;
  priorityData: Array<{ name: string; value: number; color: string }>;
}

const ClassicDashboardView: React.FC<ClassicDashboardViewProps> = ({
  projects,
  statusCounts,
  chartData,
  monthlyTrend,
  priorityData,
}) => {
  return (
    <Box>
      {/* サマリーカード */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon />
                総案件数
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: '#007bff', fontWeight: 'bold' }}>
              {projects.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SyncIcon />
                進行中案件
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: '#28a745', fontWeight: 'bold' }}>
              {(statusCounts['申請作業'] || 0) + (statusCounts['審査中'] || 0)}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ color: 'warning.main' }} />
                検査待ち
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
              {(statusCounts['配筋検査待ち'] || 0) + (statusCounts['中間検査待ち'] || 0) + (statusCounts['完了検査待ち'] || 0)}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                完了案件
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: '#28a745', fontWeight: 'bold' }}>
              {statusCounts['完了'] || 0}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* チャートセクション */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3, mb: 4 }}>
        {/* ステータス分布円グラフ */}
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            ステータス別案件分布
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        {/* 優先度分布円グラフ */}
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            アラート優先度分布
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* 月別推移とステータス詳細 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 4 }}>
        {/* 月別案件登録数推移 */}
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            月別案件登録数推移
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke="#007bff" 
                strokeWidth={3}
                dot={{ fill: '#007bff' }}
                name="案件数"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* ステータス別棒グラフ */}
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            ステータス詳細
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* 最近の案件 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          最近の案件
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projects.slice(0, 5).map((project) => (
            <Box
              key={project.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderLeft: 4,
                borderColor: '#28a745',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#e9ecef'
                }
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#495057' }}>
                  {project.project_name || 'プロジェクト名未設定'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {project.project_code} - 作成日: {new Date(project.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  background: project.status === '完了' ? '#28a745' : '#007bff',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.8rem'
                }}
              >
                {project.status}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ClassicDashboardView;