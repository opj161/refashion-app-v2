'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-4">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-4">
          <p>
            An error occurred while loading the dashboard. This might be due to a temporary connection issue.
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
