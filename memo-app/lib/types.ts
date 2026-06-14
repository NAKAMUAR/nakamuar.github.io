/**
 * Minimal hand-written database types matching supabase/migrations.
 * (Generated types from `supabase gen types` could replace this later.)
 */

export type Note = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  note_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type Event = {
  id: string;
  user_id: string;
  title: string;
  location: string | null;
  notes: string | null;
  all_day: boolean;
  starts_at: string;
  ends_at: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: Note;
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          body?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          body?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: Attachment;
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          location?: string | null;
          notes?: string | null;
          all_day?: boolean;
          starts_at: string;
          ends_at: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          location?: string | null;
          notes?: string | null;
          all_day?: boolean;
          starts_at?: string;
          ends_at?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
