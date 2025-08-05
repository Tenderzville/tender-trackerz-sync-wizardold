export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_data: Json | null
          confidence_score: number | null
          created_at: string | null
          estimated_value_max: number | null
          estimated_value_min: number | null
          id: number
          model_version: string | null
          recommendations: string[] | null
          tender_id: number
          win_probability: number | null
        }
        Insert: {
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_value_max?: number | null
          estimated_value_min?: number | null
          id?: number
          model_version?: string | null
          recommendations?: string[] | null
          tender_id: number
          win_probability?: number | null
        }
        Update: {
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_value_max?: number | null
          estimated_value_min?: number | null
          id?: number
          model_version?: string | null
          recommendations?: string[] | null
          tender_id?: number
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_location: string
          backup_status: string | null
          backup_type: string
          checksum: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_size: number | null
          id: number
        }
        Insert: {
          backup_location: string
          backup_status?: string | null
          backup_type: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: number
        }
        Update: {
          backup_location?: string
          backup_status?: string | null
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: number
        }
        Relationships: []
      }
      consortium_members: {
        Row: {
          consortium_id: number
          contribution: string | null
          expertise: string | null
          id: number
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          consortium_id: number
          contribution?: string | null
          expertise?: string | null
          id?: number
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          consortium_id?: number
          contribution?: string | null
          expertise?: string | null
          id?: number
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consortium_members_consortium_id_fkey"
            columns: ["consortium_id"]
            isOneToOne: false
            referencedRelation: "consortiums"
            referencedColumns: ["id"]
          },
        ]
      }
      consortiums: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: number
          max_members: number | null
          name: string
          required_skills: string[] | null
          status: string | null
          tender_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: number
          max_members?: number | null
          name: string
          required_skills?: string[] | null
          status?: string | null
          tender_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: number
          max_members?: number | null
          name?: string
          required_skills?: string[] | null
          status?: string | null
          tender_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consortiums_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_type: string | null
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_early_user: boolean | null
          last_name: string | null
          location: string | null
          loyalty_points: number | null
          paypal_subscription_id: string | null
          phone_number: string | null
          profile_image_url: string | null
          referral_code: string | null
          referred_by: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          total_referrals: number | null
          twitter_followed: boolean | null
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_early_user?: boolean | null
          last_name?: string | null
          location?: string | null
          loyalty_points?: number | null
          paypal_subscription_id?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          total_referrals?: number | null
          twitter_followed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_early_user?: boolean | null
          last_name?: string | null
          location?: string | null
          loyalty_points?: number | null
          paypal_subscription_id?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          total_referrals?: number | null
          twitter_followed?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rfq_quotes: {
        Row: {
          attachments: string[] | null
          delivery_timeline: string | null
          id: number
          proposal_text: string | null
          quoted_amount: number
          rfq_id: number
          status: string | null
          submitted_at: string | null
          supplier_id: string
          terms_and_conditions: string | null
          updated_at: string | null
          validity_period: number | null
        }
        Insert: {
          attachments?: string[] | null
          delivery_timeline?: string | null
          id?: number
          proposal_text?: string | null
          quoted_amount: number
          rfq_id: number
          status?: string | null
          submitted_at?: string | null
          supplier_id: string
          terms_and_conditions?: string | null
          updated_at?: string | null
          validity_period?: number | null
        }
        Update: {
          attachments?: string[] | null
          delivery_timeline?: string | null
          id?: number
          proposal_text?: string | null
          quoted_amount?: number
          rfq_id?: number
          status?: string | null
          submitted_at?: string | null
          supplier_id?: string
          terms_and_conditions?: string | null
          updated_at?: string | null
          validity_period?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          budget_range_max: number | null
          budget_range_min: number | null
          category: string
          created_at: string | null
          deadline: string
          description: string
          documents: string[] | null
          id: number
          location: string
          preferred_suppliers: string[] | null
          requirements: string[] | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          category: string
          created_at?: string | null
          deadline: string
          description: string
          documents?: string[] | null
          id?: number
          location: string
          preferred_suppliers?: string[] | null
          requirements?: string[] | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          category?: string
          created_at?: string | null
          deadline?: string
          description?: string
          documents?: string[] | null
          id?: number
          location?: string
          preferred_suppliers?: string[] | null
          requirements?: string[] | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_tenders: {
        Row: {
          created_at: string | null
          id: number
          tender_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          tender_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          tender_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_tenders_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          availability: string | null
          certifications: string[] | null
          created_at: string | null
          description: string | null
          email: string
          experience: number | null
          hourly_rate: number | null
          id: number
          linkedin: string | null
          name: string
          phone: string | null
          portfolio: string[] | null
          profile_image: string | null
          rating: number | null
          review_count: number | null
          specialization: string
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          availability?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          email: string
          experience?: number | null
          hourly_rate?: number | null
          id?: number
          linkedin?: string | null
          name: string
          phone?: string | null
          portfolio?: string[] | null
          profile_image?: string | null
          rating?: number | null
          review_count?: number | null
          specialization: string
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          availability?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          email?: string
          experience?: number | null
          hourly_rate?: number | null
          id?: number
          linkedin?: string | null
          name?: string
          phone?: string | null
          portfolio?: string[] | null
          profile_image?: string | null
          rating?: number | null
          review_count?: number | null
          specialization?: string
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      tender_analytics: {
        Row: {
          applications_count: number | null
          created_at: string | null
          id: number
          last_viewed: string | null
          saves_count: number | null
          tender_id: number
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          created_at?: string | null
          id?: number
          last_viewed?: string | null
          saves_count?: number | null
          tender_id: number
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          created_at?: string | null
          id?: number
          last_viewed?: string | null
          saves_count?: number | null
          tender_id?: number
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_analytics_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      tenders: {
        Row: {
          budget_estimate: number | null
          category: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          deadline: string
          description: string
          documents: string[] | null
          id: number
          location: string
          organization: string
          publish_date: string | null
          requirements: string[] | null
          scraped_from: string | null
          source_url: string | null
          status: string | null
          tender_number: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_estimate?: number | null
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deadline: string
          description: string
          documents?: string[] | null
          id?: number
          location: string
          organization: string
          publish_date?: string | null
          requirements?: string[] | null
          scraped_from?: string | null
          source_url?: string | null
          status?: string | null
          tender_number?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_estimate?: number | null
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deadline?: string
          description?: string
          documents?: string[] | null
          id?: number
          location?: string
          organization?: string
          publish_date?: string | null
          requirements?: string[] | null
          scraped_from?: string | null
          source_url?: string | null
          status?: string | null
          tender_number?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      version_tracking: {
        Row: {
          change_type: string | null
          changed_by: string | null
          changed_fields: Json | null
          changes_summary: string | null
          created_at: string | null
          entity_id: number
          entity_type: string
          id: number
          version_number: number
        }
        Insert: {
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: Json | null
          changes_summary?: string | null
          created_at?: string | null
          entity_id: number
          entity_type: string
          id?: number
          version_number?: number
        }
        Update: {
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: Json | null
          changes_summary?: string | null
          created_at?: string | null
          entity_id?: number
          entity_type?: string
          id?: number
          version_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
