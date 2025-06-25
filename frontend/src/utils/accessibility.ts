/**
 * アクセシビリティユーティリティ関数
 */

// カラーコントラスト比計算
export const calculateContrast = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// HEXカラーをRGBに変換
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// WCAG AA準拠のコントラスト比チェック（4.5:1以上）
export const isAccessibleContrast = (color1: string, color2: string): boolean => {
  return calculateContrast(color1, color2) >= 4.5;
};

// WCAG AAA準拠のコントラスト比チェック（7:1以上）
export const isHighContrastAccessible = (color1: string, color2: string): boolean => {
  return calculateContrast(color1, color2) >= 7;
};

// スクリーンリーダー用のテキスト生成
export const generateAriaLabel = (
  action: string,
  target: string,
  status?: string,
  additionalInfo?: string
): string => {
  let label = `${action} ${target}`;
  
  if (status) {
    label += `, 現在の状態: ${status}`;
  }
  
  if (additionalInfo) {
    label += `, ${additionalInfo}`;
  }
  
  return label;
};

// キーボードナビゲーション用のイベントハンドラー
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onEnter?.();
      break;
    case 'Escape':
      event.preventDefault();
      onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      onArrowDown?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      onArrowLeft?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      onArrowRight?.();
      break;
  }
};

// フォーカス管理
export const focusElement = (selector: string, delay: number = 0): void => {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, delay);
};

// フォーカストラップ（モーダル内でのフォーカス制御）
export const createFocusTrap = (containerElement: HTMLElement) => {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  containerElement.addEventListener('keydown', trapFocus);

  return {
    activate: () => firstElement?.focus(),
    deactivate: () => containerElement.removeEventListener('keydown', trapFocus),
  };
};

// メディアクエリによるユーザー設定の検出
export const getUserPreferences = () => {
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersLargeText: window.matchMedia('(min-resolution: 2dppx)').matches,
  };
};

// 音声読み上げ用のテキスト最適化
export const optimizeForScreenReader = (text: string): string => {
  return text
    // 数字を読みやすく
    .replace(/(\d+)/g, (match) => match.split('').join(' '))
    // 記号を説明的に
    .replace(/&/g, ' アンド ')
    .replace(/@/g, ' アットマーク ')
    .replace(/#/g, ' ハッシュ ')
    .replace(/\$/g, ' ドル ')
    .replace(/%/g, ' パーセント ')
    // 連続する空白を整理
    .replace(/\s+/g, ' ')
    .trim();
};

// ランドマーク生成
export const generateLandmarkProps = (role: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary') => {
  return {
    role,
    'aria-label': getLandmarkLabel(role),
  };
};

const getLandmarkLabel = (role: string): string => {
  const labels = {
    main: 'メインコンテンツ',
    navigation: 'ナビゲーション',
    banner: 'ヘッダー',
    contentinfo: 'フッター',
    complementary: 'サイドバー',
  };
  return labels[role as keyof typeof labels] || role;
};

// アクセシビリティ検証
export const validateAccessibility = (element: HTMLElement): string[] => {
  const issues: string[] = [];
  
  // 画像のalt属性チェック
  const images = element.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`画像 ${index + 1}: alt属性またはaria-labelが必要です`);
    }
  });
  
  // ボタンのラベルチェック
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(`ボタン ${index + 1}: ラベルが必要です`);
    }
  });
  
  // フォーム要素のラベルチェック
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.id;
    const hasLabel = id && element.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(`フォーム要素 ${index + 1}: ラベルが必要です`);
    }
  });
  
  return issues;
};