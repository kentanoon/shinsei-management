import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface FinancialData {
  month: string;
  契約金額: number;
  決済金額: number;
}

interface FinancialChartProps {
  data: FinancialData[];
  title?: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  data, 
  title = '月別財務状況' 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              {item.dataKey}: {formatCurrency(item.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const formatYAxisTick = (value: number) => {
    if (value >= 100000000) {
      return `${value / 100000000}億`;
    } else if (value >= 10000) {
      return `${value / 10000}万`;
    }
    return value.toString();
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="契約金額" 
              stroke="#007bff" 
              strokeWidth={3}
              dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
              name="契約金額"
            />
            <Line 
              type="monotone" 
              dataKey="決済金額" 
              stroke="#28a745" 
              strokeWidth={3}
              dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
              name="決済金額"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default FinancialChart;