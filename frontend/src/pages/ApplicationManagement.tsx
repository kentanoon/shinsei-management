import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

// 一時的なプレースホルダーコンポーネント
export default function ApplicationManagement() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        申請管理
      </Typography>
      <Alert severity="info">
        申請管理機能は現在メンテナンス中です。
        SimpleApplicationManagement コンポーネントをご利用ください。
      </Alert>
    </Box>
  );
}