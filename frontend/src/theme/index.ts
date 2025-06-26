/**
 * Material-UI テーマ設定
 * アクセシビリティとユーザビリティに配慮したデザインシステム
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// カラーパレット定義
const palette = {
  primary: {
    main: '#3D5B81', // カスタムブルー
    light: '#9BC0D9',
    dark: '#293241',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#EE6B4D', // カスタムオレンジレッド
    light: '#9BC0D9', // ライトブルーを使用
    dark: '#293241', // ダークグレーを使用
    contrastText: '#ffffff',
  },
  success: {
    main: '#9BC0D9', // ライトブルーを成功色に
    light: '#DFFBFC', // 極薄ブルーを使用
    dark: '#3D5B81', // ダークブルーを使用
    contrastText: '#293241',
  },
  warning: {
    main: '#EE6B4D', // オレンジレッド
    light: '#9BC0D9', // ライトブルー
    dark: '#293241', // ダークグレー
    contrastText: '#ffffff',
  },
  error: {
    main: '#EE6B4D', // オレンジレッド
    light: '#9BC0D9', // ライトブルー
    dark: '#293241', // ダークグレー
    contrastText: '#ffffff',
  },
  info: {
    main: '#3D5B81', // カスタムブルー
    light: '#9BC0D9',
    dark: '#293241',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#DFFBFC', // 極薄ブルー
    100: '#9BC0D9', // ライトブルー
    200: '#9BC0D9',
    300: '#9BC0D9',
    400: '#3D5B81', // ダークブルー
    500: '#3D5B81',
    600: '#293241', // ダークグレー
    700: '#293241',
    800: '#293241',
    900: '#293241',
  },
  background: {
    default: '#DFFBFC', // カスタム薄いブルー背景
    paper: '#DFFBFC', // カードや紙要素も同じベースカラー
  },
  text: {
    primary: '#293241', // カスタムダークグレー
    secondary: 'rgba(41, 50, 65, 0.7)',
    disabled: 'rgba(41, 50, 65, 0.38)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // ベースカラーの上に半透明の白
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0px 2px 8px rgba(61, 91, 129, 0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0px 4px 16px rgba(61, 91, 129, 0.15)',
        },
      },
    },
  },
  
  // ペーパーコンポーネント
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // ベースカラーを活かす半透明
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
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