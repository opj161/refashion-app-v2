'use client';

import { useState } from 'react';
import type { HistoryItem } from '@/lib/types';
import HistoryCard from '@/components/HistoryCard';
import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaginatedResult {
  items: HistoryItem[];
  hasMore: boolean;
}

export function HistoryGallery({ initialHistory }: { initialHistory: PaginatedResult }) {
  const [history, setHistory] = useState(initialHistory.items);
  const [hasMore, setHasMore] = useState(initialHistory.hasMore);
  const [page, setPage] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const result = await getAllUsersHistoryPaginatedForAdmin(page, 9);
    setHistory(prev => [...prev, ...result.items]);
    setHasMore(result.hasMore);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {history.map(item => (
          <HistoryCard
            key={item.id}
            item={item}
            username={item.username}
            onViewDetails={() => {}}
            onDeleteItem={() => {}}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}