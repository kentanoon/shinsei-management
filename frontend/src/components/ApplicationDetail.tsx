import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import ApplicationWorkflow from './ApplicationWorkflow';
import type { 
  EnhancedApplication, 
  ApplicationDocument, 
  ApplicationDeadline,
  ApplicationStatusChangeRequest,
  ApplicationUpdateRequest
} from '../types/application';

interface ApplicationDetailProps {
  application: EnhancedApplication;
  onUpdate: (updates: ApplicationUpdateRequest) => Promise<void>;
  onStatusChange: (request: ApplicationStatusChangeRequest) => Promise<void>;
  onUploadDocument: (file: File, requirementId: number) => Promise<void>;
  onDownloadDocument: (document: ApplicationDocument) => void;
  onDeleteDocument: (documentId: number) => Promise<void>;
  readonly?: boolean;
}

const ApplicationDetail: React.FC<ApplicationDetailProps> = ({
  application,
  onUpdate,
  onStatusChange,
  onUploadDocument,
  onDownloadDocument,
  onDeleteDocument,
  readonly = false
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: application.title,
    description: application.description || '',
    priority: application.priority,
    response_deadline: application.response_deadline || '',
    estimated_completion_date: application.estimated_completion_date || '',
    notes: application.notes || '',
    internal_notes: application.internal_notes || '',
  });
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; requirementId?: number }>({
    open: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadDialog.requirementId) return;

    try {
      await onUploadDocument(selectedFile, uploadDialog.requirementId);
      setUploadDialog({ open: false });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getDeadlineStatus = (deadline: ApplicationDeadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline.deadline_date);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (deadline.is_met) return 'completed';
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'urgent';
    if (daysUntil <= 7) return 'warning';
    return 'normal';
  };

  const getDeadlineStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'urgent': return 'error';
      case 'warning': return 'warning';
      case 'normal': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              {editMode ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  sx={{ mb: 1 }}
                />
              ) : (
                <Typography variant="h5" component="h1" gutterBottom>
                  {application.title}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip label={application.category} color="primary" variant="outlined" />
                <Chip label={application.priority} color="warning" size="small" />
                <Chip label={`リスク: ${application.risk_level}`} color="error" size="small" />
                {application.reference_number && (
                  <Typography variant="body2" color="textSecondary">
                    参照番号: {application.reference_number}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {!readonly && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editMode ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      color="primary"
                    >
                      保存
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setEditMode(false)}
                    >
                      キャンセル
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    編集
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {/* 基本情報サマリー */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="textSecondary">プロジェクト</Typography>
              <Typography variant="body1">{application.project.project_code}</Typography>
              <Typography variant="caption" color="textSecondary">
                {application.project.project_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">作成日</Typography>
              <Typography variant="body1">{formatDate(application.created_at)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">期限</Typography>
              <Typography variant="body1">{formatDate(application.response_deadline)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">進捗</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={application.progress_percentage}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="body2">{application.progress_percentage}%</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="ワークフロー" icon={<TimelineIcon />} />
          <Tab label="詳細情報" icon={<AssignmentIcon />} />
          <Tab label="書類管理" icon={<AttachFileIcon />} />
          <Tab label="期限管理" icon={<ScheduleIcon />} />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      {currentTab === 0 && (
        <ApplicationWorkflow
          application={application}
          onStatusChange={onStatusChange}
          readonly={readonly}
        />
      )}

      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>詳細情報</Typography>
            
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>説明</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    {application.description || '説明がありません'}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>期限設定</Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="date"
                      label="回答期限"
                      value={formData.response_deadline}
                      onChange={(e) => setFormData({ ...formData, response_deadline: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body2">
                      回答期限: {formatDate(application.response_deadline)}
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>優先度</Typography>
                  {editMode ? (
                    <FormControl fullWidth>
                      <InputLabel>優先度</InputLabel>
                      <Select
                        value={formData.priority}
                        label="優先度"
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      >
                        <MenuItem value="urgent">緊急</MenuItem>
                        <MenuItem value="high">高</MenuItem>
                        <MenuItem value="normal">通常</MenuItem>
                        <MenuItem value="low">低</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2">
                      {application.priority}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>備考</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    {application.notes || '備考がありません'}
                  </Typography>
                )}
              </Box>
              
              {editMode && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>内部メモ</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="内部用のメモ..."
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>必要書類</Typography>
            
            {application.requirements?.map((requirement) => {
              const relatedDocs = application.documents?.filter(
                doc => doc.requirement_id === requirement.id && doc.is_current
              ) || [];
              
              return (
                <Accordion key={requirement.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle2">{requirement.name}</Typography>
                      {requirement.is_required && (
                        <Chip label="必須" color="error" size="small" />
                      )}
                      <Chip 
                        label={`${relatedDocs.length}件`} 
                        color={relatedDocs.length > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {requirement.description}
                    </Typography>
                    
                    {/* アップロードボタン */}
                    {!readonly && (
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadDialog({ open: true, requirementId: requirement.id })}
                        sx={{ mb: 2 }}
                      >
                        ファイルをアップロード
                      </Button>
                    )}
                    
                    {/* ファイル一覧 */}
                    {relatedDocs.length > 0 && (
                      <List dense>
                        {relatedDocs.map((doc) => (
                          <ListItem key={doc.id}>
                            <ListItemIcon>
                              <AttachFileIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={doc.file_name}
                              secondary={
                                <Box>
                                  <Typography variant="caption">
                                    v{doc.version} • {(doc.file_size / 1024).toFixed(1)}KB • 
                                    {formatDate(doc.uploaded_at)}
                                  </Typography>
                                  <Chip 
                                    label={doc.review_status}
                                    size="small"
                                    color={
                                      doc.review_status === 'approved' ? 'success' :
                                      doc.review_status === 'rejected' ? 'error' : 'default'
                                    }
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                onClick={() => onDownloadDocument(doc)}
                                size="small"
                              >
                                <DownloadIcon />
                              </IconButton>
                              {!readonly && (
                                <IconButton 
                                  onClick={() => onDeleteDocument(doc.id)}
                                  size="small"
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </CardContent>
        </Card>
      )}

      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>期限管理</Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>種類</TableCell>
                    <TableCell>期限日</TableCell>
                    <TableCell>残り日数</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>重要度</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {application.deadlines?.map((deadline) => {
                    const status = getDeadlineStatus(deadline);
                    const daysUntil = Math.ceil(
                      (new Date(deadline.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <TableRow key={deadline.id}>
                        <TableCell>{deadline.description}</TableCell>
                        <TableCell>{formatDate(deadline.deadline_date)}</TableCell>
                        <TableCell>
                          <Typography
                            color={
                              status === 'overdue' ? 'error' :
                              status === 'urgent' ? 'error' :
                              status === 'warning' ? 'warning.main' : 'inherit'
                            }
                          >
                            {deadline.is_met ? '完了' : 
                             daysUntil < 0 ? `${Math.abs(daysUntil)}日超過` :
                             `あと${daysUntil}日`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={deadline.is_met ? '完了' : status}
                            color={getDeadlineStatusColor(status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {deadline.is_critical && (
                            <FlagIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ファイルアップロードダイアログ */}
      <Dialog 
        open={uploadDialog.open} 
        onClose={() => setUploadDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ファイルアップロード</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '8px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false })}>
            キャンセル
          </Button>
          <Button 
            onClick={handleFileUpload}
            variant="contained"
            disabled={!selectedFile}
          >
            アップロード
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetail;