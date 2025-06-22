/**
 * 申請ワークフローアクションコンポーネント
 * 申請のステータス変更アクション（提出、承認、差戻し、取下げ）
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Send as SubmitIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  RemoveCircle as WithdrawIcon
} from '@mui/icons-material';
import { ApplicationStatus } from '../types/application';

interface WorkflowAction {
  action: 'submit' | 'approve' | 'reject' | 'withdraw';
  label: string;
  icon: React.ReactElement;
  color: 'primary' | 'success' | 'error' | 'secondary';
  requiresComment: boolean;
  confirmMessage: string;
}

interface ApplicationWorkflowActionsProps {
  applicationId: number;
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
  disabled?: boolean;
  userRole?: string; // 将来の権限管理用
}

const ApplicationWorkflowActions: React.FC<ApplicationWorkflowActionsProps> = ({
  applicationId,
  currentStatus,
  onStatusChange,
  disabled = false,
  userRole = 'admin' // デフォルトは管理者権限
}) => {
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 利用可能なアクション定義
  const actions: WorkflowAction[] = [
    {
      action: 'submit',
      label: '提出',
      icon: <SubmitIcon />,
      color: 'primary',
      requiresComment: false,
      confirmMessage: 'この申請を提出しますか？'
    },
    {
      action: 'approve',
      label: '承認',
      icon: <ApproveIcon />,
      color: 'success',
      requiresComment: false,
      confirmMessage: 'この申請を承認しますか？'
    },
    {
      action: 'reject',
      label: '差戻し',
      icon: <RejectIcon />,
      color: 'error',
      requiresComment: true,
      confirmMessage: 'この申請を差戻しますか？'
    },
    {
      action: 'withdraw',
      label: '取下げ',
      icon: <WithdrawIcon />,
      color: 'secondary',
      requiresComment: false,
      confirmMessage: 'この申請を取下げますか？'
    }
  ];

  // 現在のステータスに基づいて利用可能なアクションを取得
  const getAvailableActions = (): WorkflowAction[] => {
    switch (currentStatus) {
      case '未定':
        return actions.filter(a => ['submit', 'withdraw'].includes(a.action));
      case '申請':
        return actions.filter(a => ['approve', 'reject', 'withdraw'].includes(a.action));
      case '承認':
        return actions.filter(a => ['withdraw'].includes(a.action));
      case '却下':
        return actions.filter(a => ['submit', 'withdraw'].includes(a.action));
      case '完了':
        return [];
      default:
        return [];
    }
  };

  // アクション実行
  const executeAction = async () => {
    if (!selectedAction) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/applications/${applicationId}/${selectedAction.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: selectedAction.action,
          comment: comment || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'アクションの実行に失敗しました');
      }

      const updatedApplication = await response.json();
      onStatusChange(updatedApplication.status);
      
      // ダイアログを閉じる
      handleCloseDialog();

    } catch (err: any) {
      setError(err.message || 'アクションの実行中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ダイアログを開く
  const handleOpenDialog = (action: WorkflowAction) => {
    setSelectedAction(action);
    setComment('');
    setError(null);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setSelectedAction(null);
    setComment('');
    setError(null);
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0 || disabled) {
    return null;
  }

  return (
    <Box>
      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {availableActions.map((action) => (
          <Button
            key={action.action}
            variant="contained"
            color={action.color}
            startIcon={action.icon}
            onClick={() => handleOpenDialog(action)}
            disabled={disabled}
            size="small"
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* 確認ダイアログ */}
      <Dialog 
        open={!!selectedAction} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedAction && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedAction.icon}
                {selectedAction.label}の確認
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedAction.confirmMessage}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`現在: ${currentStatus}`} 
                  size="small" 
                  variant="outlined" 
                />
                <Typography component="span" sx={{ mx: 1 }}>→</Typography>
                <Chip 
                  label={`変更後: ${getNewStatus(selectedAction.action)}`}
                  size="small"
                  color={selectedAction.color}
                />
              </Box>

              {(selectedAction.requiresComment || selectedAction.action === 'approve') && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={
                    selectedAction.requiresComment ? 
                    `${selectedAction.label}理由（必須）` : 
                    'コメント（任意）'
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    selectedAction.action === 'reject' ? 
                    '差戻し理由を入力してください' :
                    selectedAction.action === 'approve' ?
                    '承認コメントを入力してください（任意）' :
                    'コメントを入力してください'
                  }
                  error={selectedAction.requiresComment && !comment.trim()}
                  helperText={
                    selectedAction.requiresComment && !comment.trim() ? 
                    'コメントは必須です' : 
                    ''
                  }
                  disabled={isLoading}
                />
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </DialogContent>

            <DialogActions>
              <Button 
                onClick={handleCloseDialog} 
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                onClick={executeAction}
                variant="contained"
                color={selectedAction.color}
                disabled={
                  isLoading || 
                  (selectedAction.requiresComment && !comment.trim())
                }
                startIcon={isLoading ? <CircularProgress size={16} /> : selectedAction.icon}
              >
                {isLoading ? '実行中...' : selectedAction.label}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );

  // アクションに基づく新しいステータスを取得
  function getNewStatus(action: string): ApplicationStatus {
    switch (action) {
      case 'submit': return '申請';
      case 'approve': return '承認';
      case 'reject': return '却下';
      case 'withdraw': return '完了';
      default: return currentStatus;
    }
  }
};

export default ApplicationWorkflowActions;