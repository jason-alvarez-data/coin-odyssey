-- Collection Goals Schema
-- This table stores user-defined collection goals and tracks their progress

CREATE TABLE IF NOT EXISTS public.collection_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'series_complete',
        'year_range', 
        'country_complete',
        'denomination_set',
        'mint_mark_set',
        'grade_achievement',
        'value_target',
        'quantity_target',
        'geographic_spread',
        'custom'
    )),
    criteria JSONB NOT NULL DEFAULT '{}',
    target_count INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN (
        'us_coins',
        'world_coins',
        'ancient_coins', 
        'modern_coins',
        'commemoratives',
        'precious_metals',
        'paper_money',
        'general'
    )),
    reward TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_goals_user_id ON public.collection_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_goals_goal_type ON public.collection_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_collection_goals_category ON public.collection_goals(category);
CREATE INDEX IF NOT EXISTS idx_collection_goals_is_completed ON public.collection_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_collection_goals_created_at ON public.collection_goals(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.collection_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own goals
CREATE POLICY "Users can view their own goals" ON public.collection_goals
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert their own goals" ON public.collection_goals
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update their own goals" ON public.collection_goals
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete their own goals" ON public.collection_goals
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update updated_at on changes
CREATE TRIGGER update_collection_goals_updated_at
    BEFORE UPDATE ON public.collection_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_goals_updated_at();

-- Sample goals data (optional - can be removed in production)
-- Uncomment the following to add some sample goals for testing:

/*
INSERT INTO public.collection_goals (
    user_id, 
    title, 
    description, 
    goal_type, 
    criteria, 
    target_count, 
    category, 
    priority
) VALUES 
-- Note: Replace 'your-user-id-here' with an actual user ID for testing
(
    'your-user-id-here',
    'American Women Quarters Collection',
    'Collect all coins from the American Women Quarters series (2022-2025)',
    'series_complete',
    '{"series": "American Women Quarters", "startYear": 2022, "endYear": 2025, "country": "United States", "denomination": ["Quarter"]}',
    20,
    'us_coins',
    'medium'
),
(
    'your-user-id-here', 
    'World Tour Collection',
    'Collect at least one coin from 50 different countries',
    'geographic_spread',
    '{"countries": []}',
    50,
    'world_coins',
    'high'
);
*/