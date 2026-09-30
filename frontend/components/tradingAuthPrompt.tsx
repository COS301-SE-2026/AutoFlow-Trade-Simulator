import { useAuth } from '@/lib/hooks/useAuth';
import { Lock, ChartCandlestick } from 'lucide-react';
import Link from 'next/link';
import {CreateNewInternationalAccount} from "@/components/ui/createNewInternationalAccount";

export function TradingAuthPrompt() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  if (!token) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="flex max-w-xs flex-col items-center gap-3 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05]">
              <Lock aria-hidden="true" className="h-5 w-5 text-white/50" />
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              <Link href="/login" className="font-medium text-white underline underline-offset-4">
                Log in
              </Link>
              {' '}to access this data.
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="flex items-center justify-center py-12">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05]">
            <ChartCandlestick aria-hidden="true" className="h-5 w-5 text-white/50" />
          </div>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Create a trading account to access this data.
          </p>
          <CreateNewInternationalAccount/>
        </div>
      </div>
  );
}
