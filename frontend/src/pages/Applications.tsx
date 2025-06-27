import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Card, CardContent, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Check as CheckIcon, Description as DescriptionIcon, Assignment as AssignmentIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Send as SendIcon } from '@mui/icons-material';
import { getStatusColor } from '../utils/statusUtils';
import { applicationApi, projectApi } from '../services/api';
import type { ApplicationStatus, ApplicationCategory, ApplicationPriority } from '../types/application';

interface ApplicationType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Application {
  id: number;
  project_id: number;
  application_type_id: number;
  status: string;
  submitted_date: string | null;
  approved_date: string | null;
  notes: string;
  application_type: ApplicationType;
  project: {
    project_code: string;
    project_name: string;
  };
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    application_type_id: '',
    status: '未定',
    submitted_date: '',
    approved_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsResponse, projectsResponse, typesResponse] = await Promise.all([
        applicationApi.getApplications(),
        projectApi.getProjects({ skip: 0, limit: 1000 }),
        applicationApi.getApplicationTypes()
      ]);

      setApplications(appsResponse.applications || appsResponse || []);
      setProjects(projectsResponse.projects || []);
      setApplicationTypes(typesResponse || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusCounts = () => {
    const counts = {
      total: applications.length,
      pending: applications.filter(app => app.status === '未定').length,
      submitted: applications.filter(app => app.status === '申請').length,
      approved: applications.filter(app => app.status === '承認').length,
      rejected: applications.filter(app => app.status === '却下').length,
    };
    return counts;
  };

  const handleOpenDialog = (application?: Application) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        project_id: application.project_id.toString(),
        application_type_id: application.application_type_id.toString(),
        status: application.status,
        submitted_date: application.submitted_date || '',
        approved_date: application.approved_date || '',
        notes: application.notes || ''
      });
    } else {
      setEditingApplication(null);
      setFormData({
        project_id: '',
        application_type_id: '',
        status: '未定',
        submitted_date: '',
        approved_date: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingApplication(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingApplication) {
        // 更新用のデータ形式
        const updateData = {
          status: formData.status as ApplicationStatus,
          notes: formData.notes,
        };
        await applicationApi.updateApplication(editingApplication.id, updateData);
      } else {
        // 作成用のデータ形式
        const createData = {
          project_id: parseInt(formData.project_id),
          application_type_id: parseInt(formData.application_type_id),
          category: '確認申請' as ApplicationCategory,
          priority: 'normal' as ApplicationPriority,
          title: `申請 - ${new Date().toLocaleDateString()}`,
          notes: formData.notes,
        };
        await applicationApi.createApplication(createData);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving application:', error);
    }
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    try {
      await applicationApi.updateApplicationStatus(applicationId, {
        status: newStatus,
        ...(newStatus === '申請' && { submitted_date: new Date().toISOString().split('T')[0] }),
        ...(newStatus === '承認' && { approved_date: new Date().toISOString().split('T')[0] }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ fontSize: '1.5rem' }} />
            申請管理
          </Box>
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: 'primary.main' }}
        >
          新規申請
        </Button>
      </Box>

      {/* ステータス統計カード */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon />
                総申請数
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {counts.total}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ⏳ 未定
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
              {counts.pending}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon />
                申請中
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {counts.submitted}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                承認済
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {counts.approved}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CancelIcon sx={{ color: 'error.main' }} />
                却下
              </Box>
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'error.main', fontWeight: 'bold' }}>
              {counts.rejected}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 申請一覧テーブル */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          申請一覧
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>プロジェクト</TableCell>
                <TableCell>申請種別</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>提出日</TableCell>
                <TableCell>承認日</TableCell>
                <TableCell>備考</TableCell>
                <TableCell>アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {app.project.project_code}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {app.project.project_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{app.application_type.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={app.status}
                      color={getStatusColor(app.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {app.submitted_date ? new Date(app.submitted_date).toLocaleDateString() : '---'}
                  </TableCell>
                  <TableCell>
                    {app.approved_date ? new Date(app.approved_date).toLocaleDateString() : '---'}
                  </TableCell>
                  <TableCell>
                    {app.notes ? (
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {app.notes}
                      </Typography>
                    ) : '---'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(app)}
                      >
                        編集
                      </Button>
                      {app.status === '未定' && (
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleStatusUpdate(app.id, '申請')}
                        >
                          申請
                        </Button>
                      )}
                      {app.status === '申請' && (
                        <Button
                          size="small"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleStatusUpdate(app.id, '承認')}
                        >
                          承認
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {applications.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            申請データがありません。新規申請を作成してください。
          </Alert>
        )}
      </Paper>

      {/* 新規/編集ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingApplication ? '申請編集' : '新規申請作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={formData.project_id}
                label="プロジェクト"
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
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
                value={formData.application_type_id}
                label="申請種別"
                onChange={(e) => setFormData({ ...formData, application_type_id: e.target.value })}
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
                value={formData.status}
                label="ステータス"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="未定">未定</MenuItem>
                <MenuItem value="申請">申請</MenuItem>
                <MenuItem value="承認">承認</MenuItem>
                <MenuItem value="却下">却下</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="提出日"
              type="date"
              value={formData.submitted_date}
              onChange={(e) => setFormData({ ...formData, submitted_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="承認日"
              type="date"
              value={formData.approved_date}
              onChange={(e) => setFormData({ ...formData, approved_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="備考"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingApplication ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Applications;