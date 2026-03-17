'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function RootError({
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
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-4">
          <p>
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          {process.env.NODE_ENV === 'development' ? (
            <div className="bg-background/10 p-2 rounded text-xs font-mono break-all">
              {error.message || 'Unknown error'}
            </div>
          ) : error.digest ? (
            <div className="bg-background/10 p-2 rounded text-xs font-mono break-all">
              Error ID: {error.digest}
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => reset()}
              className="w-fit border-destructive/50 hover:bg-destructive/10"
            >
              Try again
            </Button>
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
