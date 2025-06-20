/**
 * 郵便番号入力フィールドコンポーネント
 * 住所の自動入力機能付き
 */

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search as SearchIcon, MyLocation as LocationIcon } from '@mui/icons-material';

interface AddressInfo {
  prefecture: string;
  city: string;
  town: string;
  full_address: string;
}

interface PostalCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressInfo) => void;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
}

const PostalCodeField: React.FC<PostalCodeFieldProps> = ({
  value,
  onChange,
  onAddressSelect,
  disabled = false,
  error,
  helperText,
  label = "郵便番号",
  placeholder = "例：123-4567",
  required = false,
  fullWidth = true
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);

  // 郵便番号のフォーマット
  const formatPostalCode = (input: string): string => {
    // 数字のみ抽出
    const numbers = input.replace(/[^0-9]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`;
    }
  };

  // 郵便番号のバリデーション
  const isValidPostalCode = (code: string): boolean => {
    const cleanCode = code.replace(/[^0-9]/g, '');
    return cleanCode.length === 7;
  };

  // 入力値の変更
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const formatted = formatPostalCode(input);
    onChange(formatted);
    
    // エラーをクリア
    if (searchError) {
      setSearchError(null);
    }
    
    // 住所情報をクリア
    if (addressInfo) {
      setAddressInfo(null);
    }
  };

  // 住所検索
  const searchAddress = async () => {
    if (!isValidPostalCode(value)) {
      setSearchError('7桁の郵便番号を入力してください');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const cleanCode = value.replace(/[^0-9]/g, '');
      const response = await fetch(`/api/v1/utils/postal-code/${cleanCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('該当する住所が見つかりませんでした');
        } else {
          throw new Error('住所の検索に失敗しました');
        }
      }

      const data = await response.json();
      const addressInfo: AddressInfo = {
        prefecture: data.prefecture,
        city: data.city,
        town: data.town,
        full_address: data.full_address
      };

      setAddressInfo(addressInfo);
      
      // 親コンポーネントに住所情報を通知
      if (onAddressSelect) {
        onAddressSelect(addressInfo);
      }

    } catch (err: any) {
      setSearchError(err.message || '住所の検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  // Enter キーで検索
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchAddress();
    }
  };

  // 自動検索（7桁入力完了時）
  useEffect(() => {
    if (isValidPostalCode(value) && !isSearching && !addressInfo) {
      const timer = setTimeout(() => {
        searchAddress();
      }, 500); // 500ms後に自動検索

      return () => clearTimeout(timer);
    }
  }, [value, isSearching, addressInfo]);

  const showError = error || searchError;
  const showHelperText = helperText || searchError;

  return (
    <Box>
      <TextField
        label={label}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        error={!!showError}
        helperText={showHelperText}
        placeholder={placeholder}
        required={required}
        fullWidth={fullWidth}
        inputProps={{
          maxLength: 8, // "123-4567" の形式
          pattern: '[0-9]{3}-[0-9]{4}'
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <Tooltip title="住所を検索">
                  <IconButton
                    onClick={searchAddress}
                    disabled={disabled || !isValidPostalCode(value)}
                    size="small"
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          )
        }}
      />

      {addressInfo && (
        <Alert 
          severity="success" 
          sx={{ mt: 1 }}
          icon={<LocationIcon />}
          action={
            <Button 
              size="small" 
              onClick={() => setAddressInfo(null)}
            >
              閉じる
            </Button>
          }
        >
          <Box>
            <strong>検索結果:</strong>
            <br />
            {addressInfo.full_address}
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default PostalCodeField;