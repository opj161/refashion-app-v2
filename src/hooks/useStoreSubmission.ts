import { useActionState, useEffect, useRef, startTransition } from 'react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Relaxed type definition to avoid strict overload mismatch
type ActionFunction = (prevState: any, formData: FormData) => Promise<any>;

export function useStoreSubmission<T extends { message: string; error?: string; newHistoryId?: string; historyItemId?: string; editedImageUrls?: (string | null)[]; errors?: (string | null)[] }>(
    serverAction: ActionFunction,
    initialState: T
) {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Access Stores
    const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
    const setCurrentResultId = useGenerationSettingsStore(state => state.setCurrentResultId);

    // React 19 Action State
    // We cast initialState to any to satisfy the hook's strict inference
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
            if (genState.studioAspectRatio) formData.append('aspectRatio', genState.studioAspectRatio);
        }

        // 5. Append Video Settings
        Object.entries(genState.videoSettings).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, String(value));
        });

        // 6. Append Flags
        formData.append('useRandomization', String(false)); // Usually disabled on manual submit
        formData.append('useAIPrompt', String(false));
        formData.append('removeBackground', String(genState.backgroundRemovalEnabled));
        formData.append('upscale', String(genState.upscaleEnabled));
        formData.append('enhanceFace', String(genState.faceDetailEnabled));

        // Execute
        startTransition(() => {
            formAction(formData);
        });
    };

    // Handle Side Effects (Toast & URL updates)
    useEffect(() => {
        if (!isPending && state.message) {
            const successCount = state.editedImageUrls?.filter((url: string | null) => url !== null).length ?? 0;
            const hasError = state.error || (state.errors && state.errors.some((e: string | null) => e !== null));

            // Handle both image (newHistoryId) and video (historyItemId) success keys
            const newId = state.newHistoryId || state.historyItemId;

            if ((successCount > 0 || newId) && newId !== prevResultId.current) {
                prevResultId.current = newId;
                incrementGenerationCount();

                if (newId) {
                    setCurrentResultId(newId);

                    // Update URL without refresh
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('jobId', newId);
                    router.replace(`${pathname}?${params.toString()}`);
                }

                toast({
                    title: 'Generation Started',
                    description: state.message,
                    className: "bg-teal-950 border-teal-800 text-teal-100"
                });
            } else if (hasError) {
                if (!newId) {
                    toast({
                        title: 'Generation Failed',
                        description: state.error || 'Please check settings.',
                        variant: 'destructive',
                    });
                }
            }
        }
    }, [state, isPending, toast, incrementGenerationCount, setCurrentResultId, router, pathname, searchParams]);

    return {
        state: state as T, // Cast back to T for consumer
        submit: submitWithStoreData,
        isPending
    };
}
