// src/components/history-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getHistoryPaginated, deleteHistoryItem } from "@/actions/historyActions";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ImageIcon } from "lucide-react";
import HistoryCard from "./HistoryCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { HistoryDetailModal } from './HistoryDetailModal'; // Import the new image modal
import { VideoPlaybackModal } from './VideoPlaybackModal'; // Import the video modal

type FilterType = 'all' | 'image' | 'video';

interface PaginatedResult {
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

export default function HistoryGallery({
  initialHistory
}: {
  initialHistory: PaginatedResult;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State is now initialized from server-provided props
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(initialHistory.items);
  const [currentPage, setCurrentPage] = useState<number>(initialHistory.currentPage + 1);
  const [hasMore, setHasMore] = useState<boolean>(initialHistory.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Function to refresh the history (can be called externally)
  const refreshHistory = useCallback(async () => {
    try {
      const result = await getHistoryPaginated(1, 9, currentFilter);
      setHistoryItems(result.items);
      setCurrentPage(result.currentPage + 1);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to refresh history:', err);
    }
  }, [currentFilter]);

  // Expose refresh function globally for other components to call
  useEffect(() => {
    (window as any).refreshHistoryGallery = refreshHistory;
    return () => {
      delete (window as any).refreshHistoryGallery;
    };
  }, [refreshHistory]);

  // Animation variants for the gallery
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { stiffness: 300, damping: 25 }, // Removed 'type' property for compatibility
    },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
  };


  const isInitialRender = useRef(true);

  // Data fetching is now handled by this function, called on filter change or load more.
  useEffect(() => {
    const loadFilteredHistory = async () => {
      setIsLoadingMore(true); // Use loadingMore state for subsequent loads
      try {
        const result = await getHistoryPaginated(1, 9, currentFilter);
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
    // Don't run on initial render, only when filter changes
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else {
      loadFilteredHistory();
    }
  }, [currentFilter, toast]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      // Use a server action for pagination
      const result = await getHistoryPaginated(currentPage, 9, currentFilter);
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
  }, [hasMore, isLoadingMore, currentPage, currentFilter, toast]);


  const handleFilterChange = (newFilter: string | null) => {
    // ToggleGroup can return null/empty string if deselected. Default to 'all'.
    if (newFilter) {
      setCurrentFilter(newFilter as FilterType);
    } else {
      setCurrentFilter('all');
    }
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

    setIsDeleting(true);
    try {
      const result = await deleteHistoryItem(itemToDelete.id);

      if (result.success) {
        // Optimistic UI Update: Remove the item from the local state
        setHistoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
        toast({
          title: "Item Deleted",
          description: "The history item has been permanently removed.",
        });
      } else {
        throw new Error(result.error || "Failed to delete the item.");
      }
    } catch (err) {
      console.error("Deletion failed:", err);
      toast({
        title: "Deletion Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null); // Close the dialog
    }
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

  return (
    <>
      {/* --- REPLACEMENT FOR TABS --- */}
      <div className="flex justify-start mb-6">
        <ToggleGroup
          type="single"
          defaultValue="all"
          value={currentFilter}
          onValueChange={handleFilterChange}
          className="bg-muted/30 p-1 rounded-lg"
          aria-label="Filter history items"
        >
          <ToggleGroupItem value="all" aria-label="Show all items">All</ToggleGroupItem>
          <ToggleGroupItem value="image" aria-label="Show only images">Images</ToggleGroupItem>
          <ToggleGroupItem value="video" aria-label="Show only videos">Videos</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {historyItems.length === 0 && !isLoadingMore && (
        <Card variant="glass" className="mt-8">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">No History Found</h3>
            <p className="text-muted-foreground mt-1">Creations for this filter will appear here once you&apos;ve made some.</p>
          </CardContent>
        </Card>
      )}

      <LayoutGroup>
        <>
          {historyItems.length > 0 && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              layout
            >
              <AnimatePresence>
                {historyItems.map((item) => (
                  <motion.div key={item.id} variants={itemVariants} layout>
                    <HistoryCard
                      item={item}
                      onViewDetails={handleViewDetails}
                      onDeleteItem={handleDeleteRequest}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <AnimatePresence>
            {detailItem && itemIsVideo(detailItem) && (
              <VideoPlaybackModal
                item={detailItem}
                onClose={() => setDetailItem(null)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {detailItem && !itemIsVideo(detailItem) && (
              <HistoryDetailModal
                isOpen={!!detailItem}
                onClose={() => setDetailItem(null)}
                item={detailItem}
              />
            )}
          </AnimatePresence>
        </>
      </LayoutGroup>

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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                "Yes, delete it"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
