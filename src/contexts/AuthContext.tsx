import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserStatus = 'pending' | 'active' | 'rejected';
type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userStatus: UserStatus | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkUserStatus: () => Promise<UserStatus | null>;
  checkIsAdmin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserStatus = async (): Promise<UserStatus | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user status:', error);
        return null;
      }
      
      const status = data?.status as UserStatus;
      setUserStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking user status:', error);
      return null;
    }
  };

  const checkIsAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return false;
      }
      
      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer additional Supabase calls
        if (session?.user) {
          setTimeout(() => {
            checkUserStatus();
            checkIsAdmin();
          }, 0);
        } else {
          setUserStatus(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkUserStatus();
          checkIsAdmin();
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserStatus(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userStatus,
        isAdmin,
        signIn,
        signUp,
        signOut,
        checkUserStatus,
        checkIsAdmin,
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
