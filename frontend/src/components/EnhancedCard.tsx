/**
 * アクセシビリティとユーザビリティを強化したカードコンポーネント
 */

import React from 'react';
import {
  Card,
  CardProps,
  CardContent,
  CardActions,
  Typography,
  Box,
  Skeleton,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedCardProps extends Omit<CardProps, 'children'> {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  hoverable?: boolean;
  elevation?: number;
  interactive?: boolean;
  onFavorite?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  isFavorite?: boolean;
  status?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  subtitle,
  loading = false,
  children,
  actions,
  hoverable = true,
  elevation = 1,
  interactive = false,
  onFavorite,
  onShare,
  onMore,
  isFavorite = false,
  status = 'default',
  sx,
  ...props
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return 'transparent';
    }
  };

  const cardVariants = {
    initial: { 
      scale: 1, 
      y: 0,
      boxShadow: theme.shadows[elevation],
    },
    hover: { 
      scale: hoverable ? 1.02 : 1,
      y: hoverable ? -4 : 0,
      boxShadow: hoverable ? theme.shadows[Math.min(elevation + 2, 24)] : theme.shadows[elevation],
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const
      }
    },
    tap: {
      scale: interactive ? 0.98 : 1,
      transition: {
        duration: 0.1,
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  const statusBarVariants = {
    initial: { width: 0 },
    animate: { 
      width: '100%',
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
        delay: 0.1
      }
    }
  };

  if (loading) {
    return (
      <Card
        elevation={elevation}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          ...sx,
        }}
        {...props}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={120} />
          </Box>
        </CardContent>
        {actions && (
          <CardActions>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
          </CardActions>
        )}
      </Card>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          position: 'relative',
          backgroundColor: 'background.paper',
          transition: 'none', // motion.divで制御するため無効化
          cursor: interactive ? 'pointer' : 'default',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          ...sx,
        }}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        {/* ステータスバー */}
        {status !== 'default' && (
          <motion.div
            variants={statusBarVariants}
            initial="initial"
            animate="animate"
            style={{
              height: 4,
              backgroundColor: getStatusColor(),
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          />
        )}

        {/* ヘッダー */}
        {(title || subtitle || onFavorite || onShare || onMore) && (
          <Box sx={{ 
            p: 2, 
            pb: children ? 1 : 2,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && (
                <Typography 
                  variant="h6" 
                  component="h2"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: subtitle ? 0.5 : 0,
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.4 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* アクションアイコン */}
            {(onFavorite || onShare || onMore) && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                {onFavorite && (
                  <Tooltip title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavorite();
                      }}
                      sx={{ 
                        color: isFavorite ? theme.palette.error.main : 'text.secondary',
                        '&:hover': {
                          color: theme.palette.error.main,
                          backgroundColor: alpha(theme.palette.error.main, 0.08),
                        }
                      }}
                      aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onShare && (
                  <Tooltip title="共有">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                      }}
                      sx={{ color: 'text.secondary' }}
                      aria-label="共有"
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onMore && (
                  <Tooltip title="その他のオプション">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMore();
                      }}
                      sx={{ color: 'text.secondary' }}
                      aria-label="その他のオプション"
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* コンテンツ */}
        {children && (
          <CardContent sx={{ 
            pt: (title || subtitle) ? 0 : 2,
            '&:last-child': { pb: actions ? 1 : 2 }
          }}>
            {children}
          </CardContent>
        )}

        {/* アクション */}
        {actions && (
          <CardActions sx={{ px: 2, pb: 2 }}>
            {actions}
          </CardActions>
        )}
      </Card>
    </motion.div>
  );
};

export default EnhancedCard;