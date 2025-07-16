// src/app/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
  // This is a special Next.js file that will be automatically
  // shown during navigation between server-rendered pages.
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
