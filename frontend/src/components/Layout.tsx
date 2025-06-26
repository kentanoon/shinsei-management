import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container, 
  Drawer, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as ProjectIcon,
  Schedule as ScheduleIcon,
  AttachMoney as FinancialIcon,
  Description as ApplicationIcon,
  Storage as DatabaseIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import NotificationPanel from './NotificationPanel';
import AlertSystem from './AlertSystem';
import SupabaseStatus from './SupabaseStatus';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { path: '/', label: 'ダッシュボード', icon: DashboardIcon, description: '案件の進捗状況を一目で確認' },
    { path: '/projects', label: '案件管理', icon: ProjectIcon, description: 'プロジェクトの詳細情報管理' },
    { path: '/schedule', label: '工程管理', icon: ScheduleIcon, description: '検査スケジュールの管理' },
    { path: '/financial', label: '財務管理', icon: FinancialIcon, description: '見積・契約・決済の管理' },
    { path: '/applications', label: '申請管理', icon: ApplicationIcon, description: '各種申請のステータス管理' },
    { path: '/admin/database', label: 'DB管理', icon: DatabaseIcon, description: 'データベースの管理・メンテナンス' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        <ConstructionIcon sx={{ mr: 1 }} />
        申請管理システム
      </Typography>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'inherit' : 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={isMobile ? undefined : item.description}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: isActive ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}
            onClick={() => navigate('/')}
          >
            <ConstructionIcon sx={{ mr: 1 }} />
            申請管理システム
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SupabaseStatus showDetails={!isMobile} />
            <NotificationPanel />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 250,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: { sm: `calc(100% - 250px)` },
          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Outlet />
        </Container>
      </Box>

      {/* Alert System */}
      <AlertSystem />
    </Box>
  );
};

export default Layout;