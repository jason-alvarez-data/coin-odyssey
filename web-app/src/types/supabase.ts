export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CoinStatus = 'uncirculated' | 'circulated' | 'proof'

export interface Database {
  public: {
    Tables: {
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['collections']['Insert']>
      }
      coins: {
        Row: {
          id: string
          collection_id: string
          denomination: string
          year: number
          mint_mark: string | null
          grade: string | null
          purchase_price: number
          purchase_date: string
          notes: string | null
          images: string[] | null
          country: string | null
          created_at: string | null
          updated_at: string | null
          face_value: number | null
          current_market_value: number | null
          last_value_update: string | null
        }
        Insert: Omit<Database['public']['Tables']['coins']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['coins']['Insert']>
      }
      coin_value_history: {
        Row: {
          id: string
          coin_id: string
          market_value: number
          value_date: string
          source: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['coin_value_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['coin_value_history']['Insert']>
      }
      collection_shares: {
        Row: {
          id: string
          collection_id: string
          shared_with_user_id: string
          permission_level: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['collection_shares']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['collection_shares']['Insert']>
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: 'unread' | 'read' | 'responded'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contact_messages']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>
      }
      user_consent_preferences: {
        Row: {
          id: string
          user_id: string
          data_processing: boolean
          third_party_services: boolean
          international_transfers: boolean
          marketing_communications: boolean
          analytics: boolean
          performance_cookies: boolean
          consent_given_at: string
          consent_updated_at: string
          consent_ip_address: string | null
          consent_user_agent: string | null
          gpc_enabled: boolean
          gpc_processed_at: string | null
          gpc_detected_at: string | null
          legal_basis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_consent_preferences']['Row'], 'id' | 'created_at' | 'updated_at' | 'consent_given_at' | 'consent_updated_at'>
        Update: Partial<Database['public']['Tables']['user_consent_preferences']['Insert']>
      }
      user_consent_history: {
        Row: {
          id: string
          user_id: string
          data_processing: boolean
          third_party_services: boolean
          international_transfers: boolean
          marketing_communications: boolean
          analytics: boolean
          performance_cookies: boolean
          gpc_enabled: boolean
          gpc_processed_at: string | null
          changed_at: string
          change_ip_address: string | null
          change_user_agent: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_consent_history']['Row'], 'id' | 'created_at' | 'changed_at'>
        Update: Partial<Database['public']['Tables']['user_consent_history']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      coin_status: CoinStatus
    }
  }
} 