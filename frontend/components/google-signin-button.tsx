'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

type Status = 'loading' | 'ready' | 'error';

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with';
}

export function GoogleSignInButton({ onCredential, text = 'signin_with' }: Readonly<GoogleSignInButtonProps>) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [status, setStatus] = useState<Status>(GOOGLE_CLIENT_ID ? 'loading' : 'error');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    const renderButton = () => {
      if (!window.google || !buttonRef.current) {
        setStatus('error');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential),
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 336,
          text,
        });

        setStatus('ready');
      }
      catch {
        setStatus('error');
      }
    };

    if (window.google) {
      renderButton();
      return;
    }

    const timeout = setTimeout(() => setStatus('error'), 8000);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      clearTimeout(timeout);
      renderButton();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      setStatus('error');
    };
    document.body.appendChild(script);

    return () => {
      clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
    };
  }, [text]);

  return (
    <div className="flex w-full justify-center">
      <div
        ref={buttonRef}
        className={
          status === 'ready'
            ? 'overflow-hidden rounded-full bg-[var(--background-alt)]'
            : 'hidden'
        }
      />
      {status === 'loading' && (
        <Button variant="outline" type="button" disabled className="w-full animate-pulse">
          Loading Google Sign-In...
        </Button>
      )}
      {status === 'error' && (
        <Button variant="outline" type="button" disabled className="w-full">
          Google Sign-In unavailable
        </Button>
      )}
    </div>
  );
}
