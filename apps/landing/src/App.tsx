import { Sparkles } from 'lucide-react';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-600">
          <Sparkles className="size-8 text-white" />
        </div>
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-gray-900">ActivaCom</h1>
        <p className="mb-8 max-w-md text-lg text-gray-500">
          Captura datos de contacto de tus clientes con eventos interactivos. Rifas, PhotoDrop y
          mas.
        </p>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
          Proximamente
        </span>
      </main>
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ActivaCom. Todos los derechos reservados.
      </footer>
    </div>
  );
}
