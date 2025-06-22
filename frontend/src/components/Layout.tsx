import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import NotificationPanel from './NotificationPanel';
import AlertSystem from './AlertSystem';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '📊 ダッシュボード', description: '案件の進捗状況を一目で確認' },
    { path: '/projects', label: '📋 案件管理', description: 'プロジェクトの詳細情報管理' },
    { path: '/schedule', label: '📅 工程管理', description: '検査スケジュールの管理' },
    { path: '/financial', label: '💰 財務管理', description: '見積・契約・決済の管理' },
    { path: '/applications', label: '📄 申請管理', description: '各種申請のステータス管理' },
    { path: '/admin/database', label: '🗄️ DB管理', description: 'データベースの管理・メンテナンス' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              color: '#495057',
              fontWeight: 600
            }}
            onClick={() => navigate('/')}
          >
            🏗️ 申請管理システム
          </Typography>
          <NotificationPanel />
        </Toolbar>
      </AppBar>

      {/* Navigation */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #dee2e6',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '2rem',
          overflowX: 'auto'
        }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: location.pathname === item.path ? '#e9ecef' : 'transparent',
                border: 'none',
                padding: '1rem',
                cursor: 'pointer',
                color: '#495057',
                fontWeight: location.pathname === item.path ? 600 : 'normal',
                borderBottom: location.pathname === item.path ? '3px solid #007bff' : '3px solid transparent',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Outlet />
      </main>

      {/* Alert System */}
      <AlertSystem />
    </div>
  );
};

export default Layout;