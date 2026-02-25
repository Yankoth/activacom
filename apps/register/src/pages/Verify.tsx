import { useParams } from 'react-router-dom';

export default function Verify() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <span className="text-lg font-bold text-gray-900">ActivaCom</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <h1 className="mb-2 text-xl font-semibold text-gray-900">Verificando...</h1>
          <p className="text-sm text-gray-500">
            Token: <span className="font-mono text-xs">{token?.slice(0, 8)}...</span>
          </p>
        </div>
      </main>
    </div>
  );
}
