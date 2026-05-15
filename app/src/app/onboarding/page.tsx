'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Flame, ChevronRight, ChevronLeft, Target,
  User, Ruler, Activity, Zap,
} from 'lucide-react';
import type { Sex, ActivityLevel, DeficitLevel, UnitSystem } from '@/types';
import { calculateDailyTarget, getDeficitInfo } from '@/lib/calculations';

const STEPS = ['basics', 'body', 'activity', 'goal', 'deficit'] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('30');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('10');
  const [currentWeightLbs, setCurrentWeightLbs] = useState('185');
  const [goalWeightLbs, setGoalWeightLbs] = useState('165');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('lightly_active');
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevel>('moderate');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const heightCm = Math.round((parseInt(heightFt) * 12 + parseInt(heightIn || '0')) * 2.54);
  const currentWeightKg = Math.round(parseFloat(currentWeightLbs) / 2.20462 * 10) / 10;
  const goalWeightKg = Math.round(parseFloat(goalWeightLbs) / 2.20462 * 10) / 10;

  const dailyTarget = calculateDailyTarget(
    sex, currentWeightKg, heightCm, parseInt(age), activityLevel, deficitLevel
  );

  async function handleComplete() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      sex,
      age: parseInt(age),
      height_cm: heightCm,
      current_weight_kg: currentWeightKg,
      goal_weight_kg: goalWeightKg,
      activity_level: activityLevel,
      deficit_level: deficitLevel,
      unit_system: unitSystem,
      daily_calorie_target: dailyTarget,
      onboarding_complete: true,
    });

    // Store initial weight entry
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('weight_entries').upsert({
      user_id: user.id,
      date: today,
      weight_kg: currentWeightKg,
    });

    router.push('/dashboard');
    router.refresh();
  }

  const stepIcons = [
    <User key="u" size={20} />,
    <Ruler key="r" size={20} />,
    <Activity key="a" size={20} />,
    <Target key="t" size={20} />,
    <Zap key="z" size={20} />,
  ];

  const stepTitles = [
    'About you',
    'Your body',
    'Activity level',
    'Set your goal',
    'Choose your pace',
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', padding: 24 }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="auth-logo-icon" style={{ width: 36, height: 36 }}>
            <Flame size={20} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600 }}>LeanPath</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= step ? 'var(--lp-teal)' : 'var(--bg-tertiary)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step indicator */}
        <div className="animate-fade-in-up" key={step} style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
            color: 'var(--lp-teal)',
          }}>
            {stepIcons[step]}
            <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>{stepTitles[step]}</h1>
        </div>

        {/* Step content */}
        <div className="animate-fade-in-up" key={`content-${step}`}>
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Sex assigned at birth</label>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -2 }}>
                  Used only for BMR calculation
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['male', 'female'] as Sex[]).map((s) => (
                    <button key={s} className={`btn ${sex === s ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }} onClick={() => setSex(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="age">Age</label>
                <input id="age" type="number" className="input-field"
                  value={age} onChange={(e) => setAge(e.target.value)}
                  min="16" max="100" />
              </div>
              <div className="input-group">
                <label>Unit system</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['imperial', 'metric'] as UnitSystem[]).map((u) => (
                    <button key={u} className={`btn ${unitSystem === u ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }} onClick={() => setUnitSystem(u)}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Height</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input type="number" className="input-field" placeholder="Feet"
                      value={heightFt} onChange={(e) => setHeightFt(e.target.value)} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>ft</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="number" className="input-field" placeholder="Inches"
                      value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>in</span>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="currentWeight">Current weight</label>
                <input id="currentWeight" type="number" className="input-field"
                  value={currentWeightLbs} onChange={(e) => setCurrentWeightLbs(e.target.value)}
                  placeholder="lbs" step="0.1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal exercise' },
                { value: 'lightly_active', label: 'Lightly active', desc: 'Light exercise 1-3 days/week' },
                { value: 'moderately_active', label: 'Moderately active', desc: 'Moderate exercise 3-5 days/week' },
                { value: 'very_active', label: 'Very active', desc: 'Hard exercise 6-7 days/week' },
              ] as { value: ActivityLevel; label: string; desc: string }[]).map((opt) => (
                <button key={opt.value}
                  onClick={() => setActivityLevel(opt.value)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: activityLevel === opt.value
                      ? '2px solid var(--lp-teal)'
                      : '1px solid var(--surface-border)',
                    background: activityLevel === opt.value
                      ? 'var(--lp-teal-glow)'
                      : 'var(--bg-elevated)',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label htmlFor="goalWeight">Goal weight</label>
                <input id="goalWeight" type="number" className="input-field"
                  value={goalWeightLbs} onChange={(e) => setGoalWeightLbs(e.target.value)}
                  placeholder="lbs" step="0.1" />
              </div>
              <div className="card" style={{ background: 'var(--lp-blue-bg)', border: 'none' }}>
                <div style={{ fontSize: 13, color: 'var(--lp-blue)', fontWeight: 500 }}>
                  You&apos;ll lose {Math.max(0, parseFloat(currentWeightLbs) - parseFloat(goalWeightLbs)).toFixed(1)} lbs
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  From {currentWeightLbs} lbs → {goalWeightLbs} lbs
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['gentle', 'moderate', 'aggressive', 'maximum'] as DeficitLevel[]).map((level) => {
                const info = getDeficitInfo(level);
                return (
                  <button key={level}
                    onClick={() => setDeficitLevel(level)}
                    className="card"
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: deficitLevel === level
                        ? '2px solid var(--lp-teal)'
                        : '1px solid var(--surface-border)',
                      background: deficitLevel === level
                        ? 'var(--lp-teal-glow)'
                        : 'var(--bg-elevated)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, textTransform: 'capitalize' }}>{level}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{info.note}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-teal)' }}>{info.weekly}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>per week</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="card" style={{ background: 'var(--lp-teal-glow)', border: 'none', marginTop: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--lp-teal-dark)', fontWeight: 500 }}>
                  Your daily target: {dailyTarget.toLocaleString()} kcal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 32,
        }}>
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}
              style={{ flex: 0 }}>
              <ChevronLeft size={18} />
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-full" onClick={() => setStep(step + 1)}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary btn-full btn-lg" onClick={handleComplete}
              disabled={loading}>
              {loading ? <span className="spinner" /> : 'Start tracking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
