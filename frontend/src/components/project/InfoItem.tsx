import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, SxProps, Theme, MenuItem, Select, SelectChangeEvent } from '@mui/material';

interface InfoItemProps {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
  editMode?: boolean;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  select?: boolean;
  selectOptions?: Array<{ value: string; label: string }>;
}

const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value = '',
  icon,
  sx = {},
  editMode = false,
  onChange,
  fullWidth = false,
  select = false,
  selectOptions = []
}) => {
  const [localValue, setLocalValue] = useState<string>(String(value || ''));

  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<{ value: unknown }> | SelectChangeEvent<string>) => {
    const newValue = String(e.target.value || '');
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mb: 2,
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.secondary', mr: 1, mt: editMode ? 3 : 0.5 }}>
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        {editMode ? (
          select ? (
            <Select
              value={localValue}
              onChange={handleChange}
              fullWidth={fullWidth}
              size="small"
              sx={{ mt: 0.5 }}
            >
              {selectOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <TextField
              value={localValue}
              onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
              variant="outlined"
              size="small"
              fullWidth={fullWidth}
              sx={{ mt: 0.5 }}
            />
          )
        ) : (
          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
            {value || '---'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default InfoItem;
