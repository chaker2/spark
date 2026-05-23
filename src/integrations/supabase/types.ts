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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      choices: {
        Row: {
          id: string
          is_correct: boolean
          position: number
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          position?: number
          question_id: string
          text: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          position?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          total_xp: number
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          total_xp?: number
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          expected_answer: string | null
          id: string
          image_url: string | null
          points: number
          position: number
          quiz_id: string
          text: string
          time_limit: number
          type: string
        }
        Insert: {
          created_at?: string
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          points?: number
          position?: number
          quiz_id: string
          text: string
          time_limit?: number
          type?: string
        }
        Update: {
          created_at?: string
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          points?: number
          position?: number
          quiz_id?: string
          text?: string
          time_limit?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          lesson: string | null
          level: string | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lesson?: string | null
          level?: string | null
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lesson?: string | null
          level?: string | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_answers: {
        Row: {
          answered_at: string
          choice_id: string | null
          client_id: string
          id: string
          is_correct: boolean
          question_id: string
          room_id: string
          score_awarded: number
          username: string
        }
        Insert: {
          answered_at?: string
          choice_id?: string | null
          client_id: string
          id?: string
          is_correct?: boolean
          question_id: string
          room_id: string
          score_awarded?: number
          username: string
        }
        Update: {
          answered_at?: string
          choice_id?: string | null
          client_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          room_id?: string
          score_awarded?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_answers_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          avatar: string | null
          client_id: string
          id: string
          joined_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar?: string | null
          client_id: string
          id?: string
          joined_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar?: string | null
          client_id?: string
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          current_question_id: string | null
          ended_at: string | null
          host_id: string
          id: string
          question_started_at: string | null
          quiz_id: string | null
          reveal_answer: boolean
          started_at: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          current_question_id?: string | null
          ended_at?: string | null
          host_id: string
          id?: string
          question_started_at?: string | null
          quiz_id?: string | null
          reveal_answer?: boolean
          started_at?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_question_id?: string | null
          ended_at?: string | null
          host_id?: string
          id?: string
          question_started_at?: string | null
          quiz_id?: string | null
          reveal_answer?: boolean
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_profiles: {
        Args: never
        Returns: {
          display_name: string
          id: string
          is_admin: boolean
          total_xp: number
        }[]
      }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      generate_room_code: { Args: never; Returns: string }
      get_answer_distribution: {
        Args: { _question_id: string; _room_id: string }
        Returns: {
          choice_id: string
          count: number
          is_correct: boolean
        }[]
      }
      get_global_leaderboard: {
        Args: { _since: string }
        Returns: {
          total: number
          username: string
        }[]
      }
      get_question_choices: {
        Args: { _question_id: string }
        Returns: {
          id: string
          pos: number
          text: string
        }[]
      }
      get_room_scoreboard: {
        Args: { _room_id: string }
        Returns: {
          total: number
          username: string
        }[]
      }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_display_name_available: { Args: { _name: string }; Returns: boolean }
      soundex: { Args: { "": string }; Returns: string }
      submit_answer:
        | {
            Args: {
              _choice_id: string
              _client_id: string
              _puzzle_order: string[]
              _question_id: string
              _room_id: string
              _username: string
            }
            Returns: {
              correct_choice_id: string
              correct_order: string[]
              is_correct: boolean
              score_awarded: number
            }[]
          }
        | {
            Args: {
              _choice_id: string
              _client_id: string
              _puzzle_order: string[]
              _question_id: string
              _room_id: string
              _text_answer?: string
              _username: string
            }
            Returns: {
              correct_choice_id: string
              correct_order: string[]
              correct_text: string
              is_correct: boolean
              score_awarded: number
              similarity: number
            }[]
          }
      text_normalize: { Args: { _s: string }; Returns: string }
      text_similarity: { Args: { _a: string; _b: string }; Returns: number }
      text_soundex: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
