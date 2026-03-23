export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_journey: {
        Row: {
          id: string;
          user_id: string;
          entity_type: 'theme' | 'book' | 'life_context' | 'prayer_topic' | 'passage';
          entity_key: string;
          metadata: Json;
          relevance_score: number;
          first_seen: string;
          last_seen: string;
          mention_count: number;
        };
        Insert: Omit<Database['public']['Tables']['user_journey']['Row'], 'id' | 'first_seen' | 'last_seen'>;
        Update: Partial<Database['public']['Tables']['user_journey']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          cited_verses: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      bible_verses: {
        Row: {
          id: number;
          translation: string;
          book: string;
          chapter: number;
          verse: number;
          text: string;
        };
        Insert: Omit<Database['public']['Tables']['bible_verses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['bible_verses']['Insert']>;
      };
      bible_embeddings: {
        Row: {
          id: number;
          translation: string;
          book: string;
          chapter: number;
          start_verse: number;
          end_verse: number;
          chunk_text: string;
          testament: 'OT' | 'NT';
          genre: string;
          embedding: number[];
        };
        Insert: Omit<Database['public']['Tables']['bible_embeddings']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['bible_embeddings']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          translation_preference: string;
          faith_background: string | null;
          heart_note: string | null;
          voice_id: string | null;
          prayer_reminder_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      daily_verses: {
        Row: {
          id: number;
          date: string;
          translation: string;
          book: string;
          chapter: number;
          verse: number;
          text: string;
          reflection: string | null;
        };
        Insert: Omit<Database['public']['Tables']['daily_verses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['daily_verses']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
