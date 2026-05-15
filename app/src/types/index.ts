export type UnitSystem = 'imperial' | 'metric';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type DeficitLevel = 'gentle' | 'moderate' | 'aggressive' | 'maximum';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputMethod = 'search' | 'photo' | 'description' | 'barcode';
export type AdherenceLabel = 'on_track' | 'light_deficit' | 'maintenance' | 'surplus';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  sex: Sex;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  activity_level: ActivityLevel;
  deficit_level: DeficitLevel;
  unit_system: UnitSystem;
  daily_calorie_target: number;
  onboarding_complete: boolean;
  created_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  serving_weight_g: number;
  source: 'database' | 'user' | 'ai';
  confidence?: number;
}

export interface MealEntry {
  id: string;
  user_id: string;
  date: string;
  meal_slot: MealSlot;
  items: MealFoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  input_method: InputMethod;
  photo_url?: string;
  ai_description?: string;
  created_at: string;
}

export interface MealFoodItem {
  food: FoodItem;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutEntry {
  id: string;
  user_id: string;
  date: string;
  type: string;
  duration_min: number;
  intensity: 'low' | 'moderate' | 'high';
  calories_burned: number;
  input_method: 'manual' | 'ai';
  created_at: string;
}

export interface StepEntry {
  id: string;
  user_id: string;
  date: string;
  step_count: number;
  calories_burned: number;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export interface DaySummary {
  date: string;
  consumed: number;
  burned: number;
  target: number;
  deficit: number;
  adherence: AdherenceLabel;
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
  step_calories: number;
  workout_calories: number;
  meals: MealEntry[];
  workouts: WorkoutEntry[];
}

export interface GoalProjection {
  projected_date: string;
  days_remaining: number;
  weekly_loss_rate: number;
  current_weight: number;
  goal_weight: number;
  progress_pct: number;
  pace_label: AdherenceLabel;
}

export interface AIFoodEstimate {
  items: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  }[];
  disclaimer: string;
}
