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
  const [stats, setStats] = useState({ avgDeficit: 0, avgIntake: 0, totalLost: 0, bestStreak: 0 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('daily_calorie_target, current_weight_kg, unit_system')
        .eq('id', user.id).single();

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
      setStats({ avgDeficit: Math.round(avgDeficit), avgIntake: Math.round(avgIntake), totalLost, bestStreak });
    }
    load();
  }, [supabase]);

  const maxConsumed = Math.max(...weekData.map(d => d.consumed), 1);

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Trends</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Your progress at a glance
        </p>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 3 }}>
        {(['weekly', 'monthly'] as const).map(v => (
          <button key={v}
            className={view === v ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
            onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingDown size={14} color="var(--lp-teal)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg deficit</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.avgDeficit} kcal</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <BarChart3 size={14} color="var(--lp-blue)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg intake</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.avgIntake.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Scale size={14} color="var(--lp-purple)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total lost</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.totalLost} lbs</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={14} color="var(--lp-amber)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Best streak</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.bestStreak} days</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Daily intake</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
          {weekData.map((d) => {
            const height = d.consumed > 0 ? (d.consumed / maxConsumed) * 120 : 4;
            const overBudget = d.consumed > d.target;
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {d.consumed > 0 ? d.consumed : '—'}
                </span>
                <div style={{
                  width: '100%', height, borderRadius: 'var(--radius-sm)',
                  background: overBudget
                    ? 'linear-gradient(to top, var(--lp-red), #F08090)'
                    : d.consumed > 0
                      ? 'linear-gradient(to top, var(--lp-teal), var(--lp-teal-light))'
                      : 'var(--bg-tertiary)',
                  transition: 'height 0.5s var(--ease-spring)',
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.day}</span>
              </div>
            );
          })}
        </div>
        {/* Target line label */}
        <div style={{
          borderTop: '1.5px dashed var(--text-tertiary)',
          marginTop: 8, paddingTop: 6,
          fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right',
        }}>
          Target: {weekData[0]?.target?.toLocaleString() || '—'} kcal
        </div>
      </div>

      {/* Weight Trend */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Weight trend</div>
        {weightData.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
            <Scale size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Log your weight regularly to see your trend</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {weightData.slice(-7).map((w, i) => {
              const minW = Math.min(...weightData.slice(-7).map(w => w.weight));
              const maxW = Math.max(...weightData.slice(-7).map(w => w.weight));
              const range = maxW - minW || 1;
              const h = ((w.weight - minW) / range) * 80 + 20;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{w.weight}</span>
                  <div style={{
                    width: 8, height: h, borderRadius: 4,
                    background: 'linear-gradient(to top, var(--lp-blue), var(--lp-blue-light))',
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                    {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
