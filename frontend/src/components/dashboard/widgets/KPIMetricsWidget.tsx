import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  LinearProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import DashboardWidget from '../DashboardWidget';

interface KPIData {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: number;
  color: string;
}

interface KPIMetricsWidgetProps {
  id: string;
  data: KPIData[];
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

const KPIMetricsWidget: React.FC<KPIMetricsWidgetProps> = ({
  id,
  data,
  onRemove,
  onSettings,
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />;
      case 'flat':
        return <TrendingFlatIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'flat':
        return 'warning';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === '時間') {
      return `${value.toFixed(1)}時間`;
    } else if (unit === '件') {
      return `${Math.round(value)}件`;
    } else if (unit === '日') {
      return `${value.toFixed(1)}日`;
    }
    return `${value}${unit}`;
  };

  const getProgressPercentage = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  return (
    <DashboardWidget
      id={id}
      title="KPI指標"
      onRemove={onRemove}
      onSettings={onSettings}
      minHeight={300}
    >
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {data.map((kpi, index) => {
          const progressPercentage = getProgressPercentage(kpi.value, kpi.target);
          
          return (
            <Grid item xs={12} sm={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: `1px solid ${kpi.color}20`,
                  bgcolor: `${kpi.color}05`,
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {kpi.name}
                    </Typography>
                    <Chip
                      icon={getTrendIcon(kpi.trend)}
                      label={`${kpi.trendValue > 0 ? '+' : ''}${kpi.trendValue.toFixed(1)}%`}
                      color={getTrendColor(kpi.trend) as any}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                  
                  <Typography variant="h5" sx={{ color: kpi.color, fontWeight: 'bold', mb: 1 }}>
                    {formatValue(kpi.value, kpi.unit)}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        目標: {formatValue(kpi.target, kpi.unit)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {progressPercentage.toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      color={getProgressColor(progressPercentage) as any}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary">
                    {progressPercentage >= 100 ? '目標達成！' : 
                     progressPercentage >= 90 ? '目標まであと少し' :
                     progressPercentage >= 70 ? '順調に進捗中' :
                     '改善が必要'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      {data.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">KPIデータがありません</Typography>
        </Box>
      )}
    </DashboardWidget>
  );
};

export default KPIMetricsWidget;