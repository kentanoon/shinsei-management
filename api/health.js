import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // Supabase接続テスト
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        database: 'disconnected',
        error: error.message,
        demo_mode: process.env.REACT_APP_DEMO_MODE === 'true'
      });
    }

    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      demo_mode: process.env.REACT_APP_DEMO_MODE === 'true',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'error',
      error: error.message,
      demo_mode: process.env.REACT_APP_DEMO_MODE === 'true'
    });
  }
}