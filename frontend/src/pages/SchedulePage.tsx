import React, { useState, useEffect } from 'react';
import { Build as BuildIcon, Sync as SyncIcon, CheckCircle as CheckCircleIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const SchedulePage: React.FC = () => {
  const theme = useTheme();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        // TODO: ScheduleAPI実装後にAPIレイヤーを使用
        console.log('Schedule API not yet implemented - showing sample data');
        setSchedules([]);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

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
        <CalendarIcon sx={{ fontSize: '2rem' }} />
        工程管理
      </h1>
      
      {/* 検査予定サマリー */}
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
            <BuildIcon />
            配筋検査予定
          </h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: theme.palette.warning.main }}>
            {schedules.filter(s => s.reinforcement_scheduled && !s.reinforcement_actual).length}
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
            <SyncIcon />
            中間検査予定
          </h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: theme.palette.primary.main }}>
            {schedules.filter(s => s.interim_scheduled && !s.interim_actual).length}
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
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            完了検査予定
          </h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: theme.palette.success.main }}>
            {schedules.filter(s => s.completion_scheduled && !s.completion_actual).length}
          </p>
        </div>
      </div>

      {/* 検査スケジュール一覧 */}
      <div style={{
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: theme.palette.text.secondary, marginBottom: '1rem' }}>検査スケジュール一覧</h2>
        
        {schedules.length === 0 ? (
          <p style={{ color: theme.palette.text.secondary, textAlign: 'center', padding: '2rem' }}>
            検査スケジュールが登録されていません
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>プロジェクトID</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>配筋検査</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>中間検査</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>完了検査</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>検査結果</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>{schedule.project_id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        {schedule.reinforcement_scheduled && (
                          <div style={{ fontSize: '0.9rem' }}>
                            予定: {new Date(schedule.reinforcement_scheduled).toLocaleDateString()}
                          </div>
                        )}
                        {schedule.reinforcement_actual && (
                          <div style={{ fontSize: '0.9rem', color: theme.palette.success.main }}>
                            実施: {new Date(schedule.reinforcement_actual).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        {schedule.interim_scheduled && (
                          <div style={{ fontSize: '0.9rem' }}>
                            予定: {new Date(schedule.interim_scheduled).toLocaleDateString()}
                          </div>
                        )}
                        {schedule.interim_actual && (
                          <div style={{ fontSize: '0.9rem', color: theme.palette.success.main }}>
                            実施: {new Date(schedule.interim_actual).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        {schedule.completion_scheduled && (
                          <div style={{ fontSize: '0.9rem' }}>
                            予定: {new Date(schedule.completion_scheduled).toLocaleDateString()}
                          </div>
                        )}
                        {schedule.completion_actual && (
                          <div style={{ fontSize: '0.9rem', color: theme.palette.success.main }}>
                            実施: {new Date(schedule.completion_actual).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {schedule.inspection_result && (
                        <span style={{
                          background: schedule.inspection_result === '合格' ? theme.palette.success.main : theme.palette.error.main,
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem'
                        }}>
                          {schedule.inspection_result}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;