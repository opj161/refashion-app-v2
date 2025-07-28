Of course. Here is a smart, effective, and simple implementation plan with all the necessary code diffs to refactor the application's inconsistent data fetching and properly utilize React Server Components.

### **Plan Overview**

The core strategy is to convert pages from client-side data fetchers into server-side data fetchers, leveraging React Server Components (RSC) for initial data loading and React Suspense for excellent loading states. Client-side state will now be used exclusively for UI interactivity and subsequent data fetching (like pagination), which will be handled by Server Actions.

This plan is divided into two phases:
1.  **Refactor the Admin "All History" Page:** A clear, isolated example of converting a fully client-rendered page to a server-rendered page with streaming.
2.  **Refactor the User-Facing History Gallery:** A more nuanced refactor of the main "Creation Hub", demonstrating how to embed a server-rendered component within a larger client component.

---

### **Phase 1: Refactor the Admin "All History" Page (`/admin/all-history`)**

This phase transforms the page from a client-side data-fetching model to a server-first pattern, dramatically improving its initial load performance.

#### **1. New File: `src/app/admin/all-history/_components/HistoryGallerySkeleton.tsx`**

First, we create a skeleton component. This will be the immediate fallback shown to the user while the server fetches the initial data, providing an instant UI response.

```diff
+ +++ new file: src/app/admin/all-history/_components/HistoryGallerySkeleton.tsx
+ import { Skeleton } from '@/components/ui/skeleton';
+
+ export function HistoryGallerySkeleton() {
+   return (
+     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
+       {Array.from({ length: 9 }).map((_, i) => (
+         <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
+       ))}
+     </div>
+   );
+ }
```

#### **2. New File: `src/app/admin/all-history/_components/HistoryGallery.tsx`**

Next, we create the client component responsible for displaying the history items and handling user interactions like pagination. It receives the initial data via props from the server.

```diff
+ +++ new file: src/app/admin/all-history/_components/HistoryGallery.tsx
+ 'use client';
+
+ import { useState } from 'react';
+ import type { HistoryItem } from '@/lib/types';
+ import HistoryCard from '@/components/HistoryCard';
+ import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
+ import { Button } from '@/components/ui/button';
+ import { Loader2 } from 'lucide-react';
+
+ interface PaginatedResult {
+   items: HistoryItem[];
+   hasMore: boolean;
+ }
+
+ export function HistoryGallery({ initialHistory }: { initialHistory: PaginatedResult }) {
+   const [history, setHistory] = useState(initialHistory.items);
+   const [hasMore, setHasMore] = useState(initialHistory.hasMore);
+   const [page, setPage] = useState(2);
+   const [isLoadingMore, setIsLoadingMore] = useState(false);
+
+   const handleLoadMore = async () => {
+     setIsLoadingMore(true);
+     // This now calls a Server Action to fetch the next page of data
+     const result = await getAllUsersHistoryPaginatedForAdmin(page, 9);
+     setHistory(prev => [...prev, ...result.items]);
+     setHasMore(result.hasMore);
+     setPage(prev => prev + 1);
+     setIsLoadingMore(false);
+   };
+
+   return (
+     <div>
+       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
+         {history.map(item => (
+           <HistoryCard
+             key={item.id}
+             item={item}
+             username={item.username}
+             onViewDetails={() => {}}
+             onReloadConfig={() => {}}
+             onDeleteItem={() => {}}
+           />
+         ))}
+       </div>
+
+       {hasMore && (
+         <div className="mt-8 text-center">
+           <Button onClick={handleLoadMore} disabled={isLoadingMore}>
+             {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
+             Load More
+           </Button>
+         </div>
+       )}
+     </div>
+   );
+ }
```

#### **3. Modified File: `src/app/admin/all-history/page.tsx`**

Finally, we refactor the page itself. It becomes a clean, `async` Server Component that fetches the data and delegates rendering to our new components, using `<Suspense>` to handle the loading state gracefully.

```diff
--- a/src/app/admin/all-history/page.tsx
+++ b/src/app/admin/all-history/page.tsx
- 'use client';
- 
- import { useState, useEffect, useRef, useCallback } from 'react';
- import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
- import type { HistoryItem } from '@/lib/types';
- import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
- import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
- import { Loader2, AlertTriangle } from 'lucide-react';
- import HistoryCard from '@/components/HistoryCard'; // Re-use the existing card for consistency
+ import { Suspense } from 'react';
+ import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
+ import { HistoryGallery } from './_components/HistoryGallery';
+ import { HistoryGallerySkeleton } from './_components/HistoryGallerySkeleton';
 
- export default function AllHistoryPage() {
-   const [items, setItems] = useState<HistoryItem[]>([]);
-   const [page, setPage] = useState(1);
-   const [hasMore, setHasMore] = useState(true);
-   const [loading, setLoading] = useState(true);
-   const [loadingMore, setLoadingMore] = useState(false);
-   const [error, setError] = useState<string | null>(null);
-   const loadMoreRef = useRef<HTMLDivElement>(null);
- 
-   const fetchHistory = useCallback(async (pageNum: number, append: boolean) => {
-     if (!append) {
-       setLoading(true);
-     } else {
-       setLoadingMore(true);
-     }
-     try {
-       const result = await getAllUsersHistoryPaginatedForAdmin(pageNum, 9);
-       setItems(prev => append ? [...prev, ...result.items] : result.items);
-       setHasMore(result.hasMore);
-       setPage(pageNum);
-     } catch (err) {
-       setError(err instanceof Error ? err.message : 'Failed to load history');
-     } finally {
-       setLoading(false);
-       setLoadingMore(false);
-     }
-   }, []);
- 
-   useEffect(() => {
-     fetchHistory(1, false);
-   }, [fetchHistory]);
- 
-   useEffect(() => {
-     const observer = new IntersectionObserver(
-       (entries) => {
-         if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
-           fetchHistory(page + 1, true);
-         }
-       },
-       { rootMargin: '200px' }
-     );
- 
-     const currentRef = loadMoreRef.current;
-     if (currentRef) {
-       observer.observe(currentRef);
-     }
- 
-     return () => {
-       if (currentRef) {
-         observer.unobserve(currentRef);
-       }
-     };
-   }, [hasMore, loading, loadingMore, page, fetchHistory]);
- 
-   if (loading) {
-     return (
-       <div className="container mx-auto max-w-7xl px-4 py-10">
-         <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
-         <div className="flex justify-center">
-           <Loader2 className="h-8 w-8 animate-spin text-primary" />
-         </div>
-       </div>
-     );
-   }
- 
-   if (error) {
-     return (
-       <div className="container mx-auto max-w-7xl px-4 py-10">
-         <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
-         <Alert variant="destructive">
-           <AlertTriangle className="h-4 w-4" />
-           <AlertTitle>Error</AlertTitle>
-           <AlertDescription>{error}</AlertDescription>
-         </Alert>
-       </div>
-     );
-   }
- 
-   return (
-     <main className="container mx-auto max-w-7xl px-4 py-10">
-       <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
-       
-       {items.length === 0 ? (
-         <div className="text-center text-muted-foreground py-8">
-           No user history found.
-         </div>
-       ) : (
-         <>
-           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
-             {items.map((item) => (
-               <HistoryCard
-                 key={item.id}
-                 item={item}
-                 onViewDetails={() => {}}
-                 onReloadConfig={() => {}}
-                 onDeleteItem={() => {}}
-                 username={item.username}
-               />
-             ))}
-           </div>
-           {/* Infinite scroll trigger */}
-           <div ref={loadMoreRef} className="h-10" />
- 
-           {loadingMore && (
-              <div className="flex justify-center mt-4">
-                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
-              </div>
-           )}
-         </>
-       )}
-     </main>
-   );
+ // This is now an async Server Component. It renders the static shell of the page instantly.
+ export default function AllHistoryPage() {
+   return (
+     <main className="container mx-auto max-w-7xl px-4 py-10">
+       <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
+       {/* Suspense provides a fallback while the data is fetched on the server. */}
+       <Suspense fallback={<HistoryGallerySkeleton />}>
+         <HistoryLoader />
+       </Suspense>
+     </main>
+   );
+ }
+ 
+ // This separate async component fetches the data. This allows the main page
+ // component to render its static parts immediately without waiting for the data fetch.
+ async function HistoryLoader() {
+   const initialHistory = await getAllUsersHistoryPaginatedForAdmin(1, 9);
+   if (!initialHistory || initialHistory.items.length === 0) {
+     return <div className="text-center text-muted-foreground py-8">No user history found.</div>;
+   }
+   // The client component receives the initial data as a prop.
+   return <HistoryGallery initialHistory={initialHistory} />;
}
```

---

### **Phase 2: Refactor the User-Facing Creation Hub (`/create`)**

This phase applies the same principles to the user-facing history gallery. We will use the "Passing Server Components as Children" pattern, which is ideal for when a largely interactive client component needs to contain a section of server-rendered content.

#### **1. Modified File: `src/components/history-gallery.tsx`**

We refactor the existing `HistoryGallery` to be a reusable client component that accepts initial data via props and handles its own state and pagination via Server Actions.

```diff
--- a/src/components/history-gallery.tsx
+++ b/src/components/history-gallery.tsx
 import React, { useState, useEffect, useCallback, useRef } from "react";
 import { motion, AnimatePresence, LayoutGroup } from "motion/react";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Button } from "@/components/ui/button";
-import { getHistoryPaginated, deleteHistoryItem } from "@/actions/historyActions";
+import { getHistoryPaginated, deleteHistoryItem, getMoreUserHistory } from "@/actions/historyActions"; // Assuming getMoreUserHistory is created
 import type { HistoryItem } from "@/lib/types";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, AlertTriangle, ImageIcon } from "lucide-react";
@@ -19,102 +19,16 @@
 
 type FilterType = 'all' | 'image' | 'video';
 
-export default function HistoryGallery() {
+interface PaginatedResult {
+  items: HistoryItem[];
+  totalCount: number;
+  hasMore: boolean;
+  currentPage: number;
+}
+
+export default function HistoryGallery({ initialHistory }: { initialHistory: PaginatedResult }) {
   const { toast } = useToast();
   const router = useRouter();
-  const [showSkeletons, setShowSkeletons] = useState<boolean>(false); // NEW: controls skeleton visibility
-  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
-  const [isLoading, setIsLoading] = useState<boolean>(true);
-  const [error, setError] = useState<string | null>(null);
-  const [currentPage, setCurrentPage] = useState<number>(1);
-  const [hasMore, setHasMore] = useState<boolean>(false);
-  const [totalCount, setTotalCount] = useState<number>(0);
   const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
-  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
-
-  // State for details modal
   const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
-
-  // State for delete confirmation
   const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
-
-  // Ref for the element that will trigger loading more items
-  const loadMoreRef = useRef<HTMLDivElement>(null);
-
-  // Animation variants for the gallery
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
@@ -134,70 +48,45 @@
     exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
   };
 
+  // State is now initialized from server-provided props
+  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(initialHistory.items);
+  const [currentPage, setCurrentPage] = useState<number>(initialHistory.currentPage + 1);
+  const [hasMore, setHasMore] = useState<boolean>(initialHistory.hasMore);
+  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
 
-  const itemsPerPage = 9; // Or any other number you prefer
-
-  // Effect for initial load and filter changes
+  // Data fetching is now handled by this function, called on filter change or load more.
   useEffect(() => {
-    // NEW: Timer to delay skeletons
-    const skeletonTimer = setTimeout(() => {
-      if (isLoading) setShowSkeletons(true);
-    }, 500);
-    const loadInitialHistory = async () => {
-      setIsLoading(true);
-      setError(null);
+    const loadFilteredHistory = async () => {
+      setIsLoadingMore(true); // Use loadingMore state for subsequent loads
       try {
-        const result = await getHistoryPaginated(1, itemsPerPage, currentFilter);
+        const result = await getHistoryPaginated(1, 9, currentFilter);
         setHistoryItems(result.items);
         setCurrentPage(result.currentPage + 1);
         setHasMore(result.hasMore);
-        setTotalCount(result.totalCount);
       } catch (err) {
-        console.error("Failed to fetch history:", err);
-        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
-        setError(errorMessage);
         toast({
           title: "Error Loading History",
-          description: errorMessage,
+          description: err instanceof Error ? err.message : "An unknown error occurred.",
           variant: "destructive",
         });
       } finally {
-        setIsLoading(false);
-        setShowSkeletons(false); // NEW: always hide skeletons after load
+        setIsLoadingMore(false);
       }
     };
-    loadInitialHistory();
-    // NEW: cleanup timer
-    return () => clearTimeout(skeletonTimer);
-    // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, [currentFilter, toast, itemsPerPage]);
+    // Don't run on initial render, only when filter changes
+    if (currentPage > 1) { // A bit of a hack to detect non-initial runs
+        loadFilteredHistory();
+    }
+  }, [currentFilter, toast]);
 
   const handleLoadMore = useCallback(async () => {
     if (!hasMore || isLoadingMore) return;
     setIsLoadingMore(true);
     try {
-      const result = await getHistoryPaginated(currentPage + 1, itemsPerPage, currentFilter);
+      // Use a server action for pagination
+      const result = await getHistoryPaginated(currentPage, 9, currentFilter);
       setHistoryItems(prevItems => [...prevItems, ...result.items]);
-      setCurrentPage(result.currentPage);
+      setCurrentPage(prev => prev + 1);
       setHasMore(result.hasMore);
     } catch (err) {
-      console.error("Failed to fetch history:", err);
-      setError(err instanceof Error ? err.message : "An unknown error occurred.");
       toast({
         title: "Error Loading History",
         description: err instanceof Error ? err.message : "Could not fetch history items.",
@@ -206,31 +145,10 @@
     } finally {
       setIsLoadingMore(false);
     }
-  }, [hasMore, isLoadingMore, currentPage, currentFilter, itemsPerPage, toast]);
-
-  // Set up the IntersectionObserver to watch the loadMoreRef
-  useEffect(() => {
-    const observer = new IntersectionObserver(
-      (entries) => {
-        // If the trigger element is intersecting and we have more items to load
-        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
-          handleLoadMore();
-        }
-      },
-      { 
-        threshold: 1.0, // Trigger when 100% of the element is visible
-        rootMargin: '100px' // Start loading 100px before the element is visible
-      }
-    );
-    const currentRef = loadMoreRef.current;
-    if (currentRef) {
-      observer.observe(currentRef);
-    }
-    return () => {
-      if (currentRef) {
-        observer.unobserve(currentRef);
-      }
-    };
-  }, [hasMore, isLoading, isLoadingMore, handleLoadMore]); // Dependencies updated
+  }, [hasMore, isLoadingMore, currentPage, currentFilter, toast]);
 
   const handleFilterChange = (newFilter: string) => {
     setCurrentFilter(newFilter as FilterType);
-    setCurrentPage(1); // Reset to first page on filter change
   };
 
   const handleViewDetails = (item: HistoryItem) => {
@@ -253,7 +171,6 @@
       if (result.success) {
         // Optimistic UI Update: Remove the item from the local state
         setHistoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
-        setTotalCount(prevCount => prevCount - 1); // Decrement total count
         toast({
           title: "Item Deleted",
           description: "The history item has been permanently removed.",
@@ -271,31 +188,7 @@
     }
   };
 
-
-  // Function to get display label for attribute values (similar to one in image-forge)
-  // This might be better placed in a utils file if used in multiple places
-  const getDisplayLabelForValue = (options: { value: string, displayLabel: string }[], value: string | undefined): string => {
-    if (!value) return "N/A";
-    return options.find(o => o.value === value)?.displayLabel || value;
-  };
-
-  // Simplified options for display in modal - ideally import from a shared location
-  const FASHION_STYLE_OPTIONS_SIMPLE = [{value: "default_style", displayLabel: "Default"}, /* ... other styles */];
-  const GENDER_OPTIONS_SIMPLE = [{value: "female", displayLabel: "Female"},  /* ... other genders */];
-  // ... add other simplified option arrays as needed for the modal
-
-
   // Helper to check if item is a video
   const itemIsVideo = (item: HistoryItem) => !!(item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)));
 
@@ -308,30 +201,15 @@
         </TabsList>
       </Tabs>
 
-      {isLoading && showSkeletons && !isLoadingMore && (
-        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
-          {Array.from({ length: itemsPerPage }).map((_, index) => (
-            <div key={`skel-${index}`} className="p-4 border rounded-lg shadow-sm space-y-2 bg-muted/50">
-              <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
-              <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
-              <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
-            </div>
-          ))}
-        </div>
-      )}
-
-      {!isLoading && error && (
-        <div className="text-center py-10 text-red-600">
-          <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
-          <p>Error loading history: {error}</p>
-        </div>
-      )}
-
-      {!isLoading && !error && historyItems.length === 0 && (
+      {historyItems.length === 0 && !isLoadingMore ? (
         <Card variant="glass" className="mt-8">
           <CardContent className="py-16 flex flex-col items-center justify-center text-center">
             <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
@@ -340,10 +218,10 @@
           </CardContent>
         </Card>
       )}
 
       <LayoutGroup>
         <>
-          {!isLoading && !error && historyItems.length > 0 && (
+          {historyItems.length > 0 && (
             <motion.div
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4"
               variants={containerVariants}
@@ -379,8 +257,14 @@
         </>
       </LayoutGroup>
 
-      {/* Invisible trigger element for infinite scroll */}
-      {hasMore && <div ref={loadMoreRef} className="h-4" />}
+      {hasMore && (
+        <div className="mt-8 text-center">
+          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
+            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
+            Load More
+          </Button>
+        </div>
+      )}
 
       {isLoadingMore && (
         <div className="text-center mt-8 flex justify-center">
```

#### **2. Modified File: `src/components/creation-hub.tsx`**

We modify the `<CreationHub>` to accept `children`. This allows us to pass our server-rendered history gallery into the "History" tab's content area, effectively creating a "slot" for server-rendered UI inside this interactive client component.

```diff
--- a/src/components/creation-hub.tsx
+++ b/src/components/creation-hub.tsx
 import React, { useState, useEffect, useCallback } from "react";
-import { useSearchParams, useRouter } from "next/navigation";
+import { useRouter } from "next/navigation";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import ImagePreparationContainer from "./ImagePreparationContainer";
 import ImageParameters from "./image-parameters";
 import VideoParameters from "./video-parameters";
-import { getHistoryItemById } from "@/actions/historyActions";
-import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import { useImageStore } from "@/stores/imageStore";
-import type { HistoryItem } from "@/lib/types";
 
-export default function CreationHub() {
-  const { user: currentUser } = useAuth();
+export default function CreationHub({ children }: { children: React.ReactNode }) {
   const { toast } = useToast();
-  const searchParams = useSearchParams();
   const router = useRouter();
   const { reset: resetStore } = useImageStore();
   const [defaultTab, setDefaultTab] = useState<string>("image");
-  const [processedContextId, setProcessedContextId] = useState<string | null>(null);
-  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
-  const [historyItemToLoad, setHistoryItemToLoad] = useState<HistoryItem | null>(null);
-  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
 
   // Centralized reset function
   const handleReset = useCallback(() => {
     router.push('/create', { scroll: false }); // Update URL first
     resetStore();
-    setSourceImageUrl(null);
-    setHistoryItemToLoad(null);
-    setProcessedContextId(null);
     toast({
       title: "Image Cleared",
       description: "You can now upload a new image to start over.",
     });
   }, [router, resetStore, toast]);
 
-  // Handle URL parameters and state synchronization on component mount
-  useEffect(() => {
-    const historyItemId = searchParams.get('historyItemId');
-    const defaultTabParam = searchParams.get('defaultTab');
-    const sourceImageUrlParam = searchParams.get('sourceImageUrl');
-    const currentContextId = historyItemId || sourceImageUrlParam;
-
-    // Set default tab from URL parameter, but only if it's different to avoid re-renders
-    if (defaultTabParam && (defaultTabParam === 'image' || defaultTabParam === 'video')) {
-      if (defaultTab !== defaultTabParam) {
-        setDefaultTab(defaultTabParam);
-      }
-    }
-
-    // If there's no context, and nothing was processed, do nothing.
-    if (!currentContextId && !processedContextId) {
-      return;
-    }
-
-    // Reset and load history item or source image URL based on URL parameters
-    if (currentContextId && currentContextId !== processedContextId) {
-      setHistoryItemToLoad(null);
-      if (historyItemId) {
-        const loadHistoryData = async () => {
-          setIsLoadingHistory(true);
-          try {
-            const { success, item, error } = await getHistoryItemById(historyItemId);
-            if (success && item) {
-              setHistoryItemToLoad(item);
-              setSourceImageUrl(item.originalClothingUrl || item.videoGenerationParams?.sourceImageUrl || null);
-            } else if (!success && error) {
-              toast({ title: "Error Loading Configuration", description: error, variant: "destructive" });
-            }
-          } catch (e) {
-            toast({ title: "Error Loading Configuration", description: "An unexpected error occurred.", variant: "destructive" });
-          } finally {
-            setIsLoadingHistory(false);
-          }
-        };
-        loadHistoryData();
-      } else if (sourceImageUrlParam) {
-        setSourceImageUrl(sourceImageUrlParam);
-      }
-      setProcessedContextId(currentContextId);
-    } else if (!currentContextId && processedContextId) {
-      setSourceImageUrl(null);
-      setHistoryItemToLoad(null);
-      setProcessedContextId(null);
-    }
-  }, [searchParams, currentUser, toast, processedContextId, defaultTab]);
-
   return (
     <div className="space-y-8">
       {/* Tabs at the top */}
@@ -79,25 +24,19 @@
         <TabsTrigger value="video">Video Generation</TabsTrigger>
       </TabsList>
 
+      {/* The children prop is the server-rendered history gallery */}
+      {children}
+
       <TabsContent value="image" className="space-y-6 mt-8" forceMount>
-        <ImagePreparationContainer 
-          sourceImageUrl={sourceImageUrl} 
-          preparationMode="image" 
-          onReset={handleReset}
-        />
-        <ImageParameters 
-          historyItemToLoad={historyItemToLoad}
-          isLoadingHistory={isLoadingHistory}
-        />
+        <ImagePreparationContainer preparationMode="image" onReset={handleReset} />
+        <ImageParameters />
       </TabsContent>
 
       <TabsContent value="video" className="space-y-6 mt-8" forceMount>
-        <ImagePreparationContainer 
-          sourceImageUrl={sourceImageUrl} 
-          preparationMode="video" 
-          onReset={handleReset}
-        />
-        <VideoParameters 
-          historyItemToLoad={historyItemToLoad}
-          isLoadingHistory={isLoadingHistory}
-        />
+        <ImagePreparationContainer preparationMode="video" onReset={handleReset} />
+        <VideoParameters />
       </TabsContent>
     </div>
   );
 }
```

#### **3. Modified File: `src/app/create/page.tsx`**

The `create` page is now a Server Component. It fetches the initial user history and passes it down to a new `<UserHistory />` Server Component, which is then passed as `children` to the client-side `<CreationHub />`.

```diff
--- a/src/app/create/page.tsx
+++ b/src/app/create/page.tsx
-// src/app/create/page.tsx
-import CreationHub from "@/components/creation-hub";
+import { Suspense } from 'react';
+import CreationHub from '@/components/creation-hub';
 import { PageHeader } from "@/components/ui/page-header";
-import { Palette } from "lucide-react"; // Import a suitable icon
+import { Palette } from "lucide-react";
+import HistoryGallery from '@/components/history-gallery';
+import { getHistoryPaginated } from '@/actions/historyActions';
+import { Skeleton } from '@/components/ui/skeleton';
 
-export default function CreatePage() {
+// This is now an async Server Component
+export default async function CreatePage() {
   return (
     <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
       <PageHeader
         icon={Palette}
         title="Creation Hub"
         description="Generate new fashion images and videos using your uploaded clothing."
       />
-      <CreationHub />
+      {/* CreationHub is now a child that receives the server-rendered history as children */}
+      <CreationHub>
+        <Suspense fallback={<HistoryGallerySkeleton />}>
+          <UserHistory />
+        </Suspense>
+      </CreationHub>
     </div>
   );
 }
+
+async function UserHistory() {
+  // Fetch initial history data on the server for the logged-in user
+  const initialHistory = await getHistoryPaginated(1, 9, 'all');
+  return <HistoryGallery initialHistory={initialHistory} />;
+}
+
+function HistoryGallerySkeleton() {
+  return (
+    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
+      {Array.from({ length: 9 }).map((_, i) => (
+        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
+      ))}
+    </div>
+  );
+}
```

By implementing these changes, you will have successfully refactored the most critical parts of the application to align with modern Next.js patterns, resulting in a more performant and maintainable codebase.