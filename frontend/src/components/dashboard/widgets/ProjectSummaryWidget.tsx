import React from 'react';
import { Grid, Box, Typography, Card, CardContent } from '@mui/material';
import { 
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import DashboardWidget from '../DashboardWidget';

interface SummaryItem {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface ProjectSummaryWidgetProps {
  id: string;
  data: {
    total: number;
    inProgress: number;
    pending: number;
    completed: number;
  };
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

const ProjectSummaryWidget: React.FC<ProjectSummaryWidgetProps> = ({
  id,
  data,
  onRemove,
  onSettings,
}) => {
  const summaryItems: SummaryItem[] = [
    {
      title: '総案件数',
      value: data.total,
      color: '#3D5B81',
      icon: <AssignmentIcon />,
    },
    {
      title: '進行中',
      value: data.inProgress,
      color: '#9BC0D9',
      icon: <PlayArrowIcon />,
    },
    {
      title: '検査待ち',
      value: data.pending,
      color: '#EE6B4D',
      icon: <WarningIcon />,
    },
    {
      title: '完了',
      value: data.completed,
      color: '#9BC0D9',
      icon: <CheckCircleIcon />,
    },
  ];

  return (
    <DashboardWidget
      id={id}
      title="プロジェクト概要"
      onRemove={onRemove}
      onSettings={onSettings}
      minHeight={200}
    >
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {summaryItems.map((item, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
                bgcolor: item.color + '10',
                border: `1px solid ${item.color}20`,
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box
                  sx={{
                    color: item.color,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h4" sx={{ color: item.color, fontWeight: 'bold' }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardWidget>
  );
};

export default ProjectSummaryWidget;