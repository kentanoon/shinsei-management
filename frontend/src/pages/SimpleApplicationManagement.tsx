import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { projectApi, applicationApi } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface Application {
  id: number;
  project_id: number;
  application_type_id: number;
  status: string;
  submitted_date?: string;
  approved_date?: string;
  notes?: string;
  project?: {
    id: number;
    project_code: string;
    project_name: string;
    status: string;
  };
  application_type?: {
    id: number;
    code: string;
    name: string;
    description: string;
  };
}

interface ApplicationType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  status: string;
}

interface ApplicationStatusHistory {
  id: number;
  application_id: number;
  status: string;
  changed_date: string;
  notes?: string;
}

export default function SimpleApplicationManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // 新規申請作成用の状態
  const [newApplication, setNewApplication] = useState({
    project_id: '',
    application_type_id: '',
    status: '未定',
    submitted_date: '',
    approved_date: '',
    notes: ''
  });

  const { showError, showSuccess, showWarning } = useErrorHandler();

  // データ取得関数
  const fetchApplications = async () => {
    try {
      const data = await applicationApi.getApplications();
      setApplications(data.applications || []);
    } catch (error) {
      showError('申請一覧の取得に失敗しました');
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getProjects();
      setProjects(data.projects || []);
    } catch (error) {
      showError('プロジェクト一覧の取得に失敗しました');
    }
  };

  const fetchApplicationTypes = async () => {
    try {
      const data = await applicationApi.getApplicationTypes();
      setApplicationTypes(data || []);
    } catch (error) {
      showError('申請種別の取得に失敗しました');
    }
  };

  const getDaysInStatus = (application: Application): number => {
    if (!application.submitted_date) return 0;
    const submittedDate = new Date(application.submitted_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submittedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchApplications(),
        fetchProjects(),
        fetchApplicationTypes()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetail = (application: Application) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const handleCreateApplication = async () => {
    try {
      const applicationData = {
        project_id: parseInt(newApplication.project_id),
        application_type_id: parseInt(newApplication.application_type_id),
        category: '確認申請' as const,
        priority: 'normal' as const,
        title: `申請 ${newApplication.project_id}`,
        description: newApplication.notes,
        notes: newApplication.notes
      };

      await applicationApi.createApplication(applicationData);
      showSuccess('申請が正常に作成されました');
      setCreateDialogOpen(false);
      setNewApplication({
        project_id: '',
        application_type_id: '',
        status: '未定',
        submitted_date: '',
        approved_date: '',
        notes: ''
      });
      fetchApplications();
    } catch (error) {
      showError('申請の作成に失敗しました');
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      '申請': { color: 'primary' as const, icon: <CheckCircleIcon /> },
      '未定': { color: 'default' as const, icon: <ScheduleIcon /> },
      '保留': { color: 'warning' as const, icon: <WarningIcon /> },
      '却下': { color: 'error' as const, icon: <ErrorIcon /> },
      'キャンセル': { color: 'default' as const, icon: <CancelIcon /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['未定'];

    return (
      <Chip
        label={status}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          データを読み込んでいます...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        申請管理
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="申請管理タブ">
          <Tab label="申請一覧" {...a11yProps(0)} />
          <Tab label="申請詳細" {...a11yProps(1)} />
          <Tab label="統計情報" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            申請一覧 ({applications.length}件)
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            新規申請作成
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>申請ID</TableCell>
                <TableCell>プロジェクト</TableCell>
                <TableCell>申請種別</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>提出日</TableCell>
                <TableCell>承認日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.id}</TableCell>
                  <TableCell>
                    {application.project?.project_code}<br />
                    <Typography variant="caption" color="text.secondary">
                      {application.project?.project_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{application.application_type?.name}</TableCell>
                  <TableCell>{getStatusChip(application.status)}</TableCell>
                  <TableCell>
                    {application.submitted_date 
                      ? new Date(application.submitted_date).toLocaleDateString('ja-JP')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {application.approved_date 
                      ? new Date(application.approved_date).toLocaleDateString('ja-JP')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Tooltip title="詳細表示">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(application)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          申請詳細
        </Typography>
        <Alert severity="info">
          申請を選択して詳細を表示してください
        </Alert>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          統計情報
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                総申請数
              </Typography>
              <Typography variant="h4" color="primary">
                {applications.length}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                承認済み
              </Typography>
              <Typography variant="h4" color="success.main">
                {applications.filter(app => app.status === '申請').length}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                保留中
              </Typography>
              <Typography variant="h4" color="warning.main">
                {applications.filter(app => app.status === '保留').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* 申請詳細ダイアログ */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>申請詳細</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    プロジェクト情報
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.project?.project_code} - {selectedApplication.project?.project_name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    申請種別
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.application_type?.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    ステータス
                  </Typography>
                  {getStatusChip(selectedApplication.status)}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    提出日
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.submitted_date 
                      ? new Date(selectedApplication.submitted_date).toLocaleDateString('ja-JP')
                      : '未設定'
                    }
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    承認日
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.approved_date 
                      ? new Date(selectedApplication.approved_date).toLocaleDateString('ja-JP')
                      : '未設定'
                    }
                  </Typography>
                </Box>
                
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Typography variant="subtitle2" gutterBottom>
                    備考
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.notes || '備考なし'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規申請作成ダイアログ */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新規申請作成</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>プロジェクト</InputLabel>
                <Select
                  value={newApplication.project_id}
                  label="プロジェクト"
                  onChange={(e) => setNewApplication(prev => ({
                    ...prev,
                    project_id: e.target.value as string
                  }))}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.project_code} - {project.project_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>申請種別</InputLabel>
                <Select
                  value={newApplication.application_type_id}
                  label="申請種別"
                  onChange={(e) => setNewApplication(prev => ({
                    ...prev,
                    application_type_id: e.target.value as string
                  }))}
                >
                  {applicationTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={newApplication.status}
                  label="ステータス"
                  onChange={(e) => setNewApplication(prev => ({
                    ...prev,
                    status: e.target.value as string
                  }))}
                >
                  <MenuItem value="未定">未定</MenuItem>
                  <MenuItem value="申請">申請</MenuItem>
                  <MenuItem value="保留">保留</MenuItem>
                  <MenuItem value="却下">却下</MenuItem>
                  <MenuItem value="キャンセル">キャンセル</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="提出日"
                type="date"
                value={newApplication.submitted_date}
                onChange={(e) => setNewApplication(prev => ({
                  ...prev,
                  submitted_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="備考"
                value={newApplication.notes}
                onChange={(e) => setNewApplication(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleCreateApplication}
            variant="contained"
            disabled={!newApplication.project_id || !newApplication.application_type_id}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}