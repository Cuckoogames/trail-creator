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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          id: string
          image_url: string
          name: string
          sort_order: number
          start_date: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string
          name?: string
          sort_order?: number
          start_date?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string
          name?: string
          sort_order?: number
          start_date?: string | null
        }
        Relationships: []
      }
      cursos_areas: {
        Row: {
          area_name: string
          id: string
          sort_order: number
        }
        Insert: {
          area_name: string
          id?: string
          sort_order?: number
        }
        Update: {
          area_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      cursos_items: {
        Row: {
          area_id: string
          course_name: string
          hours: number
          id: string
          sort_order: number
          tipo: string | null
        }
        Insert: {
          area_id: string
          course_name: string
          hours?: number
          id?: string
          sort_order?: number
          tipo?: string | null
        }
        Update: {
          area_id?: string
          course_name?: string
          hours?: number
          id?: string
          sort_order?: number
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "cursos_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      interessados: {
        Row: {
          codigo: string | null
          created_at: string
          estudo: string | null
          id: string
          idade: string | null
          instrutor: string | null
          mentoria_texto: string | null
          nome: string
          other_courses: Json | null
          responsavel: string | null
          selected_areas: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          estudo?: string | null
          id?: string
          idade?: string | null
          instrutor?: string | null
          mentoria_texto?: string | null
          nome?: string
          other_courses?: Json | null
          responsavel?: string | null
          selected_areas?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          estudo?: string | null
          id?: string
          idade?: string | null
          instrutor?: string | null
          mentoria_texto?: string | null
          nome?: string
          other_courses?: Json | null
          responsavel?: string | null
          selected_areas?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          codigo_interessado: string | null
          created_at: string
          id: string
          interessado_id: string | null
          nome_interessado: string
          numero_proposta: number
          plano_selecionado: string | null
          planos_data: Json | null
          updated_at: string
        }
        Insert: {
          codigo_interessado?: string | null
          created_at?: string
          id?: string
          interessado_id?: string | null
          nome_interessado?: string
          numero_proposta?: number
          plano_selecionado?: string | null
          planos_data?: Json | null
          updated_at?: string
        }
        Update: {
          codigo_interessado?: string | null
          created_at?: string
          id?: string
          interessado_id?: string | null
          nome_interessado?: string
          numero_proposta?: number
          plano_selecionado?: string | null
          planos_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propostas_interessado_id_fkey"
            columns: ["interessado_id"]
            isOneToOne: false
            referencedRelation: "interessados"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_areas: {
        Row: {
          area_name: string
          category_name: string
          id: string
          sort_order: number
        }
        Insert: {
          area_name: string
          category_name: string
          id?: string
          sort_order?: number
        }
        Update: {
          area_name?: string
          category_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      trilha_carreiras: {
        Row: {
          area_id: string
          carreira_name: string
          id: string
          sort_order: number
        }
        Insert: {
          area_id: string
          carreira_name: string
          id?: string
          sort_order?: number
        }
        Update: {
          area_id?: string
          carreira_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trilha_carreiras_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "trilha_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_cursos: {
        Row: {
          carreira_id: string
          curso_name: string
          formacao_index: number
          id: string
          sort_order: number
        }
        Insert: {
          carreira_id: string
          curso_name: string
          formacao_index: number
          id?: string
          sort_order?: number
        }
        Update: {
          carreira_id?: string
          curso_name?: string
          formacao_index?: number
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trilha_cursos_carreira_id_fkey"
            columns: ["carreira_id"]
            isOneToOne: false
            referencedRelation: "trilha_carreiras"
            referencedColumns: ["id"]
          },
        ]
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
