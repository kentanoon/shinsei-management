/**
 * プロジェクト詳細ページ
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { projectApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useErrorHandler } from '../hooks/useErrorHandler';
import type { ProjectStatus, ProjectUpdateRequest, FinancialUpdateRequest, ScheduleUpdateRequest, Project } from '../types/project';

// サブコンポーネント
import ProjectHeader from '../components/project/ProjectHeader';
import ProjectTabs from '../components/project/ProjectTabs';
import ProjectOverview from '../components/project/ProjectOverview';
import FinancialInfo from '../components/project/FinancialInfo';
import ScheduleInfo from '../components/project/ScheduleInfo';

// ステータスオプション
const statusOptions: ProjectStatus[] = [
  '事前相談',
  '受注', 
  '申請作業',
  '審査中',
  '配筋検査待ち',
  '中間検査待ち', 
  '完了検査待ち',
  '完了',
  '失注',
];

const ProjectDetail: React.FC = () => {
  const { projectCode } = useParams<{ projectCode: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();
  const { handleError } = useErrorHandler();
  const [currentTab, setCurrentTab] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectCode],
    queryFn: () => projectApi.getProject(projectCode!),
    enabled: !!projectCode,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // プロジェクト更新関数
  const updateProject = async (field: string, value: any, section?: 'customer' | 'site' | 'building' | string) => {
    if (!project) return;

    try {
      const updateData: ProjectUpdateRequest = {};
      
      if (section) {
        (updateData as any)[section] = { [field]: value };
      } else {
        (updateData as any)[field] = value;
      }

      await projectApi.updateProject(project.id, updateData);
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['project', projectCode] });
      showSuccess('更新しました');
    } catch (error) {
      handleError(error, '更新に失敗しました');
      throw error;
    }
  };

  // 財務情報更新関数
  const updateFinancial = async (field: string, value: any) => {
    if (!project) return;

    try {
      const updateData: FinancialUpdateRequest = {
        [field]: value
      };

      await projectApi.updateFinancial(project.id, updateData);
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['project', projectCode] });
      showSuccess('財務情報を更新しました');
    } catch (error) {
      handleError(error, '財務情報の更新に失敗しました');
      throw error;
    }
  };

  // スケジュール更新関数
  const updateSchedule = async (field: string, value: any) => {
    if (!project) return;

    try {
      const updateData: ScheduleUpdateRequest = {
        [field]: value
      };

      await projectApi.updateSchedule(project.id, updateData);
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['project', projectCode] });
      showSuccess('スケジュール情報を更新しました');
    } catch (error) {
      handleError(error, 'スケジュール情報の更新に失敗しました');
      throw error;
    }
  };

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    if (!project) return null;

    switch (currentTab) {
      case 0: // 概要
        return (
          <ProjectOverview 
            project={project} 
            editMode={editMode} 
            onUpdate={updateProject} 
          />
        );
      case 1: // 財務情報
        return (
          <FinancialInfo 
            project={project} 
            editMode={editMode} 
            onUpdate={updateFinancial} 
          />
        );
      case 2: // スケジュール
        return (
          <ScheduleInfo 
            project={project} 
            editMode={editMode} 
            onUpdate={updateSchedule} 
          />
        );
      case 3: // 申請書類
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              申請書類
            </Typography>
            <Typography color="textSecondary">
              申請書類の一覧がここに表示されます。
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">プロジェクトが見つかりません</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ProjectHeader 
        projectCode={project.project_code || ''}
        projectName={project.project_name || '無題のプロジェクト'}
        status={project.status || '未設定'}
        onEditToggle={toggleEditMode}
        editMode={editMode}
      />
      
      <ProjectTabs 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />
      
      {renderTabContent()}
    </Box>
  );
};

export default ProjectDetail;