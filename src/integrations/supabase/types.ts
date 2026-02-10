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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      greenhouse_plants: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          name: string
          notes: string | null
          photo_url: string | null
          species: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name: string
          notes?: string | null
          photo_url?: string | null
          species?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          notes?: string | null
          photo_url?: string | null
          species?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offerings: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          media_url: string | null
          nft_link: string | null
          sealed_by_staff: string | null
          title: string
          tree_id: string
          type: Database["public"]["Enums"]["offering_type"]
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          nft_link?: string | null
          sealed_by_staff?: string | null
          title: string
          tree_id: string
          type: Database["public"]["Enums"]["offering_type"]
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          nft_link?: string | null
          sealed_by_staff?: string | null
          title?: string
          tree_id?: string
          type?: Database["public"]["Enums"]["offering_type"]
        }
        Relationships: [
          {
            foreignKeyName: "offerings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tree_projects: {
        Row: {
          api_url: string | null
          bioregion: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          nation: string | null
          project_scope: string | null
          species: string | null
          state: string | null
          updated_at: string
          website_url: string | null
          what3words: string | null
        }
        Insert: {
          api_url?: string | null
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          nation?: string | null
          project_scope?: string | null
          species?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
          what3words?: string | null
        }
        Update: {
          api_url?: string | null
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          nation?: string | null
          project_scope?: string | null
          species?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
          what3words?: string | null
        }
        Relationships: []
      }
      tree_wishlist: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_wishlist_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      trees: {
        Row: {
          bioregion: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_age: number | null
          grove_scale: Database["public"]["Enums"]["grove_scale"] | null
          id: string
          latitude: number | null
          lineage: string | null
          longitude: number | null
          name: string
          nation: string | null
          project_name: string | null
          project_url: string | null
          species: string
          state: string | null
          updated_at: string
          what3words: string | null
        }
        Insert: {
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_age?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          latitude?: number | null
          lineage?: string | null
          longitude?: number | null
          name: string
          nation?: string | null
          project_name?: string | null
          project_url?: string | null
          species: string
          state?: string | null
          updated_at?: string
          what3words?: string | null
        }
        Update: {
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_age?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          latitude?: number | null
          lineage?: string | null
          longitude?: number | null
          name?: string
          nation?: string | null
          project_name?: string | null
          project_url?: string | null
          species?: string
          state?: string | null
          updated_at?: string
          what3words?: string | null
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
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
      grove_scale:
        | "hyper_local"
        | "local"
        | "regional"
        | "national"
        | "bioregional"
        | "species"
        | "lineage"
      offering_type: "photo" | "poem" | "song" | "story" | "nft"
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
      grove_scale: [
        "hyper_local",
        "local",
        "regional",
        "national",
        "bioregional",
        "species",
        "lineage",
      ],
      offering_type: ["photo", "poem", "song", "story", "nft"],
    },
  },
} as const
