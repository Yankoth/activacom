interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-lg">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Activa<span className="text-blue-600">Com</span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-400">
        Powered by ActivaCom
      </footer>
    </div>
  );
}
