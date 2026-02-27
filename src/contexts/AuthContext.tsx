import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'instructor' | 'student' | 'admin' | 'location_owner' | null;
  aiSubscriptionStatus: 'inactive' | 'active' | 'past_due' | 'canceled' | null;
  hasAiAccess: boolean;
  loading: boolean;
  signUp: (email: string, password: string, role?: 'student' | 'instructor' | 'location_owner', referralCode?: string, studentData?: { firstName: string; lastName: string }, instructorData?: { firstName: string; lastName: string; bio: string }, locationOwnerData?: { firstName: string; lastName: string; propertyName?: string }) => Promise<{ error: any; needsConfirmation?: boolean; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: 'instructor' | 'student' | 'admin' | 'location_owner' | undefined; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'instructor' | 'student' | 'admin' | 'location_owner' | null>(null);
  const [aiSubscriptionStatus, setAiSubscriptionStatus] = useState<'inactive' | 'active' | 'past_due' | 'canceled' | null>(null);
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
          setAiSubscriptionStatus(null);
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
        setAiSubscriptionStatus(null);
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
        setAiSubscriptionStatus(null);
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
        .select('role, ai_subscription_status')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        setRole('student'); // Default to student on error
        setAiSubscriptionStatus('inactive');
      } else if (profile?.role === 'instructor' || profile?.role === 'student' || profile?.role === 'admin' || profile?.role === 'location_owner') {
        setRole(profile.role);
        setAiSubscriptionStatus((profile.ai_subscription_status as 'inactive' | 'active' | 'past_due' | 'canceled' | null) || 'inactive');
      } else {
        // Default to student if no role is set
        setRole('student');
        setAiSubscriptionStatus('inactive');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('student'); // Default to student on error
      setAiSubscriptionStatus('inactive');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'student' | 'instructor' | 'location_owner' = 'student', referralCode?: string, studentData?: { firstName: string; lastName: string }, instructorData?: { firstName: string; lastName: string; bio: string }, locationOwnerData?: { firstName: string; lastName: string; propertyName?: string }) => {
    // Get the redirect URL - use production URL from env or current origin
    const productionUrl = import.meta.env.VITE_SUPABASE_CONFIRM_URL || 'https://www.bookmyquiltretreat.com';
    const redirectUrl = import.meta.env.PROD 
      ? `${productionUrl}/auth/confirm`
      : `${window.location.origin}/auth/confirm`;
    
    // Store role, referral code, and user data in user metadata so the database trigger can use it
    const userMetadata: { role?: string; referred_by?: string; first_name?: string; last_name?: string; full_name?: string; bio?: string; property_name?: string } = {
      role: role,
    };
    if (referralCode) {
      userMetadata.referred_by = referralCode;
    }
    
    // For students, use studentData; for instructors, use instructorData; for location owners, use locationOwnerData
    if (role === 'instructor' && instructorData) {
      userMetadata.first_name = instructorData.firstName;
      userMetadata.last_name = instructorData.lastName;
      userMetadata.full_name = `${instructorData.firstName} ${instructorData.lastName}`.trim();
      userMetadata.bio = instructorData.bio;
    } else if (role === 'student' && studentData) {
      userMetadata.first_name = studentData.firstName;
      userMetadata.last_name = studentData.lastName;
      userMetadata.full_name = `${studentData.firstName} ${studentData.lastName}`.trim();
    } else if (role === 'location_owner' && locationOwnerData) {
      userMetadata.first_name = locationOwnerData.firstName;
      userMetadata.last_name = locationOwnerData.lastName;
      userMetadata.full_name = `${locationOwnerData.firstName} ${locationOwnerData.lastName}`.trim();
      if (locationOwnerData.propertyName) {
        userMetadata.property_name = locationOwnerData.propertyName;
      }
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

    return { error, needsConfirmation: !error && data.user && !data.session, data };
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
      
      return { error, role: profile?.role as 'instructor' | 'student' | 'admin' | 'location_owner' | undefined };
    }

    return { error, role: undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setAiSubscriptionStatus(null);
  };

  const resendConfirmationEmail = async (email: string) => {
    // Get the redirect URL - use production URL from env or current origin
    const productionUrl = import.meta.env.VITE_SUPABASE_CONFIRM_URL || 'https://www.bookmyquiltretreat.com';
    const redirectUrl = import.meta.env.PROD 
      ? `${productionUrl}/auth/confirm`
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

  const resetPassword = async (email: string) => {
    // Get the redirect URL - use production URL from env or current origin
    const productionUrl = import.meta.env.VITE_SUPABASE_CONFIRM_URL || 'https://www.bookmyquiltretreat.com';
    const redirectUrl = import.meta.env.PROD 
      ? `${productionUrl}/auth/reset-password`
      : `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        aiSubscriptionStatus,
        hasAiAccess: aiSubscriptionStatus === 'active',
        loading,
        signUp,
        signIn,
        signOut,
        resendConfirmationEmail,
        resetPassword,
        updatePassword,
      }}
    >
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

