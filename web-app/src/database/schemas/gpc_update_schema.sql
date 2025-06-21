-- GPC Update Script for Existing Consent Tables
-- Run this instead of the full user_consent_schema.sql if tables already exist

-- Add GPC fields to existing user_consent_preferences table
ALTER TABLE user_consent_preferences 
ADD COLUMN IF NOT EXISTS gpc_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS gpc_processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS gpc_detected_at timestamp with time zone;

-- Add GPC fields to existing user_consent_history table
ALTER TABLE user_consent_history 
ADD COLUMN IF NOT EXISTS gpc_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS gpc_processed_at timestamp with time zone;

-- Update the consent history trigger function to include GPC fields
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

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_consent_preferences' 
AND column_name IN ('gpc_enabled', 'gpc_processed_at', 'gpc_detected_at')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_consent_history' 
AND column_name IN ('gpc_enabled', 'gpc_processed_at')
ORDER BY column_name; 