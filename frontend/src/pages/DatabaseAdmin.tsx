import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Home as HomeIcon, TableChart as TableChartIcon, Build as BuildIcon } from '@mui/icons-material';
import {
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  MonitorHeart as MonitorIcon
} from '@mui/icons-material';
import ErrorMonitor from '../components/ErrorMonitor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DatabaseStats {
  tables: {
    name: string;
    rows: number;
    size: string;
    last_updated: string;
  }[];
  total_size: string;
  connection_count: number;
  performance_stats: {
    avg_query_time: string;
    slow_queries: number;
    cache_hit_ratio: string;
  };
}

interface TableData {
  columns: string[];
  rows: any[][];
  total_count: number;
}

const DatabaseAdmin: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, page]);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      // Supabase対応APIを使用
      const { databaseAdminApi } = await import('../services/api');
      const data = await databaseAdminApi.getDatabaseStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/admin/database/tables/${selectedTable}?page=${page}&limit=${rowsPerPage}`
      );
      if (!response.ok) throw new Error('テーブルデータの取得に失敗しました');
      
      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupInProgress(true);
      const response = await fetch('/api/v1/admin/database/backup', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('バックアップに失敗しました');
      
      const result = await response.json();
      setSuccess(`バックアップが完了しました: ${result.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップエラー');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      if (!selectedTable) return;
      
      const response = await fetch(
        `/api/v1/admin/database/export/${selectedTable}?format=${format}`
      );
      
      if (!response.ok) throw new Error('エクスポートに失敗しました');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedTable}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('エクスポートが完了しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートエラー');
    }
  };

  const handleDeleteRow = async () => {
    try {
      if (!selectedRow || !selectedTable) return;
      
      const response = await fetch(
        `/api/v1/admin/database/tables/${selectedTable}/rows/${selectedRow.id}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) throw new Error('データの削除に失敗しました');
      
      setSuccess('データを削除しました');
      setDeleteDialogOpen(false);
      fetchTableData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除エラー');
    }
  };

  const renderDatabaseOverview = () => (
    <Grid container spacing={3}>
      {/* Supabase接続状況カード */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Supabase接続</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              接続中
            </Typography>
            <Typography variant="body2" color="text.secondary">
              最終確認: {new Date().toLocaleTimeString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 統計カード */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <StorageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">データベースサイズ</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {stats?.total_size || '---'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">アクティブ接続</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {stats?.connection_count || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">キャッシュヒット率</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats?.performance_stats?.cache_hit_ratio || '---'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">低速クエリ</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats?.performance_stats?.slow_queries || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* テーブル一覧 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">テーブル一覧</Typography>
              <Box>
                <Tooltip title="バックアップ作成">
                  <Button
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    onClick={handleBackup}
                    disabled={backupInProgress}
                    sx={{ mr: 1 }}
                  >
                    {backupInProgress ? 'バックアップ中...' : 'バックアップ'}
                  </Button>
                </Tooltip>
                <Tooltip title="統計更新">
                  <IconButton onClick={fetchDatabaseStats}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>テーブル名</TableCell>
                    <TableCell align="right">レコード数</TableCell>
                    <TableCell align="right">サイズ</TableCell>
                    <TableCell align="right">最終更新</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell>
                        <Chip
                          label={table.name}
                          variant="outlined"
                          clickable
                          onClick={() => {
                            setSelectedTable(table.name);
                            setTabValue(1);
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {table.rows.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">{table.size}</TableCell>
                      <TableCell align="right">
                        {new Date(table.last_updated).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="データ表示">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTable(table.name);
                              setTabValue(1);
                            }}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTableManager = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>テーブル選択</InputLabel>
          <Select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            label="テーブル選択"
          >
            {stats?.tables.map((table) => (
              <MenuItem key={table.name} value={table.name}>
                {table.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedTable && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('csv')}
              sx={{ mr: 1 }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('json')}
            >
              JSON
            </Button>
          </Box>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {selectedTable && tableData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedTable} ({tableData.total_count.toLocaleString()} レコード)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {tableData.columns.map((column) => (
                      <TableCell key={column}>{column}</TableCell>
                    ))}
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.rows.map((row, index) => (
                    <TableRow key={index}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell === null ? (
                            <Chip label="NULL" size="small" variant="outlined" />
                          ) : typeof cell === 'boolean' ? (
                            <Chip
                              label={cell.toString()}
                              size="small"
                              color={cell ? 'success' : 'default'}
                            />
                          ) : (
                            String(cell).length > 50 ? 
                              String(cell).substring(0, 50) + '...' : 
                              String(cell)
                          )}
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Tooltip title="編集">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRow(row);
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="削除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedRow(row);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <StorageIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        データベース管理
      </Typography>

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon sx={{ fontSize: 18 }} />
                概要・統計
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChartIcon sx={{ fontSize: 18 }} />
                テーブル管理
              </Box>
            } 
          />
          <Tab label="🚨 エラー監視" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon sx={{ fontSize: 18 }} />
                メンテナンス
              </Box>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderDatabaseOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderTableManager()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ErrorMonitor />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon />
                    メンテナンス操作
                  </Box>
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    onClick={handleBackup}
                    disabled={backupInProgress}
                    fullWidth
                  >
                    データベースバックアップ
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchDatabaseStats}
                    fullWidth
                  >
                    統計情報更新
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ⚡ パフォーマンス
                </Typography>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    平均クエリ時間: {stats?.performance_stats?.avg_query_time || '---'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    低速クエリ: {stats?.performance_stats?.slow_queries || 0} 件
                  </Typography>
                  <Typography variant="body2">
                    キャッシュヒット率: {stats?.performance_stats?.cache_hit_ratio || '---'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>データ削除の確認</DialogTitle>
        <DialogContent>
          このデータを削除してもよろしいですか？この操作は取り消せません。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteRow} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseAdmin;