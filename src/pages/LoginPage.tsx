import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaPin, setMfaPin] = useState('');
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.requiresMfa) {
      setPendingEmail(result.email || email.trim().toLowerCase());
      setStep('mfa');
      setMfaPin('');
      return;
    }

    if (result.user) {
      navigate('/dashboard');
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyMfa(mfaPin);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.user) {
      navigate('/dashboard');
    }
  };

  const backToCredentials = () => {
    setStep('credentials');
    setMfaPin('');
    setError('');
    setPendingEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">
          {step === 'credentials' ? 'Welcome back' : 'Verify MFA'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {step === 'credentials'
            ? 'Sign in with your email and password'
            : `Enter the 6-digit MFA PIN for ${pendingEmail}`}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfa} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">6-digit MFA PIN</label>
              <div className="relative mt-1">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\\d{6}"
                  maxLength={6}
                  value={mfaPin}
                  onChange={(e) => setMfaPin(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm tracking-widest focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || mfaPin.length !== 6}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Sign In'} <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={backToCredentials}
              className="w-full text-sm text-slate-400 hover:text-slate-200 py-2"
            >
              ← Back to email & password
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{' '}
          <Link to="/signup" className="text-sky-400 hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] text-slate-600">
          Each account is bound to one email. The same password cannot open a different mailbox.
        </p>
      </div>
    </div>
  );
};
