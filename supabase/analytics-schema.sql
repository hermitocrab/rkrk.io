-- Run this in Supabase SQL Editor to enable visitor tracking
-- Project: https://qflaflwkzdxuhqekhxos.supabase.co

CREATE TABLE IF NOT EXISTS public.page_visits (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  url TEXT,
  lang TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable public insert (anon key can insert)
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.page_visits
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow service role select" ON public.page_visits
  FOR SELECT TO service_role
  USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_referer ON public.page_visits(referer);
