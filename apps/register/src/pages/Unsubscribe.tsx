import { useParams } from 'react-router-dom';

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <span className="text-lg font-bold text-gray-900">ActivaCom</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-lg text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Cancelar suscripcion</h1>
          <p className="mb-6 text-sm text-gray-500">
            Si deseas dejar de recibir comunicaciones, confirma a continuacion.
          </p>
          <button
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={() => {
              // Will call edge function with token
              void token;
            }}
          >
            Cancelar suscripcion
          </button>
        </div>
      </main>
    </div>
  );
}
