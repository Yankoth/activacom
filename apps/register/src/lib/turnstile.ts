const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          size?: 'invisible' | 'normal' | 'compact';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/** Lazily loads the Turnstile script from Cloudflare CDN. */
function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Renders an invisible Turnstile challenge and returns the verification token.
 * Creates a temporary container, executes the challenge, then cleans up.
 */
export async function getTurnstileToken(): Promise<string> {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    console.warn('Turnstile site key not configured, skipping verification');
    return '';
  }

  await loadScript();

  if (!window.turnstile) {
    throw new Error('Turnstile not available');
  }

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    let widgetId: string;

    const cleanup = () => {
      try {
        if (widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
      } catch {
        // ignore cleanup errors
      }
      container.remove();
    };

    widgetId = window.turnstile!.render(container, {
      sitekey: siteKey,
      size: 'invisible',
      callback: (token: string) => {
        cleanup();
        resolve(token);
      },
      'error-callback': () => {
        cleanup();
        reject(new Error('Turnstile challenge failed'));
      },
    });
  });
}
