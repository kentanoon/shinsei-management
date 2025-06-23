import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';
import { AttachMoney as AttachMoneyIcon } from '@mui/icons-material';

import InfoItem from './InfoItem';
import { Project } from '../../types/project';

interface FinancialInfoProps {
  project: Project;
  editMode: boolean;
  onUpdate: (field: string, value: any) => Promise<void>;
}

const FinancialInfo: React.FC<FinancialInfoProps> = ({
  project,
  editMode,
  onUpdate,
}) => {
  // 通貨をフォーマットするヘルパー関数
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '---';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 見積もり情報 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  見積もり情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <InfoItem 
                label="見積金額" 
                value={formatCurrency(project.financial?.estimate_amount)} 
              />
              <InfoItem 
                label="見積日" 
                value={project.financial?.settlement_date} 
              />
              <InfoItem 
                label="見積有効期限" 
                value={project.financial?.settlement_date} 
              />
              <InfoItem 
                label="見積承認日" 
                value={project.financial?.settlement_date} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 契約情報 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  契約情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <InfoItem 
                label="契約金額" 
                value={formatCurrency(project.financial?.contract_price)} 
              />
              <InfoItem 
                label="契約日" 
                value={project.financial?.settlement_date} 
              />
              <InfoItem 
                label="支払い条件" 
                value={project.financial?.payment_terms} 
              />
              <InfoItem 
                label="消費税率" 
                value={project.financial?.tax_rate ? `${project.financial.tax_rate}%` : '---'} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 支払い情報 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  支払い情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="頭金" 
                    value={formatCurrency(project.financial?.settlement_amount)} 
                  />
                  <InfoItem 
                    label="中間金" 
                    value={formatCurrency(project.financial?.settlement_amount)} 
                  />
                  <InfoItem 
                    label="最終支払い" 
                    value={formatCurrency(project.financial?.settlement_amount)} 
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="支払い状況" 
                    value={project.financial?.settlement_note ? '支払い済み' : '未払い'} 
                  />
                  <InfoItem 
                    label="最終支払い日" 
                    value={project.financial?.settlement_date} 
                  />
                  <InfoItem 
                    label="備考" 
                    value={project.financial?.settlement_note} 
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialInfo;
