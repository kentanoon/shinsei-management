import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { FILE_UPLOAD } from '../../constants';
import { validateFile, formatFileSize, removeFileExtension } from '../../utils/fileUtils';

interface TemplateUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (templateData: TemplateUploadData) => Promise<void>;
  categories: string[];
  types: string[];
}

interface TemplateUploadData {
  name: string;
  description: string;
  category: string;
  type: string;
  file: File;
}

const TemplateUploadDialog: React.FC<TemplateUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  categories,
  types,
}) => {
  const [formData, setFormData] = useState<Partial<TemplateUploadData>>({
    name: '',
    description: '',
    category: '',
    type: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleInputChange = (field: keyof TemplateUploadData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // ファイル名からテンプレート名を推測
    if (!formData.name) {
      const nameWithoutExtension = removeFileExtension(file.name);
      setFormData(prev => ({
        ...prev,
        name: nameWithoutExtension,
      }));
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile || !formData.name || !formData.category || !formData.type) {
      setError('必須項目を入力してください');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onUpload({
        ...formData as TemplateUploadData,
        file: selectedFile,
      });
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFormData({
        name: '',
        description: '',
        category: '',
        type: '',
      });
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };


  const isFormValid = selectedFile && formData.name && formData.category && formData.type;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>テンプレートのアップロード</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ファイル選択エリア */}
          <Box
            sx={{
              border: 2,
              borderColor: dragOver ? 'primary.main' : 'grey.300',
              borderStyle: 'dashed',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: dragOver ? 'primary.light' : 'grey.50',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <Box>
                <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">{selectedFile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
                <Chip 
                  label={selectedFile.type}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  ファイルをドラッグ&ドロップ
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  または
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                >
                  ファイルを選択
                  <input
                    type="file"
                    hidden
                    accept={FILE_UPLOAD.ALLOWED_TYPES.join(',')}
                    onChange={handleFileInputChange}
                  />
                </Button>
              </Box>
            )}
          </Box>

          {/* フォーム */}
          <TextField
            label="テンプレート名"
            required
            fullWidth
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />

          <TextField
            label="説明"
            multiline
            rows={3}
            fullWidth
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl required fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={formData.category || ''}
                label="カテゴリ"
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl required fullWidth>
              <InputLabel>種類</InputLabel>
              <Select
                value={formData.type || ''}
                label="種類"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                アップロード中...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || uploading}
          startIcon={<UploadIcon />}
        >
          アップロード
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateUploadDialog;