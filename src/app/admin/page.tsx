'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect admin users to the all-history page
    router.replace('/admin/all-history');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
}
