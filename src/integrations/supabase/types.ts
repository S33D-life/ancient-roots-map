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
      agent_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          label: string
          last_used_at: string | null
          revoked: boolean
          scopes: string[]
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      bio_region_trees: {
        Row: {
          bio_region_id: string
          created_at: string
          id: string
          tree_id: string
        }
        Insert: {
          bio_region_id: string
          created_at?: string
          id?: string
          tree_id: string
        }
        Update: {
          bio_region_id?: string
          created_at?: string
          id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_region_trees_bio_region_id_fkey"
            columns: ["bio_region_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_region_trees_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_regions: {
        Row: {
          biome_description: string | null
          boundary_geojson: Json | null
          center_lat: number | null
          center_lon: number | null
          climate_band: string | null
          countries: string[]
          created_at: string
          dominant_species: string[]
          elevation_range: string | null
          governance_status: string
          id: string
          name: string
          parent_id: string | null
          primary_watersheds: string[]
          type: string
          updated_at: string
        }
        Insert: {
          biome_description?: string | null
          boundary_geojson?: Json | null
          center_lat?: number | null
          center_lon?: number | null
          climate_band?: string | null
          countries?: string[]
          created_at?: string
          dominant_species?: string[]
          elevation_range?: string | null
          governance_status?: string
          id: string
          name: string
          parent_id?: string | null
          primary_watersheds?: string[]
          type?: string
          updated_at?: string
        }
        Update: {
          biome_description?: string | null
          boundary_geojson?: Json | null
          center_lat?: number | null
          center_lon?: number | null
          climate_band?: string | null
          countries?: string[]
          created_at?: string
          dominant_species?: string[]
          elevation_range?: string | null
          governance_status?: string
          id?: string
          name?: string
          parent_id?: string | null
          primary_watersheds?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      book_notes: {
        Row: {
          book_entry_id: string
          content: string
          created_at: string
          id: string
          note_type: string
          offered_to_tree_id: string | null
          offering_id: string | null
          page_reference: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          book_entry_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: string
          offered_to_tree_id?: string | null
          offering_id?: string | null
          page_reference?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          book_entry_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          offered_to_tree_id?: string | null
          offering_id?: string | null
          page_reference?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_book_entry_id_fkey"
            columns: ["book_entry_id"]
            isOneToOne: false
            referencedRelation: "bookshelf_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_notes_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookshelf_entries: {
        Row: {
          author: string
          catalog_book_id: string | null
          cover_url: string | null
          created_at: string
          genre: string | null
          id: string
          is_physical_copy: boolean
          isbn: string | null
          linked_council_sessions: string[] | null
          linked_tree_ids: string[] | null
          notes_count: number
          offering_id: string | null
          quote: string | null
          reflection: string | null
          shelf_id: string | null
          source: string
          source_id: string | null
          source_url: string | null
          species_category: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          author: string
          catalog_book_id?: string | null
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_physical_copy?: boolean
          isbn?: string | null
          linked_council_sessions?: string[] | null
          linked_tree_ids?: string[] | null
          notes_count?: number
          offering_id?: string | null
          quote?: string | null
          reflection?: string | null
          shelf_id?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          species_category?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          author?: string
          catalog_book_id?: string | null
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_physical_copy?: boolean
          isbn?: string | null
          linked_council_sessions?: string[] | null
          linked_tree_ids?: string[] | null
          notes_count?: number
          offering_id?: string | null
          quote?: string | null
          reflection?: string | null
          shelf_id?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          species_category?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookshelf_entries_catalog_book_id_fkey"
            columns: ["catalog_book_id"]
            isOneToOne: false
            referencedRelation: "book_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookshelf_entries_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookshelf_entries_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "bookshelves"
            referencedColumns: ["id"]
          },
        ]
      }
      bookshelves: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      bug_comments: {
        Row: {
          bug_id: string
          comment: string
          created_at: string
          id: string
          internal_only: boolean
          user_id: string
        }
        Insert: {
          bug_id: string
          comment: string
          created_at?: string
          id?: string
          internal_only?: boolean
          user_id: string
        }
        Update: {
          bug_id?: string
          comment?: string
          created_at?: string
          id?: string
          internal_only?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_comments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          actual: string
          app_version: string | null
          assigned_to: string | null
          attachments: string[] | null
          created_at: string
          device_info: string | null
          diagnostics: Json | null
          duplicate_of_bug_id: string | null
          expected: string
          feature_area: string
          frequency: string
          hearts_awarded_total: number
          id: string
          include_diagnostics: boolean
          page_route: string | null
          reward_state: string
          severity: string
          status: string
          steps: string
          title: string
          triage_notes: string | null
          updated_at: string
          upvotes_count: number
          user_id: string | null
          watchers_count: number
        }
        Insert: {
          actual: string
          app_version?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          created_at?: string
          device_info?: string | null
          diagnostics?: Json | null
          duplicate_of_bug_id?: string | null
          expected: string
          feature_area?: string
          frequency?: string
          hearts_awarded_total?: number
          id?: string
          include_diagnostics?: boolean
          page_route?: string | null
          reward_state?: string
          severity?: string
          status?: string
          steps: string
          title: string
          triage_notes?: string | null
          updated_at?: string
          upvotes_count?: number
          user_id?: string | null
          watchers_count?: number
        }
        Update: {
          actual?: string
          app_version?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          created_at?: string
          device_info?: string | null
          diagnostics?: Json | null
          duplicate_of_bug_id?: string | null
          expected?: string
          feature_area?: string
          frequency?: string
          hearts_awarded_total?: number
          id?: string
          include_diagnostics?: boolean
          page_route?: string | null
          reward_state?: string
          severity?: string
          status?: string
          steps?: string
          title?: string
          triage_notes?: string | null
          updated_at?: string
          upvotes_count?: number
          user_id?: string | null
          watchers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_duplicate_of_bug_id_fkey"
            columns: ["duplicate_of_bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_upvotes: {
        Row: {
          bug_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bug_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bug_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_upvotes_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_watchers: {
        Row: {
          bug_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bug_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bug_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_watchers_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
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
      collaborator_experiments: {
        Row: {
          created_at: string
          description: string
          id: string
          linked_pod_ids: string[] | null
          linked_tree_ids: string[] | null
          metrics: string | null
          outcome_notes: string | null
          status: string
          timeline: string | null
          updated_at: string
          user_id: string
          volume_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          linked_pod_ids?: string[] | null
          linked_tree_ids?: string[] | null
          metrics?: string | null
          outcome_notes?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id: string
          volume_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          linked_pod_ids?: string[] | null
          linked_tree_ids?: string[] | null
          metrics?: string | null
          outcome_notes?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id?: string
          volume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_experiments_volume_id_fkey"
            columns: ["volume_id"]
            isOneToOne: false
            referencedRelation: "collaborator_volumes"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_volumes: {
        Row: {
          collaborator_name: string
          collaborator_project: string | null
          created_at: string
          divergence_map: string | null
          document_file_url: string | null
          document_title: string
          document_url: string | null
          document_version: string | null
          essence_summary: string | null
          experiment_status: string
          id: string
          integration_intent: string
          linked_council_sessions: string[] | null
          linked_pod_ids: string[] | null
          linked_tree_ids: string[] | null
          micro_experiment: string | null
          open_questions: string[] | null
          resonance_map: string | null
          ring_hearts_awarded: boolean | null
          ripple_hearts_awarded: boolean | null
          themes: string[] | null
          updated_at: string
          user_id: string
          visibility_state: string
          wanderer_summary: string | null
        }
        Insert: {
          collaborator_name: string
          collaborator_project?: string | null
          created_at?: string
          divergence_map?: string | null
          document_file_url?: string | null
          document_title: string
          document_url?: string | null
          document_version?: string | null
          essence_summary?: string | null
          experiment_status?: string
          id?: string
          integration_intent?: string
          linked_council_sessions?: string[] | null
          linked_pod_ids?: string[] | null
          linked_tree_ids?: string[] | null
          micro_experiment?: string | null
          open_questions?: string[] | null
          resonance_map?: string | null
          ring_hearts_awarded?: boolean | null
          ripple_hearts_awarded?: boolean | null
          themes?: string[] | null
          updated_at?: string
          user_id: string
          visibility_state?: string
          wanderer_summary?: string | null
        }
        Update: {
          collaborator_name?: string
          collaborator_project?: string | null
          created_at?: string
          divergence_map?: string | null
          document_file_url?: string | null
          document_title?: string
          document_url?: string | null
          document_version?: string | null
          essence_summary?: string | null
          experiment_status?: string
          id?: string
          integration_intent?: string
          linked_council_sessions?: string[] | null
          linked_pod_ids?: string[] | null
          linked_tree_ids?: string[] | null
          micro_experiment?: string | null
          open_questions?: string[] | null
          resonance_map?: string | null
          ring_hearts_awarded?: boolean | null
          ripple_hearts_awarded?: boolean | null
          themes?: string[] | null
          updated_at?: string
          user_id?: string
          visibility_state?: string
          wanderer_summary?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      council_bio_regions: {
        Row: {
          bio_region_id: string
          council_id: string
          created_at: string
          id: string
        }
        Insert: {
          bio_region_id: string
          council_id: string
          created_at?: string
          id?: string
        }
        Update: {
          bio_region_id?: string
          council_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_bio_regions_bio_region_id_fkey"
            columns: ["bio_region_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_bio_regions_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
        ]
      }
      council_trees: {
        Row: {
          council_id: string
          created_at: string
          id: string
          tree_id: string
        }
        Insert: {
          council_id: string
          created_at?: string
          id?: string
          tree_id: string
        }
        Update: {
          council_id?: string
          created_at?: string
          id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_trees_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_trees_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      councils: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meeting_cadence: string | null
          member_count: number
          name: string
          notion_link: string | null
          scope: string
          scope_ref: string | null
          slug: string
          status: string
          telegram_link: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_cadence?: string | null
          member_count?: number
          name: string
          notion_link?: string | null
          scope?: string
          scope_ref?: string | null
          slug: string
          status?: string
          telegram_link?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_cadence?: string | null
          member_count?: number
          name?: string
          notion_link?: string | null
          scope?: string
          scope_ref?: string | null
          slug?: string
          status?: string
          telegram_link?: string | null
          updated_at?: string
        }
        Relationships: []
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
      external_wisdom_cache: {
        Row: {
          author_name: string | null
          expires_at: string
          fetched_at: string
          id: string
          provider: string
          quote_text: string
          source_title: string | null
        }
        Insert: {
          author_name?: string | null
          expires_at?: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_text: string
          source_title?: string | null
        }
        Update: {
          author_name?: string | null
          expires_at?: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_text?: string
          source_title?: string | null
        }
        Relationships: []
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
      food_cycles: {
        Row: {
          created_at: string
          cultural_associations: string | null
          dormant_months: number[]
          flowering_months: number[]
          fruiting_months: number[]
          harvest_months: number[]
          hemisphere: string
          icon: string
          id: string
          name: string
          notes: string | null
          peak_months: number[]
          regions: Json
          scientific_name: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cultural_associations?: string | null
          dormant_months?: number[]
          flowering_months?: number[]
          fruiting_months?: number[]
          harvest_months?: number[]
          hemisphere?: string
          icon?: string
          id?: string
          name: string
          notes?: string | null
          peak_months?: number[]
          regions?: Json
          scientific_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cultural_associations?: string | null
          dormant_months?: number[]
          flowering_months?: number[]
          fruiting_months?: number[]
          harvest_months?: number[]
          hemisphere?: string
          icon?: string
          id?: string
          name?: string
          notes?: string | null
          peak_months?: number[]
          regions?: Json
          scientific_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      food_producers: {
        Row: {
          contact_link: string | null
          country: string | null
          created_at: string
          food_cycle_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          seasonal_window: string | null
          user_id: string | null
          verified_status: string
        }
        Insert: {
          contact_link?: string | null
          country?: string | null
          created_at?: string
          food_cycle_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          seasonal_window?: string | null
          user_id?: string | null
          verified_status?: string
        }
        Update: {
          contact_link?: string | null
          country?: string | null
          created_at?: string
          food_cycle_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          seasonal_window?: string | null
          user_id?: string | null
          verified_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_producers_food_cycle_id_fkey"
            columns: ["food_cycle_id"]
            isOneToOne: false
            referencedRelation: "food_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_seeds: {
        Row: {
          activated_at: string | null
          created_at: string
          hearts_earned: number | null
          id: string
          invite_code: string | null
          message: string | null
          recipient_id: string | null
          seeds_count: number
          sender_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          hearts_earned?: number | null
          id?: string
          invite_code?: string | null
          message?: string | null
          recipient_id?: string | null
          seeds_count?: number
          sender_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          hearts_earned?: number | null
          id?: string
          invite_code?: string | null
          message?: string | null
          recipient_id?: string | null
          seeds_count?: number
          sender_id?: string
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
      grove_quests: {
        Row: {
          companion_id: string
          completed_at: string | null
          created_at: string
          id: string
          progress_a: number
          progress_b: number
          quest_type: string
          status: string
          target_count: number
          target_species: string | null
        }
        Insert: {
          companion_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_a?: number
          progress_b?: number
          quest_type?: string
          status?: string
          target_count?: number
          target_species?: string | null
        }
        Update: {
          companion_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_a?: number
          progress_b?: number
          quest_type?: string
          status?: string
          target_count?: number
          target_species?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grove_quests_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "grove_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      heart_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          eligibility_rules: string | null
          ends_at: string
          heart_pool: number
          hearts_distributed: number
          id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: string | null
          ends_at: string
          heart_pool?: number
          hearts_distributed?: number
          id?: string
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: string | null
          ends_at?: string
          heart_pool?: number
          hearts_distributed?: number
          id?: string
          starts_at?: string
          status?: string
          title?: string
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
      hive_bio_regions: {
        Row: {
          bio_region_id: string
          created_at: string
          hive_id: string
          id: string
          tree_count: number
        }
        Insert: {
          bio_region_id: string
          created_at?: string
          hive_id: string
          id?: string
          tree_count?: number
        }
        Update: {
          bio_region_id?: string
          created_at?: string
          hive_id?: string
          id?: string
          tree_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "hive_bio_regions_bio_region_id_fkey"
            columns: ["bio_region_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hive_bio_regions_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "species_hives"
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
      influence_vote_budgets: {
        Row: {
          id: string
          spent: number
          user_id: string
          vote_date: string
        }
        Insert: {
          id?: string
          spent?: number
          user_id: string
          vote_date?: string
        }
        Update: {
          id?: string
          spent?: number
          user_id?: string
          vote_date?: string
        }
        Relationships: []
      }
      influence_votes: {
        Row: {
          created_at: string
          id: string
          offering_id: string
          revoked_at: string | null
          scope_key: string
          scope_type: string
          user_id: string
          weight_applied: number
        }
        Insert: {
          created_at?: string
          id?: string
          offering_id: string
          revoked_at?: string | null
          scope_key: string
          scope_type: string
          user_id: string
          weight_applied?: number
        }
        Update: {
          created_at?: string
          id?: string
          offering_id?: string
          revoked_at?: string | null
          scope_key?: string
          scope_type?: string
          user_id?: string
          weight_applied?: number
        }
        Relationships: [
          {
            foreignKeyName: "influence_votes_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
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
      library_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          source_type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_funds_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          market_id: string
          recipient: string
          recipient_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          market_id: string
          recipient: string
          recipient_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          market_id?: string
          recipient?: string
          recipient_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_funds_ledger_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_outcomes: {
        Row: {
          created_at: string
          id: string
          is_winning: boolean | null
          label: string
          market_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_winning?: boolean | null
          label: string
          market_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_winning?: boolean | null
          label?: string
          market_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_resolutions: {
        Row: {
          evidence_refs: string[] | null
          id: string
          market_id: string
          notes: string | null
          resolved_at: string
          resolved_outcome_id: string | null
          resolver_id: string
        }
        Insert: {
          evidence_refs?: string[] | null
          id?: string
          market_id: string
          notes?: string | null
          resolved_at?: string
          resolved_outcome_id?: string | null
          resolver_id: string
        }
        Update: {
          evidence_refs?: string[] | null
          id?: string
          market_id?: string
          notes?: string | null
          resolved_at?: string
          resolved_outcome_id?: string | null
          resolver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_resolutions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_resolutions_resolved_outcome_id_fkey"
            columns: ["resolved_outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      market_seed_stakes: {
        Row: {
          hearts_earned: number | null
          id: string
          market_id: string
          outcome_id: string
          resolved_at: string | null
          seeds_count: number
          staked_at: string
          user_id: string
        }
        Insert: {
          hearts_earned?: number | null
          id?: string
          market_id: string
          outcome_id: string
          resolved_at?: string | null
          seeds_count?: number
          staked_at?: string
          user_id: string
        }
        Update: {
          hearts_earned?: number | null
          id?: string
          market_id?: string
          outcome_id?: string
          resolved_at?: string | null
          seeds_count?: number
          staked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_seed_stakes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_seed_stakes_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      market_stakes: {
        Row: {
          amount: number
          created_at: string
          id: string
          market_id: string
          outcome_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          market_id: string
          outcome_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          market_id?: string
          outcome_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_stakes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_stakes_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          candidate_values: Json | null
          close_time: string
          created_at: string
          creator_reward_cap: number
          creator_user_id: string
          daily_market_budget: number
          description: string | null
          evidence_policy: string | null
          grove_fund_percent: number
          id: string
          is_demo: boolean
          linked_hive_id: string | null
          linked_tree_ids: string[] | null
          market_type: Database["public"]["Enums"]["market_type"]
          max_stake_per_user: number
          metric_source: string | null
          open_time: string
          parameter_key: string | null
          research_pot_percent: number
          resolution_source: string | null
          resolve_time: string | null
          rules_text: string | null
          scope: Database["public"]["Enums"]["market_scope"]
          status: Database["public"]["Enums"]["market_status"]
          success_metric: string | null
          target_scope_id: string | null
          title: string
          trial_window_end: string | null
          trial_window_start: string | null
          updated_at: string
          winner_pool_percent: number
        }
        Insert: {
          candidate_values?: Json | null
          close_time: string
          created_at?: string
          creator_reward_cap?: number
          creator_user_id: string
          daily_market_budget?: number
          description?: string | null
          evidence_policy?: string | null
          grove_fund_percent?: number
          id?: string
          is_demo?: boolean
          linked_hive_id?: string | null
          linked_tree_ids?: string[] | null
          market_type?: Database["public"]["Enums"]["market_type"]
          max_stake_per_user?: number
          metric_source?: string | null
          open_time?: string
          parameter_key?: string | null
          research_pot_percent?: number
          resolution_source?: string | null
          resolve_time?: string | null
          rules_text?: string | null
          scope?: Database["public"]["Enums"]["market_scope"]
          status?: Database["public"]["Enums"]["market_status"]
          success_metric?: string | null
          target_scope_id?: string | null
          title: string
          trial_window_end?: string | null
          trial_window_start?: string | null
          updated_at?: string
          winner_pool_percent?: number
        }
        Update: {
          candidate_values?: Json | null
          close_time?: string
          created_at?: string
          creator_reward_cap?: number
          creator_user_id?: string
          daily_market_budget?: number
          description?: string | null
          evidence_policy?: string | null
          grove_fund_percent?: number
          id?: string
          is_demo?: boolean
          linked_hive_id?: string | null
          linked_tree_ids?: string[] | null
          market_type?: Database["public"]["Enums"]["market_type"]
          max_stake_per_user?: number
          metric_source?: string | null
          open_time?: string
          parameter_key?: string | null
          research_pot_percent?: number
          resolution_source?: string | null
          resolve_time?: string | null
          rules_text?: string | null
          scope?: Database["public"]["Enums"]["market_scope"]
          status?: Database["public"]["Enums"]["market_status"]
          success_metric?: string | null
          target_scope_id?: string | null
          title?: string
          trial_window_end?: string | null
          trial_window_start?: string | null
          updated_at?: string
          winner_pool_percent?: number
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
      notification_preferences: {
        Row: {
          created_at: string
          digest_mode: string
          max_daily_pushes: number
          nearby_mode: boolean
          nearby_radius_m: number
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          topic_cantons: string[]
          topic_councils: string[]
          topic_countries: string[]
          topic_species: string[]
          topic_trees: string[]
          updated_at: string
          user_id: string
          weather_unit: string
          wind_unit: string
        }
        Insert: {
          created_at?: string
          digest_mode?: string
          max_daily_pushes?: number
          nearby_mode?: boolean
          nearby_radius_m?: number
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          topic_cantons?: string[]
          topic_councils?: string[]
          topic_countries?: string[]
          topic_species?: string[]
          topic_trees?: string[]
          updated_at?: string
          user_id: string
          weather_unit?: string
          wind_unit?: string
        }
        Update: {
          created_at?: string
          digest_mode?: string
          max_daily_pushes?: number
          nearby_mode?: boolean
          nearby_radius_m?: number
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          topic_cantons?: string[]
          topic_councils?: string[]
          topic_countries?: string[]
          topic_species?: string[]
          topic_trees?: string[]
          updated_at?: string
          user_id?: string
          weather_unit?: string
          wind_unit?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          deep_link: string | null
          dismissed: boolean
          id: string
          metadata: Json | null
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          deep_link?: string | null
          dismissed?: boolean
          id?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          deep_link?: string | null
          dismissed?: boolean
          id?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
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
          hot_score: number
          id: string
          impact_weight: number
          influence_score: number
          influence_score_by_scope: Json | null
          influence_votes_count: number
          media_url: string | null
          meeting_id: string | null
          nft_link: string | null
          quote_author: string | null
          quote_source: string | null
          quote_text: string | null
          ranked_at: string | null
          sealed_by_staff: string | null
          sky_stamp_id: string | null
          title: string
          tree_id: string
          tree_role: string
          type: Database["public"]["Enums"]["offering_type"]
          visibility: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          hot_score?: number
          id?: string
          impact_weight?: number
          influence_score?: number
          influence_score_by_scope?: Json | null
          influence_votes_count?: number
          media_url?: string | null
          meeting_id?: string | null
          nft_link?: string | null
          quote_author?: string | null
          quote_source?: string | null
          quote_text?: string | null
          ranked_at?: string | null
          sealed_by_staff?: string | null
          sky_stamp_id?: string | null
          title: string
          tree_id: string
          tree_role?: string
          type: Database["public"]["Enums"]["offering_type"]
          visibility?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          hot_score?: number
          id?: string
          impact_weight?: number
          influence_score?: number
          influence_score_by_scope?: Json | null
          influence_votes_count?: number
          media_url?: string | null
          meeting_id?: string | null
          nft_link?: string | null
          quote_author?: string | null
          quote_source?: string | null
          quote_text?: string | null
          ranked_at?: string | null
          sealed_by_staff?: string | null
          sky_stamp_id?: string | null
          title?: string
          tree_id?: string
          tree_role?: string
          type?: Database["public"]["Enums"]["offering_type"]
          visibility?: string
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
            foreignKeyName: "offerings_sky_stamp_id_fkey"
            columns: ["sky_stamp_id"]
            isOneToOne: false
            referencedRelation: "sky_stamps"
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
          visible_fields: Json
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
          visible_fields?: Json
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
          visible_fields?: Json
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
      protocol_config_history: {
        Row: {
          applied_at: string
          applied_by: string | null
          created_at: string
          id: string
          market_id: string | null
          metric_result: Json | null
          new_value: string
          notes: string | null
          parameter_key: string
          previous_value: string | null
          target_scope_id: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string | null
          created_at?: string
          id?: string
          market_id?: string | null
          metric_result?: Json | null
          new_value: string
          notes?: string | null
          parameter_key: string
          previous_value?: string | null
          target_scope_id?: string
        }
        Update: {
          applied_at?: string
          applied_by?: string | null
          created_at?: string
          id?: string
          market_id?: string | null
          metric_result?: Json | null
          new_value?: string
          notes?: string | null
          parameter_key?: string
          previous_value?: string | null
          target_scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_config_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_likes: {
        Row: {
          created_at: string
          id: string
          offering_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offering_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offering_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_likes_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
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
      region_notable_trees: {
        Row: {
          accessibility: string | null
          common_name: string
          country: string
          created_at: string
          estimated_age_label: string | null
          estimated_age_years: number | null
          id: string
          lat: number | null
          locality: string | null
          lon: number | null
          municipality: string
          province: string
          region: string
          relevance: string | null
          scientific_name: string
          source_url: string | null
        }
        Insert: {
          accessibility?: string | null
          common_name: string
          country?: string
          created_at?: string
          estimated_age_label?: string | null
          estimated_age_years?: number | null
          id: string
          lat?: number | null
          locality?: string | null
          lon?: number | null
          municipality: string
          province?: string
          region?: string
          relevance?: string | null
          scientific_name: string
          source_url?: string | null
        }
        Update: {
          accessibility?: string | null
          common_name?: string
          country?: string
          created_at?: string
          estimated_age_label?: string | null
          estimated_age_years?: number | null
          id?: string
          lat?: number | null
          locality?: string | null
          lon?: number | null
          municipality?: string
          province?: string
          region?: string
          relevance?: string | null
          scientific_name?: string
          source_url?: string | null
        }
        Relationships: []
      }
      research_trees: {
        Row: {
          anchor_chain: string | null
          anchored_at: string | null
          country: string
          created_at: string
          crown_spread: string | null
          description: string | null
          designation_type: string
          geo_precision: string
          girth_or_stem: string | null
          height_m: number | null
          id: string
          immutable_anchor_reference: string | null
          immutable_record_id: string | null
          latitude: number | null
          linked_tree_id: string | null
          locality_text: string
          longitude: number | null
          metadata_hash: string | null
          province: string | null
          record_status: string
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
          verification_score: number | null
          verified_by: string | null
        }
        Insert: {
          anchor_chain?: string | null
          anchored_at?: string | null
          country?: string
          created_at?: string
          crown_spread?: string | null
          description?: string | null
          designation_type?: string
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          id?: string
          immutable_anchor_reference?: string | null
          immutable_record_id?: string | null
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text: string
          longitude?: number | null
          metadata_hash?: string | null
          province?: string | null
          record_status?: string
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
          verification_score?: number | null
          verified_by?: string | null
        }
        Update: {
          anchor_chain?: string | null
          anchored_at?: string | null
          country?: string
          created_at?: string
          crown_spread?: string | null
          description?: string | null
          designation_type?: string
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          id?: string
          immutable_anchor_reference?: string | null
          immutable_record_id?: string | null
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text?: string
          longitude?: number | null
          metadata_hash?: string | null
          province?: string | null
          record_status?: string
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
          verification_score?: number | null
          verified_by?: string | null
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
      root_mail: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discovered_at: string | null
          discovered_by: string | null
          id: string
          is_anonymous: boolean
          tree_id: string
          visible_after: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discovered_at?: string | null
          discovered_by?: string | null
          id?: string
          is_anonymous?: boolean
          tree_id: string
          visible_after?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discovered_at?: string | null
          discovered_by?: string | null
          id?: string
          is_anonymous?: boolean
          tree_id?: string
          visible_after?: string
        }
        Relationships: [
          {
            foreignKeyName: "root_mail_tree_id_fkey"
            columns: ["tree_id"]
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
      seasonal_witnesses: {
        Row: {
          created_at: string
          id: string
          offering_id: string | null
          photo_url: string | null
          season: string
          tree_id: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          offering_id?: string | null
          photo_url?: string | null
          season: string
          tree_id: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          offering_id?: string | null
          photo_url?: string | null
          season?: string
          tree_id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_witnesses_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasonal_witnesses_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
      shelf_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          shelf_names: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          shelf_names?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          shelf_names?: string[]
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
      sky_stamps: {
        Row: {
          cache_key: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          seal: Json | null
          sky_core: Json | null
          sky_planets: Json | null
          source_checkin_id: string | null
          source_offering_id: string | null
          source_tree_id: string | null
          source_whisper_id: string | null
          timezone: string | null
          user_id: string
          weather: Json | null
        }
        Insert: {
          cache_key?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          seal?: Json | null
          sky_core?: Json | null
          sky_planets?: Json | null
          source_checkin_id?: string | null
          source_offering_id?: string | null
          source_tree_id?: string | null
          source_whisper_id?: string | null
          timezone?: string | null
          user_id: string
          weather?: Json | null
        }
        Update: {
          cache_key?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          seal?: Json | null
          sky_core?: Json | null
          sky_planets?: Json | null
          source_checkin_id?: string | null
          source_offering_id?: string | null
          source_tree_id?: string | null
          source_whisper_id?: string | null
          timezone?: string | null
          user_id?: string
          weather?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sky_stamps_source_tree_id_fkey"
            columns: ["source_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
      species_attestations: {
        Row: {
          attested_species: string
          confidence: string
          created_at: string
          id: string
          notes: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          attested_species: string
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          attested_species?: string
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_attestations_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
      species_hives: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          family_name: string
          governance_status: string
          icon: string | null
          id: string
          slug: string
          species_patterns: string[]
          tree_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          family_name: string
          governance_status?: string
          icon?: string | null
          id?: string
          slug: string
          species_patterns?: string[]
          tree_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          family_name?: string
          governance_status?: string
          icon?: string | null
          id?: string
          slug?: string
          species_patterns?: string[]
          tree_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      species_phenology: {
        Row: {
          avg_mood: number | null
          id: string
          month: number
          observation_count: number
          region: string | null
          season_stage: string
          species: string
          updated_at: string
          year: number
        }
        Insert: {
          avg_mood?: number | null
          id?: string
          month: number
          observation_count?: number
          region?: string | null
          season_stage: string
          species: string
          updated_at?: string
          year: number
        }
        Update: {
          avg_mood?: number | null
          id?: string
          month?: number
          observation_count?: number
          region?: string | null
          season_stage?: string
          species?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
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
      time_tree_entries: {
        Row: {
          created_at: string
          emotional_tone: string | null
          hearts_awarded: number
          id: string
          is_tree_real: boolean
          linked_wish_id: string | null
          meeting_realised: boolean
          moon_phase: string
          participant_one: string
          participant_two: string
          pilgrimage_flag: boolean
          reward_timestamp: string | null
          tree_name: string
          tree_reference_id: string | null
          updated_at: string
          user_id: string
          what_shared: string
          where_sitting: string | null
        }
        Insert: {
          created_at?: string
          emotional_tone?: string | null
          hearts_awarded?: number
          id?: string
          is_tree_real?: boolean
          linked_wish_id?: string | null
          meeting_realised?: boolean
          moon_phase?: string
          participant_one: string
          participant_two: string
          pilgrimage_flag?: boolean
          reward_timestamp?: string | null
          tree_name: string
          tree_reference_id?: string | null
          updated_at?: string
          user_id: string
          what_shared: string
          where_sitting?: string | null
        }
        Update: {
          created_at?: string
          emotional_tone?: string | null
          hearts_awarded?: number
          id?: string
          is_tree_real?: boolean
          linked_wish_id?: string | null
          meeting_realised?: boolean
          moon_phase?: string
          participant_one?: string
          participant_two?: string
          pilgrimage_flag?: boolean
          reward_timestamp?: string | null
          tree_name?: string
          tree_reference_id?: string | null
          updated_at?: string
          user_id?: string
          what_shared?: string
          where_sitting?: string | null
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
      tree_checkins: {
        Row: {
          birdsong_heard: boolean | null
          canopy_proof: boolean
          checked_in_at: string
          checkin_method: string
          created_at: string
          fungi_present: boolean | null
          health_notes: string | null
          id: string
          latitude: number | null
          longitude: number | null
          media_url: string | null
          minted_status: string
          mood_score: number | null
          privacy: string
          reflection: string | null
          season_stage: string
          sky_stamp_id: string | null
          tree_id: string
          updated_at: string
          user_id: string
          weather: string | null
          weather_snapshot_id: string | null
        }
        Insert: {
          birdsong_heard?: boolean | null
          canopy_proof?: boolean
          checked_in_at?: string
          checkin_method?: string
          created_at?: string
          fungi_present?: boolean | null
          health_notes?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          media_url?: string | null
          minted_status?: string
          mood_score?: number | null
          privacy?: string
          reflection?: string | null
          season_stage?: string
          sky_stamp_id?: string | null
          tree_id: string
          updated_at?: string
          user_id: string
          weather?: string | null
          weather_snapshot_id?: string | null
        }
        Update: {
          birdsong_heard?: boolean | null
          canopy_proof?: boolean
          checked_in_at?: string
          checkin_method?: string
          created_at?: string
          fungi_present?: boolean | null
          health_notes?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          media_url?: string | null
          minted_status?: string
          mood_score?: number | null
          privacy?: string
          reflection?: string | null
          season_stage?: string
          sky_stamp_id?: string | null
          tree_id?: string
          updated_at?: string
          user_id?: string
          weather?: string | null
          weather_snapshot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_checkins_sky_stamp_id_fkey"
            columns: ["sky_stamp_id"]
            isOneToOne: false
            referencedRelation: "sky_stamps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_checkins_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_checkins_weather_snapshot_id_fkey"
            columns: ["weather_snapshot_id"]
            isOneToOne: false
            referencedRelation: "weather_snapshots"
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
      tree_sources: {
        Row: {
          contributor_email: string | null
          contributor_name: string | null
          created_at: string
          description: string | null
          id: string
          research_tree_id: string | null
          source_title: string
          source_type: string
          submitted_at: string
          submitted_by: string | null
          tree_id: string
          updated_at: string
          url: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          research_tree_id?: string | null
          source_title: string
          source_type?: string
          submitted_at?: string
          submitted_by?: string | null
          tree_id: string
          updated_at?: string
          url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          research_tree_id?: string | null
          source_title?: string
          source_type?: string
          submitted_at?: string
          submitted_by?: string | null
          tree_id?: string
          updated_at?: string
          url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_sources_research_tree_id_fkey"
            columns: ["research_tree_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_whisper_collections: {
        Row: {
          collected_at: string
          collected_tree_id: string | null
          id: string
          user_id: string
          whisper_id: string
        }
        Insert: {
          collected_at?: string
          collected_tree_id?: string | null
          id?: string
          user_id: string
          whisper_id: string
        }
        Update: {
          collected_at?: string
          collected_tree_id?: string | null
          id?: string
          user_id?: string
          whisper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_whisper_collections_collected_tree_id_fkey"
            columns: ["collected_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_whisper_collections_whisper_id_fkey"
            columns: ["whisper_id"]
            isOneToOne: false
            referencedRelation: "tree_whispers"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_whispers: {
        Row: {
          circle_id: string | null
          collected_at: string | null
          collected_tree_id: string | null
          created_at: string
          delivery_scope: string
          delivery_species_key: string | null
          delivery_tree_id: string | null
          expires_at: string | null
          id: string
          media_url: string | null
          message_content: string
          recipient_scope: string
          recipient_user_id: string | null
          sender_user_id: string
          sky_stamp_id: string | null
          status: string
          tree_anchor_id: string
        }
        Insert: {
          circle_id?: string | null
          collected_at?: string | null
          collected_tree_id?: string | null
          created_at?: string
          delivery_scope?: string
          delivery_species_key?: string | null
          delivery_tree_id?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string | null
          message_content: string
          recipient_scope?: string
          recipient_user_id?: string | null
          sender_user_id: string
          sky_stamp_id?: string | null
          status?: string
          tree_anchor_id: string
        }
        Update: {
          circle_id?: string | null
          collected_at?: string | null
          collected_tree_id?: string | null
          created_at?: string
          delivery_scope?: string
          delivery_species_key?: string | null
          delivery_tree_id?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string | null
          message_content?: string
          recipient_scope?: string
          recipient_user_id?: string | null
          sender_user_id?: string
          sky_stamp_id?: string | null
          status?: string
          tree_anchor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_whispers_collected_tree_id_fkey"
            columns: ["collected_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_whispers_delivery_tree_id_fkey"
            columns: ["delivery_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_whispers_sky_stamp_id_fkey"
            columns: ["sky_stamp_id"]
            isOneToOne: false
            referencedRelation: "sky_stamps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_whispers_tree_anchor_id_fkey"
            columns: ["tree_anchor_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
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
          is_churchyard_tree: boolean | null
          latitude: number | null
          lineage: string | null
          linked_churchyard_id: string | null
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
          is_churchyard_tree?: boolean | null
          latitude?: number | null
          lineage?: string | null
          linked_churchyard_id?: string | null
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
          is_churchyard_tree?: boolean | null
          latitude?: number | null
          lineage?: string | null
          linked_churchyard_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "trees_linked_churchyard_id_fkey"
            columns: ["linked_churchyard_id"]
            isOneToOne: false
            referencedRelation: "uk_churchyards"
            referencedColumns: ["id"]
          },
        ]
      }
      uk_churchyards: {
        Row: {
          address: string | null
          church_name: string
          created_at: string
          denomination: string | null
          id: string
          last_mapped_at: string | null
          latitude: number | null
          longitude: number | null
          oldest_tree_estimate: number | null
          region: string
          submitted_by: string | null
          trees_mapped_count: number
          updated_at: string
          verified: boolean
          what3words: string | null
        }
        Insert: {
          address?: string | null
          church_name: string
          created_at?: string
          denomination?: string | null
          id?: string
          last_mapped_at?: string | null
          latitude?: number | null
          longitude?: number | null
          oldest_tree_estimate?: number | null
          region?: string
          submitted_by?: string | null
          trees_mapped_count?: number
          updated_at?: string
          verified?: boolean
          what3words?: string | null
        }
        Update: {
          address?: string | null
          church_name?: string
          created_at?: string
          denomination?: string | null
          id?: string
          last_mapped_at?: string | null
          latitude?: number | null
          longitude?: number | null
          oldest_tree_estimate?: number | null
          region?: string
          submitted_by?: string | null
          trees_mapped_count?: number
          updated_at?: string
          verified?: boolean
          what3words?: string | null
        }
        Relationships: []
      }
      user_heart_balances: {
        Row: {
          influence_tokens: number
          s33d_hearts: number
          species_hearts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          influence_tokens?: number
          s33d_hearts?: number
          species_hearts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          influence_tokens?: number
          s33d_hearts?: number
          species_hearts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_market_profile: {
        Row: {
          accuracy_pct: number | null
          markets_entered: number
          markets_won: number
          total_staked: number
          total_to_grove: number
          total_won: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_pct?: number | null
          markets_entered?: number
          markets_won?: number
          total_staked?: number
          total_to_grove?: number
          total_won?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_pct?: number | null
          markets_entered?: number
          markets_won?: number
          total_staked?: number
          total_to_grove?: number
          total_won?: number
          updated_at?: string
          user_id?: string
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
      value_proposal_supports: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "value_proposal_supports_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "value_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      value_proposals: {
        Row: {
          created_at: string
          description: string
          id: string
          moderator_note: string | null
          proposed_by: string
          status: string
          suggested_duration: string | null
          suggested_hearts: number
          support_count: number
          title: string
          updated_at: string
          verification_level: string
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          moderator_note?: string | null
          proposed_by: string
          status?: string
          suggested_duration?: string | null
          suggested_hearts?: number
          support_count?: number
          title: string
          updated_at?: string
          verification_level?: string
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          moderator_note?: string | null
          proposed_by?: string
          status?: string
          suggested_duration?: string | null
          suggested_hearts?: number
          support_count?: number
          title?: string
          updated_at?: string
          verification_level?: string
          why_it_matters?: string | null
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
      weather_snapshots: {
        Row: {
          alerts: Json | null
          current_clouds: number | null
          current_feels_like: number | null
          current_humidity: number | null
          current_temp: number | null
          current_uvi: number | null
          current_visibility: number | null
          current_weather_code: number | null
          current_weather_desc: string | null
          current_weather_icon: string | null
          current_wind_gust: number | null
          current_wind_speed: number | null
          daily_forecast: Json | null
          fetched_at: string
          id: string
          latitude: number
          longitude: number
          rain_1h: number | null
          snow_1h: number | null
          source: string
        }
        Insert: {
          alerts?: Json | null
          current_clouds?: number | null
          current_feels_like?: number | null
          current_humidity?: number | null
          current_temp?: number | null
          current_uvi?: number | null
          current_visibility?: number | null
          current_weather_code?: number | null
          current_weather_desc?: string | null
          current_weather_icon?: string | null
          current_wind_gust?: number | null
          current_wind_speed?: number | null
          daily_forecast?: Json | null
          fetched_at?: string
          id?: string
          latitude: number
          longitude: number
          rain_1h?: number | null
          snow_1h?: number | null
          source?: string
        }
        Update: {
          alerts?: Json | null
          current_clouds?: number | null
          current_feels_like?: number | null
          current_humidity?: number | null
          current_temp?: number | null
          current_uvi?: number | null
          current_visibility?: number | null
          current_weather_code?: number | null
          current_weather_desc?: string | null
          current_weather_icon?: string | null
          current_wind_gust?: number | null
          current_wind_speed?: number | null
          daily_forecast?: Json | null
          fetched_at?: string
          id?: string
          latitude?: number
          longitude?: number
          rain_1h?: number | null
          snow_1h?: number | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      tree_sources_public: {
        Row: {
          contributor_name: string | null
          description: string | null
          id: string | null
          research_tree_id: string | null
          source_title: string | null
          source_type: string | null
          submitted_at: string | null
          submitted_by: string | null
          tree_id: string | null
          url: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contributor_name?: string | null
          description?: string | null
          id?: string | null
          research_tree_id?: string | null
          source_title?: string | null
          source_type?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tree_id?: string | null
          url?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contributor_name?: string | null
          description?: string | null
          id?: string | null
          research_tree_id?: string | null
          source_title?: string | null
          source_type?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tree_id?: string | null
          url?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_sources_research_tree_id_fkey"
            columns: ["research_tree_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_daily_signups: {
        Args: { days_back?: number }
        Returns: {
          day: string
          signups: number
        }[]
      }
      admin_daily_trees: {
        Args: { days_back?: number }
        Returns: {
          day: string
          trees_mapped: number
        }[]
      }
      admin_economy_health: { Args: never; Returns: Json }
      admin_feature_health: { Args: never; Returns: Json }
      admin_geographic_coverage: {
        Args: never
        Returns: {
          nation: string
          offering_count: number
          tree_count: number
          wanderer_count: number
        }[]
      }
      admin_platform_overview: { Args: never; Returns: Json }
      admin_species_coverage: {
        Args: never
        Returns: {
          checkin_count: number
          offering_count: number
          species: string
          tree_count: number
          unique_visitors: number
        }[]
      }
      aggregate_phenology: { Args: never; Returns: undefined }
      award_bug_hearts: {
        Args: { p_amount: number; p_bug_id: string; p_curator_id: string }
        Returns: undefined
      }
      can_view_message: { Args: { msg_room_id: string }; Returns: boolean }
      cast_influence_vote: {
        Args: {
          p_offering_id: string
          p_scope_key: string
          p_scope_type: string
          p_user_id: string
          p_weight: number
        }
        Returns: string
      }
      claim_windfall_hearts: {
        Args: { p_tree_id: string; p_user_id: string }
        Returns: number
      }
      compute_hot_score: {
        Args: { p_created_at: string; p_influence: number }
        Returns: number
      }
      get_bio_region_trees: {
        Args: { p_bio_region_id: string }
        Returns: {
          id: string
          latitude: number
          longitude: number
          name: string
          nation: string
          species: string
        }[]
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
          facebook_handle: string
          full_name: string
          home_place: string
          id: string
          instagram_handle: string
          is_discoverable: boolean
          x_handle: string
        }[]
      }
      get_shared_plants: {
        Args: { result_limit?: number }
        Returns: {
          created_at: string
          id: string
          name: string
          photo_url: string
          species: string
        }[]
      }
      get_species_bio_regions: {
        Args: { p_species_pattern: string }
        Returns: {
          bio_region_id: string
          bio_region_name: string
          bio_region_type: string
          tree_count: number
        }[]
      }
      get_stewardship_leaderboard: {
        Args: { p_tree_id: string; result_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          offering_count: number
          total_impact: number
          user_id: string
        }[]
      }
      get_top_grove_quotes: {
        Args: { p_limit?: number; p_timeframe?: string }
        Returns: {
          computed_score: number
          created_at: string
          created_by: string
          creator_avatar: string
          creator_name: string
          influence_score: number
          like_count: number
          offering_id: string
          quote_author: string
          quote_source: string
          quote_text: string
          tree_id: string
        }[]
      }
      get_tree_bio_regions: {
        Args: { p_tree_id: string }
        Returns: {
          id: string
          name: string
          type: string
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
      get_tree_offering_summary: {
        Args: { p_tree_id: string }
        Returns: {
          cnt: number
          has_photo: boolean
          type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tree_meeting: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      increment_proposal_support: {
        Args: { p_id: string; p_weight: number }
        Returns: undefined
      }
      record_visit: {
        Args: { p_user_id?: string }
        Returns: {
          ancient_friend_index: number
          total_visits: number
          visitor_number: number
        }[]
      }
      retract_influence_vote: {
        Args: { p_user_id: string; p_vote_id: string }
        Returns: undefined
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
      validate_invite_code: {
        Args: { p_code: string }
        Returns: {
          created_by: string
          id: string
        }[]
      }
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
      market_scope: "tree" | "grove" | "species" | "region"
      market_status: "draft" | "open" | "closed" | "resolved" | "cancelled"
      market_type: "binary" | "date_range" | "numeric" | "protocol_parameter"
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
      market_scope: ["tree", "grove", "species", "region"],
      market_status: ["draft", "open", "closed", "resolved", "cancelled"],
      market_type: ["binary", "date_range", "numeric", "protocol_parameter"],
      offering_type: ["photo", "poem", "song", "story", "nft", "voice", "book"],
    },
  },
} as const
