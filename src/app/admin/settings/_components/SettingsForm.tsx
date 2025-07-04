'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SettingKey } from '@/services/settings.service';
import { updateSetting, triggerCacheCleanup } from '@/actions/adminActions';
import { Loader2, Video, Wand2, Sparkles, UserCheck, Trash2 } from 'lucide-react';

type SettingsState = Record<SettingKey, boolean>;

const SETTING_METADATA: Record<SettingKey, { label: string; description: string; icon: React.ElementType }> = {
  feature_video_generation: { label: 'Enable Video Generation', description: 'Allow users to access the video generation tab and features.', icon: Video },
  feature_background_removal: { label: 'Enable Background Removal', description: 'Allow users to use the background removal tool on uploaded images.', icon: Wand2 },
  feature_image_upscaling: { label: 'Enable Image Upscaling', description: 'Allow users to use the upscaling tool.', icon: Sparkles },
  feature_face_detailer: { label: 'Enable Face Detailer', description: 'Allow users to use the face enhancement tool.', icon: UserCheck },
};

interface SettingsFormProps {
  initialSettings: Record<SettingKey, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(
    Object.entries(initialSettings).reduce((acc, [key, value]) => {
      acc[key as SettingKey] = value === 'true';
      return acc;
    }, {} as SettingsState)
  );
  const [isUpdating, setIsUpdating] = useState<Record<SettingKey, boolean>>({
    feature_video_generation: false,
    feature_background_removal: false,
    feature_image_upscaling: false,
    feature_face_detailer: false,
  });
  const [isCleaningCache, setIsCleaningCache] = useState(false);

  const handleSettingChange = async (key: SettingKey, value: boolean) => {
    setIsUpdating(prev => ({ ...prev, [key]: true }));
    setSettings(prev => ({...prev, [key]: value})); // Optimistic update

    const result = await updateSetting(key, value);
    if (!result.success) {
      toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
      setSettings(prev => ({...prev, [key]: !value})); // Revert on failure
    } else {
        toast({ title: 'Setting Updated', description: `${SETTING_METADATA[key].label} has been ${value ? 'enabled' : 'disabled'}.` });
    }
    setIsUpdating(prev => ({ ...prev, [key]: false }));
  };
  
  const handleCacheCleanup = async () => {
    setIsCleaningCache(true);
    const result = await triggerCacheCleanup();
    if(result.success) {
        toast({ title: 'Cache Cleanup', description: result.message });
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsCleaningCache(false);
  }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable major application features in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(SETTING_METADATA).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor={key} className="font-medium">{meta.label}</Label>
                                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isUpdating[key as SettingKey] && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Switch
                                    id={key}
                                    checked={settings[key as SettingKey]}
                                    onCheckedChange={(checked) => handleSettingChange(key as SettingKey, checked)}
                                    disabled={!!isUpdating[key as SettingKey]}
                                />
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Run maintenance tasks to keep the application running smoothly.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                        <Label className="font-medium">Clean Image Cache</Label>
                        <p className="text-xs text-muted-foreground">Removes old processed images (e.g., background-removed, upscaled) from the server to save space.</p>
                    </div>
                    <Button onClick={handleCacheCleanup} disabled={isCleaningCache}>
                        {isCleaningCache ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Run Cleanup
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
