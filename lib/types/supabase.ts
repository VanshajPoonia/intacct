export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          assigned_collector: string | null
          balance: number
          billing_address: string | null
          code: string
          collection_notes: string | null
          collection_priority: string | null
          created_at: string
          credit_limit: number
          currency: string
          email: string
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          lifetime_revenue: number
          name: string
          payment_terms: string
          phone: string | null
          status: string
        }
        Insert: {
          address?: string | null
          assigned_collector?: string | null
          balance?: number
          billing_address?: string | null
          code: string
          collection_notes?: string | null
          collection_priority?: string | null
          created_at?: string
          credit_limit?: number
          currency?: string
          email: string
          id: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          lifetime_revenue?: number
          name: string
          payment_terms: string
          phone?: string | null
          status: string
        }
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          entity_id: string
          file_name: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          module: string
          number: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          file_name?: string | null
          file_size_bytes?: number | null
          id: string
          mime_type?: string | null
          module: string
          number: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>
        Relationships: []
      }
      entities: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id: string
          name: string
        }
        Update: Partial<Database["public"]["Tables"]["entities"]["Insert"]>
        Relationships: []
      }
      entity_memberships: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          profile_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          profile_id: string
          role_id: string
        }
        Update: Partial<Database["public"]["Tables"]["entity_memberships"]["Insert"]>
        Relationships: []
      }
      invoice_lines: {
        Row: {
          account_id: string
          account_name: string
          amount: number
          class_id: string | null
          class_name: string | null
          department_id: string | null
          department_name: string | null
          description: string
          id: string
          invoice_id: string
          project_id: string | null
          project_name: string | null
          quantity: number
          sort_order: number
          tax_amount: number | null
          unit_price: number
        }
        Insert: {
          account_id: string
          account_name: string
          amount: number
          class_id?: string | null
          class_name?: string | null
          department_id?: string | null
          department_name?: string | null
          description: string
          id: string
          invoice_id: string
          project_id?: string | null
          project_name?: string | null
          quantity?: number
          sort_order?: number
          tax_amount?: number | null
          unit_price?: number
        }
        Update: Partial<Database["public"]["Tables"]["invoice_lines"]["Insert"]>
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          amount_paid: number | null
          billing_address: string | null
          collection_status: string
          created_at: string
          currency: string
          customer_id: string
          customer_name: string
          date: string
          department_id: string | null
          department_name: string | null
          description: string | null
          due_date: string
          entity_id: string
          id: string
          memo: string | null
          number: string
          open_balance: number
          paid_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          billing_address?: string | null
          collection_status?: string
          created_at?: string
          currency?: string
          customer_id: string
          customer_name: string
          date: string
          department_id?: string | null
          department_name?: string | null
          description?: string | null
          due_date: string
          entity_id: string
          id: string
          memo?: string | null
          number: string
          open_balance?: number
          paid_at?: string | null
          sent_at?: string | null
          status: string
        }
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_entity_id: string | null
          email: string
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string
          default_entity_id?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          bank_account_id: string
          bank_account_name: string
          check_number: string | null
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          customer_name: string
          date: string
          entity_id: string
          id: string
          invoice_ids: string[]
          memo: string | null
          method: string
          number: string
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          bank_account_name: string
          check_number?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_id: string
          customer_name: string
          date: string
          entity_id: string
          id: string
          invoice_ids?: string[]
          memo?: string | null
          method: string
          number: string
          reference?: string | null
          status: string
        }
        Update: Partial<Database["public"]["Tables"]["receipts"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
