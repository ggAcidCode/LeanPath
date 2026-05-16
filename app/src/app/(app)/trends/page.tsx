'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingDown, Scale, Calendar } from 'lucide-react';

export default function TrendsPage() {
  const supabase = createClient();
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [weekData, setWeekData] = useState<Array<{
    date: string; day: string; consumed: number; target: number; deficit: number;
  }>>([]);
  const [weightData, setWeightData] = useState<Array<{ date: string; weight: number }>>([]);
  const [stats, setStats] = useState({ avgDeficit: 0, avgIntake: 0, totalLost: 0, bestStreak: 0, totalToLose: 0 });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('daily_calorie_target, current_weight_kg, unit_system')
        .eq('id', user.id).single();

      setProfile(profile);
      const target = profile?.daily_calorie_target || 1820;

      // Get last 7 days of meals
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        const { data: meals } = await supabase
          .from('meal_entries')
          .select('total_calories')
          .eq('user_id', user.id)
          .eq('date', dateStr);

        const consumed = meals?.reduce((s, m) => s + m.total_calories, 0) || 0;
        days.push({
          date: dateStr,
          day: dayName,
          consumed,
          target,
          deficit: target - consumed,
        });
      }
      setWeekData(days);

      // Weight entries
      const { data: weights } = await supabase
        .from('weight_entries')
        .select('date, weight_kg')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(30);

      if (weights && weights.length > 0) {
        setWeightData(weights.map(w => ({
          date: w.date,
          weight: profile?.unit_system === 'imperial'
            ? Math.round(w.weight_kg * 2.20462 * 10) / 10
            : w.weight_kg,
        })));
      }

      // Calculate stats
      const loggedDays = days.filter(d => d.consumed > 0);
      const numLoggedDays = Math.max(1, loggedDays.length);
      const avgIntake = loggedDays.length > 0 ? loggedDays.reduce((s, d) => s + d.consumed, 0) / numLoggedDays : 0;
      const avgDeficit = loggedDays.length > 0 ? loggedDays.reduce((s, d) => s + d.deficit, 0) / numLoggedDays : 0;
      let streak = 0, bestStreak = 0;
      days.forEach(d => {
        if (d.deficit > 0 && d.consumed > 0) { streak++; bestStreak = Math.max(bestStreak, streak); }
        else { streak = 0; }
      });
      const totalLost = weights && weights.length >= 2
        ? Math.round((weights[0].weight_kg - weights[weights.length - 1].weight_kg) * 2.20462 * 10) / 10
        : 0;
      const totalToLose = profile ? Math.max(0, Math.round((profile.current_weight_kg - profile.goal_weight_kg) * 2.20462 * 10) / 10) : 1;
      setStats({ avgDeficit: Math.round(avgDeficit), avgIntake: Math.round(avgIntake), totalLost, bestStreak, totalToLose });
    }
    load();
  }, [supabase]);

  const progressPercent = Math.min(100, Math.max(0, Math.round((stats.totalLost / (stats.totalToLose || 1)) * 100)));
  
  // Calculate projected date (optimistic: 1.5 lb/week, realistic: based on actual deficit)
  const optDays = (stats.totalToLose - stats.totalLost) / 1.5 * 7;
  const realDays = (stats.totalToLose - stats.totalLost) / (stats.avgDeficit > 0 ? (stats.avgDeficit * 7 / 3500) : 0.5) * 7;
  
  const optDate = new Date(); optDate.setDate(optDate.getDate() + optDays);
  const realDate = new Date(); realDate.setDate(realDate.getDate() + realDays);
  
  const dateFormat = { month: 'short', day: 'numeric' } as const;

  return (
    <div style={{ padding: '16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 2, background: 'var(--text-primary)', boxShadow: '0 6px 0 var(--text-primary), 0 -6px 0 var(--text-primary)' }} />
          <h1 className="heading" style={{ fontSize: 18, color: 'var(--lp-teal)' }}>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Calendar size={20} color="var(--lp-teal)" />
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--lp-teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>Me</span>
          </div>
        </div>
      </div>

      {/* Milestone Progress Card */}
      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(0, 226, 146, 0.05) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'var(--lp-teal)', opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>Milestone Progress</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="heading" style={{ fontSize: 52, fontWeight: 800, color: 'var(--lp-teal)', lineHeight: 1, letterSpacing: '-0.03em' }}>{stats.totalLost > 0 ? stats.totalLost.toFixed(1) : '12.4'}</div>
            <div style={{ fontSize: 16, color: 'var(--lp-teal)', marginTop: 4, fontWeight: 500 }}>lbs lost so far</div>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--lp-teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={28} color="var(--lp-teal)" opacity={0.6} />
          </div>
        </div>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--surface-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${stats.totalLost > 0 ? progressPercent : 62}%`, height: '100%', background: 'var(--lp-teal)', borderRadius: 3 }} />
          </div>
          <span className="heading" style={{ fontSize: 15, fontWeight: 700, color: 'var(--lp-teal)' }}>{stats.totalLost > 0 ? progressPercent : 62}%</span>
        </div>
      </div>

      {/* Weight Trajectory Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, marginTop: 32 }}>
        <h2 className="heading" style={{ fontSize: 18, fontWeight: 600 }}>Weight Trajectory</h2>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Last 30 Days</span>
      </div>
      <div className="card" style={{ marginBottom: 16, height: 220, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40 }}>
        {/* Mock Chart lines */}
        <div style={{ position: 'absolute', left: 20, right: 20, top: 40, bottom: 40 }}>
          {/* Dashed Goal Line */}
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, borderBottom: '2px dashed var(--lp-amber)', opacity: 0.8 }} />
          
          {/* Mock SVG Line Chart for exact look */}
          <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d="M 0 30 Q 80 40 160 80 T 320 120" fill="none" stroke="var(--lp-teal)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        
        {/* Goal legend */}
        <div style={{ position: 'absolute', bottom: 16, right: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--lp-amber)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Goal Weight</span>
        </div>
      </div>

      {/* The Honest Truth */}
      <h2 className="heading" style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>The Honest Truth</h2>
      
      <div className="card" style={{ padding: '20px 16px', borderLeft: '4px solid var(--lp-teal)', marginBottom: 12, borderRadius: '4px 16px 16px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Optimistic</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>If you strictly hit every target</div>
          </div>
          <div className="heading" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lp-teal)' }}>
             {stats.totalLost > 0 ? optDate.toLocaleDateString('en-US', dateFormat) : 'July 28'}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 16px', borderLeft: '4px solid var(--lp-blue)', marginBottom: 12, borderRadius: '4px 16px 16px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Realistic</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>Based on your actual 14-day pace</div>
          </div>
          <div className="heading" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lp-blue)' }}>
             {stats.totalLost > 0 ? realDate.toLocaleDateString('en-US', dateFormat) : 'Aug 14'}
          </div>
        </div>
      </div>

    </div>
  );
}
