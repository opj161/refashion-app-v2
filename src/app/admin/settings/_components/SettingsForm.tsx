'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SettingKey } from '@/services/settings.service';
import { 
  updateSetting, 
  handleApiKeysUpdate, 
  handleSystemPromptUpdate, 
  handleCacheCleanup,
  type ApiKeysFormState,
  type SystemPromptsFormState,
  type CacheCleanupFormState
} from '@/actions/adminActions';
import { Loader2, Video, Wand2, Sparkles, UserCheck, Trash2, KeyRound, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StudioPromptTester } from './StudioPromptTester';

type SettingsState = Record<SettingKey, boolean>;

type SystemPromptData = {
  success: boolean;
  prompts?: {
    engineer?: string;
    studio?: string;
  };
  sources?: {
    engineer?: 'database' | 'file' | 'none';
  };
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

// SubmitButton components using useFormStatus for pending state
function ApiKeysSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
      Save API Keys
    </Button>
  );
}

function SystemPromptSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      Save System Prompt
    </Button>
  );
}

function CacheCleanupSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
      Run Cleanup
    </Button>
  );
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
    ai_studio_mode_prompt_template: false,
  });
  
  // Initialize useActionState for each form
  const initialApiKeysState: ApiKeysFormState = { message: '' };
  const [apiKeysState, apiKeysAction] = useActionState(handleApiKeysUpdate, initialApiKeysState);
  
  const initialSystemPromptState: SystemPromptsFormState = { message: '' };
  const [systemPromptState, systemPromptAction] = useActionState(handleSystemPromptUpdate, initialSystemPromptState);
  
  const initialCacheCleanupState: CacheCleanupFormState = { message: '' };
  const [cacheCleanupState, cacheCleanupAction] = useActionState(handleCacheCleanup, initialCacheCleanupState);
  
  // Studio Prompt controlled state for testing
  const [studioPrompt, setStudioPrompt] = useState(systemPromptData?.prompts?.studio || '');
  
  // Update studio prompt state when props change
  useEffect(() => {
    if (systemPromptData?.prompts?.studio) {
      setStudioPrompt(systemPromptData.prompts.studio);
    }
  }, [systemPromptData?.prompts?.studio]);
  
  // Handle feedback from useActionState forms
  useEffect(() => {
    if (apiKeysState?.success) {
      toast({ title: 'Success', description: apiKeysState.message });
    } else if (apiKeysState?.error) {
      toast({ title: 'Error', description: apiKeysState.error, variant: 'destructive' });
    }
  }, [apiKeysState, toast]);
  
  useEffect(() => {
    if (systemPromptState?.success) {
      toast({ title: 'Success', description: systemPromptState.message });
    } else if (systemPromptState?.error) {
      toast({ title: 'Error', description: systemPromptState.error, variant: 'destructive' });
    }
  }, [systemPromptState, toast]);
  
  useEffect(() => {
    if (cacheCleanupState?.success) {
      toast({ title: 'Success', description: cacheCleanupState.message });
    } else if (cacheCleanupState?.error) {
      toast({ title: 'Error', description: cacheCleanupState.error, variant: 'destructive' });
    }
  }, [cacheCleanupState, toast]);
  
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
                <form action={cacheCleanupAction}>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                        <Label className="font-medium">Clean Image Cache</Label>
                        <p className="text-xs text-muted-foreground">Removes old processed images (e.g., background-removed, upscaled) from the server to save space.</p>
                    </div>
                    <CacheCleanupSubmitButton />
                  </div>
                </form>
            </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Global API Keys</CardTitle>
            <CardDescription>Set the system-wide default API keys for AI services. User-specific keys will override these.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={apiKeysAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini1">Global Gemini API Key 1</Label>
                <Input id="gemini1" name="gemini1" type="password" placeholder={maskedApiKeys?.gemini1 || "Enter new key"} />
                {maskedApiKeys?.gemini1 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini1}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini2">Global Gemini API Key 2</Label>
                <Input id="gemini2" name="gemini2" type="password" placeholder={maskedApiKeys?.gemini2 || "Enter new key"} />
                {maskedApiKeys?.gemini2 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini2}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini3">Global Gemini API Key 3</Label>
                <Input id="gemini3" name="gemini3" type="password" placeholder={maskedApiKeys?.gemini3 || "Enter new key"} />
                {maskedApiKeys?.gemini3 && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.gemini3}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fal">Global Fal.ai API Key</Label>
                <Input id="fal" name="fal" type="password" placeholder={maskedApiKeys?.fal || "Enter new key"} />
                {maskedApiKeys?.fal && <div className="text-xs text-muted-foreground">Current: {maskedApiKeys.fal}</div>}
              </div>
              <div className="flex justify-end">
                <ApiKeysSubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>AI System Prompts</CardTitle>
            <CardDescription>
              Configure the base instructions used by AI models. Changes take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={systemPromptAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt Engineer System Instruction (Creative Mode)</Label>
                <Textarea 
                  id="systemPrompt" 
                  name="systemPrompt"
                  defaultValue={systemPromptData?.prompts?.engineer || ''}
                  placeholder="Enter the system instruction for the AI prompt engineer..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  Current source: <span className="font-mono">{systemPromptData?.sources?.engineer || 'none'}</span>.
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="studioPromptTemplate">Studio Mode Prompt Template</Label>
                  <StudioPromptTester currentTemplate={studioPrompt} />
                </div>
                <Textarea 
                  id="studioPromptTemplate" 
                  name="studioPromptTemplate"
                  value={studioPrompt}
                  onChange={(e) => setStudioPrompt(e.target.value)}
                  placeholder="Enter the prompt template for Studio Mode..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  This prompt is used for consistent product shots. Available placeholders: <code className="bg-muted px-1 py-0.5 rounded">{'{fitDescription}'}</code> (slim fit, etc) and <code className="bg-muted px-1 py-0.5 rounded">{'{clothingItem}'}</code> (AI detected description).
                </div>
              </div>

              <div className="flex justify-end">
                <SystemPromptSubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
