import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';

interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showAnimations: boolean;
  compactMode: boolean;
  defaultView: 'interactive' | 'classic' | 'calendar';
  showConnectionStatus: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface DashboardSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onSettingsChange: (settings: DashboardSettings) => void;
  onResetLayout: () => void;
  onExportLayout: () => void;
  onImportLayout: (file: File) => void;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  autoRefresh: true,
  refreshInterval: 30,
  showAnimations: true,
  compactMode: false,
  defaultView: 'interactive',
  showConnectionStatus: true,
  enableNotifications: true,
  theme: 'auto',
};

const DashboardSettingsDialog: React.FC<DashboardSettingsProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  onResetLayout,
  onExportLayout,
  onImportLayout,
}) => {
  const [localSettings, setLocalSettings] = useState<DashboardSettings>(settings);

  const handleSettingChange = (key: keyof DashboardSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const handleResetSettings = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportLayout(file);
    }
    // Reset input
    event.target.value = '';
  };

  const getRefreshIntervalText = (value: number) => {
    if (value < 60) return `${value}秒`;
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      aria-labelledby="dashboard-settings-title"
    >
      <DialogTitle id="dashboard-settings-title">
        ダッシュボード設定
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* 表示設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                表示設定
              </Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.showAnimations}
                      onChange={(e) => handleSettingChange('showAnimations', e.target.checked)}
                    />
                  }
                  label="アニメーション効果を有効にする"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.compactMode}
                      onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                    />
                  }
                  label="コンパクトモード"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.showConnectionStatus}
                      onChange={(e) => handleSettingChange('showConnectionStatus', e.target.checked)}
                    />
                  }
                  label="接続ステータスを表示"
                />
              </FormGroup>

              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>デフォルトビュー</InputLabel>
                  <Select
                    value={localSettings.defaultView}
                    label="デフォルトビュー"
                    onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                  >
                    <MenuItem value="interactive">インタラクティブビュー</MenuItem>
                    <MenuItem value="classic">クラシックビュー</MenuItem>
                    <MenuItem value="calendar">カレンダービュー</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>テーマ</InputLabel>
                  <Select
                    value={localSettings.theme}
                    label="テーマ"
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">ライト</MenuItem>
                    <MenuItem value="dark">ダーク</MenuItem>
                    <MenuItem value="auto">自動</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* データ更新設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                データ更新設定
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  />
                }
                label="自動更新を有効にする"
              />

              {localSettings.autoRefresh && (
                <Box sx={{ mt: 2, px: 2 }}>
                  <Typography gutterBottom>
                    更新間隔: {getRefreshIntervalText(localSettings.refreshInterval)}
                  </Typography>
                  <Slider
                    value={localSettings.refreshInterval}
                    onChange={(_, value) => handleSettingChange('refreshInterval', value)}
                    min={10}
                    max={300}
                    step={10}
                    marks={[
                      { value: 10, label: '10秒' },
                      { value: 30, label: '30秒' },
                      { value: 60, label: '1分' },
                      { value: 120, label: '2分' },
                      { value: 300, label: '5分' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={getRefreshIntervalText}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 通知設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                通知設定
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  />
                }
                label="デスクトップ通知を有効にする"
              />
            </CardContent>
          </Card>

          {/* レイアウト管理 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                レイアウト管理
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="レイアウトをデフォルトに戻す">
                  <Button
                    variant="outlined"
                    startIcon={<RestoreIcon />}
                    onClick={onResetLayout}
                    size="small"
                  >
                    リセット
                  </Button>
                </Tooltip>
                
                <Tooltip title="現在のレイアウトをエクスポート">
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={onExportLayout}
                    size="small"
                  >
                    エクスポート
                  </Button>
                </Tooltip>
                
                <Tooltip title="レイアウトファイルをインポート">
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    component="label"
                    size="small"
                  >
                    インポート
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      style={{ display: 'none' }}
                    />
                  </Button>
                </Tooltip>
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                レイアウトの設定を保存・復元できます
              </Typography>
            </CardContent>
          </Card>

          {/* 設定のリセット */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                設定の管理
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<RestoreIcon />}
                onClick={handleResetSettings}
                size="small"
              >
                設定をデフォルトに戻す
              </Button>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                すべての設定をデフォルト値に戻します
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel}>
          キャンセル
        </Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardSettingsDialog;
export type { DashboardSettings };