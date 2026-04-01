import { fetchProfileWithMeta } from '@/lib/profileFetch';
import { notifyError } from '@/lib/notify';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';
import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  /** Atualiza o perfil em memória (ex.: após onboarding) antes do próximo render — evita corrida com router.replace('/'). */
  patchProfile: (patch: Partial<Profile>) => void;
  signOut: () => Promise<void>;
  demoMode: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_ISSUE_TOAST =
  'Esta conta não existe ou não tem perfil registado na base de dados.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const userId = session?.user?.id;
  const loading = !sessionReady || (Boolean(userId) && !profileReady);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileReady(true);
  }, []);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }
    const { profile: p, issue } = await fetchProfileWithMeta(uid);
    if (issue) {
      queueMicrotask(() => notifyError(PROFILE_ISSUE_TOAST, 'Eu Duvido!'));
      await signOut();
      return;
    }
    setProfile(p);
  }, [session?.user?.id, signOut]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionReady(true);
      setProfileReady(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionReady || !isSupabaseConfigured) {
      return;
    }
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }

    setProfileReady(false);
    let cancelled = false;
    fetchProfileWithMeta(userId).then(async ({ profile: p, issue }) => {
      if (cancelled) return;
      if (issue) {
        queueMicrotask(() => notifyError(PROFILE_ISSUE_TOAST, 'Eu Duvido!'));
        await signOut();
        return;
      }
      if (cancelled) return;
      setProfile(p);
      setProfileReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionReady, userId, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      refreshProfile,
      patchProfile,
      signOut,
      demoMode: !isSupabaseConfigured,
    }),
    [session, profile, loading, refreshProfile, patchProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
