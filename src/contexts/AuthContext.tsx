import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { authActions } from '@/redux/auth/authSlice';
import {
  selectAccessToken,
  selectAuthRole,
  selectAuthStatus,
  selectAuthUser,
} from '@/redux/auth/authSelectors';
import {
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshSessionMutation,
  useResendVerificationMutation,
  useResetPasswordMutation,
  useSignupMutation,
} from '@/services/server/auth/api';
import type { AuthUser, BackendUserRole } from '@/types/auth.types';
import { env } from '@/lib/env';

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string | null; user: AuthUser | null } | null;
  role: BackendUserRole | null;
  aiSubscriptionStatus: 'inactive' | 'active' | 'past_due' | 'canceled' | null;
  hasAiAccess: boolean;
  loading: boolean;
  signUp: (email: string, password: string, role?: Exclude<BackendUserRole, 'admin'>, referralCode?: string, studentData?: { firstName: string; lastName: string }, instructorData?: { firstName: string; lastName: string; bio: string }, locationOwnerData?: { firstName: string; lastName: string; propertyName?: string }) => Promise<{ error: any; needsConfirmation?: boolean; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: BackendUserRole | undefined; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string, token?: string, currentPassword?: string) => Promise<{ error: any }>;
  completeGoogleOAuth: (accessToken: string) => Promise<{ error: { message: string } | null; role?: BackendUserRole; userId?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const asError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const data = 'data' in error ? (error as { data?: { message?: string; error?: string } }).data : undefined;
    if (data?.message || data?.error) {
      return { message: data.message || data.error };
    }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return { message: (error as { message: string }).message };
    }
  }
  return { message: 'An unexpected error occurred' };
};

const withUserMetadata = (user: AuthUser | null): AuthUser | null => {
  if (!user) return null;
  return {
    ...user,
    user_metadata: {
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      ...user.user_metadata,
    },
    app_metadata: user.app_metadata || {},
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const didRestoreSession = useRef(false);
  const dispatch = useAppDispatch();
  const user = withUserMetadata(useAppSelector(selectAuthUser));
  const accessToken = useAppSelector(selectAccessToken);
  const role = useAppSelector(selectAuthRole);
  const authStatus = useAppSelector(selectAuthStatus);
  const [login] = useLoginMutation();
  const [signup] = useSignupMutation();
  const [refreshSession] = useRefreshSessionMutation();
  const [logout] = useLogoutMutation();
  const [forgotPassword] = useForgotPasswordMutation();
  const [resetPasswordMutation] = useResetPasswordMutation();
  const [changePassword] = useChangePasswordMutation();
  const [resendVerification] = useResendVerificationMutation();

  useEffect(() => {
    if (didRestoreSession.current) return;
    didRestoreSession.current = true;

    dispatch(authActions.setAuthLoading());
    refreshSession()
      .unwrap()
      .catch(() => {
        dispatch(authActions.clearCredentials());
      });
  }, [dispatch, refreshSession]);

  const signUp = async (
    email: string,
    password: string,
    role: Exclude<BackendUserRole, 'admin'> = 'student',
    referralCode?: string,
    studentData?: { firstName: string; lastName: string },
    instructorData?: { firstName: string; lastName: string; bio: string },
    locationOwnerData?: { firstName: string; lastName: string; propertyName?: string }
  ) => {
    try {
      const profileData =
        role === 'instructor'
          ? instructorData
          : role === 'location_owner'
            ? locationOwnerData
            : studentData;

      const data = await signup({
        email,
        password,
        role,
        referralCode,
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
        bio: instructorData?.bio,
        propertyName: locationOwnerData?.propertyName,
      }).unwrap();

      if (data.requiresEmailVerification) {
        await logout().unwrap().catch(() => undefined);
      }

      return {
        error: null,
        needsConfirmation: data.requiresEmailVerification !== false,
        data,
      };
    } catch (error) {
      return { error: asError(error), needsConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await login({ email, password }).unwrap();
      return { error: null, role: data.user.role };
    } catch (error) {
      const normalizedError = asError(error);
      const needsConfirmation = normalizedError.message.toLowerCase().includes('verify');
      return {
        error: needsConfirmation
          ? { message: 'Please verify your email before signing in. Check your inbox for the confirmation link.' }
          : normalizedError,
        role: undefined,
        needsConfirmation,
      };
    }
  };

  const signOut = async () => {
    await logout().unwrap().catch(() => {
      dispatch(authActions.clearCredentials());
    });
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      await resendVerification({ email }).unwrap();
      return { error: null };
    } catch (error) {
      return { error: asError(error) };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await forgotPassword({ email }).unwrap();
      return { error: null };
    } catch (error) {
      return { error: asError(error) };
    }
  };

  const updatePassword = async (password: string, token?: string, currentPassword?: string) => {
    try {
      if (token) {
        await resetPasswordMutation({ token, password }).unwrap();
      } else if (currentPassword) {
        await changePassword({ currentPassword, newPassword: password }).unwrap();
      } else {
        return { error: { message: 'Password reset token is missing.' } };
      }
      return { error: null };
    } catch (error) {
      return { error: asError(error) };
    }
  };

  const completeGoogleOAuth = async (accessToken: string) => {
    try {
      const response = await fetch(`${env.apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });
      const body = (await response.json()) as {
        data?: { user: AuthUser };
        message?: string;
      };
      if (!response.ok || !body.data?.user) {
        throw new Error(body.message || 'Could not load your profile after Google sign-in');
      }
      dispatch(authActions.setCredentials({ user: body.data.user, accessToken }));
      return { error: null, role: body.data.user.role, userId: body.data.user.id };
    } catch (error) {
      return { error: asError(error) };
    }
  };

  const aiSubscriptionStatus = user?.aiSubscriptionStatus || null;
  const session = accessToken ? { access_token: accessToken, user } : null;
  const loading = authStatus === 'idle' || authStatus === 'loading';

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
        completeGoogleOAuth,
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

