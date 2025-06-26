import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import ApplicationDashboard from '../components/ApplicationDashboard';
import ApplicationDetail from '../components/ApplicationDetail';
import { useToast } from '../components/Toast';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { projectApi, applicationTypeApi } from '../services/api';
import type { 
  EnhancedApplication, 
  ApplicationSummary,
  ApplicationStatusChangeRequest,
  ApplicationUpdateRequest,
  ApplicationDocument,
  ApplicationType,
  Project,
} from '../types/application';

const EnhancedApplications: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useToast();
  const { handleError } = useErrorHandler();
  
  const [applications, setApplications] = useState<EnhancedApplication[]>([]);
  const [summary, setSummary] = useState<ApplicationSummary>({
    total_count: 0,
    by_status: {},
    by_category: {},
    by_priority: {},
    overdue_count: 0,
    urgent_count: 0,
    avg_completion_days: 0,
    approval_rate: 0,
  } as ApplicationSummary);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<EnhancedApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // APIから取得したマスタデータ
  const [projects, setProjects] = useState<Project[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);

  // デバッグ用: 状態変更を監視
  useEffect(() => {
    console.log('📊 EnhancedApplications: プロジェクト状態変更:', projects.length, '件', projects);
  }, [projects]);

  useEffect(() => {
    console.log('📊 EnhancedApplications: 申請種別状態変更:', applicationTypes.length, '件', applicationTypes);
  }, [applicationTypes]);

  // 新規申請作成用のフォーム状態
  const [newApplication, setNewApplication] = useState({
    project_id: '' as string | number,
    application_type_id: '' as string | number,
    title: '',
    description: '',
    status: '未定',
  });

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchApplications(),
        fetchProjects(),
        fetchApplicationTypes(),
      ]);
    };
    fetchData();
  }, []);

  /**
   * 新規申請を追加（デモ用にローカル状態に push）
   * TODO: 実際のAPI 呼び出しに置き換え
   */
  const handleCreateApplication = () => {
    if (!newApplication.project_id || !newApplication.application_type_id || !newApplication.title) {
      showError('必須項目を入力してください');
      return;
    }
    const nextId = Math.max(0, ...applications.map((a) => a.id)) + 1;

    const selectedProject = projects.find(p => p.id === Number(newApplication.project_id));
    const selectedAppType = applicationTypes.find(t => t.id === Number(newApplication.application_type_id));

    const created = {
    
      id: nextId,
      project_id: Number(newApplication.project_id),
      application_type_id: Number(newApplication.application_type_id),
      category: 'N/A',
      status: newApplication.status,
      priority: 'normal',
      title: newApplication.title,
      description: newApplication.description,
      reference_number: `APP-${new Date().getTime()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_date: null,
      response_deadline: null,
      progress_percentage: 0,
      estimated_completion_date: null,
      applicant: '自分',
      reviewer: '',
      notes: '',
      application_type: selectedAppType || {
        id: Number(newApplication.application_type_id),
        code: '',
        name: '申請種別',
        category: '',
        description: '',
        typical_duration_days: 0,
        is_active: true,
      },
      project: selectedProject ? { 
        id: selectedProject.id, // id を追加
        project_code: selectedProject.project_code,
        project_name: selectedProject.project_name,
        status: selectedProject.status,
      } : {
        id: 1, // id を追加
        project_code: `PRJ-${newApplication.project_id}`,
        project_name: 'プロジェクト',
        status: '進行中',
      },
      status_history: [],
      documents: [],
      requirements: [],
    } as unknown as EnhancedApplication as EnhancedApplication;

    setApplications((prev) => [...prev, created]);
    showSuccess('申請を作成しました');
    setCreateDialogOpen(false);
    // フォームリセット
    setNewApplication({ project_id: '', application_type_id: '', title: '', description: '', status: '未定' });
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // TODO: 実際のAPIエンドポイントに置き換え
      // const response = await applicationApi.getEnhancedApplications();
      // setApplications(response.applications);
      // setSummary(response.summary);
      
      // デモ用のモックデータ
      const mockApplications: EnhancedApplication[] = [
        {
          id: 1,
          project_id: 1,
          application_type_id: 1,
          category: '確認申請',
          status: '承認',
          priority: 'high',
          title: '住宅A棟 確認申請',
          description: '3階建て住宅の確認申請書類',
          reference_number: 'APP-2024-001',
          created_at: '2024-12-01T09:00:00Z',
          updated_at: '2024-12-15T14:30:00Z',
          submitted_date: '2024-12-10T10:00:00Z',
          response_deadline: '2024-12-25T17:00:00Z',
          progress_percentage: 75,
          estimated_completion_date: '2024-12-30T17:00:00Z',
          applicant: '田中太郎',
          reviewer: '審査課',
          notes: '特記事項なし',
          application_type: {
            id: 1,
            code: 'KAKUNIN',
            name: '確認申請',
            category: '確認申請',
            description: '建築確認申請',
            typical_duration_days: 35,
            is_active: true,
          },
          project: {
            id: 1, // id を追加
            project_code: 'PRJ-2024-001',
            project_name: '住宅A棟新築工事',
            status: '申請作業',
          },
          status_history: [
            {
              id: 1,
              application_id: 1,
              from_status: null,
              to_status: '未定',
              changed_by: '田中太郎',
              changed_at: '2024-12-01T09:00:00Z',
              comment: '申請書類作成開始',
            },
            {
              id: 2,
              application_id: 1,
              from_status: '未定',
              to_status: '承認',
              changed_by: '田中太郎',
              changed_at: '2024-12-10T10:00:00Z',
              comment: '必要書類を揃えて申請完了',
            },
          ],
          documents: [],
          requirements: [
            {
              id: 1,
              name: '申請書',
              description: '建築確認申請書（第一号様式〜第五号様式）',
              is_required: true,
              order_index: 1,
            },
            {
              id: 2,
              name: '設計図書',
              description: '配置図、各階平面図、立面図、断面図等',
              is_required: true,
              order_index: 2,
            },
          ],
          deadlines: [
            {
              id: 1,
              application_id: 1,
              deadline_type: 'response',
              deadline_date: '2024-12-25T17:00:00Z',
              description: '審査結果通知期限',
              is_critical: true,
              reminder_days: [7, 3, 1],
              is_met: false,
            },
          ],
          days_in_current_status: 5,
          total_days_elapsed: 14,
          risk_level: 'medium',
          completion_score: 75,
        },
      ];

      const mockSummary: ApplicationSummary = {
        total_count: 15,
        by_status: {
          '未定': 2,
          '申請': 3,
          '承認': 4,
          '却下': 3,
          '完了': 3,
        },
        by_category: {
          '確認申請': 8,
          '長期優良住宅': 3,
          'フラット35': 2,
          'BELS': 1,
          '省エネ適合性判定': 1,
          '構造適合性判定': 0,
          '建築士事務所登録': 0,
          'その他': 0,
        },
        by_priority: {
          urgent: 2,
          high: 5,
          normal: 7,
          low: 1,
        },
        overdue_count: 1,
        urgent_count: 2,
        avg_completion_days: 28,
        approval_rate: 92.3,
      };

      setApplications(mockApplications);
      setSummary(mockSummary);
    } catch (error) {
      handleError(error, '申請データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('🚀 EnhancedApplications: プロジェクト取得開始');
      const response = await projectApi.getProjects();
      console.log('📄 EnhancedApplications: プロジェクト取得レスポンス:', response);
      setProjects(response.projects);
      console.log('✨ EnhancedApplications: プロジェクト状態更新完了:', response.projects.length, '件');
    } catch (error) {
      console.error('❌ EnhancedApplications: プロジェクト取得エラー:', error);
      handleError(error, 'プロジェクトの取得に失敗しました');
    }
  };

  const fetchApplicationTypes = async () => {
    try {
      console.log('🚀 EnhancedApplications: 申請種別取得開始');
      const types = await applicationTypeApi.getApplicationTypes();
      console.log('📄 EnhancedApplications: 申請種別取得レスポンス:', types);
      setApplicationTypes(types);
      console.log('✨ EnhancedApplications: 申請種別状態更新完了:', types.length, '件');
    } catch (error) {
      console.error('❌ EnhancedApplications: 申請種別取得エラー:', error);
      handleError(error, '申請種別の取得に失敗しました');
    }
  };

  const handleViewApplication = (application: EnhancedApplication) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const handleEditApplication = (application: EnhancedApplication) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const handleStatusChange = async (request: ApplicationStatusChangeRequest) => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換え
      // await applicationApi.changeStatus(selectedApplication!.id, request);
      
      showSuccess(`ステータスを「${request.to_status}」に変更しました`);
      await fetchApplications();
    } catch (error) {
      handleError(error, 'ステータスの変更に失敗しました');
      throw error;
    }
  };

  const handleUpdateApplication = async (updates: ApplicationUpdateRequest) => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換え
      // await applicationApi.updateApplication(selectedApplication!.id, updates);
      
      showSuccess('申請情報を更新しました');
      await fetchApplications();
    } catch (error) {
      handleError(error, '申請情報の更新に失敗しました');
      throw error;
    }
  };

  const handleUploadDocument = async (file: File, requirementId: number) => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換え
      // await applicationApi.uploadDocument(selectedApplication!.id, file, requirementId);
      
      showSuccess('ファイルをアップロードしました');
      await fetchApplications();
    } catch (error) {
      handleError(error, 'ファイルのアップロードに失敗しました');
      throw error;
    }
  };

  const handleDownloadDocument = (document: ApplicationDocument) => {
    // TODO: 実際のダウンロード処理を実装
    showSuccess(`${document.file_name} をダウンロードします`);
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換え
      // await applicationApi.deleteDocument(documentId);
      
      showSuccess('ファイルを削除しました');
      await fetchApplications();
    } catch (error) {
      handleError(error, 'ファイルの削除に失敗しました');
      throw error;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#495057' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ fontSize: '1.5rem' }} />
            申請管理（強化版）
          </Box>
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ backgroundColor: '#007bff' }}
        >
          新規申請
        </Button>
      </Box>

      {/* メインダッシュボード */}
      <ApplicationDashboard
        applications={applications}
        summary={summary}
        onViewApplication={handleViewApplication}
        onEditApplication={handleEditApplication}
      />

      {/* 申請詳細ダイアログ */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">申請詳細</Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <ApplicationDetail
              application={selectedApplication}
              onUpdate={handleUpdateApplication}
              onStatusChange={handleStatusChange}
              onUploadDocument={handleUploadDocument}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 新規申請作成ダイアログ */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新規申請作成</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={newApplication.project_id}
                label="プロジェクト"
                onChange={(e) => setNewApplication({ ...newApplication, project_id: e.target.value })}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.project_code} - {p.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>申請種別</InputLabel>
              <Select
                value={newApplication.application_type_id}
                label="申請種別"
                onChange={(e) => setNewApplication({ ...newApplication, application_type_id: e.target.value })}
              >
                {applicationTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="タイトル"
              value={newApplication.title}
              onChange={(e) => setNewApplication({ ...newApplication, title: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="説明"
              value={newApplication.description}
              onChange={(e) => setNewApplication({ ...newApplication, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleCreateApplication} disabled={!newApplication.project_id || !newApplication.application_type_id || !newApplication.title}>
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* フローティングアクションボタン（モバイル用） */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default EnhancedApplications;