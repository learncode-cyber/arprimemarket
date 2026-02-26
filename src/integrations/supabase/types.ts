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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
