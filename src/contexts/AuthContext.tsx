import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'instructor' | 'student' | null;
  loading: boolean;
  signUp: (email: string, password: string, referralCode?: string) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: 'instructor' | 'student' | undefined; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'instructor' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Supabase not configured - set no user and stop loading
      console.warn('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error in getSession:', error);
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Get role from profiles table (created automatically by database trigger)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        setRole('student'); // Default to student on error
      } else if (profile?.role === 'instructor' || profile?.role === 'student') {
        setRole(profile.role);
      } else {
        // Default to student if no role is set
        setRole('student');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('student'); // Default to student on error
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, referralCode?: string) => {
    // Get the redirect URL - use production URL in production, current origin in dev
    const isProduction = import.meta.env.PROD;
    const redirectUrl = isProduction 
      ? 'https://quilting-retreats.vercel.app/auth/confirm'
      : `${window.location.origin}/auth/confirm`;
    
    // Store referral code in user metadata so the database trigger can use it
    const userMetadata: { referred_by?: string } = {};
    if (referralCode) {
      userMetadata.referred_by = referralCode;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userMetadata,
      },
    });

    // Note: With email confirmation enabled, user won't be automatically signed in
    // They need to confirm their email first
    if (data.user && !error) {
      // Don't set user/session here - they need to confirm email first
      // The profile will be created by the database trigger when they confirm
    }

    return { error, needsConfirmation: !error && data.user && !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Check if email is confirmed
    if (error) {
      // Check if error is due to unconfirmed email
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        return { 
          error: { 
            ...error, 
            message: 'Please verify your email before signing in. Check your inbox for the confirmation link.' 
          },
          needsConfirmation: true 
        };
      }
      return { error, role: undefined };
    }

    if (data.user) {
      // Check if email is confirmed
      if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
        return { 
          error: { 
            message: 'Please verify your email before signing in. Check your inbox for the confirmation link.' 
          },
          needsConfirmation: true 
        };
      }

      setUser(data.user);
      await fetchUserRole(data.user.id);
      // Get the role after fetching
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      return { error, role: profile?.role as 'instructor' | 'student' | undefined };
    }

    return { error, role: undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const resendConfirmationEmail = async (email: string) => {
    // Get the redirect URL - use production URL in production, current origin in dev
    const isProduction = import.meta.env.PROD;
    const redirectUrl = isProduction 
      ? 'https://quilting-retreats.vercel.app/auth/confirm'
      : `${window.location.origin}/auth/confirm`;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut, resendConfirmationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

