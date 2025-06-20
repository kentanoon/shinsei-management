import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  IconButton,
  Tooltip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { formatFileSize } from '../utils/fileUtils';
import {
  Description as DescriptionIcon,
  GetApp as DownloadIcon,
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as PreviewIcon,
  FileCopy as CopyIcon,
  AutoMode as AutoIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { ApplicationCategory } from '../types/application';

interface DocumentTemplate {
  id: number;
  name: string;
  category: ApplicationCategory;
  description: string;
  file_path: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  file_size: number;
  download_count: number;
  auto_fill_fields: string[];
  required_project_fields: string[];
}

interface TemplateField {
  field_name: string;
  display_name: string;
  field_type: 'text' | 'number' | 'date' | 'select';
  is_required: boolean;
  default_value?: string;
  options?: string[];
  validation_pattern?: string;
}

interface GenerationRequest {
  template_id: number;
  project_id: number;
  custom_fields: Record<string, any>;
  output_format: 'pdf' | 'docx' | 'xlsx';
}

const ApplicationTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([
    {
      id: 1,
      name: '確認申請書（第一号様式）',
      category: '確認申請',
      description: '建築確認申請書の基本様式',
      file_path: '/templates/kakunin_01.docx',
      version: '2024.1',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 'admin',
      file_size: 156000,
      download_count: 45,
      auto_fill_fields: ['project_name', 'owner_name', 'address', 'land_area'],
      required_project_fields: ['customer', 'site', 'building'],
    },
    {
      id: 2,
      name: '長期優良住宅認定申請書',
      category: '長期優良住宅',
      description: '長期優良住宅の認定申請用書類',
      file_path: '/templates/chouki_01.xlsx',
      version: '2024.2',
      is_active: true,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-20T14:30:00Z',
      created_by: 'admin',
      file_size: 248000,
      download_count: 23,
      auto_fill_fields: ['project_name', 'owner_name', 'structure', 'total_area'],
      required_project_fields: ['customer', 'site', 'building'],
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generationData, setGenerationData] = useState<Partial<GenerationRequest>>({});
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  const handleGenerateDocument = async () => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換え
      // await templateApi.generateDocument(generationData);
      
      console.log('生成リクエスト:', generationData);
      setGenerateDialog(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('文書生成に失敗しました:', error);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getCategoryColor = (category: ApplicationCategory): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (category) {
      case '確認申請': return 'primary';
      case '長期優良住宅': return 'success';
      case 'フラット35': return 'warning';
      case 'BELS': return 'secondary';
      default: return 'primary';
    }
  };

  const renderGenerationSteps = () => (
    <Stepper activeStep={currentStep} orientation="vertical">
      <Step>
        <StepLabel>テンプレート選択</StepLabel>
        <StepContent>
          <Typography variant="body2" gutterBottom>
            生成する書類のテンプレートを選択してください。
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>テンプレート</InputLabel>
              <Select
                value={generationData.template_id || ''}
                label="テンプレート"
                onChange={(e) => {
                  const templateId = Number(e.target.value);
                  const template = templates.find(t => t.id === templateId);
                  setGenerationData({ ...generationData, template_id: templateId });
                  setSelectedTemplate(template || null);
                }}
              >
                {templates.filter(t => t.is_active).map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} (v{template.version})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(1)}
            disabled={!generationData.template_id}
          >
            次へ
          </Button>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>プロジェクト選択</StepLabel>
        <StepContent>
          <Typography variant="body2" gutterBottom>
            書類を生成するプロジェクトを選択してください。
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={generationData.project_id || ''}
                label="プロジェクト"
                onChange={(e) => setGenerationData({ ...generationData, project_id: Number(e.target.value) })}
              >
                {/* TODO: 実際のプロジェクトリストを取得 */}
                <MenuItem value={1}>PRJ-2024-001 - 住宅A棟新築工事</MenuItem>
                <MenuItem value={2}>PRJ-2024-002 - 事務所ビル改修工事</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCurrentStep(0)}>戻る</Button>
            <Button
              variant="contained"
              onClick={() => setCurrentStep(2)}
              disabled={!generationData.project_id}
            >
              次へ
            </Button>
          </Box>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>カスタムフィールド</StepLabel>
        <StepContent>
          <Typography variant="body2" gutterBottom>
            自動入力されない項目を入力してください。
          </Typography>
          
          {selectedTemplate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                自動入力項目:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {selectedTemplate.auto_fill_fields.map((field) => (
                  <Chip key={field} label={field} color="success" size="small" />
                ))}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                手動入力が必要な項目:
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="申請者印"
                  value={customFields.applicant_seal || ''}
                  onChange={(e) => setCustomFields({ ...customFields, applicant_seal: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="申請日"
                  type="date"
                  value={customFields.application_date || ''}
                  onChange={(e) => setCustomFields({ ...customFields, application_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="特記事項"
                    value={customFields.special_notes || ''}
                    onChange={(e) => setCustomFields({ ...customFields, special_notes: e.target.value })}
                  />
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCurrentStep(1)}>戻る</Button>
            <Button
              variant="contained"
              onClick={() => setCurrentStep(3)}
            >
              次へ
            </Button>
          </Box>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>出力設定</StepLabel>
        <StepContent>
          <Typography variant="body2" gutterBottom>
            出力形式を選択してください。
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>出力形式</InputLabel>
              <Select
                value={generationData.output_format || 'pdf'}
                label="出力形式"
                onChange={(e) => setGenerationData({ ...generationData, output_format: e.target.value as any })}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="docx">Word文書</MenuItem>
                <MenuItem value="xlsx">Excel表</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCurrentStep(2)}>戻る</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleGenerateDocument}
            >
              文書を生成
            </Button>
          </Box>
        </StepContent>
      </Step>
    </Stepper>
  );

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          📄 申請書類テンプレート管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoIcon />}
          onClick={() => setGenerateDialog(true)}
          color="success"
        >
          書類自動生成
        </Button>
      </Box>

      {/* 統計カード */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              📄 総テンプレート数
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {templates.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ✅ 有効テンプレート
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {templates.filter(t => t.is_active).length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              📥 今月のDL数
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'info.main', fontWeight: 'bold' }}>
              {templates.reduce((sum, t) => sum + t.download_count, 0)}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              🔄 自動生成対応
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              {templates.filter(t => t.auto_fill_fields.length > 0).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* テンプレート一覧 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">テンプレート一覧</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setEditDialog(true)}
            >
              新規テンプレート
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>テンプレート名</TableCell>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>バージョン</TableCell>
                  <TableCell>ファイルサイズ</TableCell>
                  <TableCell>ダウンロード数</TableCell>
                  <TableCell>自動入力</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {template.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={template.category}
                        color={getCategoryColor(template.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell>{formatFileSize(template.file_size)}</TableCell>
                    <TableCell>{template.download_count}</TableCell>
                    <TableCell>
                      <Chip
                        label={template.auto_fill_fields.length > 0 ? '対応' : '手動'}
                        color={template.auto_fill_fields.length > 0 ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.is_active ? '有効' : '無効'}
                        color={template.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="プレビュー">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setPreviewDialog(true);
                            }}
                          >
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ダウンロード">
                          <IconButton size="small">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編集">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="複製">
                          <IconButton size="small">
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 書類生成ダイアログ */}
      <Dialog
        open={generateDialog}
        onClose={() => setGenerateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoIcon color="success" />
            申請書類自動生成
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {renderGenerationSteps()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      {/* テンプレートプレビューダイアログ */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>テンプレート詳細</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTemplate.name}
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">カテゴリ</Typography>
                  <Typography variant="body1">{selectedTemplate.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">バージョン</Typography>
                  <Typography variant="body1">v{selectedTemplate.version}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">作成者</Typography>
                  <Typography variant="body1">{selectedTemplate.created_by}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">更新日</Typography>
                  <Typography variant="body1">{formatDate(selectedTemplate.updated_at)}</Typography>
                </Box>
              </Box>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    自動入力フィールド ({selectedTemplate.auto_fill_fields.length}件)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTemplate.auto_fill_fields.map((field) => (
                      <Chip key={field} label={field} color="success" size="small" />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    必要なプロジェクト情報 ({selectedTemplate.required_project_fields.length}件)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTemplate.required_project_fields.map((field) => (
                      <Chip key={field} label={field} color="primary" size="small" variant="outlined" />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            閉じる
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            ダウンロード
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationTemplateManager;