import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { getStatusColor } from '../../utils/statusUtils';

interface ProjectHeaderProps {
  projectCode: string;
  projectName: string;
  status: string;
  onEditToggle: () => void;
  editMode: boolean;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectCode,
  projectName,
  status,
  onEditToggle,
  editMode,
}) => {
  const navigate = useNavigate();


  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
        <ArrowBackIcon />
      </IconButton>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1">
            {projectName}
          </Typography>
          <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
          />
        </Box>
        <Typography color="text.secondary" variant="body2">
          案件コード: {projectCode}
        </Typography>
      </Box>
      <IconButton 
        onClick={onEditToggle}
        color={editMode ? 'primary' : 'default'}
        aria-label={editMode ? '編集モード終了' : '編集モード'}
      >
        <EditIcon />
      </IconButton>
    </Box>
  );
};

export default ProjectHeader;
