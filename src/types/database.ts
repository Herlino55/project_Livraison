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
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          email: string
          address: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          email?: string
          address?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          email?: string
          address?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          reference: string
          description: string
          recipient_name: string
          recipient_phone: string
          delivery_address: string
          price: number
          status: 'pending' | 'in_progress' | 'delivered' | 'failed'
          scheduled_date: string
          delivered_at: string | null
          notes: string
          signature: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          reference: string
          description?: string
          recipient_name: string
          recipient_phone: string
          delivery_address: string
          price?: number
          status?: 'pending' | 'in_progress' | 'delivered' | 'failed'
          scheduled_date: string
          delivered_at?: string | null
          notes?: string
          signature?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          reference?: string
          description?: string
          recipient_name?: string
          recipient_phone?: string
          delivery_address?: string
          price?: number
          status?: 'pending' | 'in_progress' | 'delivered' | 'failed'
          scheduled_date?: string
          delivered_at?: string | null
          notes?: string
          signature?: string
          created_at?: string
          updated_at?: string
        }
      }
      delivery_photos: {
        Row: {
          id: string
          delivery_id: string
          photo_url: string
          photo_type: 'product' | 'proof'
          created_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          photo_url: string
          photo_type?: 'product' | 'proof'
          created_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          photo_url?: string
          photo_type?: 'product' | 'proof'
          created_at?: string
        }
      }
    }
  }
}
