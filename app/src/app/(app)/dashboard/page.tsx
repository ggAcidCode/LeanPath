'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getTodayString, calculateStepCalories } from '@/lib/calculations';
import {
  Flame, Bell, Settings, Camera, MessageSquare, Search,
  Sun, Salad, Cookie, Plus, Footprints, Dumbbell,
  TrendingDown, ChevronRight, Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface MealData {
  id: string;
  meal_slot: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: { food: { name: string } }[];
  input_method: string;
}

interface WorkoutData {
  id: string;
  type: string;
  duration_min: number;
  calories_burned: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const today = getTodayString();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [steps, setSteps] = useState(0);
  const [stepCalories, setStepCalories] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (prof) setProfile(prof);

      const { data: mealData } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at');
      if (mealData) setMeals(mealData as unknown as MealData[]);

      const { data: workoutData } = await supabase
        .from('workout_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);
      if (workoutData) setWorkouts(workoutData as unknown as WorkoutData[]);

      const { data: stepData } = await supabase
        .from('step_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      if (stepData) {
        setSteps(stepData.step_count);
        setStepCalories(calculateStepCalories(stepData.step_count, prof?.current_weight_kg || 80));
      }
    }
    load();
  }, [supabase, today]);

  const target = (profile?.daily_calorie_target as number) || 1820;
  const consumed = meals.reduce((sum, m) => sum + m.total_calories, 0);
  const burned = stepCalories + workouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const remaining = Math.max(0, target - consumed + burned);
  const progressPct = Math.min(100, (consumed / target) * 100);
  const currentWeight = (profile?.current_weight_kg as number) || 84;
  const goalWeight = (profile?.goal_weight_kg as number) || 75;
  const startWeight = currentWeight;
  const weightLost = startWeight - currentWeight;
  const totalToLose = startWeight - goalWeight;
  const weightProgressPct = totalToLose > 0 ? Math.min(100, (weightLost / totalToLose) * 100) : 0;

  // Ring SVG calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progressPct / 100) * circumference;

  const mealSlotConfig: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    breakfast: { icon: <Sun size={18} />, bg: '#FAEEDA', color: '#854F0B' },
    lunch: { icon: <Salad size={18} />, bg: '#E1F5EE', color: '#0F6E56' },
    dinner: { icon: <Flame size={18} />, bg: '#FDEDEF', color: '#B91C3E' },
    snack: { icon: <Cookie size={18} />, bg: '#EEEDFE', color: '#3C3489' },
  };

  // Macro totals
  const totalProtein = meals.reduce((s, m) => s + (m.total_protein || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.total_carbs || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.total_fat || 0), 0);
  const macroTotal = totalProtein + totalCarbs + totalFat || 1;

  return (
    <div style={{ padding: '16px 16px 0' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--lp-teal), var(--lp-teal-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(29,158,117,0.3)',
          }}>
            <Flame size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>LeanPath</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {formatDate(new Date())}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0 }}
            aria-label="Notifications">
            <Bell size={18} />
          </button>
          <Link href="/profile" className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0 }}>
            <Settings size={18} />
          </Link>
        </div>
      </div>

      {/* Hero Ring Card */}
      <div className="card animate-fade-in-up stagger-1" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}
            role="img" aria-label={`Calorie budget at ${Math.round(progressPct)} percent`}>
            {/* Background ring */}
            <circle cx="70" cy="70" r={radius} fill="none"
              stroke="var(--bg-tertiary)" strokeWidth="12" />
            {/* Progress ring */}
            <circle cx="70" cy="70" r={radius} fill="none"
              stroke="var(--lp-teal)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 70 70)"
              style={{
                transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 0 6px rgba(29,158,117,0.3))',
              }}
            />
            <text x="70" y="64" textAnchor="middle"
              style={{ fontSize: 26, fontWeight: 600, fill: 'var(--text-primary)' }}>
              {consumed.toLocaleString()}
            </text>
            <text x="70" y="82" textAnchor="middle"
              style={{ fontSize: 12, fill: 'var(--text-secondary)' }}>
              of {target.toLocaleString()} kcal
            </text>
          </svg>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Today&apos;s budget
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 14, letterSpacing: -0.5 }}>
              {remaining.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>kcal left</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Eaten</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{consumed.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Burned</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--lp-teal)' }}>+{burned}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Deficit</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--lp-teal-dark)' }}>
                  −{Math.max(0, target - consumed + burned)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Macros Card */}
      <div className="card animate-fade-in-up stagger-2" style={{ marginBottom: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Macros</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            P {totalProtein}g · C {totalCarbs}g · F {totalFat}g
          </div>
        </div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
          <div style={{ width: `${(totalProtein / macroTotal) * 100}%`, background: 'var(--lp-blue)', transition: 'width 0.5s' }} />
          <div style={{ width: `${(totalCarbs / macroTotal) * 100}%`, background: 'var(--lp-teal)', transition: 'width 0.5s' }} />
          <div style={{ width: `${(totalFat / macroTotal) * 100}%`, background: 'var(--lp-amber)', transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: 'var(--lp-blue)', borderRadius: 2, display: 'inline-block' }} />Protein
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: 'var(--lp-teal)', borderRadius: 2, display: 'inline-block' }} />Carbs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: 'var(--lp-amber)', borderRadius: 2, display: 'inline-block' }} />Fat
          </span>
        </div>
      </div>

      {/* Goal Projection Card */}
      <div className="animate-fade-in-up stagger-3" style={{
        background: 'var(--lp-blue-bg)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingDown size={14} color="#185FA5" />
              <span style={{ fontSize: 12, color: '#0C447C' }}>Projected goal date</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#042C53' }}>
              {new Date(Date.now() + 89 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 12, color: '#185FA5', marginTop: 2 }}>
              ~89 days · −0.75 lb/week pace
            </div>
          </div>
          <div style={{
            background: '#B5D4F4', color: '#042C53', fontSize: 11,
            padding: '4px 10px', borderRadius: 'var(--radius-md)', fontWeight: 500,
          }}>
            on track
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#185FA5', marginBottom: 6 }}>
            <span>{Math.round(currentWeight * 2.20462)} lb today</span>
            <span>{Math.round(goalWeight * 2.20462)} lb goal</span>
          </div>
          <div style={{ height: 6, background: '#B5D4F4', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(5, weightProgressPct)}%`, height: '100%', background: '#185FA5',
              borderRadius: 3, transition: 'width 0.8s',
            }} />
          </div>
        </div>
      </div>

      {/* Quick Log Row */}
      <div className="animate-fade-in-up stagger-4" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginBottom: 12,
      }}>
        {[
          { icon: <Camera size={20} />, label: 'Snap meal', href: '/log?method=photo' },
          { icon: <MessageSquare size={20} />, label: 'Describe', href: '/log?method=describe' },
          { icon: <Search size={20} />, label: 'Search', href: '/log?method=search' },
          { icon: <Sparkles size={20} />, label: 'AI Log', href: '/log?method=ai' },
        ].map(({ icon, label, href }) => (
          <Link key={label} href={href} className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '14px 4px', textDecoration: 'none', color: 'var(--text-primary)',
            cursor: 'pointer',
          }}>
            <div style={{ color: 'var(--lp-teal)' }}>{icon}</div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Today's Meals */}
      <div className="card animate-fade-in-up stagger-5" style={{ marginBottom: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Today&apos;s meals</div>
          <Link href="/log" style={{
            fontSize: 12, color: 'var(--lp-teal)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            Add <ChevronRight size={14} />
          </Link>
        </div>

        {meals.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--text-tertiary)', fontSize: 14,
          }}>
            <Camera size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No meals logged yet today</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Tap a quick action above to get started</p>
          </div>
        ) : (
          meals.map((meal, i) => {
            const config = mealSlotConfig[meal.meal_slot] || mealSlotConfig.snack;
            const itemNames = meal.items?.map(item => item.food?.name).join(', ') || '';
            return (
              <div key={meal.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < meals.length - 1 ? '1px solid var(--surface-border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: config.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: config.color,
                }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {meal.meal_slot.charAt(0).toUpperCase() + meal.meal_slot.slice(1)}
                    {meal.input_method !== 'search' && (
                      <span style={{
                        fontSize: 10, background: 'var(--lp-blue-bg)',
                        color: 'var(--lp-blue)', padding: '1px 6px',
                        borderRadius: 4, fontWeight: 500,
                      }}>AI</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{itemNames}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{meal.total_calories}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity Card */}
      <div className="card animate-fade-in-up stagger-6" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Activity</div>
          <Link href="/log?method=workout" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
            <Plus size={12} /> Add workout
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Footprints size={14} /> Steps
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{steps.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>~{stepCalories} kcal</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Dumbbell size={14} /> Workouts
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{workouts.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {workouts.length > 0
                ? `${workouts.reduce((s, w) => s + w.calories_burned, 0)} kcal`
                : 'No workouts yet'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
