/**
 * インライン編集フィールドコンポーネント
 * テーブルセルでのリアルタイム編集を実現
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Box,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { ProjectStatus } from '../types/project';

interface InlineEditFieldProps {
  value: string | number | null | undefined;
  field: string;
  onSave: (field: string, value: any) => Promise<void>;
  type?: 'text' | 'select' | 'number' | 'date';
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  field,
  onSave,
  type = 'text',
  options = [],
  disabled = false,
  placeholder,
  maxLength,
  multiline = false,
  rows = 1
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' && inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSave(field, editValue);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setEditValue(event.target.value);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    setEditValue(newValue);
  };

  const handleBlur = () => {
    // Save on blur unless there's an error
    if (!error && editValue !== value) {
      handleSave();
    }
  };

  const displayValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>未設定</span>;
    }

    if (type === 'select' && options.length > 0) {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : String(value);
    }

    return String(value);
  };

  if (!isEditing) {
    return (
      <Box
        onClick={handleEdit}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          padding: '8px',
          borderRadius: '4px',
          minHeight: '20px',
          display: 'flex',
          alignItems: 'center',
          '&:hover': disabled ? {} : {
            backgroundColor: '#f5f5f5',
            '& .edit-icon': {
              opacity: 1
            }
          },
          position: 'relative'
        }}
      >
        {displayValue()}
        {!disabled && (
          <IconButton
            size="small"
            className="edit-icon"
            sx={{
              opacity: 0,
              transition: 'opacity 0.2s',
              marginLeft: 'auto',
              padding: '2px'
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  const renderEditControl = () => {
    if (type === 'select') {
      return (
        <FormControl fullWidth size="small">
          <Select
            value={String(editValue)}
            onChange={handleSelectChange}
            onBlur={handleBlur}
            autoFocus
            disabled={isLoading}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        inputRef={inputRef}
        value={editValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        fullWidth
        size="small"
        type={type === 'number' ? 'number' : 'text'}
        placeholder={placeholder}
        disabled={isLoading}
        multiline={multiline}
        rows={rows}
        inputProps={{
          maxLength: maxLength
        }}
        error={!!error}
        helperText={error}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        {renderEditControl()}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {isLoading ? (
          <CircularProgress size={16} />
        ) : (
          <>
            <Tooltip title="保存">
              <IconButton size="small" onClick={handleSave} color="primary">
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="キャンセル">
              <IconButton size="small" onClick={handleCancel}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
};

// プロジェクトステータス用の特別なコンポーネント
export const InlineStatusField: React.FC<Omit<InlineEditFieldProps, 'type' | 'options'>> = (props) => {
  const statusOptions = [
    { value: '事前相談', label: '事前相談' },
    { value: '受注', label: '受注' },
    { value: '申請作業', label: '申請作業' },
    { value: '審査中', label: '審査中' },
    { value: '配筋検査待ち', label: '配筋検査待ち' },
    { value: '中間検査待ち', label: '中間検査待ち' },
    { value: '完了検査待ち', label: '完了検査待ち' },
    { value: '完了', label: '完了' },
    { value: '失注', label: '失注' }
  ];

  return (
    <InlineEditField
      {...props}
      type="select"
      options={statusOptions}
    />
  );
};

export default InlineEditField;