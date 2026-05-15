'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Camera, MessageSquare, Search, ArrowLeft,
  Sparkles, Plus, Check, Loader2, AlertCircle,
  Dumbbell, Footprints,
} from 'lucide-react';
import { getTodayString } from '@/lib/calculations';
import type { MealSlot } from '@/types';

function LogContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'search';
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState(method);
  const [mealSlot, setMealSlot] = useState<MealSlot>(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    name: string; calories: number; protein: number; carbs: number; fat: number; serving: string;
  }>>([]);

  // AI describe state
  const [description, setDescription] = useState('');
  const [aiResult, setAiResult] = useState<Array<{
    name: string; quantity: number; unit: string;
    calories: number; protein: number; carbs: number; fat: number; confidence: number;
  }> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Steps state
  const [stepCount, setStepCount] = useState('');

  // Workout state
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutIntensity, setWorkoutIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sample food database for search
  const sampleFoods = [
    { name: 'Greek Yogurt (plain, 1 cup)', calories: 130, protein: 22, carbs: 9, fat: 0, serving: '1 cup (245g)' },
    { name: 'Chicken Breast (grilled, 6oz)', calories: 280, protein: 52, carbs: 0, fat: 6, serving: '6 oz (170g)' },
    { name: 'Brown Rice (cooked, 1 cup)', calories: 216, protein: 5, carbs: 45, fat: 2, serving: '1 cup (195g)' },
    { name: 'Banana (medium)', calories: 105, protein: 1, carbs: 27, fat: 0, serving: '1 medium (118g)' },
    { name: 'Egg (large, scrambled)', calories: 91, protein: 6, carbs: 1, fat: 7, serving: '1 large (61g)' },
    { name: 'Salmon (baked, 4oz)', calories: 234, protein: 25, carbs: 0, fat: 14, serving: '4 oz (113g)' },
    { name: 'Avocado (half)', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '½ medium (68g)' },
    { name: 'Oatmeal (cooked, 1 cup)', calories: 154, protein: 5, carbs: 27, fat: 3, serving: '1 cup (234g)' },
    { name: 'Apple (medium)', calories: 95, protein: 0, carbs: 25, fat: 0, serving: '1 medium (182g)' },
    { name: 'Almonds (1 oz)', calories: 164, protein: 6, carbs: 6, fat: 14, serving: '1 oz (28g)' },
    { name: 'Caesar Salad (with chicken)', calories: 470, protein: 36, carbs: 18, fat: 28, serving: '1 bowl' },
    { name: 'Coffee (black)', calories: 2, protein: 0, carbs: 0, fat: 0, serving: '8 fl oz' },
    { name: 'Protein Shake (whey, water)', calories: 120, protein: 24, carbs: 3, fat: 1, serving: '1 scoop + water' },
  ];

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const filtered = sampleFoods.filter(f =>
      f.name.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
  }

  async function handleAIDescribe() {
    if (!description.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data.items);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed. Try manual entry.');
    } finally {
      setAiLoading(false);
    }
  }

  async function saveMeal(items: Array<{
    name: string; calories: number; protein: number; carbs: number; fat: number;
    quantity?: number; unit?: string;
  }>, inputMethod: string) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totalCalories = items.reduce((s, i) => s + i.calories, 0);
    const totalProtein = items.reduce((s, i) => s + i.protein, 0);
    const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
    const totalFat = items.reduce((s, i) => s + i.fat, 0);

    await supabase.from('meal_entries').insert({
      user_id: user.id,
      date: getTodayString(),
      meal_slot: mealSlot,
      items: items.map(i => ({
        food: { name: i.name, calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat },
        quantity: i.quantity || 1,
        unit: i.unit || 'serving',
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
      })),
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      input_method: inputMethod,
      ai_description: inputMethod === 'description' ? description : null,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 800);
  }

  async function saveSteps() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const count = parseInt(stepCount) || 0;
    await supabase.from('step_entries').upsert({
      user_id: user.id,
      date: getTodayString(),
      step_count: count,
      calories_burned: Math.round(count * 0.04),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 800);
  }

  async function saveWorkout() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const duration = parseInt(workoutDuration) || 30;
    const calMultiplier = workoutIntensity === 'low' ? 4 : workoutIntensity === 'moderate' ? 6 : 9;
    await supabase.from('workout_entries').insert({
      user_id: user.id,
      date: getTodayString(),
      type: workoutType || 'General',
      duration_min: duration,
      intensity: workoutIntensity,
      calories_burned: Math.round(duration * calMultiplier),
      input_method: 'manual',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 800);
  }

  if (saved) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
      }}>
        <div className="animate-scale-in" style={{
          width: 64, height: 64, borderRadius: 'var(--radius-full)',
          background: 'var(--lp-teal-glow)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={32} color="var(--lp-teal)" />
        </div>
        <p style={{ fontWeight: 500, fontSize: 16 }}>Saved!</p>
      </div>
    );
  }

  const tabs = [
    { id: 'search', icon: <Search size={16} />, label: 'Search' },
    { id: 'describe', icon: <MessageSquare size={16} />, label: 'Describe' },
    { id: 'photo', icon: <Camera size={16} />, label: 'Photo' },
    { id: 'ai', icon: <Sparkles size={16} />, label: 'AI' },
    { id: 'steps', icon: <Footprints size={16} />, label: 'Steps' },
    { id: 'workout', icon: <Dumbbell size={16} />, label: 'Workout' },
  ];

  return (
    <div style={{ padding: '16px', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => router.back()}
          style={{ width: 36, height: 36, padding: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Log entry</h1>
      </div>

      {/* Method Tabs */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 20,
        paddingBottom: 4, WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(tab => (
          <button key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Meal Slot Selector (for food entries) */}
      {!['steps', 'workout'].includes(activeTab) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map(slot => (
            <button key={slot}
              className={`btn ${mealSlot === slot ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '6px 12px', flex: 1 }}
              onClick={() => setMealSlot(slot)}
            >
              {slot.charAt(0).toUpperCase() + slot.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
              }} />
              <input className="input-field" placeholder="Search foods..."
                value={searchQuery} onChange={e => handleSearch(e.target.value)}
                style={{ paddingLeft: 40 }} autoFocus />
            </div>
          </div>
          {searchResults.map((food, i) => (
            <button key={i} className="card" onClick={() => saveMeal([food], 'search')}
              disabled={saving}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                marginBottom: 8, padding: '14px 16px',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{food.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {food.serving} · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-teal-dark)' }}>
                    {food.calories}
                  </span>
                  <Plus size={16} color="var(--lp-teal)" />
                </div>
              </div>
            </button>
          ))}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)' }}>
              <p>No results found for &quot;{searchQuery}&quot;</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try the AI describe tab for custom meals</p>
            </div>
          )}
        </div>
      )}

      {/* Describe / AI Tab */}
      {(activeTab === 'describe' || activeTab === 'ai') && (
        <div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Describe your meal</label>
            <textarea className="input-field" placeholder='e.g. "grilled chicken sandwich with fries and a coke"'
              value={description} onChange={e => setDescription(e.target.value)}
              rows={3} style={{ resize: 'none' }} />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleAIDescribe}
            disabled={aiLoading || !description.trim()}>
            {aiLoading ? <><Loader2 size={16} className="spinner" /> Analyzing...</> : <><Sparkles size={16} /> Analyze with AI</>}
          </button>

          {aiError && (
            <div className="auth-error" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {aiError}
            </div>
          )}

          {aiResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Sparkles size={12} /> AI estimate — tap to save
              </div>
              {aiResult.map((item, i) => (
                <div key={i} className="card" style={{ marginBottom: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.quantity} {item.unit} · P {item.protein}g · C {item.carbs}g · F {item.fat}g
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{item.calories}</div>
                      <div style={{
                        fontSize: 10, color: item.confidence > 0.8 ? 'var(--lp-teal)' : 'var(--lp-amber)',
                      }}>
                        {Math.round(item.confidence * 100)}% conf
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary btn-full" style={{ marginTop: 8 }}
                onClick={() => saveMeal(aiResult, 'description')} disabled={saving}>
                {saving ? <span className="spinner" /> : <><Check size={16} /> Save meal</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Photo Tab */}
      {activeTab === 'photo' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)',
            background: 'var(--lp-teal-glow)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Camera size={36} color="var(--lp-teal)" />
          </div>
          <h3 style={{ fontWeight: 500, marginBottom: 8 }}>Snap a photo</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Take a photo of your meal and our AI will identify the food and estimate calories.
          </p>
          <label className="btn btn-primary btn-lg btn-full" style={{ cursor: 'pointer' }}>
            <Camera size={18} /> Take photo
            <input type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAiLoading(true);
                setActiveTab('ai');
                const formData = new FormData();
                formData.append('image', file);
                try {
                  const res = await fetch('/api/ai/analyze-photo', {
                    method: 'POST', body: formData,
                  });
                  const data = await res.json();
                  if (data.items) setAiResult(data.items);
                  else setAiError('Could not analyze photo');
                } catch {
                  setAiError('Failed to analyze photo');
                } finally {
                  setAiLoading(false);
                }
              }}
            />
          </label>
        </div>
      )}

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label>Today&apos;s step count</label>
            <input type="number" className="input-field" placeholder="e.g. 8000"
              value={stepCount} onChange={e => setStepCount(e.target.value)} autoFocus />
            {stepCount && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                ≈ {Math.round(parseInt(stepCount) * 0.04)} kcal burned
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-full" onClick={saveSteps}
            disabled={!stepCount || saving}>
            {saving ? <span className="spinner" /> : 'Save steps'}
          </button>
        </div>
      )}

      {/* Workout Tab */}
      {activeTab === 'workout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Workout type</label>
            <select className="input-field" value={workoutType}
              onChange={e => setWorkoutType(e.target.value)}>
              <option value="">Select...</option>
              <option value="Running">Running</option>
              <option value="Cycling">Cycling</option>
              <option value="Weightlifting">Weightlifting</option>
              <option value="Yoga">Yoga</option>
              <option value="Swimming">Swimming</option>
              <option value="Walking">Walking</option>
              <option value="HIIT">HIIT</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label>Duration (minutes)</label>
            <input type="number" className="input-field" placeholder="30"
              value={workoutDuration} onChange={e => setWorkoutDuration(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Intensity</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'moderate', 'high'] as const).map(level => (
                <button key={level}
                  className={`btn ${workoutIntensity === level ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: 13 }}
                  onClick={() => setWorkoutIntensity(level)}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={saveWorkout}
            disabled={!workoutType || !workoutDuration || saving}>
            {saving ? <span className="spinner" /> : 'Save workout'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}><span className="spinner" /></div>}>
      <LogContent />
    </Suspense>
  );
}
