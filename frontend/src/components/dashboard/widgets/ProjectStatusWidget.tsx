import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Typography } from '@mui/material';
import DashboardWidget from '../DashboardWidget';

interface ProjectStatusWidgetProps {
  id: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

const ProjectStatusWidget: React.FC<ProjectStatusWidgetProps> = ({
  id,
  data,
  onRemove,
  onSettings,
}) => {
  const hasData = data && data.length > 0 && data.some(item => item.value > 0);

  return (
    <DashboardWidget
      id={id}
      title="プロジェクトステータス"
      onRemove={onRemove}
      onSettings={onSettings}
      minHeight={300}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius="70%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
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

export default ProjectStatusWidget;