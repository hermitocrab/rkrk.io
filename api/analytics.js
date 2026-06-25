// Analytics endpoint — logs visitor data to Supabase
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = 'https://qflaflwkzdxuhqekhxos.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGFmbHdremR4dWhxZWtoeG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTE5NjQsImV4cCI6MjA5NDU4Nzk2NH0.55PLTeZofzb6Yyyw3mhZDDnOs14NILMTr352rOWvBGk';

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';
  const referer = req.query.r || '';
  const url = req.query.u || '';
  const lang = req.query.l || '';
  const sw = parseInt(req.query.w) || 0;
  const sh = parseInt(req.query.h) || 0;

  try {
    const body = {
      ip, user_agent: ua, referer, url, lang, screen_width: sw, screen_height: sh,
      created_at: new Date().toISOString()
    };

    await fetch(`${SUPABASE_URL}/rest/v1/page_visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    // silently fail — don't block page load
  }

  // Return a 1x1 transparent GIF
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}
