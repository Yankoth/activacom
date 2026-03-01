import { useState, useRef, useCallback } from 'react';

interface AuthScreenProps {
  onAuthorize: (code: string) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const CODE_LENGTH = 6;

export function AuthScreen({ onAuthorize, isConnecting, error }: AuthScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setRef = useCallback((el: HTMLInputElement | null, idx: number) => {
    inputRefs.current[idx] = el;
  }, []);

  const focusInput = (idx: number) => {
    if (idx >= 0 && idx < CODE_LENGTH) {
      inputRefs.current[idx]?.focus();
    }
  };

  const updateDigit = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < CODE_LENGTH - 1) {
      focusInput(idx + 1);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      focusInput(idx - 1);
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    }
    if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      focusInput(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newDigits = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    focusInput(focusIdx);
  };

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every((d) => d !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete && !isConnecting) {
      onAuthorize(code);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center">
        <p className="mb-12 text-sm font-medium tracking-widest text-white/40 uppercase">
          ActivaCom
        </p>

        <h1 className="mb-8 text-2xl font-semibold text-white">
          Ingresa el codigo de autorizacion
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-8 flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => setRef(el, idx)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => updateDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                disabled={isConnecting}
                className="h-16 w-12 rounded-lg border-2 border-white/20 bg-white/5 text-center text-3xl font-mono text-white transition-colors focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!isComplete || isConnecting}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting && (
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
