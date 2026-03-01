import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@activacom/shared/types';
import { useAuthStore } from '@/stores/auth-store';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = useAuthStore((s) => s.role);

  if (!role || !allowedRoles.includes(role)) {
    const redirectTo = role === 'moderator' ? '/moderate' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
