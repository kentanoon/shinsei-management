export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel Serverless Function!',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    demo_mode: process.env.REACT_APP_DEMO_MODE === 'true'
  });
}