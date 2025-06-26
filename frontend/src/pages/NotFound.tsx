/**
 * 404 Not Found ページ
 */

import React from 'react';
import { Link as LinkIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Assignment as ProjectIcon,
  Schedule as ScheduleIcon,
  AccountBalance as FinancialIcon,
  Description as ApplicationIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { path: '/', label: 'ダッシュボード', icon: DashboardIcon, description: 'プロジェクト概要を確認' },
    { path: '/projects', label: '案件管理', icon: ProjectIcon, description: 'プロジェクト一覧' },
    { path: '/schedule', label: '工程管理', icon: ScheduleIcon, description: 'スケジュール管理' },
    { path: '/financial', label: '財務管理', icon: FinancialIcon, description: '見積・契約管理' },
    { path: '/applications', label: '申請管理', icon: ApplicationIcon, description: '各種申請状況' },
    { path: '/admin/database', label: 'DB管理', icon: DatabaseIcon, description: 'データベース管理' },
  ];

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      sx={{ p: 3 }}
    >
      <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem', color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        ページが見つかりません
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4, maxWidth: 600 }}>
        お探しのページは存在しないか、移動された可能性があります。<br />
        以下のリンクから目的のページに移動してください。
      </Typography>

      <Card sx={{ maxWidth: 600, width: '100%', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon />
              利用可能なページ
            </Box>
          </Typography>
          <List>
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <ListItem key={link.path}>
                  <ListItemButton
                    onClick={() => navigate(link.path)}
                    sx={{ 
                      borderRadius: 1, 
                      mb: 1,
                      '&:hover': { 
                        backgroundColor: 'action.hover' 
                      }
                    }}
                  >
                    <ListItemIcon>
                      <IconComponent color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={link.label}
                      secondary={link.description}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          ホームに戻る
        </Button>
        <Button
          variant="outlined"
          onClick={() => window.history.back()}
        >
          前のページに戻る
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;