// src/app/admin/settings/_components/ExportTool.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportAllData } from '@/actions/adminActions';
import { HardDriveDownload, Loader2 } from 'lucide-react';

export function ExportTool() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast({
      title: 'Exporting Data...',
      description: 'This may take a few moments depending on the amount of data.',
    });

    const result = await exportAllData();

    if (result.success && result.downloadUrl) {
      toast({
        title: 'Export Ready!',
        description: 'Your download will begin shortly.',
      });
      // Trigger the download in the browser
      window.location.href = result.downloadUrl;
    } else {
      toast({
        title: 'Export Failed',
        description: result.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }

    setIsExporting(false);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>
          Create a full backup of your application data, including the database and all media files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">Export All Data</p>
            <p className="text-xs text-muted-foreground">
              Downloads a single .zip archive containing everything.
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <HardDriveDownload className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}