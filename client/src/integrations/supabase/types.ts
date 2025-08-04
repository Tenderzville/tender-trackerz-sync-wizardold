export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          id: number
          tender_id: number
          estimated_value_min: number | null
          estimated_value_max: number | null
          win_probability: number | null
          confidence_score: number | null
          analysis_data: Json | null
          recommendations: string[] | null
          model_version: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          tender_id: number
          estimated_value_min?: number | null
          estimated_value_max?: number | null
          win_probability?: number | null
          confidence_score?: number | null
          analysis_data?: Json | null
          recommendations?: string[] | null
          model_version?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          tender_id?: number
          estimated_value_min?: number | null
          estimated_value_max?: number | null
          win_probability?: number | null
          confidence_score?: number | null
          analysis_data?: Json | null
          recommendations?: string[] | null
          model_version?: string | null
          created_at?: string | null
        }
      }
      consortium_members: {
        Row: {
          id: number
          consortium_id: number
          user_id: string
          joined_at: string | null
          role: string | null
          expertise: string | null
          contribution: string | null
        }
        Insert: {
          id?: number
          consortium_id: number
          user_id: string
          joined_at?: string | null
          role?: string | null
          expertise?: string | null
          contribution?: string | null
        }
        Update: {
          id?: number
          consortium_id?: number
          user_id?: string
          joined_at?: string | null
          role?: string | null
          expertise?: string | null
          contribution?: string | null
        }
      }
      consortiums: {
        Row: {
          id: number
          name: string
          description: string | null
          tender_id: number | null
          created_by: string
          max_members: number | null
          status: string | null
          required_skills: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          tender_id?: number | null
          created_by: string
          max_members?: number | null
          status?: string | null
          required_skills?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          tender_id?: number | null
          created_by?: string
          max_members?: number | null
          status?: string | null
          required_skills?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          profile_image_url: string | null
          company: string | null
          phone_number: string | null
          location: string | null
          business_type: string | null
          subscription_type: string | null
          subscription_status: string | null
          subscription_start_date: string | null
          subscription_end_date: string | null
          paypal_subscription_id: string | null
          referral_code: string | null
          referred_by: string | null
          total_referrals: number | null
          loyalty_points: number | null
          is_early_user: boolean | null
          twitter_followed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          profile_image_url?: string | null
          company?: string | null
          phone_number?: string | null
          location?: string | null
          business_type?: string | null
          subscription_type?: string | null
          subscription_status?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          paypal_subscription_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number | null
          loyalty_points?: number | null
          is_early_user?: boolean | null
          twitter_followed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          profile_image_url?: string | null
          company?: string | null
          phone_number?: string | null
          location?: string | null
          business_type?: string | null
          subscription_type?: string | null
          subscription_status?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          paypal_subscription_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number | null
          loyalty_points?: number | null
          is_early_user?: boolean | null
          twitter_followed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      saved_tenders: {
        Row: {
          id: number
          user_id: string
          tender_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          tender_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          tender_id?: number
          created_at?: string | null
        }
      }
      service_providers: {
        Row: {
          id: number
          user_id: string
          name: string
          email: string
          phone: string | null
          specialization: string
          description: string | null
          experience: number | null
          rating: number | null
          review_count: number | null
          hourly_rate: number | null
          availability: string | null
          certifications: string[] | null
          portfolio: string[] | null
          profile_image: string | null
          website: string | null
          linkedin: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          email: string
          phone?: string | null
          specialization: string
          description?: string | null
          experience?: number | null
          rating?: number | null
          review_count?: number | null
          hourly_rate?: number | null
          availability?: string | null
          certifications?: string[] | null
          portfolio?: string[] | null
          profile_image?: string | null
          website?: string | null
          linkedin?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          specialization?: string
          description?: string | null
          experience?: number | null
          rating?: number | null
          review_count?: number | null
          hourly_rate?: number | null
          availability?: string | null
          certifications?: string[] | null
          portfolio?: string[] | null
          profile_image?: string | null
          website?: string | null
          linkedin?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tender_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      tenders: {
        Row: {
          id: number
          title: string
          description: string
          organization: string
          category: string
          location: string
          budget_estimate: number | null
          deadline: string
          publish_date: string | null
          status: string | null
          requirements: string[] | null
          documents: string[] | null
          contact_email: string | null
          contact_phone: string | null
          tender_number: string | null
          source_url: string | null
          scraped_from: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description: string
          organization: string
          category: string
          location: string
          budget_estimate?: number | null
          deadline: string
          publish_date?: string | null
          status?: string | null
          requirements?: string[] | null
          documents?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          tender_number?: string | null
          source_url?: string | null
          scraped_from?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string
          organization?: string
          category?: string
          location?: string
          budget_estimate?: number | null
          deadline?: string
          publish_date?: string | null
          status?: string | null
          requirements?: string[] | null
          documents?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          tender_number?: string | null
          source_url?: string | null
          scraped_from?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_alerts: {
        Row: {
          id: number
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user' | 'moderator'
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'user' | 'moderator'
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user' | 'moderator'
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'user' | 'moderator'
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'admin' | 'user' | 'moderator'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never