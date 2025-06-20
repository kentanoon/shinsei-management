import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAlerts, Alert as AlertType } from '../hooks/useAlerts';

interface AlertPanelProps {
  maxHeight?: number;
  showAll?: boolean;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ maxHeight = 400, showAll = false }) => {
  const { alerts, loading, refreshAlerts, dismissAlert } = useAlerts();
  const [expanded, setExpanded] = React.useState(true);
  const [showAllAlerts, setShowAllAlerts] = React.useState(showAll);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inspection':
        return '検査';
      case 'application':
        return '申請';
      case 'financial':
        return '財務';
      default:
        return '一般';
    }
  };

  const formatDaysRemaining = (daysRemaining: number) => {
    if (daysRemaining > 0) {
      return `あと${daysRemaining}日`;
    } else {
      return `${Math.abs(daysRemaining)}日経過`;
    }
  };

  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 5);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>アラートを読み込み中...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            🚨 アラート・通知
          </Typography>
          {alerts.length > 0 && (
            <Chip
              label={alerts.length}
              color={alerts.some(a => a.severity === 'high') ? 'error' : 'warning'}
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              refreshAlerts();
            }}
          >
            <RefreshIcon />
          </IconButton>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ maxHeight, overflow: 'auto' }}>
          {alerts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Alert severity="success">
                現在アラートはありません
              </Alert>
            </Box>
          ) : (
            <>
              <List sx={{ pt: 0 }}>
                {displayedAlerts.map((alert) => (
                  <ListItem
                    key={alert.id}
                    sx={{
                      borderLeft: 4,
                      borderLeftColor: 
                        alert.severity === 'high' ? 'error.main' :
                        alert.severity === 'medium' ? 'warning.main' : 'info.main',
                      mb: 1,
                      mx: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon>
                      {getSeverityIcon(alert.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {alert.title}
                          </Typography>
                          <Chip
                            label={getTypeLabel(alert.type)}
                            size="small"
                            color={getSeverityColor(alert.severity) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={formatDaysRemaining(alert.daysRemaining)}
                            size="small"
                            color={alert.daysRemaining > 0 ? 'warning' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            プロジェクト: {alert.projectCode} - {alert.projectName}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>

              {!showAllAlerts && alerts.length > 5 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowAllAlerts(true)}
                  >
                    すべて表示 ({alerts.length - 5}件の追加アラート)
                  </Button>
                </Box>
              )}

              {showAllAlerts && alerts.length > 5 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowAllAlerts(false)}
                  >
                    折りたたむ
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AlertPanel;