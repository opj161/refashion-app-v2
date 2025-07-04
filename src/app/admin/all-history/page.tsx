'use client';

import { useState, useEffect } from 'react';
import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
import type { HistoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    const loadInitialHistory = async () => {
      setLoading(true);
      try {
        const result = await getAllUsersHistoryPaginatedForAdmin(1, 9);
        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    loadInitialHistory();
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getAllUsersHistoryPaginatedForAdmin(nextPage, 9);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more history');
    } finally {
      setLoadingMore(false);
    }
  };

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
              <div key={item.id} className="relative">
                <HistoryCard
                  item={item}
                  onViewDetails={() => {}}
                  onReloadConfig={() => {}}
                  onDeleteItem={() => {}}
                />
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full z-10">
                  {item.username}
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
