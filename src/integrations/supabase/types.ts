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
      birdsong_offerings: {
        Row: {
          audio_cid: string | null
          audio_url: string
          chain_tx_hash: string | null
          confidence: number | null
          created_at: string
          duration_seconds: number | null
          ebird_code: string | null
          id: string
          metadata_cid: string | null
          model_version: string | null
          predictions: Json | null
          season: string | null
          species_common: string | null
          species_scientific: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          audio_cid?: string | null
          audio_url: string
          chain_tx_hash?: string | null
          confidence?: number | null
          created_at?: string
          duration_seconds?: number | null
          ebird_code?: string | null
          id?: string
          metadata_cid?: string | null
          model_version?: string | null
          predictions?: Json | null
          season?: string | null
          species_common?: string | null
          species_scientific?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          audio_cid?: string | null
          audio_url?: string
          chain_tx_hash?: string | null
          confidence?: number | null
          created_at?: string
          duration_seconds?: number | null
          ebird_code?: string | null
          id?: string
          metadata_cid?: string | null
          model_version?: string | null
          predictions?: Json | null
          season?: string | null
          species_common?: string | null
          species_scientific?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birdsong_offerings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      book_catalog: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          genre: string | null
          id: string
          title: string
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          title: string
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          actual: string
          created_at: string
          expected: string
          id: string
          severity: string
          status: string
          steps: string
          title: string
          user_id: string | null
        }
        Insert: {
          actual: string
          created_at?: string
          expected: string
          id?: string
          severity?: string
          status?: string
          steps: string
          title: string
          user_id?: string | null
        }
        Update: {
          actual?: string
          created_at?: string
          expected?: string
          id?: string
          severity?: string
          status?: string
          steps?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ceremony_logs: {
        Row: {
          anchor_tx_hash: string | null
          ceremony_type: string
          cid: string | null
          created_at: string
          id: string
          staff_code: string
          staff_name: string | null
          staff_species: string | null
          user_id: string
        }
        Insert: {
          anchor_tx_hash?: string | null
          ceremony_type?: string
          cid?: string | null
          created_at?: string
          id?: string
          staff_code: string
          staff_name?: string | null
          staff_species?: string | null
          user_id: string
        }
        Update: {
          anchor_tx_hash?: string | null
          ceremony_type?: string
          cid?: string | null
          created_at?: string
          id?: string
          staff_code?: string
          staff_name?: string | null
          staff_species?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chain_anchors: {
        Row: {
          anchor_data: Json | null
          anchor_type: string
          asset_id: string
          block_number: number | null
          chain: string
          created_at: string
          cycle_id: string | null
          id: string
          status: string
          tx_hash: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          anchor_data?: Json | null
          anchor_type?: string
          asset_id: string
          block_number?: number | null
          chain?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          status?: string
          tx_hash?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          anchor_data?: Json | null
          anchor_type?: string
          asset_id?: string
          block_number?: number | null
          chain?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          status?: string
          tx_hash?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chain_anchors_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "sync_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_anchors_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "sync_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cid_history: {
        Row: {
          asset_id: string
          cid: string
          created_at: string
          id: string
          pin_status: string
          pinned_at: string | null
          unpinned_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          asset_id: string
          cid: string
          created_at?: string
          id?: string
          pin_status?: string
          pinned_at?: string | null
          unpinned_at?: string | null
          user_id: string
          version: number
        }
        Update: {
          asset_id?: string
          cid?: string
          created_at?: string
          id?: string
          pin_status?: string
          pinned_at?: string | null
          unpinned_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cid_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "sync_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reward_caps: {
        Row: {
          checkin_count: number
          created_at: string
          id: string
          last_checkin_at: string | null
          reward_date: string
          tree_id: string
          user_id: string
        }
        Insert: {
          checkin_count?: number
          created_at?: string
          id?: string
          last_checkin_at?: string | null
          reward_date?: string
          tree_id: string
          user_id: string
        }
        Update: {
          checkin_count?: number
          created_at?: string
          id?: string
          last_checkin_at?: string | null
          reward_date?: string
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reward_caps_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_fire_votes: {
        Row: {
          created_at: string
          event_date: string
          id: string
          moon_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          moon_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          moon_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      draft_seeds: {
        Row: {
          artist: string | null
          confidence: string
          created_at: string
          id: string
          note: string | null
          offering_id: string | null
          raw_payload: string | null
          status: string
          title: string | null
          track_id: string | null
          track_url: string | null
          tree_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          confidence?: string
          created_at?: string
          id?: string
          note?: string | null
          offering_id?: string | null
          raw_payload?: string | null
          status?: string
          title?: string | null
          track_id?: string | null
          track_url?: string | null
          tree_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artist?: string | null
          confidence?: string
          created_at?: string
          id?: string
          note?: string | null
          offering_id?: string | null
          raw_payload?: string | null
          status?: string
          title?: string | null
          track_id?: string | null
          track_url?: string | null
          tree_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_seeds_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_seeds_tree_id_fkey"
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
      heart_transactions: {
        Row: {
          amount: number
          created_at: string
          heart_type: string
          id: string
          seed_id: string | null
          tree_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          heart_type: string
          id?: string
          seed_id?: string | null
          tree_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          heart_type?: string
          id?: string
          seed_id?: string | null
          tree_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heart_transactions_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "planted_seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          reason: string | null
          scope: string
          species_family: string | null
          tree_id: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          scope?: string
          species_family?: string | null
          tree_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          scope?: string
          species_family?: string | null
          tree_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
      meetings: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          notes: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
          meeting_id: string | null
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
          meeting_id?: string | null
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
          meeting_id?: string | null
          nft_link?: string | null
          sealed_by_staff?: string | null
          title?: string
          tree_id?: string
          type?: Database["public"]["Enums"]["offering_type"]
        }
        Relationships: [
          {
            foreignKeyName: "offerings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      planted_seeds: {
        Row: {
          blooms_at: string
          collected_at: string | null
          collected_by: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          planted_at: string
          planter_id: string
          tree_id: string
        }
        Insert: {
          blooms_at?: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          planted_at?: string
          planter_id: string
          tree_id: string
        }
        Update: {
          blooms_at?: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          planted_at?: string
          planter_id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planted_seeds_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_staff_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          facebook_handle: string | null
          full_name: string | null
          home_place: string | null
          id: string
          identity_bloomed_at: string | null
          inspiration_source: string | null
          inspired_by_tree_id: string | null
          inspired_by_user_id: string | null
          instagram_handle: string | null
          is_discoverable: boolean
          updated_at: string
          wallet_address: string | null
          x_handle: string | null
        }
        Insert: {
          active_staff_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_handle?: string | null
          full_name?: string | null
          home_place?: string | null
          id: string
          identity_bloomed_at?: string | null
          inspiration_source?: string | null
          inspired_by_tree_id?: string | null
          inspired_by_user_id?: string | null
          instagram_handle?: string | null
          is_discoverable?: boolean
          updated_at?: string
          wallet_address?: string | null
          x_handle?: string | null
        }
        Update: {
          active_staff_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_handle?: string | null
          full_name?: string | null
          home_place?: string | null
          id?: string
          identity_bloomed_at?: string | null
          inspiration_source?: string | null
          inspired_by_tree_id?: string | null
          inspired_by_user_id?: string | null
          instagram_handle?: string | null
          is_discoverable?: boolean
          updated_at?: string
          wallet_address?: string | null
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_staff_id_fkey"
            columns: ["active_staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          invite_link_id: string | null
          invitee_id: string
          inviter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_link_id?: string | null
          invitee_id: string
          inviter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_link_id?: string | null
          invitee_id?: string
          inviter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invite_link_id_fkey"
            columns: ["invite_link_id"]
            isOneToOne: false
            referencedRelation: "invite_links"
            referencedColumns: ["id"]
          },
        ]
      }
      research_trees: {
        Row: {
          country: string
          created_at: string
          crown_spread: string | null
          description: string | null
          designation_type: string
          geo_precision: string
          girth_or_stem: string | null
          height_m: number | null
          id: string
          latitude: number | null
          linked_tree_id: string | null
          locality_text: string
          longitude: number | null
          province: string | null
          size_index: number | null
          source_doc_title: string
          source_doc_url: string
          source_doc_year: number
          source_program: string
          source_row_ref: string | null
          species_common: string | null
          species_scientific: string
          status: string
          tree_name: string | null
          updated_at: string
          user_annotations: Json | null
        }
        Insert: {
          country?: string
          created_at?: string
          crown_spread?: string | null
          description?: string | null
          designation_type?: string
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          id?: string
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text: string
          longitude?: number | null
          province?: string | null
          size_index?: number | null
          source_doc_title: string
          source_doc_url: string
          source_doc_year: number
          source_program?: string
          source_row_ref?: string | null
          species_common?: string | null
          species_scientific: string
          status?: string
          tree_name?: string | null
          updated_at?: string
          user_annotations?: Json | null
        }
        Update: {
          country?: string
          created_at?: string
          crown_spread?: string | null
          description?: string | null
          designation_type?: string
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          id?: string
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text?: string
          longitude?: number | null
          province?: string | null
          size_index?: number | null
          source_doc_title?: string
          source_doc_url?: string
          source_doc_year?: number
          source_program?: string
          source_row_ref?: string | null
          species_common?: string | null
          species_scientific?: string
          status?: string
          tree_name?: string | null
          updated_at?: string
          user_annotations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "research_trees_linked_tree_id_fkey"
            columns: ["linked_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
      seed_ingest_logs: {
        Row: {
          confidence: string
          created_at: string
          errors: string[] | null
          id: string
          parsed_artist: string | null
          parsed_title: string | null
          parsed_track_id: string | null
          parsed_url: string | null
          raw_payload: string
          user_id: string | null
        }
        Insert: {
          confidence?: string
          created_at?: string
          errors?: string[] | null
          id?: string
          parsed_artist?: string | null
          parsed_title?: string | null
          parsed_track_id?: string | null
          parsed_url?: string | null
          raw_payload: string
          user_id?: string | null
        }
        Update: {
          confidence?: string
          created_at?: string
          errors?: string[] | null
          id?: string
          parsed_artist?: string | null
          parsed_title?: string | null
          parsed_track_id?: string | null
          parsed_url?: string | null
          raw_payload?: string
          user_id?: string | null
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
      song_catalog: {
        Row: {
          album: string | null
          artist: string
          artwork_url: string | null
          created_at: string
          external_url: string | null
          genre: string | null
          id: string
          preview_url: string | null
          source: string
          title: string
        }
        Insert: {
          album?: string | null
          artist: string
          artwork_url?: string | null
          created_at?: string
          external_url?: string | null
          genre?: string | null
          id?: string
          preview_url?: string | null
          source?: string
          title: string
        }
        Update: {
          album?: string | null
          artist?: string
          artwork_url?: string | null
          created_at?: string
          external_url?: string | null
          genre?: string | null
          id?: string
          preview_url?: string | null
          source?: string
          title?: string
        }
        Relationships: []
      }
      species_heart_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          species_family: string
          tree_id: string
          user_id: string
        }
        Insert: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          species_family: string
          tree_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          species_family?: string
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_heart_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      staffs: {
        Row: {
          circle_id: number
          created_at: string
          id: string
          image_url: string | null
          is_origin_spiral: boolean
          owner_address: string | null
          owner_user_id: string | null
          species: string
          species_code: string
          species_id: number
          staff_number: number
          token_id: number
          updated_at: string
          variant_id: number
          verified_at: string | null
        }
        Insert: {
          circle_id: number
          created_at?: string
          id: string
          image_url?: string | null
          is_origin_spiral?: boolean
          owner_address?: string | null
          owner_user_id?: string | null
          species: string
          species_code: string
          species_id: number
          staff_number: number
          token_id: number
          updated_at?: string
          variant_id: number
          verified_at?: string | null
        }
        Update: {
          circle_id?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_origin_spiral?: boolean
          owner_address?: string | null
          owner_user_id?: string | null
          species?: string
          species_code?: string
          species_id?: number
          staff_number?: number
          token_id?: number
          updated_at?: string
          variant_id?: number
          verified_at?: string | null
        }
        Relationships: []
      }
      sync_assets: {
        Row: {
          content_hash: string | null
          created_at: string
          current_cid: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          name: string
          pin_status: string
          project_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          current_cid?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          name: string
          pin_status?: string
          project_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          current_cid?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          pin_status?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sync_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sync_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_cycles: {
        Row: {
          assets_conflicted: number | null
          assets_processed: number | null
          assets_verified: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          project_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          assets_conflicted?: number | null
          assets_processed?: number | null
          assets_verified?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          project_id: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          assets_conflicted?: number | null
          assets_processed?: number | null
          assets_verified?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          project_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sync_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          asset_id: string | null
          created_at: string
          cycle_id: string | null
          details: Json | null
          id: string
          level: string
          message: string
          project_id: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          cycle_id?: string | null
          details?: Json | null
          id?: string
          level?: string
          message: string
          project_id: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          cycle_id?: string | null
          details?: Json | null
          id?: string
          level?: string
          message?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "sync_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "sync_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sync_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_projects: {
        Row: {
          created_at: string
          cycle_interval_minutes: number
          description: string | null
          id: string
          ipfs_prefix: string | null
          is_active: boolean
          last_cycle_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_interval_minutes?: number
          description?: string | null
          id?: string
          ipfs_prefix?: string | null
          is_active?: boolean
          last_cycle_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_interval_minutes?: number
          description?: string | null
          id?: string
          ipfs_prefix?: string | null
          is_active?: boolean
          last_cycle_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tree_change_log: {
        Row: {
          change_set: Json
          id: string
          merged_at: string
          merged_by: string
          merged_from_proposal_id: string | null
          previous_values: Json
          tree_id: string
        }
        Insert: {
          change_set?: Json
          id?: string
          merged_at?: string
          merged_by: string
          merged_from_proposal_id?: string | null
          previous_values?: Json
          tree_id: string
        }
        Update: {
          change_set?: Json
          id?: string
          merged_at?: string
          merged_by?: string
          merged_from_proposal_id?: string | null
          previous_values?: Json
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_change_log_merged_from_proposal_id_fkey"
            columns: ["merged_from_proposal_id"]
            isOneToOne: false
            referencedRelation: "tree_edit_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_change_log_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_edit_proposals: {
        Row: {
          confidence: string
          created_at: string
          evidence: Json
          flags: string[] | null
          id: string
          proposed_by: string
          proposed_changes: Json
          reason: string
          reviewer_id: string | null
          reviewer_note: string | null
          status: string
          tree_id: string
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          evidence?: Json
          flags?: string[] | null
          id?: string
          proposed_by: string
          proposed_changes?: Json
          reason: string
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          tree_id: string
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          evidence?: Json
          flags?: string[] | null
          id?: string
          proposed_by?: string
          proposed_changes?: Json
          reason?: string
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          tree_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_edit_proposals_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_heart_pools: {
        Row: {
          last_windfall_at: string | null
          total_hearts: number
          tree_id: string
          updated_at: string
          windfall_count: number
        }
        Insert: {
          last_windfall_at?: string | null
          total_hearts?: number
          tree_id: string
          updated_at?: string
          windfall_count?: number
        }
        Update: {
          last_windfall_at?: string | null
          total_hearts?: number
          tree_id?: string
          updated_at?: string
          windfall_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tree_heart_pools_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: true
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
          discovery_list: string | null
          estimated_age: number | null
          girth_cm: number | null
          grove_scale: Database["public"]["Enums"]["grove_scale"] | null
          id: string
          latitude: number | null
          lineage: string | null
          longitude: number | null
          name: string
          nation: string | null
          project_name: string | null
          project_url: string | null
          source_id: string | null
          source_name: string | null
          source_url: string | null
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
          discovery_list?: string | null
          estimated_age?: number | null
          girth_cm?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          latitude?: number | null
          lineage?: string | null
          longitude?: number | null
          name: string
          nation?: string | null
          project_name?: string | null
          project_url?: string | null
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
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
          discovery_list?: string | null
          estimated_age?: number | null
          girth_cm?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          latitude?: number | null
          lineage?: string | null
          longitude?: number | null
          name?: string
          nation?: string | null
          project_name?: string | null
          project_url?: string | null
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      vault_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          staff_id: string | null
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
          staff_id?: string | null
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
          staff_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_message: { Args: { msg_room_id: string }; Returns: boolean }
      claim_windfall_hearts: {
        Args: { p_tree_id: string; p_user_id: string }
        Returns: number
      }
      get_offering_counts: {
        Args: never
        Returns: {
          cnt: number
          first_photo: string
          tree_id: string
        }[]
      }
      get_recent_tree_songs: {
        Args: { p_tree_id: string; result_limit?: number }
        Returns: {
          artist: string
          created_at: string
          media_url: string
          title: string
        }[]
      }
      get_safe_profiles: {
        Args: { p_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
          is_discoverable: boolean
        }[]
      }
      get_tree_leaderboard: {
        Args: { result_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          tree_count: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_visit: {
        Args: { p_user_id?: string }
        Returns: {
          ancient_friend_index: number
          total_visits: number
          visitor_number: number
        }[]
      }
      search_books: {
        Args: { query: string; result_limit?: number }
        Returns: {
          author: string
          cover_url: string
          genre: string
          id: string
          similarity: number
          title: string
        }[]
      }
      search_discoverable_profiles: {
        Args: { result_limit?: number; search_query?: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
        }[]
      }
      search_songs: {
        Args: { query: string; result_limit?: number }
        Returns: {
          album: string
          artist: string
          artwork_url: string
          external_url: string
          genre: string
          id: string
          preview_url: string
          similarity: number
          source: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "curator" | "keeper"
      grove_scale:
        | "hyper_local"
        | "local"
        | "regional"
        | "national"
        | "bioregional"
        | "species"
        | "lineage"
      offering_type:
        | "photo"
        | "poem"
        | "song"
        | "story"
        | "nft"
        | "voice"
        | "book"
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
      app_role: ["curator", "keeper"],
      grove_scale: [
        "hyper_local",
        "local",
        "regional",
        "national",
        "bioregional",
        "species",
        "lineage",
      ],
      offering_type: ["photo", "poem", "song", "story", "nft", "voice", "book"],
    },
  },
} as const
