import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

// Local persistence storage keys
const LOCAL_USERS_KEY = 'carebridge_users';
const LOCAL_SESSION_KEY = 'carebridge_session';

export let supabase: SupabaseClient | any;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client with provided credentials. Falling back to secure local storage.', err);
  }
}

// Resilient local persistence provider matching Supabase auth interface strictly
class LocalAuthStorage {
  private listeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    // Clean up any old legacy mock user so no default name is used
    try {
      const users = this.getUsers();
      const cleaned = users.filter((u: any) => u.email !== 'doctor@carebridge.ai');
      if (cleaned.length !== users.length) {
        this.saveUsers(cleaned);
      }
      const session = this.getSession();
      if (session?.user?.email === 'doctor@carebridge.ai') {
        this.setSession(null);
      }
    } catch {
      // ignore
    }
  }

  getUsers(): any[] {
    try {
      const data = localStorage.getItem(LOCAL_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveUsers(users: any[]) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  getSession() {
    try {
      const data = localStorage.getItem(LOCAL_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setSession(session: any) {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    this.notifyListeners(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  }

  notifyListeners(event: string, session: any) {
    this.listeners.forEach((listener) => listener(event, session));
  }

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();
    const fullName = options?.data?.full_name?.trim();

    if (!fullName) {
      return { data: { user: null, session: null }, error: { message: 'Please enter your full name.' } };
    }
    if (!trimmedEmail) {
      return { data: { user: null, session: null }, error: { message: 'Please enter your email address.' } };
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return { data: { user: null, session: null }, error: { message: 'Password must be at least 6 characters.' } };
    }

    const users = this.getUsers();
    const existing = users.find((u: any) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { data: { user: null, session: null }, error: { message: 'An account with this email already exists.' } };
    }

    const user = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      full_name: fullName,
      role: options?.data?.role || 'Patient',
      created_at: new Date().toISOString(),
    };
    users.push({ ...user, password: trimmedPassword });
    this.saveUsers(users);

    const session = { user: { id: user.id, email: user.email, user_metadata: { full_name: user.full_name, role: user.role } }, access_token: 'local-' + user.id };
    this.setSession(session);
    return { data: { user: session.user, session }, error: null };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const trimmedEmail = email?.trim().toLowerCase();
    const users = this.getUsers();
    const match = users.find((u: any) => u.email.toLowerCase() === trimmedEmail && u.password === password);
    if (!match) {
      return { data: { user: null, session: null }, error: { message: 'Invalid email or password.' } };
    }
    const session = {
      user: {
        id: match.id,
        email: match.email,
        user_metadata: { full_name: match.full_name, role: match.role },
      },
      access_token: 'local-' + match.id,
    };
    this.setSession(session);
    return { data: { user: session.user, session }, error: null };
  }

  async signOut() {
    this.setSession(null);
    return { error: null };
  }

  async getSession() {
    return { data: { session: this.getSession() }, error: null };
  }

  async getUser() {
    const session = this.getSession();
    return { data: { user: session?.user || null }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    // Immediately emit current state
    const session = this.getSession();
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }
}

const localAuth = new LocalAuthStorage();

if (!isSupabaseConfigured || !supabase) {
  // Provide a supabase-compatible auth surface that uses local storage
  supabase = {
    auth: {
      signUp: localAuth.signUp.bind(localAuth),
      signInWithPassword: localAuth.signInWithPassword.bind(localAuth),
      signOut: localAuth.signOut.bind(localAuth),
      getSession: localAuth.getSession.bind(localAuth),
      getUser: localAuth.getUser.bind(localAuth),
      onAuthStateChange: localAuth.onAuthStateChange.bind(localAuth),
    },
  };
}

export default supabase;
