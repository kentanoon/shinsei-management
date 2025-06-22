/**
 * プロジェクト作成ページ
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { projectApi } from '../services/api';
import type { ProjectCreateRequest, ProjectStatus } from '../types/project';

const steps = ['基本情報', '顧客情報', '敷地情報', '建物情報'];

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

const ProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { handleError } = useErrorHandler();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ProjectCreateRequest>({
    project_name: '',
    status: '事前相談',
    input_date: new Date().toISOString().split('T')[0],
    customer: {
      owner_name: '',
      owner_kana: '',
      owner_zip: '',
      owner_address: '',
      owner_phone: '',
      joint_name: '',
      joint_kana: '',
      client_name: '',
      client_staff: '',
    },
    site: {
      address: '',
      land_area: undefined,
      city_plan: '',
      zoning: '',
      fire_zone: '',
      slope_limit: '',
      setback: '',
      other_buildings: '',
      landslide_alert: '',
      flood_zone: '',
      tsunami_zone: '',
    },
    building: {
      building_name: '',
      construction_type: '',
      primary_use: '',
      structure: '',
      floors: '',
      max_height: undefined,
      total_area: undefined,
      building_area: undefined,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // 基本情報
        if (!formData.project_name.trim()) {
          newErrors.project_name = 'プロジェクト名は必須です';
        }
        break;
      case 1: // 顧客情報
        if (!formData.customer?.owner_name?.trim()) {
          newErrors.owner_name = '施主名は必須です';
        }
        if (formData.customer?.owner_zip && !/^\d{3}-?\d{4}$/.test(formData.customer.owner_zip)) {
          newErrors.owner_zip = '郵便番号の形式が正しくありません';
        }
        break;
      case 2: // 敷地情報
        if (!formData.site?.address?.trim()) {
          newErrors.address = '建設地住所は必須です';
        }
        break;
      case 3: // 建物情報（すべて任意項目）
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    try {
      const project = await projectApi.createProject(formData);
      showSuccess('プロジェクトが正常に作成されました');
      navigate(`/projects/${project.project_code}`);
    } catch (error) {
      handleError(error, 'プロジェクトの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (section: keyof ProjectCreateRequest, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...(prev[section] as object), [field]: value }
        : value
    }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardHeader title="基本情報" />
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="プロジェクト名"
                    value={formData.project_name}
                    onChange={(e) => updateFormData('project_name', 'project_name', e.target.value)}
                    error={!!errors.project_name}
                    helperText={errors.project_name}
                    required
                  />
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>ステータス</InputLabel>
                    <Select
                      value={formData.status}
                      label="ステータス"
                      onChange={(e) => updateFormData('status', 'status', e.target.value)}
                    >
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', md: 'span 1' } }}>
                  <TextField
                    fullWidth
                    label="入力日"
                    type="date"
                    value={formData.input_date}
                    onChange={(e) => updateFormData('input_date', 'input_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader title="顧客情報" />
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="施主名"
                    value={formData.customer?.owner_name || ''}
                    onChange={(e) => updateFormData('customer', 'owner_name', e.target.value)}
                    error={!!errors.owner_name}
                    helperText={errors.owner_name}
                    required
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="施主フリガナ"
                    value={formData.customer?.owner_kana || ''}
                    onChange={(e) => updateFormData('customer', 'owner_kana', e.target.value)}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3, mt: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="郵便番号"
                    value={formData.customer?.owner_zip || ''}
                    onChange={(e) => updateFormData('customer', 'owner_zip', e.target.value)}
                    error={!!errors.owner_zip}
                    helperText={errors.owner_zip}
                    placeholder="123-4567"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="住所"
                    value={formData.customer?.owner_address || ''}
                    onChange={(e) => updateFormData('customer', 'owner_address', e.target.value)}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="電話番号"
                    value={formData.customer?.owner_phone || ''}
                    onChange={(e) => updateFormData('customer', 'owner_phone', e.target.value)}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="連名者"
                    value={formData.customer?.joint_name || ''}
                    onChange={(e) => updateFormData('customer', 'joint_name', e.target.value)}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="連名者フリガナ"
                    value={formData.customer?.joint_kana || ''}
                    onChange={(e) => updateFormData('customer', 'joint_kana', e.target.value)}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="発注者名"
                    value={formData.customer?.client_name || ''}
                    onChange={(e) => updateFormData('customer', 'client_name', e.target.value)}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                  <TextField
                    fullWidth
                    label="発注者担当者"
                    value={formData.customer?.client_staff || ''}
                    onChange={(e) => updateFormData('customer', 'client_staff', e.target.value)}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader title="敷地情報" />
            <CardContent>
              <Box sx={{ display: 'grid', gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="建設地住所"
                    value={formData.site?.address || ''}
                    onChange={(e) => updateFormData('site', 'address', e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="敷地面積 (㎡)"
                      type="number"
                      value={formData.site?.land_area || ''}
                      onChange={(e) => updateFormData('site', 'land_area', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="都市計画"
                      value={formData.site?.city_plan || ''}
                      onChange={(e) => updateFormData('site', 'city_plan', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="用途地域"
                      value={formData.site?.zoning || ''}
                      onChange={(e) => updateFormData('site', 'zoning', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="防火地域"
                      value={formData.site?.fire_zone || ''}
                      onChange={(e) => updateFormData('site', 'fire_zone', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="斜線制限"
                      value={formData.site?.slope_limit || ''}
                      onChange={(e) => updateFormData('site', 'slope_limit', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="外壁後退"
                      value={formData.site?.setback || ''}
                      onChange={(e) => updateFormData('site', 'setback', e.target.value)}
                    />
                  </Box>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="他建物"
                    multiline
                    rows={3}
                    value={formData.site?.other_buildings || ''}
                    onChange={(e) => updateFormData('site', 'other_buildings', e.target.value)}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="土砂災害警戒区域"
                      value={formData.site?.landslide_alert || ''}
                      onChange={(e) => updateFormData('site', 'landslide_alert', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="洪水浸水想定区域"
                      value={formData.site?.flood_zone || ''}
                      onChange={(e) => updateFormData('site', 'flood_zone', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="津波災害警戒区域"
                      value={formData.site?.tsunami_zone || ''}
                      onChange={(e) => updateFormData('site', 'tsunami_zone', e.target.value)}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader title="建物情報（任意）" />
            <CardContent>
              <Box sx={{ display: 'grid', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="建物名称"
                      value={formData.building?.building_name || ''}
                      onChange={(e) => updateFormData('building', 'building_name', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="建築用途"
                      value={formData.building?.construction_type || ''}
                      onChange={(e) => updateFormData('building', 'construction_type', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="主要用途"
                      value={formData.building?.primary_use || ''}
                      onChange={(e) => updateFormData('building', 'primary_use', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="構造"
                      value={formData.building?.structure || ''}
                      onChange={(e) => updateFormData('building', 'structure', e.target.value)}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="階数"
                      value={formData.building?.floors || ''}
                      onChange={(e) => updateFormData('building', 'floors', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="最高高さ (m)"
                      type="number"
                      value={formData.building?.max_height || ''}
                      onChange={(e) => updateFormData('building', 'max_height', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="延床面積 (㎡)"
                      type="number"
                      value={formData.building?.total_area || ''}
                      onChange={(e) => updateFormData('building', 'total_area', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="建築面積 (㎡)"
                      type="number"
                      value={formData.building?.building_area || ''}
                      onChange={(e) => updateFormData('building', 'building_area', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          新規案件作成
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            入力内容に問題があります。エラーを修正してください。
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<PrevIcon />}
          >
            戻る
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading ? '作成中...' : 'プロジェクトを作成'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
              >
                次へ
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectCreate;