'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  User, Scale, Target, Zap, LogOut, ChevronRight,
  Ruler, Activity, Flame,
} from 'lucide-react';
import { getDeficitInfo, kgToLbs, calculateDailyTarget } from '@/lib/calculations';
import type { DeficitLevel, ActivityLevel, Sex } from '@/types';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function saveField(field: string, value: unknown) {
    if (!profile) return;
    setSaving(true);

    const updates: Record<string, unknown> = { [field]: value };

    // Recalculate target if relevant fields change
    if (['current_weight_kg', 'height_cm', 'age', 'sex', 'activity_level', 'deficit_level'].includes(field)) {
      const p = { ...profile, ...updates };
      updates.daily_calorie_target = calculateDailyTarget(
        p.sex as Sex,
        p.current_weight_kg as number,
        p.height_cm as number,
        p.age as number,
        p.activity_level as ActivityLevel,
        p.deficit_level as DeficitLevel,
      );
    }

    await supabase.from('profiles').update(updates).eq('id', profile.id);
    setProfile({ ...profile, ...updates });
    setEditing(null);
    setSaving(false);
  }

  async function logWeight() {
    if (!profile || !editValue) return;
    const weightKg = parseFloat(editValue) / 2.20462;
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('weight_entries').upsert({
      user_id: profile.id,
      date: today,
      weight_kg: Math.round(weightKg * 10) / 10,
    });

    await saveField('current_weight_kg', Math.round(weightKg * 10) / 10);
    setEditing(null);
  }

  if (!profile) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: 'var(--lp-teal)' }} />
      </div>
    );
  }

  const deficitInfo = getDeficitInfo(profile.deficit_level as DeficitLevel);

  const sections = [
    {
      title: 'Body',
      icon: <User size={16} />,
      items: [
        { label: 'Current weight', value: `${Math.round(kgToLbs(profile.current_weight_kg as number))} lbs`, field: 'weight', action: 'Log weight' },
        { label: 'Goal weight', value: `${Math.round(kgToLbs(profile.goal_weight_kg as number))} lbs`, field: 'goal_weight_kg' },
        { label: 'Height', value: `${Math.round((profile.height_cm as number) / 2.54)} in`, field: 'height_cm' },
        { label: 'Age', value: `${profile.age}`, field: 'age' },
      ],
    },
    {
      title: 'Goal settings',
      icon: <Target size={16} />,
      items: [
        { label: 'Daily target', value: `${(profile.daily_calorie_target as number)?.toLocaleString()} kcal`, field: null },
        { label: 'Deficit pace', value: `${(profile.deficit_level as string)?.charAt(0).toUpperCase()}${(profile.deficit_level as string)?.slice(1)} (${deficitInfo?.weekly}/wk)`, field: 'deficit_level' },
        { label: 'Activity level', value: `${(profile.activity_level as string)?.replace('_', ' ')}`, field: 'activity_level' },
      ],
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Profile</h1>
      </div>

      {/* User card */}
      <div className="card animate-fade-in-up" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--lp-teal), var(--lp-teal-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 600, fontSize: 18,
        }}>
          {((profile.full_name as string) || (profile.email as string) || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{profile.full_name as string || 'User'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile.email as string}</div>
        </div>
      </div>

      {/* Settings sections */}
      {sections.map((section) => (
        <div key={section.title} className="card animate-fade-in-up" style={{ marginBottom: 12, padding: 0 }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--surface-border)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
          }}>
            {section.icon} {section.title}
          </div>
          {section.items.map((item, i) => (
            <button key={item.label}
              onClick={() => {
                if (item.field === 'weight') {
                  setEditing('weight');
                  setEditValue(String(Math.round(kgToLbs(profile.current_weight_kg as number))));
                } else if (item.field) {
                  setEditing(item.field);
                }
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', width: '100%',
                borderBottom: i < section.items.length - 1 ? '1px solid var(--surface-border)' : 'none',
                background: 'none', border: 'none', borderBottomStyle: 'solid',
                borderBottomWidth: i < section.items.length - 1 ? 1 : 0,
                borderBottomColor: 'var(--surface-border)',
                cursor: item.field ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.value}</span>
                {item.field && <ChevronRight size={14} color="var(--text-tertiary)" />}
              </div>
            </button>
          ))}
        </div>
      ))}

      {/* Log weight modal */}
      {editing === 'weight' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={20} color="var(--lp-teal)" /> Log weight
            </h3>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Weight (lbs)</label>
              <input type="number" className="input-field" value={editValue}
                onChange={e => setEditValue(e.target.value)} autoFocus step="0.1" />
            </div>
            <button className="btn btn-primary btn-full" onClick={logWeight} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save weight'}
            </button>
          </div>
        </div>
      )}

      {/* Deficit level modal */}
      {editing === 'deficit_level' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="var(--lp-teal)" /> Deficit pace
            </h3>
            {(['gentle', 'moderate', 'aggressive', 'maximum'] as DeficitLevel[]).map(level => {
              const info = getDeficitInfo(level);
              return (
                <button key={level} className="card" onClick={() => saveField('deficit_level', level)}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 8,
                    border: profile.deficit_level === level ? '2px solid var(--lp-teal)' : '1px solid var(--surface-border)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{level}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{info.note}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-teal)' }}>{info.weekly}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity level modal */}
      {editing === 'activity_level' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="var(--lp-teal)" /> Activity level
            </h3>
            {([
              { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal exercise' },
              { value: 'lightly_active', label: 'Lightly active', desc: 'Light exercise 1-3 days/week' },
              { value: 'moderately_active', label: 'Moderately active', desc: 'Moderate exercise 3-5 days/week' },
              { value: 'very_active', label: 'Very active', desc: 'Hard exercise 6-7 days/week' },
            ]).map(opt => (
              <button key={opt.value} className="card" onClick={() => saveField('activity_level', opt.value)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 8,
                  border: profile.activity_level === opt.value ? '2px solid var(--lp-teal)' : '1px solid var(--surface-border)',
                }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button className="btn btn-secondary btn-full" onClick={handleLogout}
        style={{ marginTop: 12, marginBottom: 24, color: 'var(--lp-red)' }}>
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
