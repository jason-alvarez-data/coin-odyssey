-- User Consent Preferences Table
CREATE TABLE user_consent_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core consent types
  data_processing boolean DEFAULT true NOT NULL,
  third_party_services boolean DEFAULT true NOT NULL,
  international_transfers boolean DEFAULT true NOT NULL,
  
  -- Optional features (currently not used but prepared for future)
  marketing_communications boolean DEFAULT false NOT NULL,
  analytics boolean DEFAULT false NOT NULL,
  performance_cookies boolean DEFAULT true NOT NULL,
  
  -- Metadata
  consent_given_at timestamp with time zone DEFAULT now() NOT NULL,
  consent_updated_at timestamp with time zone DEFAULT now() NOT NULL,
  consent_ip_address inet,
  consent_user_agent text,
  
  -- Global Privacy Control tracking
  gpc_enabled boolean DEFAULT false NOT NULL,
  gpc_processed_at timestamp with time zone,
  gpc_detected_at timestamp with time zone,
  
  -- Legal basis tracking
  legal_basis text DEFAULT 'consent' CHECK (legal_basis IN ('consent', 'legitimate_interest', 'contract', 'legal_obligation')),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure one consent record per user
  UNIQUE(user_id)
);

-- Consent History Table (for audit trail)
CREATE TABLE user_consent_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Snapshot of consent at time of change
  data_processing boolean NOT NULL,
  third_party_services boolean NOT NULL,
  international_transfers boolean NOT NULL,
  marketing_communications boolean NOT NULL,
  analytics boolean NOT NULL,
  performance_cookies boolean NOT NULL,
  
  -- GPC status at time of change
  gpc_enabled boolean NOT NULL,
  gpc_processed_at timestamp with time zone,
  
  -- Change metadata
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  change_ip_address inet,
  change_user_agent text,
  change_reason text, -- 'user_update', 'account_creation', 'policy_change', etc.
  
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_consent_preferences_user_id ON user_consent_preferences(user_id);
CREATE INDEX idx_user_consent_history_user_id ON user_consent_history(user_id);
CREATE INDEX idx_user_consent_history_changed_at ON user_consent_history(changed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consent preferences
CREATE POLICY "Users can view their own consent preferences"
  ON user_consent_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent preferences"
  ON user_consent_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent preferences"
  ON user_consent_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consent history (read-only for users)
CREATE POLICY "Users can view their own consent history"
  ON user_consent_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert consent history"
  ON user_consent_history FOR INSERT
  WITH CHECK (true); -- Allow system to insert audit records

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_consent_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.consent_updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_consent_preferences_updated_at 
  BEFORE UPDATE ON user_consent_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_consent_updated_at_column();

-- Function to create consent history entry when preferences change
CREATE OR REPLACE FUNCTION create_consent_history_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into history table when consent is updated
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        INSERT INTO user_consent_history (
            user_id,
            data_processing,
            third_party_services,
            international_transfers,
            marketing_communications,
            analytics,
            performance_cookies,
            gpc_enabled,
            gpc_processed_at,
            change_reason,
            change_ip_address,
            change_user_agent
        ) VALUES (
            NEW.user_id,
            NEW.data_processing,
            NEW.third_party_services,
            NEW.international_transfers,
            NEW.marketing_communications,
            NEW.analytics,
            NEW.performance_cookies,
            NEW.gpc_enabled,
            NEW.gpc_processed_at,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'account_creation'
                ELSE 'user_update'
            END,
            NEW.consent_ip_address,
            NEW.consent_user_agent
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to create history entries
CREATE TRIGGER create_consent_history_trigger 
  AFTER INSERT OR UPDATE ON user_consent_preferences 
  FOR EACH ROW EXECUTE FUNCTION create_consent_history_entry();

-- Function to create default consent preferences for new users
CREATE OR REPLACE FUNCTION create_default_consent_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default consent preferences when a new user is created
    INSERT INTO user_consent_preferences (
        user_id,
        data_processing,
        third_party_services,
        international_transfers,
        marketing_communications,
        analytics,
        performance_cookies,
        legal_basis,
        consent_ip_address
    ) VALUES (
        NEW.id,
        true,  -- Required for service operation
        true,  -- Required for authentication
        true,  -- Required for service operation
        false, -- Optional, defaults to false
        false, -- Not currently used
        true,  -- Required for website functionality
        'consent',
        NULL   -- Will be set when user first updates preferences
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default consent preferences for new users
CREATE TRIGGER create_default_consent_preferences_trigger 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE FUNCTION create_default_consent_preferences(); 