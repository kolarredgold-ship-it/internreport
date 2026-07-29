export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          created_at: string
          feature: string
          id: string
          model: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          model?: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          model?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          domain: string
          excerpt: string
          id: string
          is_published: boolean
          keywords: string[]
          post_type: string
          published_at: string
          read_time: number
          slug: string
          title: string
          university: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          domain?: string
          excerpt: string
          id?: string
          is_published?: boolean
          keywords?: string[]
          post_type?: string
          published_at?: string
          read_time?: number
          slug: string
          title: string
          university?: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          domain?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          keywords?: string[]
          post_type?: string
          published_at?: string
          read_time?: number
          slug?: string
          title?: string
          university?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_products: {
        Row: {
          actual_price: number | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          download_count: number | null
          download_url: string
          id: string
          image_url: string | null
          is_active: boolean
          offer_price: number | null
          price: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_price?: number | null
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          download_count?: number | null
          download_url: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_price?: number | null
          price?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_price?: number | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          download_count?: number | null
          download_url?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_price?: number | null
          price?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mock_interview_results: {
        Row: {
          ai_feedback: string | null
          ai_score: number
          ai_suggestions: string | null
          created_at: string
          id: string
          question: string
          role_or_topic: string
          user_answer: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number
          ai_suggestions?: string | null
          created_at?: string
          id?: string
          question: string
          role_or_topic: string
          user_answer: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number
          ai_suggestions?: string | null
          created_at?: string
          id?: string
          question?: string
          role_or_topic?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          payer_email: string | null
          payer_mobile: string | null
          payer_name: string | null
          payment_type: string
          product_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          report_id: string | null
          screenshot_url: string | null
          status: string
          transaction_number: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          payer_email?: string | null
          payer_mobile?: string | null
          payer_name?: string | null
          payment_type?: string
          product_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          report_id?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_number?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          payer_email?: string | null
          payer_mobile?: string | null
          payer_name?: string | null
          payment_type?: string
          product_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          report_id?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_number?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          college_name: string | null
          course: string | null
          created_at: string
          email: string | null
          full_name: string | null
          generations_used: number | null
          id: string
          mobile_number: string | null
          phone: string | null
          referred_by: string | null
          register_number: string | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          college_name?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          generations_used?: number | null
          id?: string
          mobile_number?: string | null
          phone?: string | null
          referred_by?: string | null
          register_number?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          college_name?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          generations_used?: number | null
          id?: string
          mobile_number?: string | null
          phone?: string | null
          referred_by?: string | null
          register_number?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          answer: string
          category: string
          created_at: string
          created_by: string | null
          difficulty: string
          id: string
          question: string
          subcategory: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          question: string
          subcategory?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          question?: string
          subcategory?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          created_at: string
          earning_amount: number
          id: string
          referred_mobile: string
          referred_user_id: string
          referrer_mobile: string
          referrer_user_id: string | null
          status: string
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string
          earning_amount?: number
          id?: string
          referred_mobile: string
          referred_user_id: string
          referrer_mobile: string
          referrer_user_id?: string | null
          status?: string
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string
          earning_amount?: number
          id?: string
          referred_mobile?: string
          referred_user_id?: string
          referrer_mobile?: string
          referrer_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          academic_year: string
          college_name: string
          company_location: string
          company_name: string
          course: string
          created_at: string
          download_count: number
          file_url: string | null
          guide_name: string
          id: string
          internship_duration: string
          internship_title: string
          last_downloaded_at: string | null
          pages_count: number
          register_number: string
          report_content: string | null
          report_kind: string
          status: string
          student_name: string
          topic_specialization: string
          university: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year: string
          college_name: string
          company_location: string
          company_name: string
          course: string
          created_at?: string
          download_count?: number
          file_url?: string | null
          guide_name: string
          id?: string
          internship_duration: string
          internship_title: string
          last_downloaded_at?: string | null
          pages_count?: number
          register_number: string
          report_content?: string | null
          report_kind?: string
          status?: string
          student_name: string
          topic_specialization: string
          university: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: string
          college_name?: string
          company_location?: string
          company_name?: string
          course?: string
          created_at?: string
          download_count?: number
          file_url?: string | null
          guide_name?: string
          id?: string
          internship_duration?: string
          internship_title?: string
          last_downloaded_at?: string | null
          pages_count?: number
          register_number?: string
          report_content?: string | null
          report_kind?: string
          status?: string
          student_name?: string
          topic_specialization?: string
          university?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          category: string
          created_at: string
          id: string
          last_accessed: string
          module: string
          questions_attempted: number
          questions_correct: number
          subcategory: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_accessed?: string
          module: string
          questions_attempted?: number
          questions_correct?: number
          subcategory?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_accessed?: string
          module?: string
          questions_attempted?: number
          questions_correct?: number
          subcategory?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          id: string
          pending_earnings: number
          referral_earnings: number
          total_balance: number
          updated_at: string
          user_id: string
          welcome_bonus: number
          withdrawable_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          pending_earnings?: number
          referral_earnings?: number
          total_balance?: number
          updated_at?: string
          user_id: string
          welcome_bonus?: number
          withdrawable_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          pending_earnings?: number
          referral_earnings?: number
          total_balance?: number
          updated_at?: string
          user_id?: string
          welcome_bonus?: number
          withdrawable_balance?: number
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      digital_products_public: {
        Row: {
          actual_price: number | null
          category: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          offer_price: number | null
          price: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          offer_price?: number | null
          price?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          offer_price?: number | null
          price?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_withdraw: { Args: { p_user_id: string }; Returns: Json }
      claim_generation_slot: { Args: { p_user_id: string }; Returns: Json }
      credit_referral_earnings: {
        Args: { p_referred_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral: {
        Args: {
          p_referred_mobile: string
          p_referred_user_id: string
          p_referrer_mobile: string
        }
        Returns: Json
      }
      request_withdrawal: {
        Args: { p_amount: number; p_upi_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
