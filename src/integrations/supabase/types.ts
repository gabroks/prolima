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
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          height: number
          id: string
          material_id: string | null
          material_name: string
          notes: string | null
          qty: number
          total: number
          unit: string
          unit_price: number
          width: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          height?: number
          id?: string
          material_id?: string | null
          material_name: string
          notes?: string | null
          qty?: number
          total?: number
          unit?: string
          unit_price?: number
          width?: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          height?: number
          id?: string
          material_id?: string | null
          material_name?: string
          notes?: string | null
          qty?: number
          total?: number
          unit?: string
          unit_price?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          delivery_date: string | null
          discount_type: string
          discount_value: number
          freight: number
          general_notes: string | null
          id: string
          number: string
          other_costs: number
          payment_terms: string | null
          service_description: string | null
          status: string
          subtotal: number
          total: number
          total_discount: number
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          delivery_date?: string | null
          discount_type?: string
          discount_value?: number
          freight?: number
          general_notes?: string | null
          id?: string
          number: string
          other_costs?: number
          payment_terms?: string | null
          service_description?: string | null
          status?: string
          subtotal?: number
          total?: number
          total_discount?: number
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          delivery_date?: string | null
          discount_type?: string
          discount_value?: number
          freight?: number
          general_notes?: string | null
          id?: string
          number?: string
          other_costs?: number
          payment_terms?: string | null
          service_description?: string | null
          status?: string
          subtotal?: number
          total?: number
          total_discount?: number
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string
          document: string
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          nome_fantasia: string | null
          person_type: string
          phone: string
          razao_social: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          document?: string
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          nome_fantasia?: string | null
          person_type?: string
          phone?: string
          razao_social?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          document?: string
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          nome_fantasia?: string | null
          person_type?: string
          phone?: string
          razao_social?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          cep: string
          city: string
          cnpj: string
          created_at: string
          email: string
          id: string
          inscricao_estadual: string
          logo: string | null
          neighborhood: string
          nome_fantasia: string
          phone: string
          pix_qr_code: string | null
          razao_social: string
          state: string
          street: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          cep?: string
          city?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          inscricao_estadual?: string
          logo?: string | null
          neighborhood?: string
          nome_fantasia?: string
          phone?: string
          pix_qr_code?: string | null
          razao_social?: string
          state?: string
          street?: string
          theme_color?: string
          updated_at?: string
        }
        Update: {
          cep?: string
          city?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          inscricao_estadual?: string
          logo?: string | null
          neighborhood?: string
          nome_fantasia?: string
          phone?: string
          pix_qr_code?: string | null
          razao_social?: string
          state?: string
          street?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          budget_id: string | null
          budget_number: string | null
          category: string
          created_at: string
          date: string
          description: string
          id: string
          notes: string | null
          supplier_id: string | null
          supplier_name: string | null
        }
        Insert: {
          amount?: number
          budget_id?: string | null
          budget_number?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          notes?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string | null
          budget_number?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          base_price: number
          category: string
          charge_unit: string
          created_at: string
          id: string
          measure_unit: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string
          charge_unit?: string
          created_at?: string
          id?: string
          measure_unit?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          charge_unit?: string
          created_at?: string
          id?: string
          measure_unit?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          budget_id: string | null
          budget_number: string
          client_name: string
          created_at: string
          date: string
          id: string
          method: string
          notes: string | null
        }
        Insert: {
          amount?: number
          budget_id?: string | null
          budget_number: string
          client_name: string
          created_at?: string
          date?: string
          id?: string
          method?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string | null
          budget_number?: string
          client_name?: string
          created_at?: string
          date?: string
          id?: string
          method?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          person_type: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          person_type?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          person_type?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
