// src/components/history-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useOptimistic, startTransition, lazy, Suspense } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Button } from "@/components/ui/button";
import { getHistoryPaginated, deleteHistoryItem } from "@/actions/historyActions";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ImageIcon } from "lucide-react";
import HistoryCard from "./HistoryCard";
import { HistoryGallerySkeleton } from "./HistoryCardSkeleton"; // Import skeleton loader
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { COMMON_VARIANTS } from "@/lib/motion-constants";

// Lazy load modals for better initial page load performance
const ImageViewerModal = lazy(() => import('./ImageViewerModal').then(m => ({ default: m.ImageViewerModal })));
const VideoPlaybackModal = lazy(() => import('./VideoPlaybackModal').then(m => ({ default: m.VideoPlaybackModal })));

type FilterType = 'all' | 'image' | 'video';

interface PaginatedResult {
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

export default function HistoryGallery({
  initialHistory,
}: {
  initialHistory: PaginatedResult;
}) {
  const { toast } = useToast();
  const router = useRouter();
  
  // Read history filter directly from Zustand store
  const historyFilter = useGenerationSettingsStore(state => state.historyFilter);
  const loadFromHistory = useGenerationSettingsStore(state => state.loadFromHistory);
  
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);

  // State is now initialized from server-provided props
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(initialHistory.items);
  const [currentPage, setCurrentPage] = useState<number>(initialHistory.currentPage + 1);
  const [hasMore, setHasMore] = useState<boolean>(initialHistory.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Add useOptimistic hook for instant UI updates on deletion
  const [optimisticHistory, removeOptimisticHistoryItem] = useOptimistic(
    historyItems,
    (currentHistory: HistoryItem[], itemIdToDelete: string) => {
      return currentHistory.filter(item => item.id !== itemIdToDelete);
    }
  );

  // Subscribe to generation counter from Zustand store
  const generationCount = useGenerationSettingsStore(state => state.generationCount);

  // Function to refresh the history (can be called internally)
  const refreshHistory = useCallback(async () => {
    try {
      const result = await getHistoryPaginated(1, 9, historyFilter);
      setHistoryItems(result.items);
      setCurrentPage(result.currentPage + 1);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to refresh history:', err);
    }
  }, [historyFilter]);

  // Listen for generation count changes and refresh history
  useEffect(() => {
    if (generationCount > 0) {
      // Use router.refresh() for Next.js App Router to re-fetch server component data
      router.refresh();
      // Also refresh local state
      refreshHistory();
    }
  }, [generationCount, router, refreshHistory]);

  const isInitialRender = useRef(true);

  // Data fetching is now handled by this function, called on filter change
  useEffect(() => {
    const loadFilteredHistory = async () => {
      setIsLoadingMore(true);
      try {
        const result = await getHistoryPaginated(1, 9, historyFilter);
        setHistoryItems(result.items);
        setCurrentPage(result.currentPage + 1);
        setHasMore(result.hasMore);
      } catch (err) {
        toast({
          title: "Error Loading History",
          description: err instanceof Error ? err.message : "An unknown error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMore(false);
      }
    };
    
    // Skip on initial render (we already have initialHistory prop)
    // But run whenever historyFilter changes after that
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    loadFilteredHistory();
  }, [historyFilter, toast]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      // Use a server action for pagination
      const result = await getHistoryPaginated(currentPage, 9, historyFilter);
      setHistoryItems(prevItems => [...prevItems, ...result.items]);
      setCurrentPage(prev => prev + 1);
      setHasMore(result.hasMore);
    } catch (err) {
      toast({
        title: "Error Loading History",
        description: err instanceof Error ? err.message : "Could not fetch history items.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, currentPage, historyFilter, toast]);


  // handleFilterChange is no longer needed - filtering is controlled by the store
  // This function is now dead code and can be removed
  const handleFilterChange = (newFilter: string | null) => {
    // This was used when the filter UI was in this component
    // Now the SegmentedControl in creation-hub.tsx writes directly to the store
  };

  const handleViewDetails = (item: HistoryItem) => {
    setDetailItem(item);
  };

  // handleReloadConfig is now handled directly in HistoryCard via client-side store

  const handleDeleteRequest = (item: HistoryItem) => {
    setItemToDelete(item);
  };

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
      setHistoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
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


  // Function to get display label for attribute values (similar to one in image-forge)
  // This might be better placed in a utils file if used in multiple places
  const getDisplayLabelForValue = (options: { value: string, displayLabel: string }[], value: string | undefined): string => {
    if (!value) return "N/A";
    return options.find(o => o.value === value)?.displayLabel || value;
  };

  // Simplified options for display in modal - ideally import from a shared location
  const FASHION_STYLE_OPTIONS_SIMPLE = [{value: "default_style", displayLabel: "Default"}, /* ... other styles */];
  const GENDER_OPTIONS_SIMPLE = [{value: "female", displayLabel: "Female"},  /* ... other genders */];
  // ... add other simplified option arrays as needed for the modal


  // Helper to check if item is a video
  const itemIsVideo = (item: HistoryItem) => !!(item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)));

  // Handler for reloading config from history
  const handleReloadConfig = useCallback((item: HistoryItem) => {
    // 1. Update global store
    loadFromHistory(item);
    
    // 2. Determine target tab
    const targetTab = item.videoGenerationParams ? 'video' : 'image';
    
    // 3. Navigate to creation hub with initialization params to ensure UI updates
    router.push(`/?init_history_id=${item.id}&target_tab=${targetTab}`);
    
    // 4. Close modal
    setDetailItem(null);
    
    toast({
      title: "Settings Restored",
      description: "Generation parameters have been loaded into the workspace.",
    });
  }, [router, loadFromHistory, toast]);

  // Define a simple fade variant for this component's transitions
  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <>
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STATE 1: Initial Loading Skeleton */}
          {isLoadingMore && historyItems.length === 0 && (
            <motion.div key="skeleton" variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
              <HistoryGallerySkeleton count={9} />
            </motion.div>
          )}

          {/* STATE 2: Empty State Card */}
          {!isLoadingMore && optimisticHistory.length === 0 && (
            <motion.div key="empty" variants={fadeVariant} initial="hidden" animate="visible" exit="exit">
              <Card variant="glass" className="mt-8">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold">No History Found</h3>
                  <p className="text-muted-foreground mt-1">Creations for this filter will appear here.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STATE 3: Content Grid */}
          {optimisticHistory.length > 0 && (
            <motion.div
              key="content"
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <LayoutGroup>
                <div className="relative">
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4"
                    layout
                    variants={COMMON_VARIANTS.staggeredListContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <AnimatePresence>
                      {optimisticHistory.map((item) => (
                        <motion.div 
                          key={item.id} 
                          variants={COMMON_VARIANTS.staggeredListItem}
                          exit="exit"
                          layout
                        >
                          <HistoryCard
                            item={item}
                            onViewDetails={handleViewDetails}
                            onDeleteItem={handleDeleteRequest}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* Modals are kept here to benefit from LayoutGroup */}
                  <AnimatePresence>
                    {detailItem && itemIsVideo(detailItem) && (
                      <Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
                        <VideoPlaybackModal
                          item={detailItem}
                          onClose={() => setDetailItem(null)}
                        />
                      </Suspense>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {detailItem && !itemIsVideo(detailItem) && (
                      <Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
                        <ImageViewerModal
                          isOpen={!!detailItem}
                          onClose={() => setDetailItem(null)}
                          item={detailItem}
                          onReloadConfig={handleReloadConfig}
                        />
                      </Suspense>
                    )}
                  </AnimatePresence>
                </div>
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "Load More" button and Delete Dialog remain outside the animation container */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the history item and all associated images and videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
