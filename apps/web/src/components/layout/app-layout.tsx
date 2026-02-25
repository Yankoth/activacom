import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';

export function AppLayout() {
  const defaultOpen = (() => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('sidebar_state='));
      return cookie ? cookie.split('=')[1] === 'true' : true;
    } catch {
      return true;
    }
  })();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
