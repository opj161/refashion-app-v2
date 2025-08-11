'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SettingKey } from '@/services/settings.service';
import { updateSetting, triggerCacheCleanup, updateEncryptedSetting, updateSystemPrompt } from '@/actions/adminActions';
import { Loader2, Video, Wand2, Sparkles, UserCheck, Trash2, KeyRound, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SettingsState = Record<SettingKey, boolean>;

interface SystemPromptData {
  success: boolean;
  prompt?: string;
  source?: 'database' | 'file' | 'none';
  error?: string;
}

// Metadata for boolean feature flags ONLY
const FEATURE_FLAG_METADATA: Record<
  'feature_video_generation' | 'feature_background_removal' | 'feature_image_upscaling' | 'feature_face_detailer',
  { label: string; description: string; icon: React.ElementType }
> = {
  feature_video_generation: { label: 'Enable Video Generation', description: 'Allow users to access the video generation tab and features.', icon: Video },
  feature_background_removal: { label: 'Enable Background Removal', description: 'Allow users to use the background removal tool on uploaded images.', icon: Wand2 },
  feature_image_upscaling: { label: 'Enable Image Upscaling', description: 'Allow users to use the upscaling tool.', icon: Sparkles },
  feature_face_detailer: { label: 'Enable Face Detailer', description: 'Allow users to use the face enhancement tool.', icon: UserCheck },
};

// Add a prop for masked key status
interface SettingsFormProps {
  initialSettings: Record<SettingKey, string>;
  maskedApiKeys?: { gemini1: string; gemini2: string; gemini3: string; fal: string };
  systemPromptData?: SystemPromptData;
}

export function SettingsForm({ initialSettings, maskedApiKeys, systemPromptData }: SettingsFormProps) {
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
    global_gemini_api_key_1: false,
    global_gemini_api_key_2: false,
    global_gemini_api_key_3: false,
    global_fal_api_key: false,
    ai_prompt_engineer_system: false,
  });
  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [isUpdatingApiKeys, setIsUpdatingApiKeys] = useState(false);
  const [isUpdatingSystemPrompt, setIsUpdatingSystemPrompt] = useState(false);
  // FIX: Initialize API keys with empty strings to avoid double encryption
  const [apiKeys, setApiKeys] = useState({
    gemini1: '',
    gemini2: '',
    gemini3: '',
    fal: ''
  });
  const [systemPrompt, setSystemPrompt] = useState(systemPromptData?.prompt || '');

  const handleSettingChange = async (key: SettingKey, value: boolean) => {
    setIsUpdating(prev => ({ ...prev, [key]: true }));
    setSettings(prev => ({...prev, [key]: value})); // Optimistic update

    const result = await updateSetting(key, value);
    if (!result.success) {
      toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
      setSettings(prev => ({...prev, [key]: !value})); // Revert on failure
    } else {
        toast({ title: 'Setting Updated', description: `${FEATURE_FLAG_METADATA[key as keyof typeof FEATURE_FLAG_METADATA]?.label} has been ${value ? 'enabled' : 'disabled'}.` });
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

  const handleApiKeysUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingApiKeys(true);
    try {
      // Create an array of update promises
      const updatePromises = [];
      
      // Only add an update promise if the user has entered a new value
      if (apiKeys.gemini1) {
        updatePromises.push(updateEncryptedSetting('global_gemini_api_key_1', apiKeys.gemini1));
      }
      if (apiKeys.gemini2) {
        updatePromises.push(updateEncryptedSetting('global_gemini_api_key_2', apiKeys.gemini2));
      }
      if (apiKeys.gemini3) {
        updatePromises.push(updateEncryptedSetting('global_gemini_api_key_3', apiKeys.gemini3));
      }
      if (apiKeys.fal) {
        updatePromises.push(updateEncryptedSetting('global_fal_api_key', apiKeys.fal));
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        toast({ title: 'API Keys Updated', description: 'Global API keys have been saved.' });
        // Reset the form after successful submission
        setApiKeys({ gemini1: '', gemini2: '', gemini3: '', fal: '' });
      } else {
        toast({ title: 'No Changes', description: 'No new API keys were entered.' });
      }

    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update API keys.', variant: 'destructive' });
    } finally {
      setIsUpdatingApiKeys(false);
    }
  };

  const handleSystemPromptUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingSystemPrompt(true);
    try {
      const result = await updateSystemPrompt(systemPrompt);
      if (result.success) {
        toast({ title: 'System Prompt Updated', description: 'AI prompt engineer system instruction has been saved.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update system prompt.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update system prompt.', variant: 'destructive' });
    } finally {
      setIsUpdatingSystemPrompt(false);
    }
  };

  return (
    <div className="grid gap-6">
        <Card variant="glass">
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable major application features in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(FEATURE_FLAG_METADATA).map(([key, meta]) => {
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
                                    checked={!!settings[key as SettingKey]}
                                    onCheckedChange={(checked) => handleSettingChange(key as SettingKey, checked)}
                                    disabled={!!isUpdating[key as SettingKey]}
                                />
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
        
        <Card variant="glass">
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

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Global API Keys</CardTitle>
            <CardDescription>Set the system-wide default API keys for AI services. User-specific keys will override these.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApiKeysUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global_gemini_api_key_1">Global Gemini API Key 1</Label>
                <Input id="global_gemini_api_key_1" type="password" value={apiKeys.gemini1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, gemini1: e.target.value}))} placeholder={maskedApiKeys?.gemini1 || "Enter new key"} />
                {maskedApiKeys?.gemini1 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini1}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_gemini_api_key_2">Global Gemini API Key 2</Label>
                <Input id="global_gemini_api_key_2" type="password" value={apiKeys.gemini2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, gemini2: e.target.value}))} placeholder={maskedApiKeys?.gemini2 || "Enter new key"} />
                {maskedApiKeys?.gemini2 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini2}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_gemini_api_key_3">Global Gemini API Key 3</Label>
                <Input id="global_gemini_api_key_3" type="password" value={apiKeys.gemini3} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, gemini3: e.target.value}))} placeholder={maskedApiKeys?.gemini3 || "Enter new key"} />
                {maskedApiKeys?.gemini3 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini3}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_fal_api_key">Global Fal.ai API Key</Label>
                <Input id="global_fal_api_key" type="password" value={apiKeys.fal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, fal: e.target.value}))} placeholder={maskedApiKeys?.fal || "Enter new key"} />
                {maskedApiKeys?.fal && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.fal}</div>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingApiKeys}>
                  {isUpdatingApiKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Save API Keys
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>AI System Prompts</CardTitle>
            <CardDescription>
              Configure the system prompts used by AI models. Changes take effect immediately.
              {systemPromptData?.source && (
                <span className="block mt-1 text-xs">
                  Current source: <span className="font-mono">{systemPromptData.source}</span>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSystemPromptUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai_prompt_engineer_system">Prompt Engineer System Instruction</Label>
                <Textarea 
                  id="ai_prompt_engineer_system" 
                  value={systemPrompt} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
                  placeholder="Enter the system instruction for the AI prompt engineer..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  This prompt instructs the AI on how to generate optimized prompts for image generation.
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingSystemPrompt}>
                  {isUpdatingSystemPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Save System Prompt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
