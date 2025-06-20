import React from 'react';
import { Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';

export interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number;
  maxHeight?: number;
}

const DashboardWidget: React.FC<WidgetProps> = ({
  id,
  title,
  children,
  onRemove,
  onSettings,
  className,
  style,
  minHeight = 200,
  maxHeight = 600,
}) => {
  return (
    <Paper
      className={className}
      style={{
        ...style,
        minHeight,
        maxHeight,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={2}
      sx={{
        height: '100%',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      {/* Widget Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          minHeight: 56,
        }}
      >
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onSettings && (
            <Tooltip title="設定">
              <IconButton
                size="small"
                onClick={() => onSettings(id)}
                aria-label="ウィジェット設定"
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onRemove && (
            <Tooltip title="削除">
              <IconButton
                size="small"
                onClick={() => onRemove(id)}
                aria-label="ウィジェット削除"
                color="error"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Widget Content */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default DashboardWidget;