import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface ProgressData {
  month: string;
  新規: number;
  完了: number;
  進行中: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  title?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title = '月別案件進捗' 
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          {payload.map((item: any, index: number) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ color: item.color }}
            >
              {item.dataKey}: {item.value}件
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="新規" fill="#007bff" name="新規案件" />
            <Bar dataKey="完了" fill="#28a745" name="完了案件" />
            <Bar dataKey="進行中" fill="#ffc107" name="進行中案件" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProgressChart;