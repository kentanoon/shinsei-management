/**
 * Supabase接続状況表示コンポーネント
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Alert,
  AlertTitle,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CloudDone as ConnectedIcon,
  CloudOff as DisconnectedIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { checkSupabaseConnection } from '../services/database';

interface SupabaseStatusProps {
  showDetails?: boolean;
}

const SupabaseStatus: React.FC<SupabaseStatusProps> = ({ showDetails = true }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
    } catch (err) {
      console.error('Supabase接続チェックエラー:', err);
      setError('接続チェック中にエラーが発生しました');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Chip
        label="DB接続確認中..."
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  const statusColor = isConnected ? 'success' : 'error';
  const statusIcon = isConnected ? <ConnectedIcon /> : <DisconnectedIcon />;
  const statusText = isConnected ? 'DB接続済み' : 'DB未接続';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={statusIcon}
          label={statusText}
          color={statusColor}
          size="small"
          variant="filled"
          sx={{ fontSize: '0.75rem' }}
        />
        {showDetails && (
          <IconButton
            size="small"
            onClick={() => setShowInfo(!showInfo)}
            sx={{ ml: 0.5 }}
          >
            {showInfo ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {showDetails && (
        <Collapse in={showInfo}>
          <Alert
            severity={isConnected ? 'success' : 'warning'}
            sx={{ mt: 1, fontSize: '0.875rem' }}
          >
            <AlertTitle sx={{ fontSize: '0.875rem' }}>
              {isConnected ? 'Supabaseデータベース接続' : 'データベース接続なし'}
            </AlertTitle>
            {isConnected ? (
              <Typography variant="body2">
                Supabaseデータベースに正常に接続されています。
                フォームからデータを登録・取得できます。
              </Typography>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Supabaseデータベースに接続できません。以下を確認してください：
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li>環境変数 REACT_APP_SUPABASE_URL が設定されているか</li>
                  <li>環境変数 REACT_APP_SUPABASE_ANON_KEY が設定されているか</li>
                  <li>Supabaseプロジェクトが稼働しているか</li>
                  <li>ネットワーク接続が正常か</li>
                </ul>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  現在はモックデータを使用しています。
                </Typography>
              </Box>
            )}
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                エラー: {error}
              </Typography>
            )}
          </Alert>
        </Collapse>
      )}
    </Box>
  );
};

export default SupabaseStatus;