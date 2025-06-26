/**
 * Material-UI テーマ設定
 * アクセシビリティとユーザビリティに配慮したデザインシステム
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// カラーパレット定義
const palette = {
  primary: {
    main: '#1976d2', // 信頼性の高いブルー
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e', // アクセントカラー
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32', // 成功・完了状態
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02', // 注意・警告状態
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f', // エラー状態
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288d1', // 情報表示
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
};

// タイポグラフィ設定
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 300,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 400,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.6,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none' as const, // ボタンテキストの大文字変換を無効化
  },
};

// シャドウ設定（より自然な影）
const shadows = [
  'none',
  '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
  '0px 3px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.12)',
  '0px 10px 20px rgba(0, 0, 0, 0.15), 0px 3px 6px rgba(0, 0, 0, 0.10)',
  '0px 15px 25px rgba(0, 0, 0, 0.15), 0px 5px 10px rgba(0, 0, 0, 0.05)',
  '0px 20px 40px rgba(0, 0, 0, 0.1)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
  '0px 25px 50px rgba(0, 0, 0, 0.25)',
] as any;

// コンポーネントのカスタマイズ
const components: any = {
  // ボタンコンポーネント
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '10px 24px',
        minHeight: 44, // タッチフレンドリーなサイズ
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
        },
      },
      contained: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  
  // カードコンポーネント
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  
  // ペーパーコンポーネント
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  
  // チップコンポーネント
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        height: 32,
        fontSize: '0.8125rem',
      },
    },
  },
  
  // テキストフィールド
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.primary.light,
          },
        },
      },
    },
  },
  
  // アイコンボタン
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: 12,
        minWidth: 44,
        minHeight: 44,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },
  
  // ステッパー
  MuiStepper: {
    styleOverrides: {
      root: {
        padding: '24px 0',
      },
    },
  },
  
  // アプリバー
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: palette.text.primary,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  
  // タブ
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 48,
        textTransform: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
};

// ブレークポイント設定
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// スペーシング設定
const spacing = 8;

// テーマオプション
const themeOptions: ThemeOptions = {
  palette,
  typography,
  shadows,
  components,
  breakpoints,
  spacing,
  shape: {
    borderRadius: 8,
  },
};

// テーマを作成
export const theme = createTheme(themeOptions, jaJP);

// テーマ使用のヘルパー関数
export const getStatusColor = (status: string): keyof typeof palette => {
  const statusColorMap: Record<string, keyof typeof palette> = {
    '事前相談': 'info',
    '受注': 'primary',
    '申請作業': 'warning',
    '審査中': 'secondary',
    '配筋検査待ち': 'warning',
    '中間検査待ち': 'warning',
    '完了検査待ち': 'warning',
    '完了': 'success',
    '失注': 'error',
  };
  
  return statusColorMap[status] || 'grey';
};

export default theme;