export type Category = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio'
export type ExerciseType = 'strength' | 'cardio' | 'bodyweight'
export type Units = 'kg' | 'lbs'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  units: Units
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  category: Category
  type: ExerciseType
  created_by: string | null
}

export interface Workout {
  id: string
  user_id: string
  name: string
  started_at: string
  finished_at: string | null
  notes: string | null
  share_token: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_secs: number | null
  completed_at: string
}

export interface BodyWeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
  notes: string | null
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  sort_order: number
}

type InsertOf<T> = Omit<T, 'id' | 'created_at' | 'completed_at' | 'started_at'> & {
  id?: string
  created_at?: string
  completed_at?: string
  started_at?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      exercises: {
        Row: Exercise
        Insert: InsertOf<Exercise>
        Update: Partial<Exercise>
      }
      workouts: {
        Row: Workout
        Insert: InsertOf<Workout>
        Update: Partial<Workout>
      }
      workout_sets: {
        Row: WorkoutSet
        Insert: InsertOf<WorkoutSet>
        Update: Partial<WorkoutSet>
      }
      workout_templates: {
        Row: WorkoutTemplate
        Insert: InsertOf<WorkoutTemplate>
        Update: Partial<WorkoutTemplate>
      }
      body_weight_logs: {
        Row: BodyWeightLog
        Insert: Omit<BodyWeightLog, 'id' | 'logged_at'> & {
          id?: string
          logged_at?: string
        }
        Update: Partial<BodyWeightLog>
      }
      template_exercises: {
        Row: TemplateExercise
        Insert: InsertOf<TemplateExercise>
        Update: Partial<TemplateExercise>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
