import { useParams } from 'react-router-dom';

export default function EventRegistration() {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <span className="text-lg font-bold text-gray-900">ActivaCom</span>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full max-w-lg">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Registro</h1>
          <p className="mb-6 text-sm text-gray-500">
            Evento: <span className="font-medium">{code}</span>
          </p>
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-center text-sm text-gray-400">
              El formulario de registro se cargara aqui.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
