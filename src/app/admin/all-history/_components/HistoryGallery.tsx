'use client';

import { useState, useCallback, useOptimistic, startTransition } from 'react';
import type { HistoryItem } from '@/lib/types';
import HistoryCard from '@/components/HistoryCard';
import { getAllUsersHistoryPaginatedForAdmin, deleteHistoryItem } from '@/actions/historyActions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HistoryDetailModal } from '@/components/HistoryDetailModal';
import { VideoPlaybackModal } from '@/components/VideoPlaybackModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PaginatedResult {
  items: HistoryItem[];
  hasMore: boolean;
}

export function HistoryGallery({ initialHistory }: { initialHistory: PaginatedResult }) {
  const { toast } = useToast();
  const [history, setHistory] = useState(initialHistory.items);
  const [hasMore, setHasMore] = useState(initialHistory.hasMore);
  const [page, setPage] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // State for detail modal
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  
  // State for delete confirmation
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);

  // Add useOptimistic hook for instant UI updates on deletion
  const [optimisticHistory, removeOptimisticHistoryItem] = useOptimistic(
    history,
    (currentHistory: HistoryItem[], itemIdToDelete: string) => {
      return currentHistory.filter(item => item.id !== itemIdToDelete);
    }
  );

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const result = await getAllUsersHistoryPaginatedForAdmin(page, 9);
    setHistory(prev => [...prev, ...result.items]);
    setHasMore(result.hasMore);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const handleViewDetails = useCallback((item: HistoryItem) => {
    setDetailItem(item);
  }, []);

  const handleDeleteRequest = useCallback((item: HistoryItem) => {
    setItemToDelete(item);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    // Start optimistic update immediately - item disappears from UI instantly
    startTransition(() => {
      removeOptimisticHistoryItem(itemToDelete.id);
    });

    // Call server action without blocking UI
    const result = await deleteHistoryItem(itemToDelete.id);

    if (result.success) {
      // On success, sync the real state to match the optimistic one
      setHistory(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
      toast({
        title: "Item Deleted",
        description: "The history item has been permanently removed.",
      });
    } else {
      // On failure, useOptimistic automatically reverts. We just show a toast.
      toast({
        title: "Deletion Failed",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
    }
    
    setItemToDelete(null); // Close dialog regardless of outcome
  };

  // Helper to check if item is a video
  const itemIsVideo = (item: HistoryItem) => !!(item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)));

  return (
    <>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {optimisticHistory.map(item => (
            <HistoryCard
              key={item.id}
              item={item}
              username={item.username}
              onViewDetails={handleViewDetails}
              onDeleteItem={handleDeleteRequest}
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

      {/* Detail Modal - conditionally renders based on item type */}
      {detailItem && !itemIsVideo(detailItem) && (
        <HistoryDetailModal
          item={detailItem}
          isOpen={true}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Video Playback Modal */}
      {detailItem && itemIsVideo(detailItem) && (
        <VideoPlaybackModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this history item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}