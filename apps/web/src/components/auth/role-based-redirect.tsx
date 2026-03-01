import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export function RoleBasedRedirect() {
  const role = useAuthStore((s) => s.role);

  if (role === 'moderator') return <Navigate to="/moderate" replace />;
  return <Navigate to="/dashboard" replace />;
}
