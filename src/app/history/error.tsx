'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Failed to load history</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-4">
          <p>
            We couldn&apos;t load your creation history. This might be a temporary issue.
          </p>
          <div className="bg-background/10 p-2 rounded text-xs font-mono break-all">
            {error.message || 'Unknown error'}
          </div>
          <Button
            variant="outline"
            onClick={() => reset()}
            className="w-fit border-destructive/50 hover:bg-destructive/10"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
