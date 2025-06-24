import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details?: any;
  source: string;
  resolved: boolean;
}

interface ErrorSummary {
  total: number;
  by_level: {
    error: number;
    warning: number;
    info: number;
  };
  by_category: {
    [key: string]: number;
  };
  recent_24h: number;
}

const ErrorMonitor: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [summary, setSummary] = useState<ErrorSummary>({
    total: 0,
    by_level: { error: 0, warning: 0, info: 0 },
    by_category: {},
    recent_24h: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadErrorLogs();
    
    // 5分ごとに自動更新
    const interval = setInterval(loadErrorLogs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadErrorLogs = async () => {
    setLoading(true);
    try {
      // 実際のアプリケーションで発生したエラーパターンを基にサンプルデータを生成
      const sampleErrors: ErrorLog[] = [
        {
          id: 'err-001',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          level: 'error',
          category: 'TypeScript',
          message: "Property 'types' does not exist on type 'any[]'",
          details: {
            file: 'SimpleApplicationManagement.tsx',
            line: 172,
            fix: 'data.types → data に修正'
          },
          source: 'Build Process',
          resolved: true
        },
        {
          id: 'err-002',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          level: 'error',
          category: 'CORS',
          message: 'Access to XMLHttpRequest blocked by CORS policy',
          details: {
            url: 'https://shinsei-backend.onrender.com/api/v1/applications/types/',
            origin: 'https://tranquil-cactus-de8407.netlify.app',
            fix: 'Supabase APIに移行済み'
          },
          source: 'API Request',
          resolved: true
        },
        {
          id: 'err-003',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          level: 'error',
          category: 'Module',
          message: "Module not found: Error: Can't resolve '../lib/supabase'",
          details: {
            cause: '.gitignoreでlibディレクトリが除外',
            fix: 'git add src/lib/supabaseを実行'
          },
          source: 'Netlify Build',
          resolved: true
        },
        {
          id: 'err-004',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          level: 'warning',
          category: 'API',
          message: 'Supabase申請取得は未実装、モックデータを返します',
          details: {
            status: '実装予定',
            impact: 'プロダクション機能に影響'
          },
          source: 'Application API',
          resolved: false
        },
        {
          id: 'err-005',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          level: 'info',
          category: 'Database',
          message: 'Supabaseデータベースに接続しました',
          details: {
            tables: ['projects', 'applications', 'application_types'],
            records: { projects: 2, application_types: 5 }
          },
          source: 'Database Connection',
          resolved: true
        },
        {
          id: 'err-006',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          level: 'error',
          category: 'TypeScript',
          message: "Property 'customer' is possibly 'undefined'",
          details: {
            file: 'ProjectCreate.tsx',
            solution: 'Optional chaining (?.) と fallback値を追加',
            fix: 'formData.customer?.owner_name || ""'
          },
          source: 'Type Checker',
          resolved: true
        }
      ];

      setErrorLogs(sampleErrors);
      
      // サマリー計算
      const errorCount = sampleErrors.filter(e => e.level === 'error').length;
      const warningCount = sampleErrors.filter(e => e.level === 'warning').length;
      const infoCount = sampleErrors.filter(e => e.level === 'info').length;
      
      const categoryCount: { [key: string]: number } = {};
      sampleErrors.forEach(error => {
        categoryCount[error.category] = (categoryCount[error.category] || 0) + 1;
      });

      const recent24h = sampleErrors.filter(error => 
        Date.now() - new Date(error.timestamp).getTime() < 24 * 60 * 60 * 1000
      ).length;

      setSummary({
        total: sampleErrors.length,
        by_level: {
          error: errorCount,
          warning: warningCount,
          info: infoCount
        },
        by_category: categoryCount,
        recent_24h: recent24h
      });

    } catch (error) {
      console.error('エラーログの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewError = (error: ErrorLog) => {
    setSelectedError(error);
    setDetailDialogOpen(true);
  };

  const handleResolveError = (errorId: string) => {
    setErrorLogs(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ));
  };

  const handleClearResolved = () => {
    setErrorLogs(prev => prev.filter(error => !error.resolved));
  };

  const exportErrorLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message', 'Source', 'Resolved'],
      ...errorLogs.map(error => [
        error.timestamp,
        error.level,
        error.category,
        error.message,
        error.source,
        error.resolved.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: 'error' | 'warning' | 'info') => {
    switch (level) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
    }
  };

  const getLevelColor = (level: 'error' | 'warning' | 'info') => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* エラーサマリー */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="error">
              エラー: {summary.by_level.error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              未解決の重要な問題
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              警告: {summary.by_level.warning}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              注意が必要な問題
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="info.main">
              情報: {summary.by_level.info}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              システム情報ログ
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">
              24h: {summary.recent_24h}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              過去24時間のログ
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadErrorLogs}
          disabled={loading}
        >
          更新
        </Button>
        <Button
          startIcon={<ClearIcon />}
          onClick={handleClearResolved}
          color="warning"
        >
          解決済みをクリア
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={exportErrorLogs}
        >
          CSVエクスポート
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* エラーログテーブル */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            エラーログ一覧
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>時刻</TableCell>
                  <TableCell>レベル</TableCell>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>メッセージ</TableCell>
                  <TableCell>ソース</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorLogs.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>
                      {new Date(error.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getLevelIcon(error.level)}
                        <Chip 
                          label={error.level.toUpperCase()} 
                          size="small"
                          color={getLevelColor(error.level)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{error.category}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {error.message}
                      </Typography>
                    </TableCell>
                    <TableCell>{error.source}</TableCell>
                    <TableCell>
                      <Chip 
                        label={error.resolved ? '解決済み' : '未解決'}
                        color={error.resolved ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewError(error)}
                      >
                        <InfoIcon />
                      </IconButton>
                      {!error.resolved && (
                        <IconButton
                          size="small"
                          onClick={() => handleResolveError(error.id)}
                          color="success"
                        >
                          <ClearIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* エラー詳細ダイアログ */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          エラー詳細: {selectedError?.category}
        </DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <Alert severity={selectedError.level} sx={{ mb: 2 }}>
                {selectedError.message}
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                基本情報
              </Typography>
              <Box sx={{ mb: 2, pl: 2 }}>
                <Typography variant="body2">
                  <strong>時刻:</strong> {new Date(selectedError.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>ソース:</strong> {selectedError.source}
                </Typography>
                <Typography variant="body2">
                  <strong>カテゴリ:</strong> {selectedError.category}
                </Typography>
              </Box>

              {selectedError.details && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    詳細情報
                  </Typography>
                  <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                    <pre style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedError.details, null, 2)}
                    </pre>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            閉じる
          </Button>
          {selectedError && !selectedError.resolved && (
            <Button 
              onClick={() => {
                handleResolveError(selectedError.id);
                setDetailDialogOpen(false);
              }}
              color="success"
              variant="contained"
            >
              解決済みにする
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ErrorMonitor;