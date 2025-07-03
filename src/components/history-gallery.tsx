// src/components/history-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getHistoryPaginated, deleteHistoryItem } from "@/actions/historyActions";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, History, Download, Copy } from "lucide-react";
import HistoryCard from "./HistoryCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { getDisplayableImageUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";

type FilterType = 'all' | 'image' | 'video';

export default function HistoryGallery() {
  const { toast } = useToast();
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // State for details modal
  const [selectedHistoryItemForDetail, setSelectedHistoryItemForDetail] = useState<HistoryItem | null>(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);

  // State for delete confirmation
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref for the element that will trigger loading more items
  const loadMoreRef = useRef<HTMLDivElement>(null);


  const itemsPerPage = 9; // Or any other number you prefer

  const fetchHistory = useCallback(async (page: number, filter: FilterType, append: boolean = false) => {
    if (!append) {
      setIsLoading(true);
      setHistoryItems([]); // Clear items for new filter/initial load
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const result = await getHistoryPaginated(page, itemsPerPage, filter);
      setHistoryItems(prevItems => append ? [...prevItems, ...result.items] : result.items);
      setCurrentPage(result.currentPage);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      toast({
        title: "Error Loading History",
        description: err instanceof Error ? err.message : "Could not fetch history items.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [toast, itemsPerPage]);

  useEffect(() => {
    fetchHistory(1, currentFilter);
  }, [currentFilter, fetchHistory]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchHistory(currentPage + 1, currentFilter, true);
    }
  }, [hasMore, isLoadingMore, currentPage, currentFilter, fetchHistory]);

  // Set up the IntersectionObserver to watch the loadMoreRef
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the trigger element is intersecting and we have more items to load
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { 
        threshold: 1.0, // Trigger when 100% of the element is visible
        rootMargin: '100px' // Start loading 100px before the element is visible
      }
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
  }, [hasMore, isLoadingMore, handleLoadMore]); // Dependencies updated

  const handleFilterChange = (newFilter: string) => {
    setCurrentFilter(newFilter as FilterType);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleViewDetails = (item: HistoryItem) => {
    setSelectedHistoryItemForDetail(item);
    setIsHistoryDetailOpen(true);
  };

  const handleReloadConfig = (item: HistoryItem) => {
    // Only navigate, do not show a toast here
    router.push(`/create?historyItemId=${item.id}`);
  };

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
        setTotalCount(prevCount => prevCount - 1); // Decrement total count
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


  return (
    <>
      <Tabs value={currentFilter} onValueChange={handleFilterChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && !isLoadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div key={`skel-${index}`} className="p-4 border rounded-lg shadow-sm space-y-2 bg-muted/50">
              <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-10 text-red-600">
          <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
          <p>Error loading history: {error}</p>
        </div>
      )}

      {!isLoading && !error && historyItems.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No history items found for this filter.</p>
        </div>
      )}

      {!isLoading && !error && historyItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
          {historyItems.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onViewDetails={handleViewDetails}
              onReloadConfig={handleReloadConfig}
              onDeleteItem={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Modal for History Item Details */}
      {selectedHistoryItemForDetail && (
        <Dialog open={isHistoryDetailOpen} onOpenChange={setIsHistoryDetailOpen}>
          <DialogContent className="max-w-3xl"> {/* Increased max-width for better layout */}
            <DialogHeader>
              <DialogTitle>History Item Details</DialogTitle>
              <DialogDescription>
                Review of saved configuration and generated outputs.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-1 pr-2 -mr-2"> {/* Added padding for scrollbar */}
              <div className="space-y-6 py-4 px-2">
                {/* Displaying original image or source image for video */}
                {(selectedHistoryItemForDetail.originalClothingUrl || selectedHistoryItemForDetail.videoGenerationParams?.sourceImageUrl) && (
                  <div>
                    <h3 className="font-semibold mb-2 text-muted-foreground">
                      {selectedHistoryItemForDetail.videoGenerationParams ? "Source Image for Video" : "Original Clothing Item"}
                    </h3>
                    <div className="relative aspect-square w-full max-w-xs mx-auto border rounded-md bg-muted/30">
                      <Image
                        src={getDisplayableImageUrl(selectedHistoryItemForDetail.videoGenerationParams?.sourceImageUrl || selectedHistoryItemForDetail.originalClothingUrl || '')!}
                        alt="Original/Source Item"
                        fill
                        sizes="(max-width: 768px) 90vw, 33vw"
                        className="object-contain rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Displaying Generated Images */}
                {selectedHistoryItemForDetail.editedImageUrls && selectedHistoryItemForDetail.editedImageUrls.some(url => url) && !selectedHistoryItemForDetail.generatedVideoUrls?.some(vUrl => vUrl) && (
                  <div>
                    <h3 className="font-semibold mb-2 text-muted-foreground">Generated Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedHistoryItemForDetail.editedImageUrls.map((url, index) => url && (
                        <div key={`img-detail-${index}`} className="relative aspect-square border rounded-md bg-muted/30 overflow-hidden">
                          <Image src={getDisplayableImageUrl(url)!} alt={`Generated ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-contain" />
                           <a href={getDisplayableImageUrl(url)!} download={`Refashion_Image_${selectedHistoryItemForDetail.id.substring(0,6)}_${index}.png`} target="_blank" rel="noopener noreferrer" className="absolute bottom-1 right-1">
                            <Button variant="outline" size="icon" className="h-6 w-6 bg-background/70 hover:bg-background/90"><Download className="h-3 w-3" /></Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Displaying Generated Videos */}
                {selectedHistoryItemForDetail.generatedVideoUrls && selectedHistoryItemForDetail.generatedVideoUrls.some(url => url) && (
                   <div>
                    <h3 className="font-semibold mb-2 text-muted-foreground">Generated Video(s)</h3>
                    {selectedHistoryItemForDetail.generatedVideoUrls.map((url, index) => url && (
                      <div key={`video-detail-${index}`} className="space-y-2">
                        <div className="aspect-video w-full border rounded-md bg-muted/30 overflow-hidden">
                          <video src={getDisplayableImageUrl(url)!} controls className="w-full h-full" />
                        </div>
                        <a href={getDisplayableImageUrl(url)!} download={`Refashion_Video_${selectedHistoryItemForDetail.id.substring(0,6)}_${index}.mp4`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full"><Download className="mr-2 h-4 w-4" /> Download Video</Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Displaying Configuration */}
                <div>
                  <h3 className="font-semibold mb-2 text-muted-foreground">Configuration Used</h3>
                  {selectedHistoryItemForDetail.attributes && Object.keys(selectedHistoryItemForDetail.attributes).length > 0 && (
                    <div className="text-xs space-y-1 bg-muted/50 p-3 rounded-md">
                      {Object.entries(selectedHistoryItemForDetail.attributes).map(([key, value]) => {
                        // A simple way to format keys. Could be more sophisticated.
                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        // Here, you might want to map `value` to display labels if they are IDs/enums
                        // For now, just stringifying. This is where getDisplayLabelForValue would be used with actual option arrays.
                        return <p key={key}><strong>{formattedKey}:</strong> {String(value)}</p>;
                      })}
                    </div>
                  )}
                  {selectedHistoryItemForDetail.videoGenerationParams && (
                     <div className="text-xs space-y-1 bg-muted/50 p-3 rounded-md mt-2">
                        <p><strong>Video Prompt:</strong> {selectedHistoryItemForDetail.videoGenerationParams.prompt}</p>
                        <p><strong>Resolution:</strong> {selectedHistoryItemForDetail.videoGenerationParams.resolution}</p>
                        <p><strong>Duration:</strong> {selectedHistoryItemForDetail.videoGenerationParams.duration}s</p>
                        {selectedHistoryItemForDetail.videoGenerationParams.seed !== undefined && <p><strong>Seed:</strong> {selectedHistoryItemForDetail.videoGenerationParams.seed}</p>}
                     </div>
                  )}
                  {selectedHistoryItemForDetail.constructedPrompt && (!selectedHistoryItemForDetail.videoGenerationParams || selectedHistoryItemForDetail.constructedPrompt !== selectedHistoryItemForDetail.videoGenerationParams.prompt) && (
                    <>
                      <h4 className="font-medium text-xs mt-2 mb-1 text-muted-foreground">Full Generated Prompt (Image):</h4>
                      <ScrollArea className="h-20"><p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md whitespace-pre-wrap break-words">{selectedHistoryItemForDetail.constructedPrompt}</p></ScrollArea>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Timestamp: {new Date(selectedHistoryItemForDetail.timestamp).toLocaleString()}</p>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-2 sm:justify-between">
                <Button
                    variant="secondary"
                    onClick={() => {
                        handleReloadConfig(selectedHistoryItemForDetail);
                        setIsHistoryDetailOpen(false);
                    }}
                    className="w-full sm:w-auto"
                >
                    <Copy className="mr-2 h-4 w-4"/> Use as Template
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invisible trigger element for infinite scroll */}
      {hasMore && <div ref={loadMoreRef} className="h-4" />}

      {isLoadingMore && (
        <div className="text-center mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
