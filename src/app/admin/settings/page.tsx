// src/app/admin/settings/page.tsx
import { getAllSettings, getGlobalApiKeysForDisplay, getSystemPromptsForAdmin } from '@/actions/adminActions';
import { PageHeader } from '@/components/ui/page-header';
import { Settings } from 'lucide-react';
import { SettingsForm } from './_components/SettingsForm';
import { ExportTool } from './_components/ExportTool';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const initialSettings = await getAllSettings();
  const maskedApiKeys = await getGlobalApiKeysForDisplay();
  const systemPromptData = await getSystemPromptsForAdmin();

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Settings}
        title="Application Settings"
        description="Manage feature flags and perform system maintenance."
        className="text-left py-0"
      />
      <SettingsForm
        initialSettings={initialSettings}
        maskedApiKeys={maskedApiKeys}
        systemPromptData={systemPromptData}
      />
      <ExportTool />
    </div>
  );
}
