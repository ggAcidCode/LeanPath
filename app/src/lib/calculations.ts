import type { Sex, ActivityLevel, DeficitLevel } from '@/types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

const DEFICIT_VALUES: Record<DeficitLevel, number> = {
  gentle: 250,
  moderate: 500,
  aggressive: 750,
  maximum: 1000,
};

/** Mifflin-St Jeor BMR */
export function calculateBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
}

export function calculateDailyTarget(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  deficitLevel: DeficitLevel
): number {
  const bmr = calculateBMR(sex, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const deficit = DEFICIT_VALUES[deficitLevel];
  const target = tdee - deficit;

  const minCalories = sex === 'female' ? 1200 : 1500;
  return Math.max(target, minCalories);
}

export function calculateStepCalories(steps: number, weightKg: number): number {
  // ~0.04 kcal per step per kg of body weight / 100
  return Math.round(steps * weightKg * 0.0004);
}

export function estimateGoalDate(
  currentWeightKg: number,
  goalWeightKg: number,
  avgWeeklyDeficit: number
): Date {
  const weightToLose = currentWeightKg - goalWeightKg;
  // 7700 kcal ≈ 1 kg of body fat
  const weeksNeeded = (weightToLose * 7700) / (avgWeeklyDeficit || 1);
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + Math.round(weeksNeeded * 7));
  return goalDate;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function getDeficitInfo(level: DeficitLevel) {
  const info = {
    gentle: { daily: 250, weekly: '~0.5 lb', note: 'Sustainable; minimal hunger' },
    moderate: { daily: 500, weekly: '~1.0 lb', note: 'Most common; recommended' },
    aggressive: { daily: 750, weekly: '~1.5 lb', note: 'May affect energy' },
    maximum: { daily: 1000, weekly: '~2.0 lb', note: 'Short-term only' },
  };
  return info[level];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
