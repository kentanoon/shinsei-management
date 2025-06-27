import React, { useState, useEffect } from 'react';
import { AttachMoney as AttachMoneyIcon, BarChart as BarChartIcon, Assignment as AssignmentIcon, AccountBalance as AccountBalanceIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const FinancialPage: React.FC = () => {
  const theme = useTheme();
  const [financials, setFinancials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        // TODO: FinancialAPI実装後にAPIレイヤーを使用
        console.log('Financial API not yet implemented - showing sample data');
        setFinancials([]);
      } catch (error) {
        console.error('Error fetching financials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, []);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '---';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const getTotalContract = () => {
    return financials.reduce((sum, f) => sum + (f.contract_price || 0), 0);
  };

  const getTotalSettlement = () => {
    return financials.reduce((sum, f) => sum + (f.settlement_amount || 0), 0);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>読み込み中...</h2>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: theme.palette.text.secondary, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AttachMoneyIcon sx={{ fontSize: '2rem' }} />
        財務管理
      </h1>
      
      {/* 財務サマリー */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartIcon />
            総契約金額
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: theme.palette.primary.main }}>
            {formatCurrency(getTotalContract())}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AccountBalanceIcon sx={{ color: 'success.main' }} />
            総決済金額
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: theme.palette.success.main }}>
            {formatCurrency(getTotalSettlement())}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AssignmentIcon />
            管理案件数
          </h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: theme.palette.info.main }}>
            {financials.length}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScheduleIcon sx={{ color: 'warning.main' }} />
            未決済金額
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: theme.palette.warning.main }}>
            {formatCurrency(getTotalContract() - getTotalSettlement())}
          </p>
        </div>
      </div>

      {/* 財務データ一覧 */}
      <div style={{
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: theme.palette.text.secondary, marginBottom: '1rem' }}>財務データ一覧</h2>
        
        {financials.length === 0 ? (
          <p style={{ color: theme.palette.text.secondary, textAlign: 'center', padding: '2rem' }}>
            財務データが登録されていません
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>プロジェクトID</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>契約金額</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>見積金額</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>決済金額</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>決済日</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>決済担当者</th>
                </tr>
              </thead>
              <tbody>
                {financials.map((financial) => (
                  <tr key={financial.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{financial.project_id}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatCurrency(financial.contract_price)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatCurrency(financial.estimate_amount)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <span style={{
                        color: financial.settlement_amount ? theme.palette.success.main : theme.palette.text.secondary
                      }}>
                        {formatCurrency(financial.settlement_amount)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {financial.settlement_date ? 
                        new Date(financial.settlement_date).toLocaleDateString() : 
                        '---'
                      }
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {financial.settlement_staff || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 提出書類状況 */}
      <div style={{
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ color: theme.palette.text.secondary, marginBottom: '1rem' }}>提出書類状況</h2>
        
        {financials.length === 0 ? (
          <p style={{ color: theme.palette.text.secondary, textAlign: 'center', padding: '2rem' }}>
            データがありません
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>プロジェクトID</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>交付申請書</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>検査予定表</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>基礎伏図</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>金物図</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>請求書</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>省エネ計算書</th>
                </tr>
              </thead>
              <tbody>
                {financials.map((financial) => {
                  const getStatusBadge = (hasDocument: boolean) => (
                    <span style={{
                      background: hasDocument ? theme.palette.success.main : theme.palette.error.main,
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '15px',
                      fontSize: '0.7rem'
                    }}>
                      {hasDocument ? '提出済' : '未提出'}
                    </span>
                  );

                  return (
                    <tr key={financial.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{financial.project_id}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_permit_application)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_inspection_schedule)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_foundation_plan)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_hardware_plan)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_invoice)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(financial.has_energy_calculation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialPage;