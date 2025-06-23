import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';

import InfoItem from './InfoItem';
import { Project } from '../../types/project';

interface ScheduleInfoProps {
  project: Project;
  editMode: boolean;
  onUpdate: (field: string, value: any) => Promise<void>;
}

const ScheduleInfo: React.FC<ScheduleInfoProps> = ({
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
        {/* 基本スケジュール */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  基本スケジュール
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <InfoItem 
                label="着工予定日" 
                value={formatDate(project.schedule?.reinforcement_scheduled)} 
              />
              <InfoItem 
                label="完了予定日" 
                value={formatDate(project.schedule?.completion_scheduled)} 
              />
              <InfoItem 
                label="実際の着工日" 
                value={formatDate(project.schedule?.reinforcement_actual)} 
              />
              <InfoItem 
                label="実際の完了日" 
                value={formatDate(project.schedule?.completion_actual)} 
              />
              <InfoItem 
                label="進捗状況" 
                value={project.schedule?.completion_note || '---'} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 重要なマイルストーン */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  重要なマイルストーン
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <InfoItem 
                label="設計完了予定日" 
                value={formatDate(project.schedule?.reinforcement_scheduled)} 
              />
              <InfoItem 
                label="着工許可取得予定日" 
                value={formatDate(project.schedule?.reinforcement_scheduled)} 
              />
              <InfoItem 
                label="上棟式予定日" 
                value={formatDate(project.schedule?.interim_scheduled)} 
              />
              <InfoItem 
                label="内装完了予定日" 
                value={formatDate(project.schedule?.completion_scheduled)} 
              />
              <InfoItem 
                label="完成検査予定日" 
                value={formatDate(project.schedule?.inspection_date)} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 検査スケジュール */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  検査スケジュール
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="配筋検査予定日" 
                    value={formatDate(project.schedule?.inspection_date)} 
                  />
                  <InfoItem 
                    label="配筋検査結果" 
                    value={project.schedule?.inspection_result} 
                  />
                  <InfoItem 
                    label="配筋検査コメント" 
                    value={project.schedule?.corrections} 
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="中間検査予定日" 
                    value={formatDate(project.schedule?.interim_actual)} 
                  />
                  <InfoItem 
                    label="中間検査結果" 
                    value={project.schedule?.inspection_result} 
                  />
                  <InfoItem 
                    label="中間検査コメント" 
                    value={project.schedule?.corrections} 
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem 
                    label="完了検査予定日" 
                    value={formatDate(project.schedule?.inspection_date)} 
                  />
                  <InfoItem 
                    label="完了検査結果" 
                    value={project.schedule?.inspection_result} 
                  />
                  <InfoItem 
                    label="完了検査コメント" 
                    value={project.schedule?.corrections} 
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

export default ScheduleInfo;
