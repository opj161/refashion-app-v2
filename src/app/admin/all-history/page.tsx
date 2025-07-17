'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
import type { HistoryItem } from '@/lib/types';
// ...removed unused Card component imports...
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import HistoryCard from '@/components/HistoryCard'; // Re-use the existing card for consistency

export default function AllHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchHistory = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await getAllUsersHistoryPaginatedForAdmin(pageNum, 9);
      setItems(prev => append ? [...prev, ...result.items] : result.items);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1, false);
  }, [fetchHistory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchHistory(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchHistory]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
      
      {items.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No user history found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onViewDetails={() => {}}
                onReloadConfig={() => {}}
                onDeleteItem={() => {}}
                username={item.username}
              />
            ))}
          </div>
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-10" />

          {loadingMore && (
             <div className="flex justify-center mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}
        </>
      )}
    </main>
  );
}
