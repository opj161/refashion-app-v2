// src/app/create/page.tsx
import { PageHeader } from "@/components/ui/page-header";
import { Palette } from "lucide-react";
import { getHistoryItemById } from '@/actions/historyActions';
import type { HistoryItem } from '@/lib/types';
import CreationHub from "@/components/creation-hub";

export default async function CreatePage({ searchParams }: {
  // The searchParams prop is now correctly typed as a Promise
  searchParams: Promise<{ historyItemId?: string | string[], sourceImageUrl?: string | string[] }>;
}) {
  // Await the promise to get the actual search params object
  const resolvedSearchParams = await searchParams;

  const { historyItemId: historyItemIdParam, sourceImageUrl: sourceImageUrlParam } = resolvedSearchParams;
  const historyItemId = Array.isArray(historyItemIdParam) ? historyItemIdParam[0] : historyItemIdParam;
  const sourceImageUrl = Array.isArray(sourceImageUrlParam) ? sourceImageUrlParam[0] : sourceImageUrlParam;

  let historyItem: HistoryItem | null = null;
  if (historyItemId) {
    const result = await getHistoryItemById(historyItemId);
    if (result.success && result.item) {
      historyItem = result.item;
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
      <PageHeader
        icon={Palette}
        title="Creation Hub"
        description="Generate new fashion images and videos using your uploaded clothing."
      />
      <CreationHub historyItemToLoad={historyItem} sourceImageUrl={sourceImageUrl} />
    </div>
  );
}