import React from 'react';
import { Alert, AlertTitle, Box, Chip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { isDemoMode } from '../services/demo-api';

export const DemoBanner: React.FC = () => {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          '& .MuiAlert-icon': {
            color: 'primary.contrastText'
          }
        }}
      >
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="DEMO" 
            size="small" 
            color="warning"
            sx={{ fontWeight: 'bold' }}
          />
          デモ環境
        </AlertTitle>
        これはデモ環境です。データベースには接続されておらず、見本データを表示しています。
        すべての機能はシミュレーションされており、実際のデータは保存されません。
      </Alert>
    </Box>
  );
};