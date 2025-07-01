// src/components/history-gallery.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getHistoryPaginated } from "@/actions/historyActions";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import HistoryCard from "./HistoryCard"; // Import the actual HistoryCard component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // For details modal
import { ScrollArea } from "@/components/ui/scroll-area"; // For modal content
import { Separator } from "@/components/ui/separator"; // For modal content
import Image from "next/image"; // For modal content
import { getDisplayableImageUrl } from "@/lib/utils"; // For modal content
import { Video, Download as DownloadIcon, CopyPlus } from "lucide-react"; // For modal content
import { useRouter } from 'next/navigation'; // For reload config


export default function HistoryGallery() {
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'image' | 'video'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // State for details modal
  const [selectedHistoryItemForDetail, setSelectedHistoryItemForDetail] = useState<HistoryItem | null>(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);
  const router = useRouter();


  const itemsPerPage = 9; // Or any other number you prefer

  const fetchHistory = useCallback(async (page: number, filter: 'all' | 'image' | 'video', append: boolean = false) => {
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

  const handleFilterChange = (newFilter: string) => {
    setCurrentFilter(newFilter as 'all' | 'image' | 'video');
    setCurrentPage(1); // Reset to first page on filter change
    // useEffect will trigger fetchHistory
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchHistory(currentPage + 1, currentFilter, true);
    }
  };

  const handleViewDetails = (item: HistoryItem) => {
    setSelectedHistoryItemForDetail(item);
    setIsHistoryDetailOpen(true);
  };

  const handleReloadConfig = (item: HistoryItem) => {
    if (!item) return;

    const params = new URLSearchParams();
    params.set('historyItemId', item.id);
    
    if (item.videoGenerationParams) {
      params.set('defaultTab', 'video');
    } else {
      params.set('defaultTab', 'image');
    }

    router.push(`/create?${params.toString()}`);
    toast({
      title: "Configuration Loaded",
      description: "Settings applied to the creation hub. Adjust and generate!",
    });
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
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={handleFilterChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && !isLoadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {historyItems.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onViewDetails={handleViewDetails}
              onReloadConfig={handleReloadConfig}
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
                        layout="fill"
                        objectFit="contain"
                        className="rounded-md"
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
                          <Image src={getDisplayableImageUrl(url)!} alt={`Generated ${index + 1}`} layout="fill" objectFit="contain" />
                           <a href={getDisplayableImageUrl(url)!} download={`Refashion_Image_${selectedHistoryItemForDetail.id.substring(0,6)}_${index}.png`} target="_blank" rel="noopener noreferrer" className="absolute bottom-1 right-1">
                            <Button variant="outline" size="icon" className="h-6 w-6 bg-background/70 hover:bg-background/90"><DownloadIcon className="h-3 w-3" /></Button>
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
                          <Button variant="outline" size="sm" className="w-full"><DownloadIcon className="mr-2 h-4 w-4" /> Download Video</Button>
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
                    <CopyPlus className="mr-2 h-4 w-4"/> Use as Template
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {hasMore && !isLoadingMore && (
        <div className="text-center mt-8">
          <Button onClick={handleLoadMore} variant="outline">
            Load More ({totalCount - historyItems.length} remaining)
          </Button>
        </div>
      )}
      {isLoadingMore && (
        <div className="text-center mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
