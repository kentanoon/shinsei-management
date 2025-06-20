import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  FileCopy as CopyIcon,
} from '@mui/icons-material';
import { getStatusColor, getStatusLabel } from '../../utils/statusUtils';

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  lastModified: string;
  size: string;
  status: 'active' | 'draft' | 'archived';
  category: string;
}

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onPreview: (template: Template) => void;
  onDownload: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  onDuplicate,
}) => {

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {template.name}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(template.status)}
            color={getStatusColor(template.status) as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={template.type} size="small" variant="outlined" />
          <Chip label={template.category} size="small" variant="outlined" />
        </Box>

        <Typography variant="caption" color="text.secondary">
          最終更新: {template.lastModified} | サイズ: {template.size}
        </Typography>
      </CardContent>

      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Tooltip title="プレビュー">
            <IconButton size="small" onClick={() => onPreview(template)}>
              <PreviewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="ダウンロード">
            <IconButton size="small" onClick={() => onDownload(template)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="複製">
            <IconButton size="small" onClick={() => onDuplicate(template)}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="編集">
            <IconButton size="small" onClick={() => onEdit(template)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton size="small" color="error" onClick={() => onDelete(template)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
};

export default TemplateCard;