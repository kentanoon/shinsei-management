import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Assignment as FormIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';

// 型定義
interface FormTemplate {
  id: number;
  form_name: string;
  google_form_url: string;
  description?: string;
  required_fields: Record<string, any>;
}

interface FormCategory {
  [key: string]: FormTemplate[];
}

interface FormSubmission {
  id: number;
  recipient_email: string;
  status: 'pending' | 'sent' | 'opened' | 'submitted' | 'expired';
  sent_at?: string;
  opened_at?: string;
  submitted_at?: string;
  form_template: {
    form_name: string;
    form_category: string;
  };
}

interface SendFormRequest {
  project_id: number;
  application_type: string;
  form_categories: string[];
  recipient_emails: string[];
  custom_message?: string;
}

interface GoogleFormsManagerProps {
  projectId: number;
  projectName: string;
  customerEmails: string[];
}

const APPLICATION_TYPES = {
  'building_permit': '建築確認申請',
  'completion_inspection': '完了検査申請',
  'interim_inspection': '中間検査申請',
  'bels_application': 'BELS申請',
  'performance_evaluation': '性能評価申請',
  'supervision': '工事監理関連'
};

const STATUS_CONFIG = {
  pending: { label: '未送信', color: 'default', icon: PendingIcon },
  sent: { label: '送信済み', color: 'primary', icon: EmailIcon },
  opened: { label: '開封済み', color: 'info', icon: InfoIcon },
  submitted: { label: '提出完了', color: 'success', icon: CheckIcon },
  expired: { label: '期限切れ', color: 'error', icon: WarningIcon }
} as const;

const GoogleFormsManager: React.FC<GoogleFormsManagerProps> = ({
  projectId,
  projectName,
  customerEmails
}) => {
  // State
  const [selectedApplicationType, setSelectedApplicationType] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<FormCategory>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>(customerEmails);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sendDialogOpen, setSendDialogOpen] = useState<boolean>(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Effects
  useEffect(() => {
    if (selectedApplicationType) {
      fetchFormTemplates();
    }
  }, [selectedApplicationType]);

  useEffect(() => {
    fetchSubmissions();
  }, [projectId]);

  // API関数
  const fetchFormTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Supabase対応版に更新予定
      console.log('🚧 GoogleFormsManager: フォームテンプレート取得を一時的に無効化中');
      
      // モック処理
      console.log('✅ フォームテンプレート取得成功（モック）');
      setAvailableCategories({});
      setSelectedCategories([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // TODO: Supabase対応版に更新予定
      console.log('🚧 GoogleFormsManager: 送信状況取得を一時的に無効化中');
      
      // モック処理
      console.log('✅ 送信状況取得成功（モック）');
      setSubmissions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const sendForms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const request: SendFormRequest = {
        project_id: projectId,
        application_type: selectedApplicationType,
        form_categories: selectedCategories,
        recipient_emails: selectedEmails,
        custom_message: customMessage || undefined
      };

      // TODO: Supabase対応版に更新予定
      console.log('🚧 GoogleFormsManager: フォーム送信を一時的に無効化中');
      
      // モック成功処理
      console.log('✅ フォーム送信成功（モック）');
      setSuccess('1 件のフォームを送信しました（モック）');
      setSendDialogOpen(false);
      
      // フォームリセット
      setSelectedApplicationType('');
      setSelectedCategories([]);
      setCustomMessage('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // イベントハンドラー
  const handleApplicationTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedApplicationType(event.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEmailChange = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const getStatusIcon = (status: FormSubmission['status']) => {
    const config = STATUS_CONFIG[status];
    const IconComponent = config.icon;
    return <IconComponent />;
  };

  const getStatusColor = (status: FormSubmission['status']) => {
    return STATUS_CONFIG[status].color;
  };

  const getStatusLabel = (status: FormSubmission['status']) => {
    return STATUS_CONFIG[status].label;
  };

  return (
    <Box>
      {/* エラー・成功メッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* メインコンテンツ */}
      <Grid container spacing={3}>
        {/* フォーム送信セクション */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FormIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                申請書類フォーム送信
              </Typography>

              {/* 申請種別選択 */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>申請種別</InputLabel>
                <Select
                  value={selectedApplicationType}
                  onChange={handleApplicationTypeChange}
                  label="申請種別"
                >
                  {Object.entries(APPLICATION_TYPES).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* フォームカテゴリ選択 */}
              {selectedApplicationType && Object.keys(availableCategories).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    送信するフォーム
                  </Typography>
                  {Object.entries(availableCategories).map(([category, forms]) => (
                    <FormControlLabel
                      key={category}
                      control={
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {category}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {forms.map(f => f.form_name).join(', ')}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
              )}

              {/* 送信先メール選択 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  送信先メールアドレス
                </Typography>
                {customerEmails.map(email => (
                  <FormControlLabel
                    key={email}
                    control={
                      <Checkbox
                        checked={selectedEmails.includes(email)}
                        onChange={() => handleEmailChange(email)}
                      />
                    }
                    label={email}
                  />
                ))}
              </Box>

              {/* 送信ボタン */}
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                fullWidth
                disabled={!selectedApplicationType || selectedCategories.length === 0 || selectedEmails.length === 0}
                onClick={() => setSendDialogOpen(true)}
              >
                フォームを送信
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 送信状況セクション */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  送信状況
                </Typography>
                <Tooltip title="更新">
                  <IconButton onClick={fetchSubmissions} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {submissions.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  まだフォームを送信していません
                </Typography>
              ) : (
                <List>
                  {submissions.map((submission) => (
                    <ListItem key={submission.id} divider>
                      <ListItemIcon>
                        {getStatusIcon(submission.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" component="span">
                              {submission.form_template.form_name}
                            </Typography>
                            <Chip
                              label={getStatusLabel(submission.status)}
                              size="small"
                              color={getStatusColor(submission.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              送信先: {submission.recipient_email}
                            </Typography>
                            {submission.sent_at && (
                              <Typography variant="caption" display="block">
                                送信日時: {new Date(submission.sent_at).toLocaleString()}
                              </Typography>
                            )}
                            {submission.submitted_at && (
                              <Typography variant="caption" display="block" color="success.main">
                                提出日時: {new Date(submission.submitted_at).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 送信確認ダイアログ */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>フォーム送信確認</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            以下の内容でフォームを送信しますか？
          </Typography>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 送信内容
            </Typography>
            <Typography variant="body2">
              <strong>プロジェクト:</strong> {projectName}
            </Typography>
            <Typography variant="body2">
              <strong>申請種別:</strong> {APPLICATION_TYPES[selectedApplicationType as keyof typeof APPLICATION_TYPES]}
            </Typography>
            <Typography variant="body2">
              <strong>フォーム:</strong> {selectedCategories.join(', ')}
            </Typography>
            <Typography variant="body2">
              <strong>送信先:</strong> {selectedEmails.join(', ')}
            </Typography>
          </Paper>

          <TextField
            label="カスタムメッセージ（省略可）"
            multiline
            rows={3}
            fullWidth
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="お客様への追加メッセージがあれば入力してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={sendForms} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            送信実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleFormsManager;