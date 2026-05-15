'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Auto-login after signup if email confirmation is disabled
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 1500);
  }

  if (success) {
    return (
      <div className="auth-container animate-scale-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Flame size={28} color="white" />
          </div>
          <span className="auth-title">LeanPath</span>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '32px 0',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'var(--lp-teal-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Flame size={32} color="var(--lp-teal)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Account created!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Setting up your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <Flame size={28} color="white" />
        </div>
        <span className="auth-title">LeanPath</span>
      </div>

      <p className="auth-subtitle">
        Create your account to start your personalized weight loss journey with AI-powered tracking.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSignup}>
        <div className="input-group">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            className="input-field"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input-field"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: 4,
              }}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Create account'}
        </button>
      </form>

      <div className="auth-link">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
