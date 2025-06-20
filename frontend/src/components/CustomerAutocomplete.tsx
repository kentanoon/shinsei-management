/**
 * 顧客検索オートコンプリートコンポーネント
 * 既存顧客の選択と情報自動入力
 */

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import { debounce } from 'lodash';
import { Person as PersonIcon, Business as BusinessIcon } from '@mui/icons-material';

interface CustomerInfo {
  id: number;
  owner_name: string;
  owner_kana?: string;
  owner_phone?: string;
  owner_address?: string;
  client_name?: string;
}

interface CustomerAutocompleteProps {
  value?: CustomerInfo | null;
  onChange: (customer: CustomerInfo | null) => void;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  helperText,
  label = "顧客検索",
  placeholder = "顧客名、フリガナ、発注者名で検索",
  required = false,
  fullWidth = true
}) => {
  const [options, setOptions] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // デバウンス検索関数
  const debouncedSearch = debounce(async (query: string) => {
    if (query.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/utils/customers/search?q=${encodeURIComponent(query)}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setOptions(data.results || []);
      } else {
        console.error('顧客検索エラー:', response.statusText);
        setOptions([]);
      }
    } catch (err) {
      console.error('顧客検索エラー:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // 入力値の変更時
  useEffect(() => {
    if (inputValue) {
      debouncedSearch(inputValue);
    } else {
      setOptions([]);
      setLoading(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue]);

  // カスタムオプションレンダリング
  const renderOption = (props: any, option: CustomerInfo) => (
    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
        {option.client_name ? <BusinessIcon /> : <PersonIcon />}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" component="div">
          {option.owner_name}
          {option.owner_kana && (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              ({option.owner_kana})
            </Typography>
          )}
        </Typography>
        {option.client_name && (
          <Typography variant="body2" color="text.secondary">
            {option.client_name}
          </Typography>
        )}
        {option.owner_phone && (
          <Typography variant="caption" color="text.secondary">
            TEL: {option.owner_phone}
          </Typography>
        )}
      </Box>
    </Box>
  );

  // 選択された値の表示
  const renderValue = (option: CustomerInfo) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 1, width: 24, height: 24, bgcolor: 'primary.main' }}>
          {option.client_name ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
        </Avatar>
        <span>{option.owner_name}</span>
        {option.client_name && (
          <Chip 
            label={option.client_name} 
            size="small" 
            sx={{ ml: 1 }} 
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: CustomerInfo) => option.owner_name}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={!!error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      loading={loading}
      loadingText="検索中..."
      noOptionsText={inputValue.length < 2 ? "2文字以上入力してください" : "該当する顧客が見つかりません"}
      disabled={disabled}
      fullWidth={fullWidth}
      filterOptions={(x) => x} // サーバーサイドフィルタリングを使用
      isOptionEqualToValue={(option, value) => option.id === value.id}
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
      freeSolo={false}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={renderValue(option)}
            size="small"
          />
        ))
      }
    />
  );
};

export default CustomerAutocomplete;