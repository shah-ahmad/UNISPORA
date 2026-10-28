import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

export function RequireAccount({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Checking your account…</p>;
  if (!user?.status || !user.emailVerification) return <div className="page-container"><h1>Sign in required</h1><p>Use your verified account to view this page.</p><Link to="/login">Sign in</Link></div>;
  return <>{children}</>;
}
