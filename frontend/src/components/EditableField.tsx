import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface EditableFieldProps {
  label: string;
  value: any;
  onSave: (value: any) => Promise<void>;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiline';
  options?: { value: any; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder,
  required = false,
  disabled = false,
  multiline = false,
  rows = 1,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (required && !editValue) {
      return;
    }

    setLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      // エラーはuseErrorHandlerで処理される
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return '---';
    }
    
    if (type === 'boolean') {
      return val ? 'はい' : 'いいえ';
    }
    
    if (type === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    
    if (type === 'date' && val) {
      return new Date(val).toLocaleDateString('ja-JP');
    }

    return val;
  };

  if (!isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ flexGrow: 1, minHeight: '24px' }}>
          {formatDisplayValue(value)}
        </Typography>
        {!disabled && (
          <IconButton
            size="small"
            onClick={handleEdit}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  const renderEditField = () => {
    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              value={editValue || ''}
              label={label}
              onChange={(e) => setEditValue(e.target.value)}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!editValue}
                onChange={(e) => setEditValue(e.target.checked)}
              />
            }
            label={label}
          />
        );

      case 'multiline':
        return (
          <TextField
            fullWidth
            multiline
            rows={rows}
            label={label}
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            size="small"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            type={type}
            label={label}
            value={editValue || ''}
            onChange={(e) => setEditValue(
              type === 'number' 
                ? (e.target.value ? parseFloat(e.target.value) : '')
                : e.target.value
            )}
            placeholder={placeholder}
            required={required}
            size="small"
            InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        {renderEditField()}
      </Box>
      <IconButton
        size="small"
        onClick={handleSave}
        disabled={loading || (required && !editValue)}
        color="primary"
      >
        <SaveIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleCancel}
        disabled={loading}
      >
        <CancelIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default EditableField;