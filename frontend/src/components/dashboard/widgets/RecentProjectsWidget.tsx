import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import { 
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../../../utils/statusUtils';
import DashboardWidget from '../DashboardWidget';

interface Project {
  id: string;
  project_name: string;
  project_code: string;
  status: string;
  created_at: string;
}

interface RecentProjectsWidgetProps {
  id: string;
  projects: Project[];
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  maxItems?: number;
}

const RecentProjectsWidget: React.FC<RecentProjectsWidgetProps> = ({
  id,
  projects,
  onRemove,
  onSettings,
  maxItems = 5,
}) => {

  const recentProjects = projects.slice(0, maxItems);

  return (
    <DashboardWidget
      id={id}
      title="最近のプロジェクト"
      onRemove={onRemove}
      onSettings={onSettings}
      minHeight={300}
    >
      {recentProjects.length > 0 ? (
        <List sx={{ width: '100%', p: 0 }}>
          {recentProjects.map((project, index) => (
            <ListItem
              key={project.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < recentProjects.length - 1 ? '1px solid #e0e0e0' : 'none',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {project.project_name || 'プロジェクト名未設定'}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      コード: {project.project_code}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      作成日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                }
              />
              <Chip
                label={project.status}
                color={getStatusColor(project.status)}
                size="small"
                sx={{ ml: 1 }}
              />
            </ListItem>
          ))}
        </List>
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
          <Typography variant="body2">プロジェクトがありません</Typography>
        </Box>
      )}
    </DashboardWidget>
  );
};

export default RecentProjectsWidget;