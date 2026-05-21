import { useAuth } from '@/lib/hooks/useAuth';
import { Lock, ChartCandlestick } from 'lucide-react';
import Link from 'next/link';
import {CreateNewInternationalAccount} from "@/components/ui/createNewInternationalAccount";

export function TradingAuthPrompt() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  if (!token) {
    return (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2.5 text-center max-w-xs">
            <Lock className="w-5 h-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Log in
              </Link>
              {' '}to access this data.
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center gap-2.5 text-center max-w-xs">
          <ChartCandlestick className="w-5 h-5 text-muted-foreground/50" />
            <CreateNewInternationalAccount/>
            {' '}to access this data.
        </div>
      </div>
  );
}