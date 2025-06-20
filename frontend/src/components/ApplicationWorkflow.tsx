import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../utils/statusUtils';
import type { 
  EnhancedApplication, 
  ApplicationStatus, 
  ApplicationStatusChangeRequest,
  ApplicationStatusHistory 
} from '../types/application';

interface ApplicationWorkflowProps {
  application: EnhancedApplication;
  onStatusChange: (request: ApplicationStatusChangeRequest) => Promise<void>;
  readonly?: boolean;
}

const ApplicationWorkflow: React.FC<ApplicationWorkflowProps> = ({
  application,
  onStatusChange,
  readonly = false
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('承認済');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // ワークフローステップの定義
  const workflowSteps: { status: ApplicationStatus; label: string; description: string }[] = [
    { status: '下書き', label: '下書き', description: '申請内容を準備中' },
    { status: 'レビュー中', label: 'レビュー中', description: '内容確認・レビュー中' },
    { status: '承認済', label: '承認済', description: '申請が承認されました' },
    { status: '差戻し', label: '差戻し', description: '修正が必要です' },
    { status: '取下げ', label: '取下げ', description: '申請を取り下げました' },
    { status: '完了', label: '完了', description: '全工程が完了しました' },
  ];


  const getCurrentStep = () => {
    return workflowSteps.findIndex(step => step.status === application.status);
  };

  const getAvailableActions = (): ApplicationStatus[] => {
    switch (application.status) {
      case '下書き':
        return ['レビュー中', '取下げ'];
      case 'レビュー中':
        return ['承認済', '差戻し', '取下げ'];
      case '承認済':
        return ['完了'];
      case '差戻し':
        return ['下書き', '取下げ'];
      case '取下げ':
        return ['下書き'];
      case '完了':
        return [];
      default:
        return [];
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    try {
      await onStatusChange({
        to_status: selectedStatus,
        comment: comment.trim() || undefined,
        update_deadlines: true,
      });
      setOpenDialog(false);
      setComment('');
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInStatus = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Box>
      {/* ワークフロー概要 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              申請ワークフロー
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={application.status}
                color={getStatusColor(application.status)}
                variant="filled"
              />
              <Chip
                label={`進捗 ${application.progress_percentage}%`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* ステッパー */}
          <Stepper activeStep={getCurrentStep()} orientation="horizontal" sx={{ mb: 3 }}>
            {workflowSteps.map((step, index) => (
              <Step key={step.status}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                        color: 'white',
                        fontSize: 12,
                      }}
                    >
                      {completed ? <CheckIcon fontSize="small" /> : index + 1}
                    </Box>
                  )}
                >
                  <Typography variant="body2">{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* アクションボタン */}
          {!readonly && getAvailableActions().length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {getAvailableActions().map((action) => (
                <Button
                  key={action}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedStatus(action);
                    setOpenDialog(true);
                  }}
                  color={
                    action === '承認済' || action === '完了' ? 'success' :
                    action === '差戻し' || action === '取下げ' ? 'error' :
                    action === 'レビュー中' ? 'warning' : 'primary'
                  }
                >
                  {action}
                </Button>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ステータス履歴 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6">ステータス履歴</Typography>
          </Box>

          <Timeline>
            {application.status_history?.map((history, index) => (
              <TimelineItem key={history.id}>
                <TimelineSeparator>
                  <TimelineDot
                    color={
                      history.to_status === '承認済' || history.to_status === '完了' ? 'success' :
                      history.to_status === '差戻し' || history.to_status === '取下げ' ? 'error' :
                      'primary'
                    }
                  >
                    {history.to_status === '承認済' || history.to_status === '完了' ? <CheckIcon /> :
                     history.to_status === '差戻し' || history.to_status === '取下げ' ? <CancelIcon /> :
                     <AssignmentIcon />}
                  </TimelineDot>
                  {index < application.status_history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {history.from_status ? `${history.from_status} → ` : ''}{history.to_status}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(history.changed_at)} • {history.changed_by}
                    </Typography>
                  </Box>
                  {history.comment && (
                    <Alert severity="info" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      {history.comment}
                    </Alert>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>

      {/* ステータス変更ダイアログ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          ステータスを「{selectedStatus}」に変更
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              申請を「{selectedStatus}」状態に変更します。必要に応じてコメントを追加してください。
            </Alert>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="コメント（任意）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="変更理由や備考を入力してください..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleStatusChange}
            variant="contained"
            disabled={loading}
            color={
              selectedStatus === '承認済' || selectedStatus === '完了' ? 'success' :
              selectedStatus === '差戻し' || selectedStatus === '取下げ' ? 'error' :
              'primary'
            }
          >
            {loading ? '変更中...' : '変更実行'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationWorkflow;