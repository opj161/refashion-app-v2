// src/app/create/page.tsx
import { PageHeader } from "@/components/ui/page-header";
import { Palette } from "lucide-react";
import { getHistoryItemById } from '@/actions/historyActions';
import type { HistoryItem } from '@/lib/types';
import CreationHub from "@/components/creation-hub";

export default async function CreatePage({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined }; 
}) {
  // Handle the possibility of array values for query params
  const historyItemId = Array.isArray(searchParams.historyItemId) ? searchParams.historyItemId[0] : searchParams.historyItemId;
  const sourceImageUrl = Array.isArray(searchParams.sourceImageUrl) ? searchParams.sourceImageUrl[0] : searchParams.sourceImageUrl;

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
