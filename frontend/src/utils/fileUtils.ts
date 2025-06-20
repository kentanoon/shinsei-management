/**
 * ファイル関連のユーティリティ関数
 */

import { FILE_UPLOAD } from '../constants';

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * ファイルのバリデーション
 */
export const validateFile = (file: File): string | null => {
  // ファイルサイズチェック
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    return 'ファイルサイズが上限を超えています';
  }
  
  // ファイル形式チェック
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
    return 'サポートされていないファイル形式です';
  }
  
  return null;
};

/**
 * ファイル拡張子を取得
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * ファイル名から拡張子を除去
 */
export const removeFileExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '');
};

/**
 * MIMEタイプからファイル種別を判定
 */
export const getFileTypeLabel = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'JPEG画像',
    'image/png': 'PNG画像',
    'image/gif': 'GIF画像',
    'text/plain': 'テキスト',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
  };
  
  return typeMap[mimeType] || 'その他';
};