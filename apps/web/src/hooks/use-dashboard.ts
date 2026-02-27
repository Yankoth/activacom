import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getRegistrationsByDay,
  getRecentRegistrations,
} from '@/lib/api/dashboard';
import { dashboardKeys } from '@/lib/query-keys';

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });
}

export function useRegistrationChart() {
  return useQuery({
    queryKey: dashboardKeys.chart(),
    queryFn: getRegistrationsByDay,
  });
}

export function useRecentRegistrations() {
  return useQuery({
    queryKey: dashboardKeys.recent(),
    queryFn: () => getRecentRegistrations(10),
    staleTime: 30_000,
  });
}
