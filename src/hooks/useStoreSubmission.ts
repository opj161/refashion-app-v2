import { useActionState, useEffect, useRef, startTransition } from 'react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';

// Type definition for the Server Action
type ActionFunction = (prevState: any, formData: FormData) => Promise<any>;

export function useStoreSubmission<T extends { message: string; error?: string; newHistoryId?: string; historyItemId?: string; editedImageUrls?: (string | null)[]; errors?: (string | null)[] }>(
    serverAction: ActionFunction,
    submissionType: 'image' | 'video',
    initialState: T
) {
    const { toast } = useToast();

    // Access Stores
    const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
    const setCurrentResultId = useGenerationSettingsStore(state => state.setCurrentResultId);

    // React 19 Action State
    const [state, formAction, isPending] = useActionState(serverAction, initialState as any);
    const prevResultId = useRef<string | undefined>(undefined);

    // Helper to construct FormData from Stores dynamically
    const submitWithStoreData = () => {
        // Get fresh state
        const genState = useGenerationSettingsStore.getState();
        const imgState = useImageStore.getState();

        // Get active image
        const activeImage = imgState.activeVersionId ? imgState.versions[imgState.activeVersionId] : null;

        const formData = new FormData();

        // 1. Append Image Context
        if (activeImage) {
            formData.append('imageUrl', activeImage.imageUrl);
            // Compatibility for different action signatures
            formData.append('imageDataUriOrUrl', activeImage.imageUrl);
            formData.append('localImagePath', activeImage.imageUrl);
        }

        // NEW: Append Prompt based on type
        if (submissionType === 'image' && genState.generationMode === 'creative') {
            formData.append('manualPrompt', genState.activeImagePrompt);
        } else if (submissionType === 'video') {
            formData.append('prompt', genState.activeVideoPrompt);
        }

        // 2. Append General Settings
        formData.append('generationMode', genState.generationMode);
        formData.append('settingsMode', genState.settingsMode);

        // 3. Append Creative/Studio Attributes
        Object.entries(genState.imageSettings).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });

        // 4. Append Studio Specifics
        if (genState.generationMode === 'studio') {
            formData.append('studioFit', genState.studioFit);
        }

        // FIX 3: Move aspectRatio check OUTSIDE the studio check
        // Nano Banana uses this in both Creative and Studio modes
        if (genState.studioAspectRatio) {
            formData.append('aspectRatio', genState.studioAspectRatio);
        }

        // 5. Append Video Settings
        Object.entries(genState.videoSettings).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, String(value));
        });

        // 6. Append Flags
        // FIX: Only append checkbox fields if true. zfd.checkbox() interprets missing keys as false.
        // Sending "false" string causes Zod validation errors ("Invalid input").
        
        // useRandomization and useAIPrompt are disabled on manual submit
        // so we simply do not append them (defaults to false).
        
        if (genState.backgroundRemovalEnabled) {
            formData.append('removeBackground', 'true');
        }
        
        if (genState.upscaleEnabled) {
            formData.append('upscale', 'true');
        }
        
        if (genState.faceDetailEnabled) {
            formData.append('enhanceFace', 'true');
        }

        // Execute
        startTransition(() => {
            formAction(formData);
        });
    };

    // Handle Side Effects (Toast & Store Updates)
    useEffect(() => {
        if (!isPending && state.message) {
            const successCount = state.editedImageUrls?.filter((url: string | null) => url !== null).length ?? 0;
            const hasError = state.error || (state.errors && state.errors.some((e: string | null) => e !== null));

            // Handle both image (newHistoryId) and video (historyItemId) success keys
            const newId = state.newHistoryId || state.historyItemId;

            if ((successCount > 0 || newId) && newId !== prevResultId.current) {
                prevResultId.current = newId;

                // 1. Notify components to refresh
                incrementGenerationCount();

                // 2. Bridge Pattern: Tell results display what to show
                if (newId) {
                    setCurrentResultId(newId);
                }

                toast({
                    title: 'Generation Started',
                    description: state.message,
                });
            } else if (hasError) {
                // Only show error toast if we didn't get a success ID
                if (!newId) {
                    // FIX 1: Check for state.errors[0] if state.error is missing
                    const errorMessage = state.error || (state.errors && state.errors[0]) || 'Please check settings.';
                    
                    toast({
                        title: 'Generation Failed',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                }
            }
        }
    }, [state, isPending, toast, incrementGenerationCount, setCurrentResultId]);

    return {
        state: state as T,
        submit: submitWithStoreData,
        isPending
    };
}
