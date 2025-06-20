import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface TemplateFilters {
  searchQuery: string;
  category: string;
  type: string;
  status: string;
}

interface TemplateFiltersProps {
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
  onClearFilters: () => void;
  categories: string[];
  types: string[];
  statuses: string[];
}

const TemplateFiltersComponent: React.FC<TemplateFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  categories,
  types,
  statuses,
}) => {
  const handleFilterChange = (field: keyof TemplateFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="検索"
          placeholder="テンプレート名で検索..."
          value={filters.searchQuery}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>カテゴリ</InputLabel>
          <Select
            value={filters.category}
            label="カテゴリ"
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <MenuItem value="">すべて</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>種類</InputLabel>
          <Select
            value={filters.type}
            label="種類"
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <MenuItem value="">すべて</MenuItem>
            {types.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>ステータス</InputLabel>
          <Select
            value={filters.status}
            label="ステータス"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">すべて</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            size="small"
          >
            フィルターをクリア
          </Button>
        )}
      </Box>

      {hasActiveFilters && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.searchQuery && (
            <Chip
              label={`検索: ${filters.searchQuery}`}
              onDelete={() => handleFilterChange('searchQuery', '')}
              size="small"
            />
          )}
          {filters.category && (
            <Chip
              label={`カテゴリ: ${filters.category}`}
              onDelete={() => handleFilterChange('category', '')}
              size="small"
            />
          )}
          {filters.type && (
            <Chip
              label={`種類: ${filters.type}`}
              onDelete={() => handleFilterChange('type', '')}
              size="small"
            />
          )}
          {filters.status && (
            <Chip
              label={`ステータス: ${filters.status}`}
              onDelete={() => handleFilterChange('status', '')}
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default TemplateFiltersComponent;