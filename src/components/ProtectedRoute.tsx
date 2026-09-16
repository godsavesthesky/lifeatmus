import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * Gate for pages that require a signed-in user, optionally an admin one.
 *
 * IMPORTANT: this only controls what renders in the browser. It is a UX
 * convenience, not a security boundary — anyone can read React source or
 * call Supabase directly. The actual enforcement lives in Postgres Row
 * Level Security policies (see supabase/migrations/0001_init.sql), which
 * run no matter how the request reaches the database.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode
  requireAdmin?: boolean
}) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="max-w-7xl mx-auto px-5 py-20 text-muted text-sm">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && !profile?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}