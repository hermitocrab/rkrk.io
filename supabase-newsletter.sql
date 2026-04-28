-- ===============================================================
-- Newsletter Subscribers Table for rkrk.io
-- Paste this into Supabase SQL Editor (one click, one time)
-- ===============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'rkrk.io',
  consented BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (anonymous INSERT)
CREATE POLICY "anyone_can_subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only you can view the list
CREATE POLICY "owner_can_select"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.email() = 'sriskeeda@gmail.com');

-- Only you can update (e.g., unsubscribe)
CREATE POLICY "owner_can_update"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.email() = 'sriskeeda@gmail.com');

-- ===============================================================
-- After running this, go to your Supabase Dashboard:
-- Table Editor → newsletter_subscribers → you'll see every signup
-- ===============================================================
