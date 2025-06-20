import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { getStatusColor } from '../../utils/statusUtils';

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface StatusChartProps {
  data: Record<string, number>;
  title?: string;
}

const getStatusColorHex = (status: string): string => {
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
  return colorMap[statusColor] || '#6c757d';
};

const StatusChart: React.FC<StatusChartProps> = ({ 
  data, 
  title = 'ステータス別案件数' 
}) => {
  const chartData: StatusData[] = Object.entries(data).map(([status, count]) => ({
    status,
    count,
    color: getStatusColorHex(status),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2">
            {data.status}: {data.count}件
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const renderLabel = (entry: StatusData) => {
    return `${entry.status} (${entry.count})`;
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default StatusChart;