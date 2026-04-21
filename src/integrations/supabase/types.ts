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
      agent_capabilities: {
        Row: {
          active: boolean
          agent_id: string
          capability_type: string
          created_at: string
          id: string
          input_formats: string[]
          output_formats: string[]
          regions: string[]
          species_focus: string[]
        }
        Insert: {
          active?: boolean
          agent_id: string
          capability_type?: string
          created_at?: string
          id?: string
          input_formats?: string[]
          output_formats?: string[]
          regions?: string[]
          species_focus?: string[]
        }
        Update: {
          active?: boolean
          agent_id?: string
          capability_type?: string
          created_at?: string
          id?: string
          input_formats?: string[]
          output_formats?: string[]
          regions?: string[]
          species_focus?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "agent_capabilities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_contribution_events: {
        Row: {
          agent_id: string
          contribution_type: string
          created_at: string
          dataset_id: string | null
          hearts_awarded: number
          id: string
          payload_json: Json | null
          research_tree_record_id: string | null
          reward_status: string
          rewarded_at: string | null
          source_id: string | null
          spark_report_id: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string
        }
        Insert: {
          agent_id: string
          contribution_type?: string
          created_at?: string
          dataset_id?: string | null
          hearts_awarded?: number
          id?: string
          payload_json?: Json | null
          research_tree_record_id?: string | null
          reward_status?: string
          rewarded_at?: string | null
          source_id?: string | null
          spark_report_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string
        }
        Update: {
          agent_id?: string
          contribution_type?: string
          created_at?: string
          dataset_id?: string | null
          hearts_awarded?: number
          id?: string
          payload_json?: Json | null
          research_tree_record_id?: string | null
          reward_status?: string
          rewarded_at?: string | null
          source_id?: string | null
          spark_report_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_contribution_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contribution_events_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contribution_events_research_tree_record_id_fkey"
            columns: ["research_tree_record_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contribution_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contribution_events_spark_report_id_fkey"
            columns: ["spark_report_id"]
            isOneToOne: false
            referencedRelation: "spark_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_contributions: {
        Row: {
          agent_id: string
          contribution_type: string
          created_at: string
          hearts_awarded: number | null
          id: string
          metadata: Json | null
          source_id: string | null
          status: string
          tree_id: string | null
          updated_at: string
          verification_notes: string | null
        }
        Insert: {
          agent_id: string
          contribution_type?: string
          created_at?: string
          hearts_awarded?: number | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          status?: string
          tree_id?: string | null
          updated_at?: string
          verification_notes?: string | null
        }
        Update: {
          agent_id?: string
          contribution_type?: string
          created_at?: string
          hearts_awarded?: number | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          status?: string
          tree_id?: string | null
          updated_at?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_contributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contributions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contributions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_contributions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_findings: {
        Row: {
          created_at: string
          curator_notes: string | null
          description: string
          id: string
          review_status: string
          route: string | null
          run_id: string
          screenshot_url: string | null
          severity: string
          suggested_bug_garden_post_id: string | null
          title: string
          trace_json: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          curator_notes?: string | null
          description: string
          id?: string
          review_status?: string
          route?: string | null
          run_id: string
          screenshot_url?: string | null
          severity?: string
          suggested_bug_garden_post_id?: string | null
          title: string
          trace_json?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          curator_notes?: string | null
          description?: string
          id?: string
          review_status?: string
          route?: string | null
          run_id?: string
          screenshot_url?: string | null
          severity?: string
          suggested_bug_garden_post_id?: string | null
          title?: string
          trace_json?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_garden_tasks: {
        Row: {
          category: string
          claimed_by_agent_id: string | null
          country: string | null
          created_at: string
          dataset_id: string | null
          description: string | null
          hearts_reward: number
          id: string
          max_submissions: number
          proof_requirements: string | null
          purpose: string | null
          region: string | null
          reward_max: number
          reward_min: number
          roadmap_feature_slug: string | null
          source_id: string | null
          species: string | null
          status: string
          submissions_count: number
          system_area: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          claimed_by_agent_id?: string | null
          country?: string | null
          created_at?: string
          dataset_id?: string | null
          description?: string | null
          hearts_reward?: number
          id?: string
          max_submissions?: number
          proof_requirements?: string | null
          purpose?: string | null
          region?: string | null
          reward_max?: number
          reward_min?: number
          roadmap_feature_slug?: string | null
          source_id?: string | null
          species?: string | null
          status?: string
          submissions_count?: number
          system_area?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          claimed_by_agent_id?: string | null
          country?: string | null
          created_at?: string
          dataset_id?: string | null
          description?: string | null
          hearts_reward?: number
          id?: string
          max_submissions?: number
          proof_requirements?: string | null
          purpose?: string | null
          region?: string | null
          reward_max?: number
          reward_min?: number
          roadmap_feature_slug?: string | null
          source_id?: string | null
          species?: string | null
          status?: string
          submissions_count?: number
          system_area?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_garden_tasks_claimed_by_agent_id_fkey"
            columns: ["claimed_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_garden_tasks_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_garden_tasks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_journeys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_path: string
          id: string
          is_active: boolean
          slug: string
          steps_json: Json
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_path?: string
          id?: string
          is_active?: boolean
          slug: string
          steps_json?: Json
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_path?: string
          id?: string
          is_active?: boolean
          slug?: string
          steps_json?: Json
          title?: string
        }
        Relationships: []
      }
      agent_profiles: {
        Row: {
          agent_name: string
          agent_role: string
          agent_type: string
          api_endpoint: string | null
          auth_method: string
          avatar_emoji: string | null
          connected_datasets: string[] | null
          connection_mode: string
          contributions: number | null
          created_at: string
          creator: string
          datasets_discovered: number | null
          description: string | null
          external_marketplace: string | null
          hearts_earned: number | null
          id: string
          last_active: string | null
          registration_source: string | null
          rejected_contributions: number
          specialization: string | null
          status: string
          tier: string
          trees_added: number | null
          trust_score: number | null
          updated_at: string
          verified_contributions: number
        }
        Insert: {
          agent_name: string
          agent_role?: string
          agent_type?: string
          api_endpoint?: string | null
          auth_method?: string
          avatar_emoji?: string | null
          connected_datasets?: string[] | null
          connection_mode?: string
          contributions?: number | null
          created_at?: string
          creator: string
          datasets_discovered?: number | null
          description?: string | null
          external_marketplace?: string | null
          hearts_earned?: number | null
          id?: string
          last_active?: string | null
          registration_source?: string | null
          rejected_contributions?: number
          specialization?: string | null
          status?: string
          tier?: string
          trees_added?: number | null
          trust_score?: number | null
          updated_at?: string
          verified_contributions?: number
        }
        Update: {
          agent_name?: string
          agent_role?: string
          agent_type?: string
          api_endpoint?: string | null
          auth_method?: string
          avatar_emoji?: string | null
          connected_datasets?: string[] | null
          connection_mode?: string
          contributions?: number | null
          created_at?: string
          creator?: string
          datasets_discovered?: number | null
          description?: string | null
          external_marketplace?: string | null
          hearts_earned?: number | null
          id?: string
          last_active?: string | null
          registration_source?: string | null
          rejected_contributions?: number
          specialization?: string | null
          status?: string
          tier?: string
          trees_added?: number | null
          trust_score?: number | null
          updated_at?: string
          verified_contributions?: number
        }
        Relationships: []
      }
      agent_reward_ledger: {
        Row: {
          agent_id: string
          contribution_event_id: string | null
          created_at: string
          hearts_amount: number
          id: string
          issued_at: string | null
          reason: string | null
          reward_type: string
          status: string
        }
        Insert: {
          agent_id: string
          contribution_event_id?: string | null
          created_at?: string
          hearts_amount?: number
          id?: string
          issued_at?: string | null
          reason?: string | null
          reward_type?: string
          status?: string
        }
        Update: {
          agent_id?: string
          contribution_event_id?: string | null
          created_at?: string
          hearts_amount?: number
          id?: string
          issued_at?: string | null
          reason?: string | null
          reward_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reward_ledger_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reward_ledger_contribution_event_id_fkey"
            columns: ["contribution_event_id"]
            isOneToOne: false
            referencedRelation: "agent_contribution_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_id: string | null
          build_id: string | null
          created_at: string
          environment: string | null
          finished_at: string | null
          id: string
          journey_id: string
          score: number | null
          started_at: string | null
          status: string
          summary: string | null
        }
        Insert: {
          agent_id?: string | null
          build_id?: string | null
          created_at?: string
          environment?: string | null
          finished_at?: string | null
          id?: string
          journey_id: string
          score?: number | null
          started_at?: string | null
          status?: string
          summary?: string | null
        }
        Update: {
          agent_id?: string | null
          build_id?: string | null
          created_at?: string
          environment?: string | null
          finished_at?: string | null
          id?: string
          journey_id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "agent_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
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
      background_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json
          priority: number
          scheduled_for: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          payload?: Json
          priority?: number
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
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
          {
            foreignKeyName: "bio_region_trees_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          cover_image: string | null
          created_at: string
          dominant_species: string[]
          elevation_range: string | null
          flagship_species_keys: string[] | null
          governance_status: string
          hemisphere: string | null
          id: string
          name: string
          parent_id: string | null
          primary_watersheds: string[]
          short_description: string | null
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
          cover_image?: string | null
          created_at?: string
          dominant_species?: string[]
          elevation_range?: string | null
          flagship_species_keys?: string[] | null
          governance_status?: string
          hemisphere?: string | null
          id: string
          name: string
          parent_id?: string | null
          primary_watersheds?: string[]
          short_description?: string | null
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
          cover_image?: string | null
          created_at?: string
          dominant_species?: string[]
          elevation_range?: string | null
          flagship_species_keys?: string[] | null
          governance_status?: string
          hemisphere?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          primary_watersheds?: string[]
          short_description?: string | null
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
      bioregion_seasonal_markers: {
        Row: {
          bioregion_id: string
          confidence: string
          created_at: string
          description: string | null
          elevation_band: string | null
          emoji: string | null
          id: string
          marker_type: string
          metadata: Json | null
          name: string
          sort_order: number
          species_keys: string[] | null
          typical_month_end: number
          typical_month_start: number
        }
        Insert: {
          bioregion_id: string
          confidence?: string
          created_at?: string
          description?: string | null
          elevation_band?: string | null
          emoji?: string | null
          id?: string
          marker_type?: string
          metadata?: Json | null
          name: string
          sort_order?: number
          species_keys?: string[] | null
          typical_month_end: number
          typical_month_start: number
        }
        Update: {
          bioregion_id?: string
          confidence?: string
          created_at?: string
          description?: string | null
          elevation_band?: string | null
          emoji?: string | null
          id?: string
          marker_type?: string
          metadata?: Json | null
          name?: string
          sort_order?: number
          species_keys?: string[] | null
          typical_month_end?: number
          typical_month_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "bioregion_seasonal_markers_bioregion_id_fkey"
            columns: ["bioregion_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      bioregion_seed_windows: {
        Row: {
          bioregion_id: string
          created_at: string
          dormant_month_end: number | null
          dormant_month_start: number | null
          harvest_month_end: number | null
          harvest_month_start: number | null
          id: string
          notes: string | null
          sow_month_end: number | null
          sow_month_start: number | null
          species_key: string
          species_name: string
        }
        Insert: {
          bioregion_id: string
          created_at?: string
          dormant_month_end?: number | null
          dormant_month_start?: number | null
          harvest_month_end?: number | null
          harvest_month_start?: number | null
          id?: string
          notes?: string | null
          sow_month_end?: number | null
          sow_month_start?: number | null
          species_key: string
          species_name: string
        }
        Update: {
          bioregion_id?: string
          created_at?: string
          dormant_month_end?: number | null
          dormant_month_start?: number | null
          harvest_month_end?: number | null
          harvest_month_start?: number | null
          id?: string
          notes?: string | null
          sow_month_end?: number | null
          sow_month_start?: number | null
          species_key?: string
          species_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bioregion_seed_windows_bioregion_id_fkey"
            columns: ["bioregion_id"]
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
          {
            foreignKeyName: "birdsong_offerings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      bot_handoffs: {
        Row: {
          bot_name: string | null
          campaign: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          expires_at: string
          external_user_hash: string | null
          flow_name: string | null
          gift_code: string | null
          id: string
          intent: string | null
          invite_code: string | null
          last_opened_at: string | null
          message_template_key: string | null
          open_count: number
          payload: Json | null
          payload_version: number
          return_to: string | null
          source: string
          status: string
          step_key: string | null
          token: string
          updated_at: string
        }
        Insert: {
          bot_name?: string | null
          campaign?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          external_user_hash?: string | null
          flow_name?: string | null
          gift_code?: string | null
          id?: string
          intent?: string | null
          invite_code?: string | null
          last_opened_at?: string | null
          message_template_key?: string | null
          open_count?: number
          payload?: Json | null
          payload_version?: number
          return_to?: string | null
          source?: string
          status?: string
          step_key?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          bot_name?: string | null
          campaign?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          external_user_hash?: string | null
          flow_name?: string | null
          gift_code?: string | null
          id?: string
          intent?: string | null
          invite_code?: string | null
          last_opened_at?: string | null
          message_template_key?: string | null
          open_count?: number
          payload?: Json | null
          payload_version?: number
          return_to?: string | null
          source?: string
          status?: string
          step_key?: string | null
          token?: string
          updated_at?: string
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
          report_type: string
          reward_state: string
          roadmap_feature_slug: string | null
          screenshot_urls: string[] | null
          severity: string
          status: string
          steps: string
          suggestion: string | null
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
          report_type?: string
          reward_state?: string
          roadmap_feature_slug?: string | null
          screenshot_urls?: string[] | null
          severity?: string
          status?: string
          steps: string
          suggestion?: string | null
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
          report_type?: string
          reward_state?: string
          roadmap_feature_slug?: string | null
          screenshot_urls?: string[] | null
          severity?: string
          status?: string
          steps?: string
          suggestion?: string | null
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
      calendar_lenses: {
        Row: {
          attribution: string | null
          created_at: string
          description: string | null
          disclaimer: string | null
          icon: string | null
          id: string
          is_default: boolean
          lens_type: string
          lineage: string | null
          name: string
          region: string | null
          slug: string
          sources: Json | null
          version: number
        }
        Insert: {
          attribution?: string | null
          created_at?: string
          description?: string | null
          disclaimer?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          lens_type?: string
          lineage?: string | null
          name: string
          region?: string | null
          slug: string
          sources?: Json | null
          version?: number
        }
        Update: {
          attribution?: string | null
          created_at?: string
          description?: string | null
          disclaimer?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          lens_type?: string
          lineage?: string | null
          name?: string
          region?: string | null
          slug?: string
          sources?: Json | null
          version?: number
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
          {
            foreignKeyName: "chat_rooms_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      compute_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_key: string
          metric_type: string
          recorded_at: string
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_key: string
          metric_type: string
          recorded_at?: string
          value?: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_key?: string
          metric_type?: string
          recorded_at?: string
          value?: number
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
          linked_at: string
          provider: string
          provider_metadata: Json | null
          provider_user_id: string
          provider_username: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          linked_at?: string
          provider: string
          provider_metadata?: Json | null
          provider_user_id: string
          provider_username?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          linked_at?: string
          provider?: string
          provider_metadata?: Json | null
          provider_user_id?: string
          provider_username?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
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
      contribution_supports: {
        Row: {
          contribution_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contribution_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contribution_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_supports_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "tree_contributions"
            referencedColumns: ["id"]
          },
        ]
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
      council_market_links: {
        Row: {
          council_id: string
          created_at: string
          id: string
          linked_by: string
          market_id: string
          notes: string | null
        }
        Insert: {
          council_id: string
          created_at?: string
          id?: string
          linked_by: string
          market_id: string
          notes?: string | null
        }
        Update: {
          council_id?: string
          created_at?: string
          id?: string
          linked_by?: string
          market_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "council_market_links_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_market_links_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      council_participation_rewards: {
        Row: {
          council_id: string
          created_at: string
          gathering_date: string
          hearts_awarded: number
          id: string
          influence_awarded: number
          notes: string | null
          reward_type: string
          user_id: string
        }
        Insert: {
          council_id: string
          created_at?: string
          gathering_date: string
          hearts_awarded?: number
          id?: string
          influence_awarded?: number
          notes?: string | null
          reward_type?: string
          user_id: string
        }
        Update: {
          council_id?: string
          created_at?: string
          gathering_date?: string
          hearts_awarded?: number
          id?: string
          influence_awarded?: number
          notes?: string | null
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_participation_rewards_council_id_fkey"
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
          {
            foreignKeyName: "council_trees_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          {
            foreignKeyName: "daily_reward_caps_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_crawl_runs: {
        Row: {
          agent_id: string | null
          candidates_found: number
          config_json: Json | null
          created_at: string
          error_log: string | null
          finished_at: string | null
          id: string
          pages_scraped: number
          source_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          candidates_found?: number
          config_json?: Json | null
          created_at?: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          pages_scraped?: number
          source_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          candidates_found?: number
          config_json?: Json | null
          created_at?: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          pages_scraped?: number
          source_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_crawl_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_crawl_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_discovery_queue: {
        Row: {
          access_type: string
          api_available: boolean
          country_code: string | null
          country_name: string | null
          created_at: string
          data_format: string
          dataset_type: string
          discovered_by: string | null
          discovery_confidence: string
          discovery_method: string
          download_available: boolean
          estimated_record_count: number | null
          geo_available: boolean
          id: string
          individual_trees: boolean
          license_notes: string | null
          priority_tier: string | null
          promoted_source_id: string | null
          readiness_score: number | null
          region_name: string | null
          review_notes: string | null
          score_geographic_precision: number | null
          score_heritage_value: number | null
          score_individual_records: number | null
          score_licensing_clarity: number | null
          score_map_compatibility: number | null
          score_official_status: number | null
          score_public_accessibility: number | null
          score_species_detail: number | null
          score_story_value: number | null
          score_update_frequency: number | null
          source_name: string
          source_org: string | null
          source_url: string | null
          species_detail: boolean
          status: string
          update_frequency: string | null
          updated_at: string
        }
        Insert: {
          access_type?: string
          api_available?: boolean
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          data_format?: string
          dataset_type?: string
          discovered_by?: string | null
          discovery_confidence?: string
          discovery_method?: string
          download_available?: boolean
          estimated_record_count?: number | null
          geo_available?: boolean
          id?: string
          individual_trees?: boolean
          license_notes?: string | null
          priority_tier?: string | null
          promoted_source_id?: string | null
          readiness_score?: number | null
          region_name?: string | null
          review_notes?: string | null
          score_geographic_precision?: number | null
          score_heritage_value?: number | null
          score_individual_records?: number | null
          score_licensing_clarity?: number | null
          score_map_compatibility?: number | null
          score_official_status?: number | null
          score_public_accessibility?: number | null
          score_species_detail?: number | null
          score_story_value?: number | null
          score_update_frequency?: number | null
          source_name: string
          source_org?: string | null
          source_url?: string | null
          species_detail?: boolean
          status?: string
          update_frequency?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: string
          api_available?: boolean
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          data_format?: string
          dataset_type?: string
          discovered_by?: string | null
          discovery_confidence?: string
          discovery_method?: string
          download_available?: boolean
          estimated_record_count?: number | null
          geo_available?: boolean
          id?: string
          individual_trees?: boolean
          license_notes?: string | null
          priority_tier?: string | null
          promoted_source_id?: string | null
          readiness_score?: number | null
          region_name?: string | null
          review_notes?: string | null
          score_geographic_precision?: number | null
          score_heritage_value?: number | null
          score_individual_records?: number | null
          score_licensing_clarity?: number | null
          score_map_compatibility?: number | null
          score_official_status?: number | null
          score_public_accessibility?: number | null
          score_species_detail?: number | null
          score_story_value?: number | null
          score_update_frequency?: number | null
          source_name?: string
          source_org?: string | null
          source_url?: string | null
          species_detail?: boolean
          status?: string
          update_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_discovery_queue_promoted_source_id_fkey"
            columns: ["promoted_source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_watch_state: {
        Row: {
          change_confidence: string
          change_detected: boolean
          change_explanation: string | null
          check_count: number
          consecutive_failures: number
          created_at: string
          dataset_id: string | null
          id: string
          last_checked_at: string | null
          last_known_file_size: number | null
          last_known_file_url: string | null
          last_known_record_count: number | null
          last_known_source_hash: string | null
          last_known_updated_label: string | null
          last_successful_check_at: string | null
          refresh_recommendation: string
          source_id: string
          updated_at: string
          watch_enabled: boolean
          watch_notes: string | null
          watch_status: string
        }
        Insert: {
          change_confidence?: string
          change_detected?: boolean
          change_explanation?: string | null
          check_count?: number
          consecutive_failures?: number
          created_at?: string
          dataset_id?: string | null
          id?: string
          last_checked_at?: string | null
          last_known_file_size?: number | null
          last_known_file_url?: string | null
          last_known_record_count?: number | null
          last_known_source_hash?: string | null
          last_known_updated_label?: string | null
          last_successful_check_at?: string | null
          refresh_recommendation?: string
          source_id: string
          updated_at?: string
          watch_enabled?: boolean
          watch_notes?: string | null
          watch_status?: string
        }
        Update: {
          change_confidence?: string
          change_detected?: boolean
          change_explanation?: string | null
          check_count?: number
          consecutive_failures?: number
          created_at?: string
          dataset_id?: string | null
          id?: string
          last_checked_at?: string | null
          last_known_file_size?: number | null
          last_known_file_url?: string | null
          last_known_record_count?: number | null
          last_known_source_hash?: string | null
          last_known_updated_label?: string | null
          last_successful_check_at?: string | null
          refresh_recommendation?: string
          source_id?: string
          updated_at?: string
          watch_enabled?: boolean
          watch_notes?: string | null
          watch_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_watch_state_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_watch_state_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "tree_data_sources"
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
          {
            foreignKeyName: "draft_seeds_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          lifecycle_stage: string
          lineage_story: string | null
          name: string
          notes: string | null
          origin_grove_id: string | null
          origin_tree_id: string | null
          photo_url: string | null
          plant_type: string
          planted_at: string | null
          planted_tree_id: string | null
          seed_source: string | null
          species: string | null
          target_grove_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          lifecycle_stage?: string
          lineage_story?: string | null
          name: string
          notes?: string | null
          origin_grove_id?: string | null
          origin_tree_id?: string | null
          photo_url?: string | null
          plant_type?: string
          planted_at?: string | null
          planted_tree_id?: string | null
          seed_source?: string | null
          species?: string | null
          target_grove_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          lifecycle_stage?: string
          lineage_story?: string | null
          name?: string
          notes?: string | null
          origin_grove_id?: string | null
          origin_tree_id?: string | null
          photo_url?: string | null
          plant_type?: string
          planted_at?: string | null
          planted_tree_id?: string | null
          seed_source?: string | null
          species?: string | null
          target_grove_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "greenhouse_plants_origin_grove_id_fkey"
            columns: ["origin_grove_id"]
            isOneToOne: false
            referencedRelation: "groves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greenhouse_plants_origin_tree_id_fkey"
            columns: ["origin_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greenhouse_plants_origin_tree_id_fkey"
            columns: ["origin_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greenhouse_plants_planted_tree_id_fkey"
            columns: ["planted_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greenhouse_plants_planted_tree_id_fkey"
            columns: ["planted_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greenhouse_plants_target_grove_id_fkey"
            columns: ["target_grove_id"]
            isOneToOne: false
            referencedRelation: "groves"
            referencedColumns: ["id"]
          },
        ]
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
      grove_guardians: {
        Row: {
          contribution_score: number
          created_at: string
          grove_id: string
          id: string
          offerings_count: number
          role: string
          since_date: string
          stories_count: number
          trees_added: number
          updated_at: string
          user_id: string
          visits_count: number
        }
        Insert: {
          contribution_score?: number
          created_at?: string
          grove_id: string
          id?: string
          offerings_count?: number
          role?: string
          since_date?: string
          stories_count?: number
          trees_added?: number
          updated_at?: string
          user_id: string
          visits_count?: number
        }
        Update: {
          contribution_score?: number
          created_at?: string
          grove_id?: string
          id?: string
          offerings_count?: number
          role?: string
          since_date?: string
          stories_count?: number
          trees_added?: number
          updated_at?: string
          user_id?: string
          visits_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "grove_guardians_grove_id_fkey"
            columns: ["grove_id"]
            isOneToOne: false
            referencedRelation: "groves"
            referencedColumns: ["id"]
          },
        ]
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
      grove_trees: {
        Row: {
          added_at: string
          grove_id: string
          id: string
          tree_id: string
          tree_source: string
        }
        Insert: {
          added_at?: string
          grove_id: string
          id?: string
          tree_id: string
          tree_source?: string
        }
        Update: {
          added_at?: string
          grove_id?: string
          id?: string
          tree_id?: string
          tree_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "grove_trees_grove_id_fkey"
            columns: ["grove_id"]
            isOneToOne: false
            referencedRelation: "groves"
            referencedColumns: ["id"]
          },
        ]
      }
      groves: {
        Row: {
          blessed_by: string | null
          center_latitude: number | null
          center_longitude: number | null
          compactness_score: number | null
          country: string | null
          created_at: string
          formation_method: string
          grove_name: string | null
          grove_status: string
          grove_strength: string
          grove_strength_score: number
          grove_type: string
          guardian_count: number
          id: string
          offering_count: number
          radius_m: number | null
          region: string | null
          species_common: string | null
          species_scientific: string | null
          tree_count: number
          updated_at: string
          verified_tree_count: number
          visit_count: number
          whisper_count: number
        }
        Insert: {
          blessed_by?: string | null
          center_latitude?: number | null
          center_longitude?: number | null
          compactness_score?: number | null
          country?: string | null
          created_at?: string
          formation_method?: string
          grove_name?: string | null
          grove_status?: string
          grove_strength?: string
          grove_strength_score?: number
          grove_type?: string
          guardian_count?: number
          id?: string
          offering_count?: number
          radius_m?: number | null
          region?: string | null
          species_common?: string | null
          species_scientific?: string | null
          tree_count?: number
          updated_at?: string
          verified_tree_count?: number
          visit_count?: number
          whisper_count?: number
        }
        Update: {
          blessed_by?: string | null
          center_latitude?: number | null
          center_longitude?: number | null
          compactness_score?: number | null
          country?: string | null
          created_at?: string
          formation_method?: string
          grove_name?: string | null
          grove_status?: string
          grove_strength?: string
          grove_strength_score?: number
          grove_type?: string
          guardian_count?: number
          id?: string
          offering_count?: number
          radius_m?: number | null
          region?: string | null
          species_common?: string | null
          species_scientific?: string | null
          tree_count?: number
          updated_at?: string
          verified_tree_count?: number
          visit_count?: number
          whisper_count?: number
        }
        Relationships: []
      }
      habitat_pool_ledger: {
        Row: {
          allocation_pct: number
          created_at: string
          hearts_contributed: number
          id: string
          notes: string | null
          source_id: string | null
          source_type: string
        }
        Insert: {
          allocation_pct?: number
          created_at?: string
          hearts_contributed?: number
          id?: string
          notes?: string | null
          source_id?: string | null
          source_type?: string
        }
        Update: {
          allocation_pct?: number
          created_at?: string
          hearts_contributed?: number
          id?: string
          notes?: string | null
          source_id?: string | null
          source_type?: string
        }
        Relationships: []
      }
      harvest_listings: {
        Row: {
          availability_type: string
          category: string
          contact_method: string | null
          created_at: string
          description: string | null
          external_link: string | null
          guardian_id: string
          harvest_month_end: number | null
          harvest_month_start: number | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          photos: string[] | null
          pickup_instructions: string | null
          price_note: string | null
          produce_name: string
          quantity_note: string | null
          shipping_available: boolean | null
          status: string
          tree_id: string | null
          updated_at: string
        }
        Insert: {
          availability_type?: string
          category?: string
          contact_method?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          guardian_id: string
          harvest_month_end?: number | null
          harvest_month_start?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          photos?: string[] | null
          pickup_instructions?: string | null
          price_note?: string | null
          produce_name: string
          quantity_note?: string | null
          shipping_available?: boolean | null
          status?: string
          tree_id?: string | null
          updated_at?: string
        }
        Update: {
          availability_type?: string
          category?: string
          contact_method?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          guardian_id?: string
          harvest_month_end?: number | null
          harvest_month_start?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          photos?: string[] | null
          pickup_instructions?: string | null
          price_note?: string | null
          produce_name?: string
          quantity_note?: string | null
          shipping_available?: boolean | null
          status?: string
          tree_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_listings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_listings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      heart_claims: {
        Row: {
          amount: number
          chain: string | null
          chain_tx_hash: string | null
          claim_type: string
          claimed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          source_ledger_id: string | null
          status: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount?: number
          chain?: string | null
          chain_tx_hash?: string | null
          claim_type: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          source_ledger_id?: string | null
          status?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          chain?: string | null
          chain_tx_hash?: string | null
          claim_type?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          source_ledger_id?: string | null
          status?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heart_claims_source_ledger_id_fkey"
            columns: ["source_ledger_id"]
            isOneToOne: false
            referencedRelation: "heart_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      heart_ledger: {
        Row: {
          amount: number
          chain_state: string
          chain_tx_hash: string | null
          created_at: string
          currency_type: string
          destination: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          source: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          chain_state?: string
          chain_tx_hash?: string | null
          created_at?: string
          currency_type?: string
          destination?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          chain_state?: string
          chain_tx_hash?: string | null
          created_at?: string
          currency_type?: string
          destination?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      heart_signals: {
        Row: {
          body: string | null
          created_at: string
          deep_link: string | null
          dismissed: boolean
          id: string
          is_read: boolean
          metadata: Json | null
          related_offering_id: string | null
          related_transaction_id: string | null
          related_tree_id: string | null
          signal_type: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deep_link?: string | null
          dismissed?: boolean
          id?: string
          is_read?: boolean
          metadata?: Json | null
          related_offering_id?: string | null
          related_transaction_id?: string | null
          related_tree_id?: string | null
          signal_type?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deep_link?: string | null
          dismissed?: boolean
          id?: string
          is_read?: boolean
          metadata?: Json | null
          related_offering_id?: string | null
          related_transaction_id?: string | null
          related_tree_id?: string | null
          signal_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_signals_related_offering_id_fkey"
            columns: ["related_offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_signals_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "heart_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_signals_related_tree_id_fkey"
            columns: ["related_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_signals_related_tree_id_fkey"
            columns: ["related_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      heart_transactions: {
        Row: {
          amount: number
          created_at: string
          heart_type: string
          id: string
          seed_id: string | null
          tree_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          heart_type: string
          id?: string
          seed_id?: string | null
          tree_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          heart_type?: string
          id?: string
          seed_id?: string | null
          tree_id?: string | null
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
          {
            foreignKeyName: "heart_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      hive_stewardship_signals: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          hive_family: string
          id: string
          linked_proposal_id: string | null
          linked_tree_ids: string[] | null
          signal_type: string
          status: string
          title: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          hive_family: string
          id?: string
          linked_proposal_id?: string | null
          linked_tree_ids?: string[] | null
          signal_type?: string
          status?: string
          title: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          hive_family?: string
          id?: string
          linked_proposal_id?: string | null
          linked_tree_ids?: string[] | null
          signal_type?: string
          status?: string
          title?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "hive_stewardship_signals_linked_proposal_id_fkey"
            columns: ["linked_proposal_id"]
            isOneToOne: false
            referencedRelation: "value_proposals"
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
          {
            foreignKeyName: "influence_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          is_used: boolean
          max_uses: number | null
          used_at: string | null
          used_by_user_id: string | null
          uses_count: number
        }
        Insert: {
          code?: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          max_uses?: number | null
          used_at?: string | null
          used_by_user_id?: string | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          max_uses?: number | null
          used_at?: string | null
          used_by_user_id?: string | null
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
          {
            foreignKeyName: "meetings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      mycelial_pathways: {
        Row: {
          blessed_by: string | null
          center_lat: number | null
          center_lng: number | null
          created_at: string
          distance_km: number | null
          end_lat: number | null
          end_lng: number | null
          formation_method: string
          grove_ids: string[]
          id: string
          offering_count: number | null
          pathway_name: string | null
          pathway_status: string
          pathway_strength: string
          pathway_strength_score: number
          pathway_type: string
          species_common: string | null
          species_scientific: string | null
          start_lat: number | null
          start_lng: number | null
          tree_count: number | null
          updated_at: string
          visit_count: number | null
        }
        Insert: {
          blessed_by?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          distance_km?: number | null
          end_lat?: number | null
          end_lng?: number | null
          formation_method?: string
          grove_ids?: string[]
          id?: string
          offering_count?: number | null
          pathway_name?: string | null
          pathway_status?: string
          pathway_strength?: string
          pathway_strength_score?: number
          pathway_type?: string
          species_common?: string | null
          species_scientific?: string | null
          start_lat?: number | null
          start_lng?: number | null
          tree_count?: number | null
          updated_at?: string
          visit_count?: number | null
        }
        Update: {
          blessed_by?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          distance_km?: number | null
          end_lat?: number | null
          end_lng?: number | null
          formation_method?: string
          grove_ids?: string[]
          id?: string
          offering_count?: number | null
          pathway_name?: string | null
          pathway_status?: string
          pathway_strength?: string
          pathway_strength_score?: number
          pathway_type?: string
          species_common?: string | null
          species_scientific?: string | null
          start_lat?: number | null
          start_lng?: number | null
          tree_count?: number | null
          updated_at?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      nftree_mints: {
        Row: {
          authorization_deadline: string | null
          authorization_nonce: string | null
          authorization_signature: string | null
          block_number: number | null
          chain_id: number
          confirmed_at: string | null
          contract_address: string | null
          created_at: string
          error_message: string | null
          explorer_url: string | null
          id: string
          image_uri: string | null
          marketplace_url: string | null
          metadata_uri: string | null
          mint_status: string
          minter_address: string
          minter_user_id: string
          offering_id: string | null
          staff_id: string | null
          staff_token_id: number
          token_id: number | null
          tree_id: string
          tx_hash: string | null
          updated_at: string | null
        }
        Insert: {
          authorization_deadline?: string | null
          authorization_nonce?: string | null
          authorization_signature?: string | null
          block_number?: number | null
          chain_id?: number
          confirmed_at?: string | null
          contract_address?: string | null
          created_at?: string
          error_message?: string | null
          explorer_url?: string | null
          id?: string
          image_uri?: string | null
          marketplace_url?: string | null
          metadata_uri?: string | null
          mint_status?: string
          minter_address: string
          minter_user_id: string
          offering_id?: string | null
          staff_id?: string | null
          staff_token_id: number
          token_id?: number | null
          tree_id: string
          tx_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          authorization_deadline?: string | null
          authorization_nonce?: string | null
          authorization_signature?: string | null
          block_number?: number | null
          chain_id?: number
          confirmed_at?: string | null
          contract_address?: string | null
          created_at?: string
          error_message?: string | null
          explorer_url?: string | null
          id?: string
          image_uri?: string | null
          marketplace_url?: string | null
          metadata_uri?: string | null
          mint_status?: string
          minter_address?: string
          minter_user_id?: string
          offering_id?: string | null
          staff_id?: string | null
          staff_token_id?: number
          token_id?: number | null
          tree_id?: string
          tx_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nftree_mints_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nftree_mints_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nftree_mints_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nftree_mints_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          notify_council_updates: boolean
          notify_minting_events: boolean
          notify_nearby_friends: boolean
          notify_system_updates: boolean
          notify_tree_interactions: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_mode: boolean
          show_celebrations: boolean
          show_companion_suggestions: boolean
          show_floating_prompts: boolean
          show_onboarding_nudges: boolean
          show_teotag_whispers: boolean
          topic_cantons: string[]
          topic_councils: string[]
          topic_countries: string[]
          topic_species: string[]
          topic_trees: string[]
          updated_at: string
          user_id: string
          weather_unit: string
          whispers_auto_open: boolean
          whispers_enabled: boolean
          whispers_haptic: boolean
          whispers_near_tree_only: boolean
          wind_unit: string
        }
        Insert: {
          created_at?: string
          digest_mode?: string
          max_daily_pushes?: number
          nearby_mode?: boolean
          nearby_radius_m?: number
          notify_council_updates?: boolean
          notify_minting_events?: boolean
          notify_nearby_friends?: boolean
          notify_system_updates?: boolean
          notify_tree_interactions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_mode?: boolean
          show_celebrations?: boolean
          show_companion_suggestions?: boolean
          show_floating_prompts?: boolean
          show_onboarding_nudges?: boolean
          show_teotag_whispers?: boolean
          topic_cantons?: string[]
          topic_councils?: string[]
          topic_countries?: string[]
          topic_species?: string[]
          topic_trees?: string[]
          updated_at?: string
          user_id: string
          weather_unit?: string
          whispers_auto_open?: boolean
          whispers_enabled?: boolean
          whispers_haptic?: boolean
          whispers_near_tree_only?: boolean
          wind_unit?: string
        }
        Update: {
          created_at?: string
          digest_mode?: string
          max_daily_pushes?: number
          nearby_mode?: boolean
          nearby_radius_m?: number
          notify_council_updates?: boolean
          notify_minting_events?: boolean
          notify_nearby_friends?: boolean
          notify_system_updates?: boolean
          notify_tree_interactions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_mode?: boolean
          show_celebrations?: boolean
          show_companion_suggestions?: boolean
          show_floating_prompts?: boolean
          show_onboarding_nudges?: boolean
          show_teotag_whispers?: boolean
          topic_cantons?: string[]
          topic_councils?: string[]
          topic_countries?: string[]
          topic_species?: string[]
          topic_trees?: string[]
          updated_at?: string
          user_id?: string
          weather_unit?: string
          whispers_auto_open?: boolean
          whispers_enabled?: boolean
          whispers_haptic?: boolean
          whispers_near_tree_only?: boolean
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
      offering_resonances: {
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
            foreignKeyName: "offering_resonances_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
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
          hot_score: number
          id: string
          impact_weight: number
          influence_score: number
          influence_score_by_scope: Json | null
          influence_votes_count: number
          media_url: string | null
          meeting_id: string | null
          nft_link: string | null
          photos: string[]
          quote_author: string | null
          quote_source: string | null
          quote_text: string | null
          ranked_at: string | null
          resonance_count: number
          sealed_by_staff: string | null
          sky_stamp_id: string | null
          thumbnail_url: string | null
          title: string
          tree_id: string
          tree_role: string
          type: Database["public"]["Enums"]["offering_type"]
          updated_at: string
          visibility: string
          youtube_embed_url: string | null
          youtube_url: string | null
          youtube_video_id: string | null
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
          photos?: string[]
          quote_author?: string | null
          quote_source?: string | null
          quote_text?: string | null
          ranked_at?: string | null
          resonance_count?: number
          sealed_by_staff?: string | null
          sky_stamp_id?: string | null
          thumbnail_url?: string | null
          title: string
          tree_id: string
          tree_role?: string
          type: Database["public"]["Enums"]["offering_type"]
          updated_at?: string
          visibility?: string
          youtube_embed_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
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
          photos?: string[]
          quote_author?: string | null
          quote_source?: string | null
          quote_text?: string | null
          ranked_at?: string | null
          resonance_count?: number
          sealed_by_staff?: string | null
          sky_stamp_id?: string | null
          thumbnail_url?: string | null
          title?: string
          tree_id?: string
          tree_role?: string
          type?: Database["public"]["Enums"]["offering_type"]
          updated_at?: string
          visibility?: string
          youtube_embed_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
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
          {
            foreignKeyName: "offerings_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_proposals: {
        Row: {
          category: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          message: string
          org_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          message: string
          org_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          message?: string
          org_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pathway_groves: {
        Row: {
          created_at: string
          grove_id: string
          id: string
          pathway_id: string
          position_order: number | null
        }
        Insert: {
          created_at?: string
          grove_id: string
          id?: string
          pathway_id: string
          position_order?: number | null
        }
        Update: {
          created_at?: string
          grove_id?: string
          id?: string
          pathway_id?: string
          position_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_groves_grove_id_fkey"
            columns: ["grove_id"]
            isOneToOne: false
            referencedRelation: "groves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_groves_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "mycelial_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      phenology_observations: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          moderation_status: string
          notes: string | null
          observation_type: string
          observed_at: string
          photo_url: string | null
          species_key: string | null
          tree_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          moderation_status?: string
          notes?: string | null
          observation_type: string
          observed_at?: string
          photo_url?: string | null
          species_key?: string | null
          tree_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          moderation_status?: string
          notes?: string | null
          observation_type?: string
          observed_at?: string
          photo_url?: string | null
          species_key?: string | null
          tree_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phenology_observations_species_key_fkey"
            columns: ["species_key"]
            isOneToOne: false
            referencedRelation: "species_index"
            referencedColumns: ["species_key"]
          },
          {
            foreignKeyName: "phenology_observations_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phenology_observations_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      phenology_signals: {
        Row: {
          bioregion_id: string | null
          confidence: string
          expires_at: string
          fetched_at: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          phase: string
          region_name: string | null
          signal_date: string
          source_adapter: string
          species_key: string | null
          typical_window_end: number | null
          typical_window_start: number | null
        }
        Insert: {
          bioregion_id?: string | null
          confidence?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          phase: string
          region_name?: string | null
          signal_date: string
          source_adapter?: string
          species_key?: string | null
          typical_window_end?: number | null
          typical_window_start?: number | null
        }
        Update: {
          bioregion_id?: string | null
          confidence?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          phase?: string
          region_name?: string | null
          signal_date?: string
          source_adapter?: string
          species_key?: string | null
          typical_window_end?: number | null
          typical_window_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phenology_signals_species_key_fkey"
            columns: ["species_key"]
            isOneToOne: false
            referencedRelation: "species_index"
            referencedColumns: ["species_key"]
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
          {
            foreignKeyName: "planted_seeds_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      presence_streaks: {
        Row: {
          current_streak: number
          last_presence_date: string | null
          longest_streak: number
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_presence_date?: string | null
          longest_streak?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_presence_date?: string | null
          longest_streak?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      press_chapters: {
        Row: {
          artwork_url: string | null
          body: string
          chapter_order: number
          created_at: string
          epigraph: string | null
          id: string
          linked_bio_region_id: string | null
          linked_tree_id: string | null
          title: string
          unlock_mode: string
          updated_at: string
          visibility: string
          work_id: string
        }
        Insert: {
          artwork_url?: string | null
          body: string
          chapter_order?: number
          created_at?: string
          epigraph?: string | null
          id?: string
          linked_bio_region_id?: string | null
          linked_tree_id?: string | null
          title: string
          unlock_mode?: string
          updated_at?: string
          visibility?: string
          work_id: string
        }
        Update: {
          artwork_url?: string | null
          body?: string
          chapter_order?: number
          created_at?: string
          epigraph?: string | null
          id?: string
          linked_bio_region_id?: string | null
          linked_tree_id?: string | null
          title?: string
          unlock_mode?: string
          updated_at?: string
          visibility?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "press_chapters_linked_bio_region_id_fkey"
            columns: ["linked_bio_region_id"]
            isOneToOne: false
            referencedRelation: "bio_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "press_chapters_linked_tree_id_fkey"
            columns: ["linked_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "press_chapters_linked_tree_id_fkey"
            columns: ["linked_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "press_chapters_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "press_works"
            referencedColumns: ["id"]
          },
        ]
      }
      press_works: {
        Row: {
          body: string
          created_at: string
          epigraph: string | null
          form: string
          id: string
          published_at: string | null
          season: string | null
          source_book_id: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          body: string
          created_at?: string
          epigraph?: string | null
          form?: string
          id?: string
          published_at?: string | null
          season?: string | null
          source_book_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          body?: string
          created_at?: string
          epigraph?: string | null
          form?: string
          id?: string
          published_at?: string | null
          season?: string | null
          source_book_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "press_works_source_book_id_fkey"
            columns: ["source_book_id"]
            isOneToOne: false
            referencedRelation: "bookshelf_entries"
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
          invited_by_user_id: string | null
          invites_accepted: number
          invites_remaining: number
          invites_sent: number
          is_discoverable: boolean
          lineage_staff_id: string | null
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
          invited_by_user_id?: string | null
          invites_accepted?: number
          invites_remaining?: number
          invites_sent?: number
          is_discoverable?: boolean
          lineage_staff_id?: string | null
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
          invited_by_user_id?: string | null
          invites_accepted?: number
          invites_remaining?: number
          invites_sent?: number
          is_discoverable?: boolean
          lineage_staff_id?: string | null
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
      proposal_council_reviews: {
        Row: {
          council_id: string | null
          created_at: string
          id: string
          library_entry_id: string | null
          next_steps: string | null
          outcome: string
          proposal_id: string
          recorded_by: string
          reviewed_at: string
          summary: string | null
        }
        Insert: {
          council_id?: string | null
          created_at?: string
          id?: string
          library_entry_id?: string | null
          next_steps?: string | null
          outcome?: string
          proposal_id: string
          recorded_by: string
          reviewed_at?: string
          summary?: string | null
        }
        Update: {
          council_id?: string | null
          created_at?: string
          id?: string
          library_entry_id?: string | null
          next_steps?: string | null
          outcome?: string
          proposal_id?: string
          recorded_by?: string
          reviewed_at?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_council_reviews_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_council_reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "value_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_pledges: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          pledge_type: string
          proposal_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          pledge_type?: string
          proposal_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          pledge_type?: string
          proposal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_pledges_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "value_proposals"
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
          age_estimate: string | null
          anchor_chain: string | null
          anchored_at: string | null
          city: string | null
          completeness_score: number | null
          confidence_score: number | null
          conversion_notes: string | null
          conversion_status: string
          converted_at: string | null
          converted_by: string | null
          converted_tree_id: string | null
          country: string
          created_at: string
          crown_spread: string | null
          dataset_id: string | null
          description: string | null
          designation_type: string
          duplicate_of_record_id: string | null
          geo_precision: string
          girth_or_stem: string | null
          height_m: number | null
          heritage_status: string | null
          id: string
          images_json: Json | null
          immutable_anchor_reference: string | null
          immutable_record_id: string | null
          latitude: number | null
          linked_tree_id: string | null
          locality_text: string
          longitude: number | null
          metadata_hash: string | null
          province: string | null
          record_kind: string
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
          submitted_by_agent_id: string | null
          tree_name: string | null
          updated_at: string
          user_annotations: Json | null
          verification_score: number | null
          verified_by: string | null
        }
        Insert: {
          age_estimate?: string | null
          anchor_chain?: string | null
          anchored_at?: string | null
          city?: string | null
          completeness_score?: number | null
          confidence_score?: number | null
          conversion_notes?: string | null
          conversion_status?: string
          converted_at?: string | null
          converted_by?: string | null
          converted_tree_id?: string | null
          country?: string
          created_at?: string
          crown_spread?: string | null
          dataset_id?: string | null
          description?: string | null
          designation_type?: string
          duplicate_of_record_id?: string | null
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          heritage_status?: string | null
          id?: string
          images_json?: Json | null
          immutable_anchor_reference?: string | null
          immutable_record_id?: string | null
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text: string
          longitude?: number | null
          metadata_hash?: string | null
          province?: string | null
          record_kind?: string
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
          submitted_by_agent_id?: string | null
          tree_name?: string | null
          updated_at?: string
          user_annotations?: Json | null
          verification_score?: number | null
          verified_by?: string | null
        }
        Update: {
          age_estimate?: string | null
          anchor_chain?: string | null
          anchored_at?: string | null
          city?: string | null
          completeness_score?: number | null
          confidence_score?: number | null
          conversion_notes?: string | null
          conversion_status?: string
          converted_at?: string | null
          converted_by?: string | null
          converted_tree_id?: string | null
          country?: string
          created_at?: string
          crown_spread?: string | null
          dataset_id?: string | null
          description?: string | null
          designation_type?: string
          duplicate_of_record_id?: string | null
          geo_precision?: string
          girth_or_stem?: string | null
          height_m?: number | null
          heritage_status?: string | null
          id?: string
          images_json?: Json | null
          immutable_anchor_reference?: string | null
          immutable_record_id?: string | null
          latitude?: number | null
          linked_tree_id?: string | null
          locality_text?: string
          longitude?: number | null
          metadata_hash?: string | null
          province?: string | null
          record_kind?: string
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
          submitted_by_agent_id?: string | null
          tree_name?: string | null
          updated_at?: string
          user_annotations?: Json | null
          verification_score?: number | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_trees_converted_tree_id_fkey"
            columns: ["converted_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_converted_tree_id_fkey"
            columns: ["converted_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_duplicate_of_record_id_fkey"
            columns: ["duplicate_of_record_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_linked_tree_id_fkey"
            columns: ["linked_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_linked_tree_id_fkey"
            columns: ["linked_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trees_submitted_by_agent_id_fkey"
            columns: ["submitted_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
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
          {
            foreignKeyName: "root_mail_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      seasonal_quests: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_count: number
          hearts_awarded: number
          id: string
          quest_description: string | null
          quest_title: string
          quest_type: string
          season: string
          species_hearts_awarded: number
          target_count: number
          user_id: string
          year: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          hearts_awarded?: number
          id?: string
          quest_description?: string | null
          quest_title: string
          quest_type: string
          season: string
          species_hearts_awarded?: number
          target_count?: number
          user_id: string
          year: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          hearts_awarded?: number
          id?: string
          quest_description?: string | null
          quest_title?: string
          quest_type?: string
          season?: string
          species_hearts_awarded?: number
          target_count?: number
          user_id?: string
          year?: number
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
          {
            foreignKeyName: "seasonal_witnesses_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      seed_libraries: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          contact_link: string | null
          country: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_hidden: boolean
          last_community_activity: string | null
          latitude: number | null
          library_type: string
          longitude: number | null
          name: string
          photo_url: string | null
          region: string | null
          slug: string
          status: string
          submitted_by: string | null
          testimonial_count: number
          updated_at: string
          verification_count: number
          verification_status: string
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_link?: string | null
          country: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          last_community_activity?: string | null
          latitude?: number | null
          library_type?: string
          longitude?: number | null
          name: string
          photo_url?: string | null
          region?: string | null
          slug: string
          status?: string
          submitted_by?: string | null
          testimonial_count?: number
          updated_at?: string
          verification_count?: number
          verification_status?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_link?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          last_community_activity?: string | null
          latitude?: number | null
          library_type?: string
          longitude?: number | null
          name?: string
          photo_url?: string | null
          region?: string | null
          slug?: string
          status?: string
          submitted_by?: string | null
          testimonial_count?: number
          updated_at?: string
          verification_count?: number
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      seed_library_testimonials: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          is_anonymous: boolean
          is_hidden: boolean
          library_id: string
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          is_hidden?: boolean
          library_id: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          is_hidden?: boolean
          library_id?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_library_testimonials_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "seed_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_library_verifications: {
        Row: {
          created_at: string
          id: string
          library_id: string
          note: string | null
          user_id: string
          verification_type: string
          verified_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          library_id: string
          note?: string | null
          user_id: string
          verification_type: string
          verified_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          library_id?: string
          note?: string | null
          user_id?: string
          verification_type?: string
          verified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seed_library_verifications_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "seed_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_life_entries: {
        Row: {
          archive_link: string | null
          common_name: string
          created_at: string
          description: string | null
          germination_notes: string | null
          growth_journey: Json
          id: string
          image_alt: string | null
          image_credit: string | null
          image_path: string | null
          image_thumb_path: string | null
          is_featured: boolean
          is_hidden: boolean
          latin_name: string | null
          origin_label: string | null
          region_label: string | null
          relationship_notes: Json
          seed_size: string | null
          slug: string
          species_group: string
          status: string
          storage_notes: string | null
          submitted_by: string
          updated_at: string
          use_category: string
          validation_count: number
          verification_status: string
        }
        Insert: {
          archive_link?: string | null
          common_name: string
          created_at?: string
          description?: string | null
          germination_notes?: string | null
          growth_journey?: Json
          id?: string
          image_alt?: string | null
          image_credit?: string | null
          image_path?: string | null
          image_thumb_path?: string | null
          is_featured?: boolean
          is_hidden?: boolean
          latin_name?: string | null
          origin_label?: string | null
          region_label?: string | null
          relationship_notes?: Json
          seed_size?: string | null
          slug: string
          species_group: string
          status?: string
          storage_notes?: string | null
          submitted_by: string
          updated_at?: string
          use_category: string
          validation_count?: number
          verification_status?: string
        }
        Update: {
          archive_link?: string | null
          common_name?: string
          created_at?: string
          description?: string | null
          germination_notes?: string | null
          growth_journey?: Json
          id?: string
          image_alt?: string | null
          image_credit?: string | null
          image_path?: string | null
          image_thumb_path?: string | null
          is_featured?: boolean
          is_hidden?: boolean
          latin_name?: string | null
          origin_label?: string | null
          region_label?: string | null
          relationship_notes?: Json
          seed_size?: string | null
          slug?: string
          species_group?: string
          status?: string
          storage_notes?: string | null
          submitted_by?: string
          updated_at?: string
          use_category?: string
          validation_count?: number
          verification_status?: string
        }
        Relationships: []
      }
      seed_life_guardians: {
        Row: {
          added_by: string
          created_at: string
          id: string
          library_id: string | null
          note: string | null
          pod_name: string | null
          relationship_type: string
          seed_id: string
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          library_id?: string | null
          note?: string | null
          pod_name?: string | null
          relationship_type?: string
          seed_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          library_id?: string | null
          note?: string | null
          pod_name?: string | null
          relationship_type?: string
          seed_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_life_guardians_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "seed_libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seed_life_guardians_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seed_life_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_life_notes: {
        Row: {
          content: string
          created_at: string
          cultivation_stage: string | null
          id: string
          is_hidden: boolean
          seed_id: string
          title: string | null
          updated_at: string
          user_id: string
          validation_count: number
        }
        Insert: {
          content: string
          created_at?: string
          cultivation_stage?: string | null
          id?: string
          is_hidden?: boolean
          seed_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          validation_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          cultivation_stage?: string | null
          id?: string
          is_hidden?: boolean
          seed_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          validation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "seed_life_notes_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seed_life_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_life_validations: {
        Row: {
          created_at: string
          id: string
          note: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
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
          {
            foreignKeyName: "sky_stamps_source_tree_id_fkey"
            columns: ["source_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      source_tree_candidates: {
        Row: {
          confidence_score: number | null
          crawl_run_id: string
          created_at: string
          duplicate_of_candidate_id: string | null
          id: string
          normalization_status: string
          promoted_research_tree_id: string | null
          raw_country: string | null
          raw_data: Json
          raw_latitude: number | null
          raw_location_text: string | null
          raw_longitude: number | null
          raw_name: string | null
          raw_species: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          source_id: string
        }
        Insert: {
          confidence_score?: number | null
          crawl_run_id: string
          created_at?: string
          duplicate_of_candidate_id?: string | null
          id?: string
          normalization_status?: string
          promoted_research_tree_id?: string | null
          raw_country?: string | null
          raw_data?: Json
          raw_latitude?: number | null
          raw_location_text?: string | null
          raw_longitude?: number | null
          raw_name?: string | null
          raw_species?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id: string
        }
        Update: {
          confidence_score?: number | null
          crawl_run_id?: string
          created_at?: string
          duplicate_of_candidate_id?: string | null
          id?: string
          normalization_status?: string
          promoted_research_tree_id?: string | null
          raw_country?: string | null
          raw_data?: Json
          raw_latitude?: number | null
          raw_location_text?: string | null
          raw_longitude?: number | null
          raw_name?: string | null
          raw_species?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_tree_candidates_crawl_run_id_fkey"
            columns: ["crawl_run_id"]
            isOneToOne: false
            referencedRelation: "dataset_crawl_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_tree_candidates_duplicate_of_candidate_id_fkey"
            columns: ["duplicate_of_candidate_id"]
            isOneToOne: false
            referencedRelation: "source_tree_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_tree_candidates_promoted_research_tree_id_fkey"
            columns: ["promoted_research_tree_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_tree_candidates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_reports: {
        Row: {
          created_at: string
          dataset_id: string | null
          description: string
          hearts_rewarded: number | null
          id: string
          report_type: string
          research_tree_record_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          submitted_by: string | null
          submitted_by_agent: string | null
          suggested_fix: string | null
          target_id: string | null
          target_type: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          description: string
          hearts_rewarded?: number | null
          id?: string
          report_type?: string
          research_tree_record_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_agent?: string | null
          suggested_fix?: string | null
          target_id?: string | null
          target_type?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          description?: string
          hearts_rewarded?: number | null
          id?: string
          report_type?: string
          research_tree_record_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_agent?: string | null
          suggested_fix?: string | null
          target_id?: string | null
          target_type?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_reports_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_reports_research_tree_record_id_fkey"
            columns: ["research_tree_record_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_reports_submitted_by_agent_fkey"
            columns: ["submitted_by_agent"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "species_attestations_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      species_badges: {
        Row: {
          badge_name: string
          earned_at: string
          id: string
          species_key: string
          species_name: string
          trees_mapped: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_name: string
          earned_at?: string
          id?: string
          species_key: string
          species_name: string
          trees_mapped?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_name?: string
          earned_at?: string
          id?: string
          species_key?: string
          species_name?: string
          trees_mapped?: number
          updated_at?: string | null
          user_id?: string
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
          tree_id: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          species_family: string
          tree_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          species_family?: string
          tree_id?: string | null
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
          {
            foreignKeyName: "species_heart_transactions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      species_hives: {
        Row: {
          accent_hsl: string | null
          created_at: string
          description: string | null
          display_name: string
          family_name: string
          governance_status: string
          icon: string | null
          id: string
          representative_species: string[] | null
          slug: string
          species_patterns: string[]
          tree_count: number
          updated_at: string
        }
        Insert: {
          accent_hsl?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          family_name: string
          governance_status?: string
          icon?: string | null
          id?: string
          representative_species?: string[] | null
          slug: string
          species_patterns?: string[]
          tree_count?: number
          updated_at?: string
        }
        Update: {
          accent_hsl?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          family_name?: string
          governance_status?: string
          icon?: string | null
          id?: string
          representative_species?: string[] | null
          slug?: string
          species_patterns?: string[]
          tree_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      species_index: {
        Row: {
          canonical_name: string | null
          common_name: string
          created_at: string
          family: string | null
          gbif_taxon_id: number | null
          genus: string | null
          icon: string | null
          id: string
          metadata: Json | null
          normalized_name: string | null
          rank: string
          scientific_name: string | null
          species_key: string
          synonym_names: Json | null
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          canonical_name?: string | null
          common_name: string
          created_at?: string
          family?: string | null
          gbif_taxon_id?: number | null
          genus?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          normalized_name?: string | null
          rank?: string
          scientific_name?: string | null
          species_key: string
          synonym_names?: Json | null
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          canonical_name?: string | null
          common_name?: string
          created_at?: string
          family?: string | null
          gbif_taxon_id?: number | null
          genus?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          normalized_name?: string | null
          rank?: string
          scientific_name?: string | null
          species_key?: string
          synonym_names?: Json | null
          synonyms?: string[] | null
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
      stewardship_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string | null
          season: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          season?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          season?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stewardship_actions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stewardship_actions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      support_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string | null
          event_type: string
          external_ref: string | null
          id: string
          metadata: Json | null
          provider: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          event_type?: string
          external_ref?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          event_type?: string
          external_ref?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_signups: {
        Row: {
          availability: string | null
          created_at: string
          email: string | null
          id: string
          interests: string | null
          message: string | null
          name: string
          signup_type: string
          skills: string | null
          telegram_handle: string | null
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string | null
          message?: string | null
          name: string
          signup_type?: string
          skills?: string | null
          telegram_handle?: string | null
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string | null
          message?: string | null
          name?: string
          signup_type?: string
          skills?: string | null
          telegram_handle?: string | null
          user_id?: string | null
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
      task_submissions: {
        Row: {
          agent_id: string | null
          contribution_event_id: string | null
          created_at: string
          hearts_awarded: number
          id: string
          proof_attachments: string[] | null
          proof_text: string
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          skill_category: string | null
          status: string
          submitted_by: string
          task_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          contribution_event_id?: string | null
          created_at?: string
          hearts_awarded?: number
          id?: string
          proof_attachments?: string[] | null
          proof_text: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          skill_category?: string | null
          status?: string
          submitted_by: string
          task_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          contribution_event_id?: string | null
          created_at?: string
          hearts_awarded?: number
          id?: string
          proof_attachments?: string[] | null
          proof_text?: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          skill_category?: string | null
          status?: string
          submitted_by?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_contribution_event_id_fkey"
            columns: ["contribution_event_id"]
            isOneToOne: false
            referencedRelation: "agent_contribution_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_garden_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_inbound_queue: {
        Row: {
          chat_id: number
          created_at: string
          from_user_id: number | null
          from_username: string | null
          id: string
          message_text: string | null
          processed: boolean
          processed_at: string | null
          raw_update: Json
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          from_user_id?: number | null
          from_username?: string | null
          id?: string
          message_text?: string | null
          processed?: boolean
          processed_at?: string | null
          raw_update: Json
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          from_user_id?: number | null
          from_username?: string | null
          id?: string
          message_text?: string | null
          processed?: boolean
          processed_at?: string | null
          raw_update?: Json
          update_id?: number
        }
        Relationships: []
      }
      telegram_outbound_log: {
        Row: {
          chat_id: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          message_text: string
          metadata: Json | null
          status: string
          telegram_message_id: number | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          message_text: string
          metadata?: Json | null
          status?: string
          telegram_message_id?: number | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          message_text?: string
          metadata?: Json | null
          status?: string
          telegram_message_id?: number | null
        }
        Relationships: []
      }
      telegram_settings: {
        Row: {
          bot_username: string | null
          chat_id: string | null
          delivery_mode: string
          digest_hour: number | null
          enabled: boolean
          id: number
          notify_council_invite: boolean
          notify_ecosystem_update: boolean
          notify_heart_milestone: boolean
          notify_new_tree: boolean
          notify_offering: boolean
          notify_whisper: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bot_username?: string | null
          chat_id?: string | null
          delivery_mode?: string
          digest_hour?: number | null
          enabled?: boolean
          id: number
          notify_council_invite?: boolean
          notify_ecosystem_update?: boolean
          notify_heart_milestone?: boolean
          notify_new_tree?: boolean
          notify_offering?: boolean
          notify_whisper?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bot_username?: string | null
          chat_id?: string | null
          delivery_mode?: string
          digest_hour?: number | null
          enabled?: boolean
          id?: number
          notify_council_invite?: boolean
          notify_ecosystem_update?: boolean
          notify_heart_milestone?: boolean
          notify_new_tree?: boolean
          notify_offering?: boolean
          notify_whisper?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      telegram_verification_codes: {
        Row: {
          action: string
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          status: string
          telegram_user_id: number | null
          telegram_username: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          action?: string
          claimed_at?: string | null
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          action?: string
          claimed_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          user_id?: string
          verified_at?: string | null
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
          {
            foreignKeyName: "tree_change_log_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_checkin_witnesses: {
        Row: {
          accuracy_m: number | null
          checkin_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          witness_user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          checkin_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          witness_user_id: string
        }
        Update: {
          accuracy_m?: number | null
          checkin_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          witness_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_checkin_witnesses_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_checkin_witnesses_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_checkins: {
        Row: {
          accuracy_m: number | null
          birdsong_heard: boolean | null
          canopy_proof: boolean
          checked_in_at: string
          checkin_method: string
          confidence_score: number | null
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
          proof_types: string[] | null
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
          accuracy_m?: number | null
          birdsong_heard?: boolean | null
          canopy_proof?: boolean
          checked_in_at?: string
          checkin_method?: string
          confidence_score?: number | null
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
          proof_types?: string[] | null
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
          accuracy_m?: number | null
          birdsong_heard?: boolean | null
          canopy_proof?: boolean
          checked_in_at?: string
          checkin_method?: string
          confidence_score?: number | null
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
          proof_types?: string[] | null
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
            foreignKeyName: "tree_checkins_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      tree_contributions: {
        Row: {
          content: string | null
          contribution_type: string
          created_at: string
          id: string
          media_url: string | null
          metadata: Json | null
          reviewed_at: string | null
          reviewer_id: string | null
          state: string
          support_count: number
          title: string | null
          tree_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          contribution_type: string
          created_at?: string
          id?: string
          media_url?: string | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          state?: string
          support_count?: number
          title?: string | null
          tree_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          contribution_type?: string
          created_at?: string
          id?: string
          media_url?: string | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          state?: string
          support_count?: number
          title?: string | null
          tree_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_contributions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_contributions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_crawl_tasks: {
        Row: {
          country: string | null
          crawl_type: string
          created_at: string
          id: string
          last_attempt: string | null
          next_action: string | null
          priority: number | null
          source_id: string
          status: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          crawl_type?: string
          created_at?: string
          id?: string
          last_attempt?: string | null
          next_action?: string | null
          priority?: number | null
          source_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          crawl_type?: string
          created_at?: string
          id?: string
          last_attempt?: string | null
          next_action?: string | null
          priority?: number | null
          source_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_crawl_tasks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_data_sources: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          data_format: string
          discovered_by_agent_id: string | null
          id: string
          integration_status: string
          last_checked: string | null
          license: string | null
          name: string
          notes: string | null
          record_count: number | null
          region: string | null
          scope: string
          source_type: string
          species_keys: string[] | null
          update_frequency: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_format?: string
          discovered_by_agent_id?: string | null
          id?: string
          integration_status?: string
          last_checked?: string | null
          license?: string | null
          name: string
          notes?: string | null
          record_count?: number | null
          region?: string | null
          scope?: string
          source_type?: string
          species_keys?: string[] | null
          update_frequency?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_format?: string
          discovered_by_agent_id?: string | null
          id?: string
          integration_status?: string
          last_checked?: string | null
          license?: string | null
          name?: string
          notes?: string | null
          record_count?: number | null
          region?: string | null
          scope?: string
          source_type?: string
          species_keys?: string[] | null
          update_frequency?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_data_sources_discovered_by_agent_id_fkey"
            columns: ["discovered_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_datasets: {
        Row: {
          created_at: string
          created_by_agent_id: string | null
          description: string | null
          id: string
          ingestion_status: string
          last_update: string | null
          ledger_linked: boolean | null
          map_layer_enabled: boolean | null
          map_layer_key: string | null
          name: string
          regions_covered: string[] | null
          source_id: string
          species_coverage: string[] | null
          tree_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_agent_id?: string | null
          description?: string | null
          id?: string
          ingestion_status?: string
          last_update?: string | null
          ledger_linked?: boolean | null
          map_layer_enabled?: boolean | null
          map_layer_key?: string | null
          name: string
          regions_covered?: string[] | null
          source_id: string
          species_coverage?: string[] | null
          tree_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_agent_id?: string | null
          description?: string | null
          id?: string
          ingestion_status?: string
          last_update?: string | null
          ledger_linked?: boolean | null
          map_layer_enabled?: boolean | null
          map_layer_key?: string | null
          name?: string
          regions_covered?: string[] | null
          source_id?: string
          species_coverage?: string[] | null
          tree_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_datasets_created_by_agent_id_fkey"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_datasets_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tree_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_duplicate_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          proposer_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          similarity_score: number
          status: string
          tree_a_id: string
          tree_b_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          proposer_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score?: number
          status?: string
          tree_a_id: string
          tree_b_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          proposer_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score?: number
          status?: string
          tree_a_id?: string
          tree_b_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_duplicate_reports_tree_a_id_fkey"
            columns: ["tree_a_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_duplicate_reports_tree_a_id_fkey"
            columns: ["tree_a_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_duplicate_reports_tree_b_id_fkey"
            columns: ["tree_b_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_duplicate_reports_tree_b_id_fkey"
            columns: ["tree_b_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_edit_history: {
        Row: {
          created_at: string
          edit_reason: string | null
          edit_type: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          proposal_id: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edit_reason?: string | null
          edit_type?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          proposal_id?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          edit_reason?: string | null
          edit_type?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          proposal_id?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_edit_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "tree_edit_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_edit_history_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_edit_history_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          {
            foreignKeyName: "tree_edit_proposals_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_guardians: {
        Row: {
          contribution_count: number
          earned_at: string
          id: string
          role: string
          tree_id: string
          user_id: string
        }
        Insert: {
          contribution_count?: number
          earned_at?: string
          id?: string
          role?: string
          tree_id: string
          user_id: string
        }
        Update: {
          contribution_count?: number
          earned_at?: string
          id?: string
          role?: string
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_guardians_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_guardians_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          {
            foreignKeyName: "tree_heart_pools_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: true
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_location_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_confidence: string | null
          new_latitude: number
          new_longitude: number
          old_confidence: string | null
          old_latitude: number
          old_longitude: number
          reason: string | null
          refinement_ids: string[] | null
          tree_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_confidence?: string | null
          new_latitude: number
          new_longitude: number
          old_confidence?: string | null
          old_latitude: number
          old_longitude: number
          reason?: string | null
          refinement_ids?: string[] | null
          tree_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_confidence?: string | null
          new_latitude?: number
          new_longitude?: number
          old_confidence?: string | null
          old_latitude?: number
          old_longitude?: number
          reason?: string | null
          refinement_ids?: string[] | null
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_location_history_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_location_history_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_location_refinements: {
        Row: {
          accuracy_m: number | null
          at_trunk: boolean
          checkin_id: string | null
          context_photo_url: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          status: string
          supporting_photo_url: string | null
          tree_id: string
          trunk_photo_url: string | null
          user_id: string
          weight: number
        }
        Insert: {
          accuracy_m?: number | null
          at_trunk?: boolean
          checkin_id?: string | null
          context_photo_url?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          supporting_photo_url?: string | null
          tree_id: string
          trunk_photo_url?: string | null
          user_id: string
          weight?: number
        }
        Update: {
          accuracy_m?: number | null
          at_trunk?: boolean
          checkin_id?: string | null
          context_photo_url?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          supporting_photo_url?: string | null
          tree_id?: string
          trunk_photo_url?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "tree_location_refinements_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_location_refinements_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_location_refinements_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_location_refinements_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_merge_history: {
        Row: {
          created_at: string
          data_migrated: Json | null
          id: string
          merge_reason: string | null
          merged_by: string
          primary_tree_id: string
          secondary_tree_id: string
        }
        Insert: {
          created_at?: string
          data_migrated?: Json | null
          id?: string
          merge_reason?: string | null
          merged_by: string
          primary_tree_id: string
          secondary_tree_id: string
        }
        Update: {
          created_at?: string
          data_migrated?: Json | null
          id?: string
          merge_reason?: string | null
          merged_by?: string
          primary_tree_id?: string
          secondary_tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_merge_history_primary_tree_id_fkey"
            columns: ["primary_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_merge_history_primary_tree_id_fkey"
            columns: ["primary_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_merge_history_secondary_tree_id_fkey"
            columns: ["secondary_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_merge_history_secondary_tree_id_fkey"
            columns: ["secondary_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_page_views: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          tree_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          tree_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          tree_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_page_views_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_page_views_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_presence_completions: {
        Row: {
          completed_at: string
          created_at: string
          duration_seconds: number
          geo_validated: boolean
          hearts_awarded: number
          id: string
          reflection: string | null
          streak_day: number
          tree_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          geo_validated?: boolean
          hearts_awarded?: number
          id?: string
          reflection?: string | null
          streak_day?: number
          tree_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          geo_validated?: boolean
          hearts_awarded?: number
          id?: string
          reflection?: string | null
          streak_day?: number
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_presence_completions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_presence_completions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      tree_value_roots: {
        Row: {
          amount: number
          asset_type: string
          created_at: string
          id: string
          last_accrual_at: string
          last_visit_at: string | null
          species_key: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          asset_type?: string
          created_at?: string
          id?: string
          last_accrual_at?: string
          last_visit_at?: string | null
          species_key?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          amount?: number
          asset_type?: string
          created_at?: string
          id?: string
          last_accrual_at?: string
          last_visit_at?: string | null
          species_key?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_value_roots_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_value_roots_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
            foreignKeyName: "tree_whisper_collections_collected_tree_id_fkey"
            columns: ["collected_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
            foreignKeyName: "tree_whispers_collected_tree_id_fkey"
            columns: ["collected_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
            foreignKeyName: "tree_whispers_delivery_tree_id_fkey"
            columns: ["delivery_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
          {
            foreignKeyName: "tree_whispers_tree_anchor_id_fkey"
            columns: ["tree_anchor_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_wishlist: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          notes: string | null
          shared_with: string[] | null
          status: string
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          notes?: string | null
          shared_with?: string[] | null
          status?: string
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          notes?: string | null
          shared_with?: string[] | null
          status?: string
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
          {
            foreignKeyName: "tree_wishlist_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
      trees: {
        Row: {
          age_confidence: string | null
          age_exact: number | null
          age_max: number | null
          age_min: number | null
          age_source: string | null
          archetype: string | null
          bioregion: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discovery_list: string | null
          elemental_signature: string[] | null
          estimated_age: number | null
          girth_cm: number | null
          grove_scale: Database["public"]["Enums"]["grove_scale"] | null
          id: string
          image_similarity_hash: string | null
          is_anchor_node: boolean | null
          is_churchyard_tree: boolean | null
          is_orchard: boolean
          latitude: number | null
          lineage: string | null
          linked_churchyard_id: string | null
          location_confidence: string | null
          longitude: number | null
          lore_text: string | null
          merged_into_tree_id: string | null
          metadata: Json | null
          name: string
          nation: string | null
          parent_description: string | null
          parent_tree_id: string | null
          photo_error: string | null
          photo_original_url: string | null
          photo_processed_url: string | null
          photo_status: string
          photo_thumb_url: string | null
          planted_year: number | null
          project_name: string | null
          project_url: string | null
          propagation_type:
            | Database["public"]["Enums"]["propagation_type"]
            | null
          radio_theme: string | null
          refinement_count: number | null
          seasonal_tone: string | null
          source_id: string | null
          source_name: string | null
          source_url: string | null
          species: string
          species_key: string | null
          state: string | null
          updated_at: string
          variety_name: string | null
          what3words: string | null
          wish_tags: string[] | null
        }
        Insert: {
          age_confidence?: string | null
          age_exact?: number | null
          age_max?: number | null
          age_min?: number | null
          age_source?: string | null
          archetype?: string | null
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discovery_list?: string | null
          elemental_signature?: string[] | null
          estimated_age?: number | null
          girth_cm?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          image_similarity_hash?: string | null
          is_anchor_node?: boolean | null
          is_churchyard_tree?: boolean | null
          is_orchard?: boolean
          latitude?: number | null
          lineage?: string | null
          linked_churchyard_id?: string | null
          location_confidence?: string | null
          longitude?: number | null
          lore_text?: string | null
          merged_into_tree_id?: string | null
          metadata?: Json | null
          name: string
          nation?: string | null
          parent_description?: string | null
          parent_tree_id?: string | null
          photo_error?: string | null
          photo_original_url?: string | null
          photo_processed_url?: string | null
          photo_status?: string
          photo_thumb_url?: string | null
          planted_year?: number | null
          project_name?: string | null
          project_url?: string | null
          propagation_type?:
            | Database["public"]["Enums"]["propagation_type"]
            | null
          radio_theme?: string | null
          refinement_count?: number | null
          seasonal_tone?: string | null
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
          species: string
          species_key?: string | null
          state?: string | null
          updated_at?: string
          variety_name?: string | null
          what3words?: string | null
          wish_tags?: string[] | null
        }
        Update: {
          age_confidence?: string | null
          age_exact?: number | null
          age_max?: number | null
          age_min?: number | null
          age_source?: string | null
          archetype?: string | null
          bioregion?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discovery_list?: string | null
          elemental_signature?: string[] | null
          estimated_age?: number | null
          girth_cm?: number | null
          grove_scale?: Database["public"]["Enums"]["grove_scale"] | null
          id?: string
          image_similarity_hash?: string | null
          is_anchor_node?: boolean | null
          is_churchyard_tree?: boolean | null
          is_orchard?: boolean
          latitude?: number | null
          lineage?: string | null
          linked_churchyard_id?: string | null
          location_confidence?: string | null
          longitude?: number | null
          lore_text?: string | null
          merged_into_tree_id?: string | null
          metadata?: Json | null
          name?: string
          nation?: string | null
          parent_description?: string | null
          parent_tree_id?: string | null
          photo_error?: string | null
          photo_original_url?: string | null
          photo_processed_url?: string | null
          photo_status?: string
          photo_thumb_url?: string | null
          planted_year?: number | null
          project_name?: string | null
          project_url?: string | null
          propagation_type?:
            | Database["public"]["Enums"]["propagation_type"]
            | null
          radio_theme?: string | null
          refinement_count?: number | null
          seasonal_tone?: string | null
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
          species?: string
          species_key?: string | null
          state?: string | null
          updated_at?: string
          variety_name?: string | null
          what3words?: string | null
          wish_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "trees_linked_churchyard_id_fkey"
            columns: ["linked_churchyard_id"]
            isOneToOne: false
            referencedRelation: "uk_churchyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_merged_into_tree_id_fkey"
            columns: ["merged_into_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_merged_into_tree_id_fkey"
            columns: ["merged_into_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_parent_tree_id_fkey"
            columns: ["parent_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_parent_tree_id_fkey"
            columns: ["parent_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      user_calendar_preferences: {
        Row: {
          created_at: string
          enabled_lens_ids: string[]
          hemisphere: string
          label_style: string
          primary_lens_id: string | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled_lens_ids?: string[]
          hemisphere?: string
          label_style?: string
          primary_lens_id?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled_lens_ids?: string[]
          hemisphere?: string
          label_style?: string
          primary_lens_id?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_heart_balances: {
        Row: {
          influence_tokens: number
          last_earned_at: string | null
          lifetime_earned: number
          lifetime_spent: number
          s33d_hearts: number
          species_hearts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          influence_tokens?: number
          last_earned_at?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          s33d_hearts?: number
          species_hearts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          influence_tokens?: number
          last_earned_at?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
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
      value_contributions: {
        Row: {
          amount_minor: number
          contribution_mode: string
          created_at: string
          currency: string
          hearts_granted: number
          hearts_granted_at: string | null
          id: string
          metadata: Json | null
          rail: string
          rail_session_id: string | null
          rail_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_minor?: number
          contribution_mode?: string
          created_at?: string
          currency?: string
          hearts_granted?: number
          hearts_granted_at?: string | null
          id?: string
          metadata?: Json | null
          rail?: string
          rail_session_id?: string | null
          rail_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_minor?: number
          contribution_mode?: string
          created_at?: string
          currency?: string
          hearts_granted?: number
          hearts_granted_at?: string | null
          id?: string
          metadata?: Json | null
          rail?: string
          rail_session_id?: string | null
          rail_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
          category: string
          council_notes: string | null
          council_outcome: string | null
          council_review_date: string | null
          council_reviewed: boolean | null
          created_at: string
          description: string
          funding_current: number | null
          funding_target: number | null
          funding_type: string | null
          hive_family: string | null
          id: string
          library_entry_id: string | null
          location_name: string | null
          moderator_note: string | null
          proposed_by: string
          status: string
          suggested_duration: string | null
          suggested_hearts: number
          support_count: number
          title: string
          updated_at: string
          value_tree_branch: string | null
          verification_level: string
          why_it_matters: string | null
        }
        Insert: {
          category?: string
          council_notes?: string | null
          council_outcome?: string | null
          council_review_date?: string | null
          council_reviewed?: boolean | null
          created_at?: string
          description: string
          funding_current?: number | null
          funding_target?: number | null
          funding_type?: string | null
          hive_family?: string | null
          id?: string
          library_entry_id?: string | null
          location_name?: string | null
          moderator_note?: string | null
          proposed_by: string
          status?: string
          suggested_duration?: string | null
          suggested_hearts?: number
          support_count?: number
          title: string
          updated_at?: string
          value_tree_branch?: string | null
          verification_level?: string
          why_it_matters?: string | null
        }
        Update: {
          category?: string
          council_notes?: string | null
          council_outcome?: string | null
          council_review_date?: string | null
          council_reviewed?: boolean | null
          created_at?: string
          description?: string
          funding_current?: number | null
          funding_target?: number | null
          funding_type?: string | null
          hive_family?: string | null
          id?: string
          library_entry_id?: string | null
          location_name?: string | null
          moderator_note?: string | null
          proposed_by?: string
          status?: string
          suggested_duration?: string | null
          suggested_hearts?: number
          support_count?: number
          title?: string
          updated_at?: string
          value_tree_branch?: string | null
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
      verification_tasks: {
        Row: {
          claimed_by: string | null
          completed_at: string | null
          completion_evidence_json: Json | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          hearts_reward: number
          id: string
          research_tree_id: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          completed_at?: string | null
          completion_evidence_json?: Json | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          hearts_reward?: number
          id?: string
          research_tree_id: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          completed_at?: string | null
          completion_evidence_json?: Json | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          hearts_reward?: number
          id?: string
          research_tree_id?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_tasks_research_tree_id_fkey"
            columns: ["research_tree_id"]
            isOneToOne: false
            referencedRelation: "research_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_links: {
        Row: {
          chain: string
          created_at: string
          id: string
          is_primary: boolean | null
          label: string | null
          nonce: string | null
          user_id: string
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          chain?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          nonce?: string | null
          user_id: string
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          chain?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          nonce?: string | null
          user_id?: string
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      wanderer_streaks: {
        Row: {
          current_streak: number
          last_mapped_date: string | null
          longest_streak: number
          streak_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_mapped_date?: string | null
          longest_streak?: number
          streak_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_mapped_date?: string | null
          longest_streak?: number
          streak_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      witness_sessions: {
        Row: {
          companion_channel: string | null
          created_at: string
          env_snapshot: Json | null
          expires_at: string
          hearts_awarded: number
          id: string
          initiator_accuracy_m: number | null
          initiator_checkin_id: string | null
          initiator_confirmed: boolean
          initiator_id: string
          initiator_lat: number | null
          initiator_lng: number | null
          initiator_offerings: string[] | null
          initiator_photos: string[] | null
          joiner_accuracy_m: number | null
          joiner_checkin_id: string | null
          joiner_confirmed: boolean
          joiner_id: string | null
          joiner_lat: number | null
          joiner_lng: number | null
          joiner_offerings: string[] | null
          joiner_photos: string[] | null
          snapshot_quality: string | null
          status: string
          tree_id: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          companion_channel?: string | null
          created_at?: string
          env_snapshot?: Json | null
          expires_at?: string
          hearts_awarded?: number
          id?: string
          initiator_accuracy_m?: number | null
          initiator_checkin_id?: string | null
          initiator_confirmed?: boolean
          initiator_id: string
          initiator_lat?: number | null
          initiator_lng?: number | null
          initiator_offerings?: string[] | null
          initiator_photos?: string[] | null
          joiner_accuracy_m?: number | null
          joiner_checkin_id?: string | null
          joiner_confirmed?: boolean
          joiner_id?: string | null
          joiner_lat?: number | null
          joiner_lng?: number | null
          joiner_offerings?: string[] | null
          joiner_photos?: string[] | null
          snapshot_quality?: string | null
          status?: string
          tree_id: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          companion_channel?: string | null
          created_at?: string
          env_snapshot?: Json | null
          expires_at?: string
          hearts_awarded?: number
          id?: string
          initiator_accuracy_m?: number | null
          initiator_checkin_id?: string | null
          initiator_confirmed?: boolean
          initiator_id?: string
          initiator_lat?: number | null
          initiator_lng?: number | null
          initiator_offerings?: string[] | null
          initiator_photos?: string[] | null
          joiner_accuracy_m?: number | null
          joiner_checkin_id?: string | null
          joiner_confirmed?: boolean
          joiner_id?: string | null
          joiner_lat?: number | null
          joiner_lng?: number | null
          joiner_offerings?: string[] | null
          joiner_photos?: string[] | null
          snapshot_quality?: string | null
          status?: string
          tree_id?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "witness_sessions_initiator_checkin_id_fkey"
            columns: ["initiator_checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "witness_sessions_initiator_checkin_id_fkey"
            columns: ["initiator_checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "witness_sessions_joiner_checkin_id_fkey"
            columns: ["joiner_checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "witness_sessions_joiner_checkin_id_fkey"
            columns: ["joiner_checkin_id"]
            isOneToOne: false
            referencedRelation: "tree_checkins_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "witness_sessions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "witness_sessions_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tree_checkins_public: {
        Row: {
          birdsong_heard: boolean | null
          canopy_proof: boolean | null
          checked_in_at: string | null
          fungi_present: boolean | null
          id: string | null
          minted_status: string | null
          privacy: string | null
          season_stage: string | null
          tree_id: string | null
          weather: string | null
        }
        Insert: {
          birdsong_heard?: boolean | null
          canopy_proof?: boolean | null
          checked_in_at?: string | null
          fungi_present?: boolean | null
          id?: string | null
          minted_status?: string | null
          privacy?: string | null
          season_stage?: string | null
          tree_id?: string | null
          weather?: string | null
        }
        Update: {
          birdsong_heard?: boolean | null
          canopy_proof?: boolean | null
          checked_in_at?: string | null
          fungi_present?: boolean | null
          id?: string | null
          minted_status?: string | null
          privacy?: string | null
          season_stage?: string | null
          tree_id?: string | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_checkins_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_checkins_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
            referencedColumns: ["id"]
          },
        ]
      }
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
      trees_map_hot: {
        Row: {
          created_by: string | null
          estimated_age: number | null
          girth_cm: number | null
          id: string | null
          latitude: number | null
          lineage: string | null
          longitude: number | null
          merged_into_tree_id: string | null
          name: string | null
          nation: string | null
          offering_count: number | null
          offering_photo: string | null
          photo_thumb_url: string | null
          project_name: string | null
          species: string | null
          what3words: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trees_merged_into_tree_id_fkey"
            columns: ["merged_into_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_merged_into_tree_id_fkey"
            columns: ["merged_into_tree_id"]
            isOneToOne: false
            referencedRelation: "trees_map_hot"
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
      can_edit_tree: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
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
      claim_bot_handoff: { Args: { p_token: string }; Returns: Json }
      claim_gift_seed: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: Json
      }
      claim_windfall_hearts: {
        Args: { p_tree_id: string; p_user_id: string }
        Returns: number
      }
      compute_hot_score: {
        Args: { p_created_at: string; p_influence: number }
        Returns: number
      }
      consume_invitation: {
        Args: { p_invite_code: string; p_new_user_id: string }
        Returns: Json
      }
      create_bot_handoff: {
        Args: {
          p_bot_name: string
          p_campaign?: string
          p_expires_minutes?: number
          p_external_user_hash?: string
          p_flow_name?: string
          p_gift_code?: string
          p_intent?: string
          p_invite_code?: string
          p_payload?: Json
          p_return_to?: string
          p_source: string
        }
        Returns: Json
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
      get_heart_economy_stats: { Args: { p_user_id: string }; Returns: Json }
      get_hive_leaderboard: {
        Args: { p_family: string; p_limit?: number }
        Returns: {
          offerings_count: number
          species_hearts: number
          trees_mapped: number
          user_id: string
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
          lifecycle_stage: string
          lineage_story: string
          name: string
          photo_url: string
          plant_type: string
          seed_source: string
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
      get_tree_activity_stats: { Args: { p_tree_id: string }; Returns: Json }
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
      get_tree_presence_summary: {
        Args: {
          p_max_lat?: number
          p_max_lng?: number
          p_min_lat?: number
          p_min_lng?: number
        }
        Returns: {
          latitude: number
          longitude: number
          most_recent: string
          presence_count: number
          presence_state: string
          species: string
          tree_id: string
          tree_name: string
        }[]
      }
      get_trees_in_viewport: {
        Args: {
          p_east: number
          p_limit?: number
          p_north: number
          p_south: number
          p_west: number
        }
        Returns: {
          created_by: string
          estimated_age: number
          girth_cm: number
          id: string
          latitude: number
          lineage: string
          longitude: number
          name: string
          nation: string
          offering_count: number
          offering_photo: string
          photo_thumb_url: string
          project_name: string
          species: string
          what3words: string
        }[]
      }
      get_user_lineage: { Args: { p_user_id: string }; Returns: Json }
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
      owns_agent: { Args: { _agent_id: string }; Returns: boolean }
      plant_hearts_at_tree: {
        Args: {
          p_amount: number
          p_asset_type?: string
          p_species_key?: string
          p_tree_id: string
          p_user_id: string
        }
        Returns: {
          amount: number
          asset_type: string
          created_at: string
          id: string
          last_accrual_at: string
          last_visit_at: string | null
          species_key: string | null
          tree_id: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tree_value_roots"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      recompute_seed_life_validation_totals: {
        Args: { _target_id: string; _target_type: string }
        Returns: undefined
      }
      record_referral_secure: {
        Args: { p_invite_code: string; p_invitee_id: string }
        Returns: Json
      }
      record_visit: {
        Args: { p_user_id?: string }
        Returns: {
          ancient_friend_index: number
          total_visits: number
          visitor_number: number
        }[]
      }
      refresh_trees_map_hot: { Args: never; Returns: undefined }
      resolve_bot_handoff: { Args: { p_token: string }; Returns: Json }
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
      update_agent_trust_score: {
        Args: { p_agent_id: string }
        Returns: undefined
      }
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
      propagation_type: "seed" | "graft" | "cutting" | "unknown"
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
      propagation_type: ["seed", "graft", "cutting", "unknown"],
    },
  },
} as const
