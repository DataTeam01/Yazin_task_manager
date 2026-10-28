
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "milestones": {
                  Row: {
                    "deadline": string | null,"id": string,"name": string,"position": number,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deadline"?: string | null,"id"?: string,"name": string,"position"?: number,"project_id": string
                  }
                  Update: {
                    "deadline"?: string | null,"id"?: string,"name"?: string,"position"?: number,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "archived_at": string | null,"color": string,"created_at": string,"deadline": string | null,"goal": string | null,"id": string,"name": string,"start_date": string | null,"status": Database["public"]['Enums']["project_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"color"?: string,"created_at"?: string,"deadline"?: string | null,"goal"?: string | null,"id"?: string,"name": string,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"]
                  }
                  Update: {
                    "archived_at"?: string | null,"color"?: string,"created_at"?: string,"deadline"?: string | null,"goal"?: string | null,"id"?: string,"name"?: string,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"]
                  }
                  Relationships: [
                    
                  ]
                },"schema_migrations": {
                  Row: {
                    "applied_at": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_at"?: string,"name": string
                  }
                  Update: {
                    "applied_at"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "color": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "color"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"task_tags": {
                  Row: {
                    "tag_id": string,"task_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "tag_id": string,"task_id": string
                  }
                  Update: {
                    "tag_id"?: string,"task_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_tags_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"deadline": string | null,"description": string | null,"estimate_minutes": number | null,"id": string,"milestone_id": string | null,"parent_task_id": string | null,"position": number,"priority": Database["public"]['Enums']["task_priority"],"project_id": string | null,"start_date": string | null,"status": Database["public"]['Enums']["task_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"deadline"?: string | null,"description"?: string | null,"estimate_minutes"?: number | null,"id"?: string,"milestone_id"?: string | null,"parent_task_id"?: string | null,"position"?: number,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"deadline"?: string | null,"description"?: string | null,"estimate_minutes"?: number | null,"id"?: string,"milestone_id"?: string | null,"parent_task_id"?: string | null,"position"?: number,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_parent_task_id_fkey"
      columns: ["parent_task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "project_status": "active"|"on_hold"|"completed","task_priority": "low"|"medium"|"high","task_status": "todo"|"doing"|"done"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "project_status": ["active", "on_hold", "completed"],"task_priority": ["low", "medium", "high"],"task_status": ["todo", "doing", "done"]
          }
        }
} as const
