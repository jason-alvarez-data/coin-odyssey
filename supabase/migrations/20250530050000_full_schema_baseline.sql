-- Full schema baseline migration
-- Captures the complete database state as of 2025-05-30
-- This consolidates all prior migrations into a single reproducible schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================
-- Tables
-- ============================================================

-- Collections (one per user)
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT one_collection_per_user UNIQUE (user_id)
);

-- Coins
CREATE TABLE IF NOT EXISTS public.coins (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.collections(id),
  name text,
  title text,
  denomination text,
  year integer NOT NULL,
  mint_mark text,
  grade text,
  country text,
  series text,
  series_id text,
  specific_coin_id text,
  specific_coin_name text,
  designer text,
  theme text,
  honoree text,
  release_date date,
  certification_number text,
  grading_service text,
  purchase_price numeric,
  purchase_date date,
  face_value numeric,
  current_market_value numeric,
  personal_value numeric,
  last_appraisal_value numeric,
  last_appraisal_date date,
  last_value_update timestamptz,
  pcgs_id text,
  mintage integer,
  rarity_scale integer CHECK (rarity_scale >= 1 AND rarity_scale <= 10),
  historical_notes text,
  variety_notes text,
  notes text,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.coins.denomination IS 'Standard denomination of the coin (e.g., "Quarter", "Dollar")';
COMMENT ON COLUMN public.coins.title IS 'User-defined name for the coin (e.g., "US State Quarter - Colorado")';

-- Coin value history
CREATE TABLE IF NOT EXISTS public.coin_value_history (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  coin_id uuid REFERENCES public.coins(id),
  value numeric NOT NULL,
  source varchar,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coin varieties
CREATE TABLE IF NOT EXISTS public.coin_varieties (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  coin_id uuid REFERENCES public.coins(id),
  variety_name text NOT NULL,
  description text,
  distinguishing_marks text,
  rarity_scale integer CHECK (rarity_scale >= 1 AND rarity_scale <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Collection shares
CREATE TABLE IF NOT EXISTS public.collection_shares (
  collection_id uuid NOT NULL REFERENCES public.collections(id),
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id),
  permission_level text NOT NULL CHECK (permission_level = ANY (ARRAY['view', 'edit'])),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (collection_id, shared_with_user_id)
);

-- Grading guides
CREATE TABLE IF NOT EXISTS public.grading_guides (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  denomination text NOT NULL,
  grade text NOT NULL,
  description text NOT NULL,
  key_identifying_marks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Collection goals
CREATE TABLE IF NOT EXISTS public.collection_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title varchar NOT NULL,
  description text,
  goal_type varchar NOT NULL CHECK (goal_type IN ('series_complete', 'year_range', 'country_complete', 'denomination_set', 'mint_mark_set', 'grade_achievement', 'value_target', 'quantity_target', 'geographic_spread', 'custom')),
  criteria jsonb DEFAULT '{}'::jsonb,
  target_count integer DEFAULT 0,
  current_count integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  priority varchar DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category varchar DEFAULT 'general' CHECK (category IN ('us_coins', 'world_coins', 'ancient_coins', 'modern_coins', 'commemoratives', 'precious_metals', 'paper_money', 'general')),
  reward text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  achievement_id text NOT NULL,
  progress jsonb DEFAULT '{"current": 0, "required": 1}'::jsonb,
  is_completed boolean DEFAULT false,
  unlocked_at timestamptz,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- Contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status = ANY (ARRAY['unread', 'read', 'responded'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User consent preferences (GDPR)
CREATE TABLE IF NOT EXISTS public.user_consent_preferences (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
  data_processing boolean DEFAULT true,
  third_party_services boolean DEFAULT true,
  international_transfers boolean DEFAULT true,
  marketing_communications boolean DEFAULT false,
  analytics boolean DEFAULT false,
  performance_cookies boolean DEFAULT true,
  consent_given_at timestamptz DEFAULT now(),
  consent_updated_at timestamptz DEFAULT now(),
  consent_ip_address inet,
  consent_user_agent text,
  legal_basis text DEFAULT 'consent' CHECK (legal_basis = ANY (ARRAY['consent', 'legitimate_interest', 'contract', 'legal_obligation'])),
  gpc_enabled boolean DEFAULT false,
  gpc_detected_at timestamptz,
  gpc_processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User consent history (GDPR audit trail)
CREATE TABLE IF NOT EXISTS public.user_consent_history (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  data_processing boolean NOT NULL,
  third_party_services boolean NOT NULL,
  international_transfers boolean NOT NULL,
  marketing_communications boolean NOT NULL,
  analytics boolean NOT NULL,
  performance_cookies boolean NOT NULL,
  change_ip_address inet,
  change_user_agent text,
  change_reason text,
  changed_at timestamptz DEFAULT now(),
  gpc_enabled boolean DEFAULT false,
  gpc_processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Coins
CREATE INDEX IF NOT EXISTS idx_coins_name ON public.coins (name);
CREATE INDEX IF NOT EXISTS idx_coins_country ON public.coins (country);
CREATE INDEX IF NOT EXISTS idx_coins_series ON public.coins (series);
CREATE INDEX IF NOT EXISTS idx_coins_series_id ON public.coins (series_id);
CREATE INDEX IF NOT EXISTS idx_coins_specific_coin_id ON public.coins (specific_coin_id);

-- Coin value history
CREATE INDEX IF NOT EXISTS idx_coin_value_history_coin_id ON public.coin_value_history (coin_id);
CREATE INDEX IF NOT EXISTS idx_coin_value_history_recorded_at ON public.coin_value_history (recorded_at);

-- Collection shares
CREATE INDEX IF NOT EXISTS idx_collection_shares_shared_with_user_id ON public.collection_shares (shared_with_user_id);

-- Collection goals
CREATE INDEX IF NOT EXISTS idx_collection_goals_user_id ON public.collection_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_collection_goals_goal_type ON public.collection_goals (goal_type);
CREATE INDEX IF NOT EXISTS idx_collection_goals_is_completed ON public.collection_goals (is_completed);
CREATE INDEX IF NOT EXISTS idx_collection_goals_category ON public.collection_goals (category);
CREATE INDEX IF NOT EXISTS idx_collection_goals_created_at ON public.collection_goals (created_at DESC);

-- User achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements (user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements (unlocked_at DESC) WHERE unlocked_at IS NOT NULL;

-- Contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages (email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at);

-- User consent
CREATE INDEX IF NOT EXISTS idx_user_consent_preferences_user_id ON public.user_consent_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_consent_history_user_id ON public.user_consent_history (user_id);
CREATE INDEX IF NOT EXISTS idx_user_consent_history_changed_at ON public.user_consent_history (changed_at);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_value_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Collections: users manage their own
CREATE POLICY manage_own_collections ON public.collections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coins: users manage coins in their collection
CREATE POLICY manage_own_coins ON public.coins
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = coins.collection_id AND collections.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = coins.collection_id AND collections.user_id = auth.uid()));

-- Coin value history: manage via coin ownership
CREATE POLICY manage_coin_value_history ON public.coin_value_history
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM coins JOIN collections ON collections.id = coins.collection_id WHERE coins.id = coin_value_history.coin_id AND collections.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM coins JOIN collections ON collections.id = coins.collection_id WHERE coins.id = coin_value_history.coin_id AND collections.user_id = auth.uid()));

-- Coin varieties: authenticated can view all
CREATE POLICY view_coin_varieties ON public.coin_varieties
  FOR SELECT TO authenticated
  USING (true);

-- Collection shares: owners and shared-with users
CREATE POLICY manage_collection_shares ON public.collection_shares
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_shares.collection_id AND collections.user_id = auth.uid())
    OR shared_with_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_shares.collection_id AND collections.user_id = auth.uid())
  );

-- Grading guides: authenticated can view
CREATE POLICY view_grading_guides ON public.grading_guides
  FOR SELECT TO authenticated
  USING (true);

-- Collection goals: users manage their own
CREATE POLICY "Users can view their own goals" ON public.collection_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.collection_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.collection_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.collection_goals FOR DELETE USING (auth.uid() = user_id);

-- User achievements: users manage their own
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON public.user_achievements FOR DELETE USING (auth.uid() = user_id);

-- Contact messages: anyone can submit, only admins can view
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view contact messages" ON public.contact_messages FOR SELECT USING (false);

-- User consent preferences
CREATE POLICY "Users can view their own consent preferences" ON public.user_consent_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consent preferences" ON public.user_consent_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consent preferences" ON public.user_consent_preferences FOR UPDATE USING (auth.uid() = user_id);

-- User consent history
CREATE POLICY "Users can view their own consent history" ON public.user_consent_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert consent history" ON public.user_consent_history FOR INSERT WITH CHECK (true);
