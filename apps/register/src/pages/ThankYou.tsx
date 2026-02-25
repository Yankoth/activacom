import { CheckCircle } from 'lucide-react';

export default function ThankYou() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <span className="text-lg font-bold text-gray-900">ActivaCom</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-lg text-center">
          <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">¡Gracias por registrarte!</h1>
          <p className="text-sm text-gray-500">
            Tu registro fue exitoso. Buena suerte.
          </p>
        </div>
      </main>
    </div>
  );
}
