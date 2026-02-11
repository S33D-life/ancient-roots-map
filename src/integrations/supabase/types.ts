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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          tree_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tree_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tree_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
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
      grove_companions: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invite_links: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          code?: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      offering_tags: {
        Row: {
          created_at: string
          id: string
          offering_id: string
          tagged_by: string
          tagged_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offering_id: string
          tagged_by: string
          tagged_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offering_id?: string
          tagged_by?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_tags_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
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
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          is_discoverable: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_discoverable?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_discoverable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      saved_songs: {
        Row: {
          artist: string
          created_at: string
          id: string
          link: string | null
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          artist: string
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          artist?: string
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          ancient_friend_index: number
          created_at: string
          id: string
          ip_hash: string | null
          user_id: string | null
          visitor_number: number
        }
        Insert: {
          ancient_friend_index: number
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_id?: string | null
          visitor_number: number
        }
        Update: {
          ancient_friend_index?: number
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_id?: string | null
          visitor_number?: number
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
      user_presence: {
        Row: {
          display_name: string | null
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          is_online?: boolean
          last_seen?: string
          user_id?: string
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
      can_view_message: { Args: { msg_room_id: string }; Returns: boolean }
      get_tree_leaderboard: {
        Args: { result_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          tree_count: number
          user_id: string
        }[]
      }
      record_visit: {
        Args: { p_user_id?: string }
        Returns: {
          ancient_friend_index: number
          total_visits: number
          visitor_number: number
        }[]
      }
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
