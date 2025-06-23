import React from 'react';
import { Box, Card, CardContent, Divider, Typography, Grid } from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

import InfoItem from './InfoItem';
import { Project } from '../../types/project';

interface ProjectOverviewProps {
  project: Project;
  editMode: boolean;
  onUpdate: (field: string, value: any, section?: string) => Promise<void>;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  editMode,
  onUpdate,
}) => {
  // 日付をフォーマットするヘルパー関数
  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 顧客情報 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  顧客情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="お客様名" 
                    value={project.customer?.owner_name || ''} 
                    editMode={editMode}
                    fullWidth
                    onChange={(value: string) => onUpdate('owner_name', value, 'customer')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="お客様名（カナ）" 
                    value={project.customer?.owner_kana || ''} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('owner_kana', value, 'customer')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="郵便番号" 
                    value={project.customer?.owner_zip || ''} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('owner_zip', value, 'customer')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InfoItem 
                    label="住所" 
                    value={project.customer?.owner_address || ''} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('owner_address', value, 'customer')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="電話番号" 
                    value={project.customer?.owner_phone || ''} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('owner_phone', value, 'customer')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 建築物情報 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HomeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  建築物情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="プロジェクトコード" 
                    value={project.project_code} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('project_code', value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="ステータス" 
                    value={project.status} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('status', value)}
                    select
                    selectOptions={[
                      { value: '事前相談', label: '事前相談' },
                      { value: '受注', label: '受注' },
                      { value: '申請作業', label: '申請作業' },
                      { value: '審査中', label: '審査中' },
                      { value: '配筋検査待ち', label: '配筋検査待ち' },
                      { value: '中間検査待ち', label: '中間検査待ち' },
                      { value: '完了検査待ち', label: '完了検査待ち' },
                      { value: '完了', label: '完了' },
                      { value: '失注', label: '失注' },
                      { value: 'その他', label: 'その他' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InfoItem 
                    label="プロジェクト名" 
                    value={project.project_name} 
                    editMode={editMode}
                    onChange={(value: string) => onUpdate('project_name', value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 現場情報 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  現場情報
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3} sx={{ width: '100%' }}>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="住所" 
                    value={project.site?.address} 
                  />
                  <InfoItem 
                    label="敷地面積" 
                    value={`${project.site?.land_area?.toLocaleString()} m²`} 
                  />
                  <InfoItem 
                    label="用途地域" 
                    value={project.site?.zoning} 
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="着工予定日" 
                    value={formatDate(project.schedule?.reinforcement_scheduled)} 
                  />
                  <InfoItem 
                    label="完了予定日" 
                    value={formatDate(project.schedule?.completion_scheduled)} 
                  />
                  <InfoItem 
                    label="配筋検査予定日" 
                    value={formatDate(project.schedule?.reinforcement_scheduled)} 
                  />
                  <InfoItem 
                    label="完了検査予定日" 
                    value={formatDate(project.schedule?.completion_scheduled)} 
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

export default ProjectOverview;
