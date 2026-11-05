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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          icon: string | null
          id: string
          milestone_type: string | null
          milestone_value: number
          name: string
        }
        Insert: {
          icon?: string | null
          id?: string
          milestone_type?: string | null
          milestone_value: number
          name: string
        }
        Update: {
          icon?: string | null
          id?: string
          milestone_type?: string | null
          milestone_value?: number
          name?: string
        }
        Relationships: []
      }
      comment_reports: {
        Row: {
          comment_id: string | null
          community_id: string | null
          created_at: string | null
          details: string | null
          id: string
          reason_id: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          community_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason_id: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          community_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason_id?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comment_reports_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comment_reports_resolved_by"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          product_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          branch_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_approved: boolean | null
          is_private: boolean | null
          members_count: number | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          branch_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_private?: boolean | null
          members_count?: number | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          branch_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_private?: boolean | null
          members_count?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "community_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_branches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_chats: {
        Row: {
          community_id: string | null
          created_at: string | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_chats_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_logs: {
        Row: {
          action: string
          community_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          community_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          community_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_online_members: {
        Row: {
          community_id: string
          last_seen: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          last_seen?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          last_seen?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_online_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_tags: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          name: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          name: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_tags_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          last_message: string | null
          last_message_at: string | null
          last_message_type: string | null
          unread_count_user_1: number | null
          unread_count_user_2: number | null
          user_1: string | null
          user_2: string | null
        }
        Insert: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_type?: string | null
          unread_count_user_1?: number | null
          unread_count_user_2?: number | null
          user_1?: string | null
          user_2?: string | null
        }
        Update: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_type?: string | null
          unread_count_user_1?: number | null
          unread_count_user_2?: number | null
          user_1?: string | null
          user_2?: string | null
        }
        Relationships: []
      }
      debug_rpc_log: {
        Row: {
          called_at: string | null
          community_id: string | null
          id: number
          rpc_name: string | null
          user_id: string | null
        }
        Insert: {
          called_at?: string | null
          community_id?: string | null
          id?: number
          rpc_name?: string | null
          user_id?: string | null
        }
        Update: {
          called_at?: string | null
          community_id?: string | null
          id?: number
          rpc_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
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
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string | null
          sender_id: string
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id: string
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_chat_reads: {
        Row: {
          community_id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_chat_reads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_chat_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_conversations: {
        Row: {
          community_id: string
          last_message: string | null
          last_message_at: string | null
          last_message_type: string | null
          last_sender_id: string | null
        }
        Insert: {
          community_id: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_type?: string | null
          last_sender_id?: string | null
        }
        Update: {
          community_id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_type?: string | null
          last_sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mod_conversations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_conversations_last_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_logs: {
        Row: {
          action_type: string
          community_id: string
          created_at: string
          id: string
          mod_id: string | null
          reason_note: string | null
          target_id: string | null
        }
        Insert: {
          action_type: string
          community_id: string
          created_at?: string
          id?: string
          mod_id?: string | null
          reason_note?: string | null
          target_id?: string | null
        }
        Update: {
          action_type?: string
          community_id?: string
          created_at?: string
          id?: string
          mod_id?: string | null
          reason_note?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mod_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_logs_mod_id_fkey"
            columns: ["mod_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_messages: {
        Row: {
          community_id: string
          created_at: string
          id: string
          metadata: Json | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mod_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          product_id: string | null
          read: boolean | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          product_id?: string | null
          read?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          product_id?: string | null
          read?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications2: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      product_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          old_data: Json | null
          product_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          old_data?: Json | null
          product_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          old_data?: Json | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_likes: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "community_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          community_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          images: Json | null
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          title: string
          user_id: string
          views: number | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          title: string
          user_id?: string
          views?: number | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          title?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_reasons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          sort_order: number | null
          target_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          sort_order?: number | null
          target_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          sort_order?: number | null
          target_type?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          community_id: string
          created_at: string
          details: string | null
          id: string
          product_id: string
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          community_id: string
          created_at?: string
          details?: string | null
          id?: string
          product_id: string
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string
          details?: string | null
          id?: string
          product_id?: string
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          device: string | null
          id: string
          location: string | null
          query: string
          searched_at: string | null
          user_id: string | null
        }
        Insert: {
          device?: string | null
          id?: string
          location?: string | null
          query: string
          searched_at?: string | null
          user_id?: string | null
        }
        Update: {
          device?: string | null
          id?: string
          location?: string | null
          query?: string
          searched_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_search_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          id: string
          received_at: string | null
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          id?: string
          received_at?: string | null
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          id?: string
          received_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_badges_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_reviewer_public_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string | null
          fcm_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fcm_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fcm_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          birth: string | null
          created_at: string | null
          email: string | null
          id: string
          identity: number | null
          is_online: boolean | null
          karma: number | null
          last_seen: string | null
          phone: number | null
          selling_policy: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identity?: number | null
          is_online?: boolean | null
          karma?: number | null
          last_seen?: string | null
          phone?: number | null
          selling_policy?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identity?: number | null
          is_online?: boolean | null
          karma?: number | null
          last_seen?: string | null
          phone?: number | null
          selling_policy?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists_in_auth: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      cleanup_stale_online_members: { Args: never; Returns: undefined }
      count_online:
        | { Args: { comm_id: string }; Returns: number }
        | { Args: { comm_id: string; max_age?: string }; Returns: number }
      decrement_online:
        | { Args: { community_id: string }; Returns: undefined }
        | { Args: { amount: number; community_id: string }; Returns: undefined }
      decrement_upvotes: { Args: { pid: string }; Returns: undefined }
      handle_user_disconnect_timeout: { Args: never; Returns: undefined }
      handle_user_timeout: { Args: never; Returns: undefined }
      increment_online:
        | { Args: { community_id: string }; Returns: undefined }
        | { Args: { amount: number; community_id: string }; Returns: undefined }
      increment_upvotes: { Args: { pid: string }; Returns: undefined }
      increment_views: { Args: { pid: string }; Returns: undefined }
      join_community_tx: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      leave_community_tx: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      refresh_user_last_seen:
        | {
            Args: { _community_id: string; _user_id: string }
            Returns: undefined
          }
        | { Args: { uid: string }; Returns: undefined }
      set_user_offline: { Args: { uid: string }; Returns: undefined }
    }
    Enums: {
      product_status: "draft" | "published" | "sold" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      product_status: ["draft", "published", "sold", "archived"],
    },
  },
} as const
