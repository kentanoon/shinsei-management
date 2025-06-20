import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const NotificationPanel: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    dismissNotification, 
    refreshNotifications,
    getHighPriorityCount 
  } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
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

  const handleProjectClick = (projectCode: string) => {
    navigate(`/projects/${projectCode}`);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const totalNotifications = notifications.length;
  const highPriorityCount = getHighPriorityCount();

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 2 }}
      >
        <Badge 
          badgeContent={highPriorityCount} 
          color="error"
          overlap="circular"
          variant={totalNotifications > 0 ? 'standard' : 'dot'}
          invisible={totalNotifications === 0}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 400, maxHeight: 500, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                通知 ({totalNotifications})
              </Typography>
              <IconButton 
                size="small" 
                onClick={refreshNotifications}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
            {highPriorityCount > 0 && (
              <Chip 
                label={`緊急: ${highPriorityCount}件`}
                color="error"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {totalNotifications === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                新しい通知はありません
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{ 
                      py: 1.5,
                      backgroundColor: notification.priority === 'high' 
                        ? 'error.50' 
                        : notification.priority === 'medium' 
                          ? 'warning.50' 
                          : 'inherit'
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            color={getPriorityColor(notification.priority) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {notification.message}
                          </Typography>
                          {notification.daysUntilDeadline !== undefined && (
                            <Typography 
                              variant="caption" 
                              color={notification.daysUntilDeadline <= 0 ? 'error' : 'textSecondary'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {notification.daysUntilDeadline <= 0 
                                ? `${Math.abs(notification.daysUntilDeadline)}日超過`
                                : `残り${notification.daysUntilDeadline}日`
                              }
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {notification.project && (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleProjectClick(notification.project!.project_code)}
                            sx={{ mr: 1 }}
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => dismissNotification(notification.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {totalNotifications > 0 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  notifications.forEach(n => dismissNotification(n.id));
                }}
              >
                すべて削除
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationPanel;