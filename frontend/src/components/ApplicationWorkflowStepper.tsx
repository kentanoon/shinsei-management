/**
 * 申請ワークフローステッパーコンポーネント
 * 申請の現在の状態と進行状況を視覚的に表示
 */

import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  Chip,
  StepIcon
} from '@mui/material';
import {
  Edit as DraftIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  RemoveCircle as WithdrawnIcon,
  Task as CompletedIcon
} from '@mui/icons-material';
import { ApplicationStatus } from '../types/application';

interface WorkflowStep {
  label: string;
  status: ApplicationStatus;
  icon: React.ReactElement;
  description: string;
  optional?: boolean;
}

interface ApplicationWorkflowStepperProps {
  currentStatus: ApplicationStatus;
  submittedDate?: string;
  approvedDate?: string;
  rejectedDate?: string;
  completedDate?: string;
  rejectionReason?: string;
  approvalComment?: string;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
}

const ApplicationWorkflowStepper: React.FC<ApplicationWorkflowStepperProps> = ({
  currentStatus,
  submittedDate,
  approvedDate,
  rejectedDate,
  completedDate,
  rejectionReason,
  approvalComment,
  orientation = 'horizontal',
  showDescriptions = true
}) => {
  const steps: WorkflowStep[] = [
    {
      label: '下書き',
      status: '下書き',
      icon: <DraftIcon />,
      description: '申請の準備段階です。必要事項を入力してください。'
    },
    {
      label: 'レビュー中',
      status: 'レビュー中',
      icon: <ReviewIcon />,
      description: '申請内容を確認中です。しばらくお待ちください。'
    },
    {
      label: '承認済',
      status: '承認済',
      icon: <ApprovedIcon />,
      description: '申請が承認されました。'
    },
    {
      label: '完了',
      status: '完了',
      icon: <CompletedIcon />,
      description: 'すべての手続きが完了しました。'
    }
  ];

  // 現在のステップを特定
  const getCurrentStepIndex = (): number => {
    return steps.findIndex(step => step.status === currentStatus);
  };

  // ステップの状態を判定
  const getStepStatus = (stepIndex: number): 'active' | 'completed' | 'error' | 'disabled' => {
    const currentIndex = getCurrentStepIndex();
    
    if (currentStatus === '差戻し' || currentStatus === '取下げ') {
      if (stepIndex === 0) return 'error';
      return 'disabled';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'disabled';
  };

  // カスタムステップアイコン
  const CustomStepIcon: React.FC<{ stepIndex: number }> = ({ stepIndex }) => {
    const status = getStepStatus(stepIndex);
    const step = steps[stepIndex];
    
    const iconProps = {
      color: status === 'completed' ? 'success' : 
             status === 'active' ? 'primary' :
             status === 'error' ? 'error' : 'disabled'
    };

    return React.cloneElement(step.icon, iconProps);
  };

  // 特別な状態（差戻し・取下げ）の表示
  const renderSpecialStatus = () => {
    if (currentStatus === '差戻し') {
      return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <RejectedIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6" color="error">
              申請が差戻されました
            </Typography>
          </Box>
          {rejectedDate && (
            <Typography variant="body2" color="text.secondary">
              差戻し日: {new Date(rejectedDate).toLocaleDateString('ja-JP')}
            </Typography>
          )}
          {rejectionReason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              理由: {rejectionReason}
            </Typography>
          )}
        </Box>
      );
    }

    if (currentStatus === '取下げ') {
      return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.200', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WithdrawnIcon color="disabled" sx={{ mr: 1 }} />
            <Typography variant="h6" color="text.secondary">
              申請が取下げられました
            </Typography>
          </Box>
        </Box>
      );
    }

    return null;
  };

  // 日付情報の表示
  const renderDateInfo = (stepIndex: number) => {
    const step = steps[stepIndex];
    let dateInfo = '';

    switch (step.status) {
      case 'レビュー中':
        if (submittedDate) {
          dateInfo = `提出日: ${new Date(submittedDate).toLocaleDateString('ja-JP')}`;
        }
        break;
      case '承認済':
        if (approvedDate) {
          dateInfo = `承認日: ${new Date(approvedDate).toLocaleDateString('ja-JP')}`;
        }
        break;
      case '完了':
        if (completedDate) {
          dateInfo = `完了日: ${new Date(completedDate).toLocaleDateString('ja-JP')}`;
        }
        break;
    }

    return dateInfo ? (
      <Typography variant="caption" color="text.secondary">
        {dateInfo}
      </Typography>
    ) : null;
  };

  // コメント情報の表示
  const renderCommentInfo = (stepIndex: number) => {
    const step = steps[stepIndex];
    
    if (step.status === '承認済' && approvalComment) {
      return (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          コメント: {approvalComment}
        </Typography>
      );
    }

    return null;
  };

  return (
    <Box>
      <Stepper 
        activeStep={getCurrentStepIndex()} 
        orientation={orientation}
        sx={{ mb: 2 }}
      >
        {steps.map((step, index) => (
          <Step key={step.status}>
            <StepLabel 
              StepIconComponent={() => <CustomStepIcon stepIndex={index} />}
              error={getStepStatus(index) === 'error'}
            >
              <Box>
                <Typography variant="subtitle2">
                  {step.label}
                </Typography>
                {renderDateInfo(index)}
              </Box>
            </StepLabel>
            {orientation === 'vertical' && showDescriptions && (
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                {renderCommentInfo(index)}
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>

      {/* 現在のステータスチップ */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Chip
          label={currentStatus}
          color={
            currentStatus === '承認済' || currentStatus === '完了' ? 'success' :
            currentStatus === 'レビュー中' ? 'primary' :
            currentStatus === '差戻し' ? 'error' :
            currentStatus === '取下げ' ? 'default' : 'default'
          }
          variant="filled"
          size="medium"
        />
      </Box>

      {/* 特別な状態の表示 */}
      {renderSpecialStatus()}
    </Box>
  );
};

export default ApplicationWorkflowStepper;