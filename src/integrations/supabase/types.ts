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
      abandoned_carts: {
        Row: {
          cart_items: Json
          created_at: string
          currency: string
          email: string | null
          id: string
          is_recovered: boolean
          last_activity_at: string
          recovered_at: string | null
          recovered_order_id: string | null
          recovery_token: string | null
          session_id: string | null
          subtotal: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_items?: Json
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_recovered?: boolean
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_token?: string | null
          session_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_items?: Json
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_recovered?: boolean
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_token?: string | null
          session_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string
          order_total: number
          paid_at: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          order_id: string
          order_total?: number
          paid_at?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string
          order_total?: number
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          last_sale_at: string | null
          paid_earnings: number
          payout_details: Json | null
          payout_method: string | null
          pending_earnings: number
          status: string
          total_clicks: number
          total_earnings: number
          total_orders: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          last_sale_at?: string | null
          paid_earnings?: number
          payout_details?: Json | null
          payout_method?: string | null
          pending_earnings?: number
          status?: string
          total_clicks?: number
          total_earnings?: number
          total_orders?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          last_sale_at?: string | null
          paid_earnings?: number
          payout_details?: Json | null
          payout_method?: string | null
          pending_earnings?: number
          status?: string
          total_clicks?: number
          total_earnings?: number
          total_orders?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          performed_by: string | null
          scan_result_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          scan_result_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          scan_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_activity_log_scan_result_id_fkey"
            columns: ["scan_result_id"]
            isOneToOne: false
            referencedRelation: "ai_scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_updates: {
        Row: {
          created_at: string
          id: string
          items_updated: number | null
          status: string | null
          summary: string | null
          triggered_by: string | null
          update_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          items_updated?: number | null
          status?: string | null
          summary?: string | null
          triggered_by?: string | null
          update_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          items_updated?: number | null
          status?: string | null
          summary?: string | null
          triggered_by?: string | null
          update_type?: string
        }
        Relationships: []
      }
      ai_learning_log: {
        Row: {
          category: string
          confidence_score: number | null
          correct_response: string | null
          created_at: string
          id: string
          is_active: boolean | null
          lesson: string
          lesson_type: string
          times_applied: number | null
          trigger_message: string | null
          updated_at: string
          wrong_response: string | null
        }
        Insert: {
          category?: string
          confidence_score?: number | null
          correct_response?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson: string
          lesson_type?: string
          times_applied?: number | null
          trigger_message?: string | null
          updated_at?: string
          wrong_response?: string | null
        }
        Update: {
          category?: string
          confidence_score?: number | null
          correct_response?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson?: string
          lesson_type?: string
          times_applied?: number | null
          trigger_message?: string | null
          updated_at?: string
          wrong_response?: string | null
        }
        Relationships: []
      }
      ai_marketing_strategies: {
        Row: {
          created_at: string
          description: string
          effectiveness_score: number | null
          id: string
          is_active: boolean | null
          last_reviewed_at: string | null
          strategy_name: string
          strategy_type: string
          times_converted: number | null
          times_used: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          last_reviewed_at?: string | null
          strategy_name: string
          strategy_type?: string
          times_converted?: number | null
          times_used?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          last_reviewed_at?: string | null
          strategy_name?: string
          strategy_type?: string
          times_converted?: number | null
          times_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_scan_results: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          auto_fix_available: boolean
          auto_fix_query: string | null
          category: string
          created_at: string
          description: string
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          metadata: Json | null
          scan_type: string
          severity: string
          status: string
          suggestion: string | null
          title: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          auto_fix_available?: boolean
          auto_fix_query?: string | null
          category?: string
          created_at?: string
          description: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          metadata?: Json | null
          scan_type?: string
          severity?: string
          status?: string
          suggestion?: string | null
          title: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          auto_fix_available?: boolean
          auto_fix_query?: string | null
          category?: string
          created_at?: string
          description?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          metadata?: Json | null
          scan_type?: string
          severity?: string
          status?: string
          suggestion?: string | null
          title?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: string | null
          scheduled_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          scheduled_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          scheduled_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          campaign_type: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          metrics: Json | null
          name: string
          related_coupon_id: string | null
          related_promotion_id: string | null
          spent: number
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          campaign_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metrics?: Json | null
          name: string
          related_coupon_id?: string | null
          related_promotion_id?: string | null
          spent?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          related_coupon_id?: string | null
          related_promotion_id?: string | null
          spent?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_related_coupon_id_fkey"
            columns: ["related_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_related_promotion_id_fkey"
            columns: ["related_promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_reminder_logs: {
        Row: {
          abandoned_cart_id: string
          email_to: string
          error_message: string | null
          id: string
          reminder_tier: number
          sent_at: string
          status: string
        }
        Insert: {
          abandoned_cart_id: string
          email_to: string
          error_message?: string | null
          id?: string
          reminder_tier: number
          sent_at?: string
          status?: string
        }
        Update: {
          abandoned_cart_id?: string
          email_to?: string
          error_message?: string | null
          id?: string
          reminder_tier?: number
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_reminder_logs_abandoned_cart_id_fkey"
            columns: ["abandoned_cart_id"]
            isOneToOne: false
            referencedRelation: "abandoned_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string | null
          sender_type?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          abandoned_cart_id: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          order_id: string | null
          recipient: string
          retry_count: number
          status: string
          subject: string
        }
        Insert: {
          abandoned_cart_id?: string | null
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient: string
          retry_count?: number
          status?: string
          subject: string
        }
        Update: {
          abandoned_cart_id?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient?: string
          retry_count?: number
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_abandoned_cart_id_fkey"
            columns: ["abandoned_cart_id"]
            isOneToOne: false
            referencedRelation: "abandoned_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string | null
          order_id: string
          resolved_at: string | null
          resolved_by: string | null
          title: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          order_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          order_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          title: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          title: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          title?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          auto_forwarded: boolean | null
          coupon_id: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          discount_amount: number
          forwarded_at: string | null
          id: string
          is_dropship: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          processing_errors: Json | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_country: string | null
          shipping_email: string | null
          shipping_method: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: string
          subtotal: number
          supplier_order_id: string | null
          tax_amount: number
          total: number
          tracking_number: string | null
          tracking_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_forwarded?: boolean | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          discount_amount?: number
          forwarded_at?: string | null
          id?: string
          is_dropship?: boolean | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          processing_errors?: Json | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_country?: string | null
          shipping_email?: string | null
          shipping_method?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string
          subtotal?: number
          supplier_order_id?: string | null
          tax_amount?: number
          total?: number
          tracking_number?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_forwarded?: boolean | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          discount_amount?: number
          forwarded_at?: string | null
          id?: string
          is_dropship?: boolean | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          processing_errors?: Json | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_country?: string | null
          shipping_email?: string | null
          shipping_method?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string
          subtotal?: number
          supplier_order_id?: string | null
          tax_amount?: number
          total?: number
          tracking_number?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          deposit_link: string | null
          display_name: string
          display_name_ar: string | null
          display_name_bn: string | null
          icon_name: string | null
          id: string
          instructions: string | null
          instructions_ar: string | null
          instructions_bn: string | null
          is_active: boolean
          method_key: string
          method_type: string
          network: string | null
          sort_order: number
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          deposit_link?: string | null
          display_name: string
          display_name_ar?: string | null
          display_name_bn?: string | null
          icon_name?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          instructions_bn?: string | null
          is_active?: boolean
          method_key: string
          method_type: string
          network?: string | null
          sort_order?: number
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          deposit_link?: string | null
          display_name?: string
          display_name_ar?: string | null
          display_name_bn?: string | null
          icon_name?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          instructions_bn?: string | null
          is_active?: boolean
          method_key?: string
          method_type?: string
          network?: string | null
          sort_order?: number
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          admin_notes: string | null
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_method_key: string
          status: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_method_key: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_method_key?: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          price_delta: number
          product_id: string
          size: string | null
          sku: string | null
          sort_order: number
          stock_quantity: number
          updated_at: string
          variant_label: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_delta?: number
          product_id: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          variant_label?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_delta?: number
          product_id?: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          low_stock_threshold: number | null
          price: number
          rating: number | null
          review_count: number | null
          sku: string | null
          slug: string
          stock_quantity: number
          supplier_price: number | null
          supplier_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          slug: string
          stock_quantity?: number
          supplier_price?: number | null
          supplier_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          slug?: string
          stock_quantity?: number
          supplier_price?: number | null
          supplier_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          banner_url: string | null
          category_ids: string[] | null
          conditions: Json | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          product_ids: string[] | null
          promotion_type: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category_ids?: string[] | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          product_ids?: string[] | null
          promotion_type?: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category_ids?: string[] | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          product_ids?: string[] | null
          promotion_type?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_uses: number | null
          referrer_reward_value: number
          reward_type: string
          reward_value: number
          used_count: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_reward_value?: number
          reward_type?: string
          reward_value?: number
          used_count?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_reward_value?: number
          reward_type?: string
          reward_value?: number
          used_count?: number
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          order_id: string | null
          referral_code_id: string
          referred_id: string
          referred_reward: number | null
          referrer_id: string
          referrer_reward: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code_id: string
          referred_id: string
          referred_reward?: number | null
          referrer_id: string
          referrer_reward?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code_id?: string
          referred_id?: string
          referred_reward?: number | null
          referrer_id?: string
          referrer_reward?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          order_id: string
          product_items: Json
          reason: string
          refund_amount: number
          refund_type: string
          resolved_at: string | null
          resolved_by: string | null
          restock_items: boolean
          return_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id: string
          product_items?: Json
          reason: string
          refund_amount?: number
          refund_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          restock_items?: boolean
          return_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string
          product_items?: Json
          reason?: string
          refund_amount?: number
          refund_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          restock_items?: boolean
          return_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          base_cost: number
          created_at: string
          id: string
          is_active: boolean
          max_days: number
          min_days: number
          per_kg_cost: number
          shipping_type: string
          zone_id: string
        }
        Insert: {
          base_cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          per_kg_cost?: number
          shipping_type?: string
          zone_id: string
        }
        Update: {
          base_cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          per_kg_cost?: number
          shipping_type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean
          section_key: string
          section_label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_key: string
          section_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_key?: string
          section_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string | null
          adjustment_type: string
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason: string | null
          warehouse_id: string
        }
        Insert: {
          adjusted_by?: string | null
          adjustment_type?: string
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id: string
          quantity_change: number
          reason?: string | null
          warehouse_id: string
        }
        Update: {
          adjusted_by?: string | null
          adjustment_type?: string
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          created_at: string
          external_order_id: string | null
          forwarded_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipping_carrier: string | null
          status: string
          supplier_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_order_id?: string | null
          forwarded_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipping_carrier?: string | null
          status?: string
          supplier_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_order_id?: string | null
          forwarded_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipping_carrier?: string | null
          status?: string
          supplier_id?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          external_category: string | null
          external_description: string | null
          external_id: string
          external_image_url: string | null
          external_images: string[] | null
          external_price: number
          external_stock: number
          external_title: string
          external_url: string | null
          external_variants: Json | null
          id: string
          import_errors: Json | null
          is_imported: boolean
          last_synced_at: string | null
          product_id: string | null
          supplier_id: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_category?: string | null
          external_description?: string | null
          external_id: string
          external_image_url?: string | null
          external_images?: string[] | null
          external_price?: number
          external_stock?: number
          external_title: string
          external_url?: string | null
          external_variants?: Json | null
          id?: string
          import_errors?: Json | null
          is_imported?: boolean
          last_synced_at?: string | null
          product_id?: string | null
          supplier_id: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_category?: string | null
          external_description?: string | null
          external_id?: string
          external_image_url?: string | null
          external_images?: string[] | null
          external_price?: number
          external_stock?: number
          external_title?: string
          external_url?: string | null
          external_variants?: Json | null
          id?: string
          import_errors?: Json | null
          is_imported?: boolean
          last_synced_at?: string | null
          product_id?: string | null
          supplier_id?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_sync_logs: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_details: Json | null
          id: string
          items_failed: number
          items_processed: number
          started_at: string
          status: string
          supplier_id: string
        }
        Insert: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          id?: string
          items_failed?: number
          items_processed?: number
          started_at?: string
          status?: string
          supplier_id: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          id?: string
          items_failed?: number
          items_processed?: number
          started_at?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sync_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          api_key_name: string | null
          api_key_secret: string | null
          api_type: string
          api_url: string | null
          auto_forward_orders: boolean | null
          auto_sync: boolean
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          markup_percentage: number
          name: string
          notes: string | null
          sync_interval_hours: number
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key_name?: string | null
          api_key_secret?: string | null
          api_type?: string
          api_url?: string | null
          auto_forward_orders?: boolean | null
          auto_sync?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          markup_percentage?: number
          name: string
          notes?: string | null
          sync_interval_hours?: number
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key_name?: string | null
          api_key_secret?: string | null
          api_type?: string
          api_url?: string | null
          auto_forward_orders?: boolean | null
          auto_sync?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          markup_percentage?: number
          name?: string
          notes?: string | null
          sync_interval_hours?: number
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_pixels: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          pixel_id: string
          platform: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          pixel_id?: string
          platform: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          pixel_id?: string
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations_cache: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          source_lang?: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
        }
        Relationships: []
      }
      upsell_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          source_product_id: string | null
          suggested_product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          source_product_id?: string | null
          suggested_product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          source_product_id?: string | null
          suggested_product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upsell_events_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_events_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_events_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_events_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_stock: {
        Row: {
          bin_location: string | null
          id: string
          product_id: string
          quantity: number
          reorder_level: number | null
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          bin_location?: string | null
          id?: string
          product_id: string
          quantity?: number
          reorder_level?: number | null
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          bin_location?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reorder_level?: number | null
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      widget_configs: {
        Row: {
          ai_persona: string
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          scraped_data: Json | null
          site_name: string
          site_url: string
          updated_at: string
          user_id: string
          welcome_message: string
          widget_color: string
          widget_position: string
        }
        Insert: {
          ai_persona?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraped_data?: Json | null
          site_name?: string
          site_url?: string
          updated_at?: string
          user_id: string
          welcome_message?: string
          widget_color?: string
          widget_position?: string
        }
        Update: {
          ai_persona?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraped_data?: Json | null
          site_name?: string
          site_url?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string
          widget_color?: string
          widget_position?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_methods_public: {
        Row: {
          display_name: string | null
          display_name_ar: string | null
          display_name_bn: string | null
          icon_name: string | null
          id: string | null
          instructions: string | null
          instructions_ar: string | null
          instructions_bn: string | null
          is_active: boolean | null
          method_key: string | null
          method_type: string | null
          network: string | null
          sort_order: number | null
        }
        Insert: {
          display_name?: string | null
          display_name_ar?: string | null
          display_name_bn?: string | null
          icon_name?: string | null
          id?: string | null
          instructions?: string | null
          instructions_ar?: string | null
          instructions_bn?: string | null
          is_active?: boolean | null
          method_key?: string | null
          method_type?: string | null
          network?: string | null
          sort_order?: number | null
        }
        Update: {
          display_name?: string | null
          display_name_ar?: string | null
          display_name_bn?: string | null
          icon_name?: string | null
          id?: string | null
          instructions?: string | null
          instructions_ar?: string | null
          instructions_bn?: string | null
          is_active?: boolean | null
          method_key?: string | null
          method_type?: string | null
          network?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          barcode: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          price: number | null
          rating: number | null
          review_count: number | null
          sku: string | null
          slug: string | null
          stock_quantity: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          slug?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          slug?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_inactive_affiliates: { Args: never; Returns: number }
      credit_affiliate_commission: {
        Args: {
          _affiliate_code: string
          _order_id: string
          _order_total: number
        }
        Returns: undefined
      }
      get_guest_order: {
        Args: { _order_number: string; _tracking_token: string }
        Returns: {
          auto_forwarded: boolean | null
          coupon_id: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          discount_amount: number
          forwarded_at: string | null
          id: string
          is_dropship: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          processing_errors: Json | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_country: string | null
          shipping_email: string | null
          shipping_method: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: string
          subtotal: number
          supplier_order_id: string | null
          tax_amount: number
          total: number
          tracking_number: string | null
          tracking_token: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guest_order: { Args: { _order_id: string }; Returns: boolean }
      verify_guest_order: {
        Args: { _email: string; _order_number: string }
        Returns: {
          auto_forwarded: boolean | null
          coupon_id: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          discount_amount: number
          forwarded_at: string | null
          id: string
          is_dropship: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          processing_errors: Json | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_country: string | null
          shipping_email: string | null
          shipping_method: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: string
          subtotal: number
          supplier_order_id: string | null
          tax_amount: number
          total: number
          tracking_number: string | null
          tracking_token: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
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
