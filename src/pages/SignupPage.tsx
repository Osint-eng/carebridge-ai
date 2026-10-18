import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signup(fullName, email, password, role, 'English');
    setLoading(false);
    if (result.error) setError(result.error);
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
        <p className="text-slate-400 text-sm mb-6">Join CareBridge AI</p>
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500">
              <option value="Patient">Patient</option>
              <option value="Caregiver">Caregiver</option>
              <option value="Healthcare Staff">Healthcare Staff</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-sky-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
