import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';
import DashboardWidget from '../DashboardWidget';

interface MonthlyData {
  month: string;
  projects: number;
  completed: number;
}

interface MonthlyTrendWidgetProps {
  id: string;
  data: MonthlyData[];
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

const MonthlyTrendWidget: React.FC<MonthlyTrendWidgetProps> = ({
  id,
  data,
  onRemove,
  onSettings,
}) => {
  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      id={id}
      title="月別推移"
      onRemove={onRemove}
      onSettings={onSettings}
      minHeight={300}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="projects"
              stroke="#3D5B81"
              strokeWidth={2}
              dot={{ fill: '#3D5B81' }}
              name="新規案件"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#9BC0D9"
              strokeWidth={2}
              dot={{ fill: '#9BC0D9' }}
              name="完了案件"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">データがありません</Typography>
        </Box>
      )}
    </DashboardWidget>
  );
};

export default MonthlyTrendWidget;