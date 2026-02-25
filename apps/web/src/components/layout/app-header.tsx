import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/auth-store';

export function AppHeader() {
  const tenant = useAuthStore((s) => s.tenant);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center gap-2">
        <span className="text-muted-foreground text-sm">{tenant?.name}</span>
      </div>
    </header>
  );
}
