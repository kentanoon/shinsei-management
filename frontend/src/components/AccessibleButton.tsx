/**
 * アクセシビリティを強化したボタンコンポーネント
 */

import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
  Box,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
  onConfirm?: () => void;
  minTouchSize?: boolean;
  ariaDescribedBy?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  loading = false,
  loadingText,
  tooltip,
  confirmAction = false,
  confirmMessage = 'この操作を実行しますか？',
  onConfirm,
  minTouchSize = true,
  ariaDescribedBy,
  children,
  onClick,
  disabled,
  startIcon,
  endIcon,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (confirmAction && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    if (confirmAction && showConfirm && onConfirm) {
      onConfirm();
      setShowConfirm(false);
      return;
    }

    if (onClick) {
      onClick(event);
    }
  };

  const handleBlur = () => {
    if (showConfirm) {
      setShowConfirm(false);
    }
  };

  const isDisabled = disabled || loading;

  const buttonContent = (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      onBlur={handleBlur}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={loading ? undefined : endIcon}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-label={loading && loadingText ? loadingText : undefined}
      sx={{
        // 最小タッチサイズの確保（44px）
        ...(minTouchSize && {
          minHeight: 44,
          minWidth: 44,
        }),
        // ローディング状態のスタイル
        ...(loading && {
          pointerEvents: 'none',
          opacity: 0.7,
        }),
        // 確認状態のスタイル
        ...(showConfirm && {
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.warning.dark,
          },
        }),
        // フォーカス時のアウトライン強化
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        // ホバー時のアニメーション
        transition: 'all 0.2s ease-in-out',
        '&:hover:not(:disabled)': {
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[4],
        },
        '&:active:not(:disabled)': {
          transform: 'translateY(0)',
        },
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading && loadingText ? loadingText : children}
        {showConfirm && ` - ${confirmMessage}`}
      </Box>
    </Button>
  );

  if (tooltip && !isDisabled) {
    return (
      <Tooltip 
        title={tooltip}
        arrow
        placement="top"
        enterDelay={1000}
        leaveDelay={200}
      >
        <span>{buttonContent}</span>
      </Tooltip>
    );
  }

  return buttonContent;
};

export default AccessibleButton;