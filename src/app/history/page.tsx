// src/app/history/page.tsx
import HistoryGallery from "@/components/history-gallery";
import { PageHeader } from "@/components/ui/page-header";
import { History } from "lucide-react"; // Using History as the icon from lucide-react

export default function HistoryPage() {
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        icon={History}
        title="Creation History"
        description="Review your past image and video generations."
      />
      <HistoryGallery />
    </div>
  );
}
