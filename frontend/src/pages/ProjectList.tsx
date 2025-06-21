import React, { useState, useEffect } from 'react';
import { Pagination, Box, FormControl, InputLabel, Select, MenuItem, Button, Menu } from '@mui/material';
import { GetApp as GetAppIcon, ArrowDropDown } from '@mui/icons-material';
import { getStatusColor } from '../utils/statusUtils';
import { projectApi } from '../services/api';

const statusTabs = [
  { label: 'すべて', value: null },
  { label: '事前相談', value: '事前相談' },
  { label: '受注', value: '受注' },
  { label: '申請作業', value: '申請作業' },
  { label: '審査中', value: '審査中' },
  { label: '配筋検査待ち', value: '配筋検査待ち' },
  { label: '中間検査待ち', value: '中間検査待ち' },
  { label: '完了検査待ち', value: '完了検査待ち' },
  { label: '完了', value: '完了' },
];

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const selectedStatus = statusTabs[currentTab].value;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let response: any;
        
        // 検索クエリがある場合は検索APIを使用
        if (searchQuery.trim()) {
          response = await projectApi.searchProjects(searchQuery.trim());
          setProjects(response.projects || []);
          setTotalCount(response.count || 0);
        } else {
          // 通常のプロジェクト一覧取得
          const params = {
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            ...(selectedStatus && { status: selectedStatus }),
          };
          response = await projectApi.getProjects(params);
          setProjects(response.projects || []);
          setTotalCount(response.total || 0);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    // 検索クエリがある場合は少し遅延を入れる（デバウンス効果）
    const timeoutId = setTimeout(() => {
      fetchProjects();
    }, searchQuery.trim() ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, selectedStatus, searchQuery]);

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
    setCurrentPage(1); // タブ変更時はページを1に戻す
    setSearchQuery(''); // タブ変更時は検索をクリア
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // 検索時はページを1に戻す
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event: any) => {
    setItemsPerPage(event.target.value);
    setCurrentPage(1); // 表示件数変更時はページを1に戻す
  };

  const getStatusColorHex = (status: string) => {
    const statusColor = getStatusColor(status);
    // Convert Material-UI color names to hex colors
    const colorMap: Record<string, string> = {
      'info': '#6c757d',
      'primary': '#007bff',
      'warning': '#fd7e14',
      'secondary': '#ffc107',
      'success': '#28a745',
      'error': '#dc3545',
      'default': '#6c757d'
    };
    return colorMap[statusColor] || '#6c757d';
  };

  const exportToCSV = () => {
    const headers = ['管理番号', '案件名', 'ステータス', '作成日', '更新日'];
    const csvData = projects.map(project => [
      project.project_code || '',
      project.project_name || 'プロジェクト名未設定',
      project.status || '',
      project.input_date ? new Date(project.input_date).toLocaleDateString() : '---',
      new Date(project.updated_at || project.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `案件一覧_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuAnchor(null);
  };

  const exportToJSON = () => {
    const jsonData = projects.map(project => ({
      管理番号: project.project_code || '',
      案件名: project.project_name || 'プロジェクト名未設定',
      ステータス: project.status || '',
      作成日: project.input_date ? new Date(project.input_date).toLocaleDateString() : '---',
      更新日: new Date(project.updated_at || project.created_at).toLocaleDateString(),
      顧客情報: project.customer,
      敷地情報: project.site,
      建物情報: project.building,
      財務情報: project.financial,
      スケジュール: project.schedule
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `案件一覧_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuAnchor(null);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  // サーバーサイドでフィルタリングされたプロジェクトを表示
  const displayProjects = projects;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>読み込み中...</h2>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#495057' }}>📋 案件管理</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            endIcon={<ArrowDropDown />}
            onClick={handleExportClick}
            disabled={projects.length === 0}
            sx={{
              borderColor: '#28a745',
              color: '#28a745',
              '&:hover': {
                borderColor: '#218838',
                backgroundColor: '#f8f9fa'
              }
            }}
          >
            エクスポート
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={exportToCSV}>CSV形式</MenuItem>
            <MenuItem onClick={exportToJSON}>JSON形式</MenuItem>
          </Menu>
          
          <button 
            onClick={() => window.location.href = '/projects/new'}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + 新規案件
          </button>
        </div>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="案件名、管理番号で検索..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* ステータスタブ */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {statusTabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            style={{
              background: currentTab === index ? '#007bff' : '#ffffff',
              color: currentTab === index ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* プロジェクト一覧 */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {displayProjects.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
            該当する案件がありません
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>管理番号</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>案件名</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>ステータス</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>作成日</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>更新日</th>
                </tr>
              </thead>
              <tbody>
                {displayProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    style={{ 
                      borderBottom: '1px solid #dee2e6',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => window.location.href = `/projects/${project.project_code}`}
                  >
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{project.project_code}</td>
                    <td style={{ padding: '1rem' }}>{project.project_name || 'プロジェクト名未設定'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: getStatusColorHex(project.status),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.8rem'
                      }}>
                        {project.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6c757d' }}>
                      {project.input_date ? new Date(project.input_date).toLocaleDateString() : '---'}
                    </td>
                    <td style={{ padding: '1rem', color: '#6c757d' }}>
                      {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {!searchQuery.trim() && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>表示件数</InputLabel>
              <Select
                value={itemsPerPage}
                label="表示件数"
                onChange={handleItemsPerPageChange}
              >
                <MenuItem value={10}>10件</MenuItem>
                <MenuItem value={20}>20件</MenuItem>
                <MenuItem value={50}>50件</MenuItem>
                <MenuItem value={100}>100件</MenuItem>
              </Select>
            </FormControl>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} / 総件数: {totalCount}
            </div>
          </Box>
          
          <Pagination
            count={Math.ceil(totalCount / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      {/* 検索結果の場合の表示 */}
      {searchQuery.trim() && (
        <Box sx={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            「{searchQuery}」の検索結果: {totalCount}件
          </div>
        </Box>
      )}
    </div>
  );
};

export default ProjectList;