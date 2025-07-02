# Migration Guide: From Monolithic to Modular Image Preparation

## For Developers Working on This Codebase

### Quick Reference: What Changed

#### Before (Old Pattern)
```tsx
// CreationHub.tsx
const [preparedImageDataUri, setPreparedImageDataUri] = useState<string | null>(null);

<ImagePreparation onImageReady={setPreparedImageDataUri} />
<ImageParameters preparedImageUrl={preparedImageDataUri} />
```

#### After (New Pattern)
```tsx
// CreationHub.tsx - No state management needed
<ImagePreparationContainer onImageReady={setPreparedImageDataUri} />
<ImageParameters /> // Gets image from store directly
```

### How to Use the New Architecture

#### 1. Accessing Image Data
**Old way:**
```tsx
function MyComponent({ preparedImageUrl }: { preparedImageUrl: string | null }) {
  // Use preparedImageUrl
}
```

**New way:**
```tsx
import { useActiveImage } from '@/stores/imageStore';

function MyComponent() {
  const activeImage = useActiveImage();
  const imageUrl = activeImage?.dataUri || null;
  // Use imageUrl
}
```

#### 2. Triggering Image Processing
**Old way:** Logic was mixed inside image-preparation.tsx

**New way:**
```tsx
import { useImageStore } from '@/stores/imageStore';

function MyComponent() {
  const { removeBackground, upscaleImage, isProcessing } = useImageStore();
  
  const handleProcess = async () => {
    try {
      await removeBackground();
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
}
```

#### 3. Adding New Processing Features

To add a new image processing feature (e.g., "Color Correction"):

1. **Add server action to store** (`src/stores/imageStore.ts`):
```tsx
// In the store actions
colorCorrect: async () => {
  const { activeVersionId, versions, original } = get();
  if (!activeVersionId) return;
  
  set({ isProcessing: true, processingStep: 'color' });
  try {
    const result = await colorCorrectAction(versions[activeVersionId].dataUri);
    get().addVersion({
      dataUri: result.savedPath,
      label: 'Color Corrected',
      sourceVersionId: activeVersionId,
    });
  } catch (error) {
    set({ isProcessing: false, processingStep: null });
    throw error;
  }
}
```

2. **Add UI button** (`src/components/ImageProcessingTools.tsx`):
```tsx
<Button onClick={() => useImageStore.getState().colorCorrect()}>
  Color Correct
</Button>
```

That's it! No need to modify any other components.

### Store Selectors Available

```tsx
import { 
  useImageStore, 
  useActiveImage, 
  useImageProcessingState 
} from '@/stores/imageStore';

// Get everything
const store = useImageStore();

// Get just the active image
const activeImage = useActiveImage(); // { id, dataUri, label, etc. }

// Get processing state
const { isProcessing, processingStep } = useImageProcessingState();

// Get specific data
const versions = useImageStore(state => state.versions);
const hasOriginal = useImageStore(state => !!state.original);
```

### Debugging the Store

In browser console:
```javascript
// Quick snapshot
window.imageStoreSnapshot()

// Full store access
window.imageStore.getState()

// Subscribe to changes
window.imageStore.subscribe(console.log)
```

### Testing Components

**Old way:** Had to mock complex props and state

**New way:** Mock the store
```tsx
import { useImageStore } from '@/stores/imageStore';

// Mock the store
jest.mock('@/stores/imageStore');
const mockUseImageStore = useImageStore as jest.MockedFunction<typeof useImageStore>;

// Test component in isolation
mockUseImageStore.mockReturnValue({
  activeImage: { id: 'test', dataUri: 'test-data', label: 'Test' },
  isProcessing: false,
  // ... other needed values
});
```

### Common Patterns

#### 1. Conditional Rendering Based on Image State
```tsx
const activeImage = useActiveImage();
if (!activeImage) return <ImageUploader />;
return <ImageEditor />;
```

#### 2. Processing with Error Handling
```tsx
const { removeBackground } = useImageStore();
const { toast } = useToast();

const handleProcess = async () => {
  try {
    await removeBackground();
    toast({ title: "Success!" });
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
};
```

#### 3. Watching for Processing State
```tsx
const { isProcessing, processingStep } = useImageProcessingState();

return (
  <Button disabled={isProcessing}>
    {isProcessing ? `${processingStep}...` : 'Process'}
  </Button>
);
```

### File Organization

```
src/
├── stores/
│   └── imageStore.ts          # Centralized state management
├── components/
│   ├── ImageUploader.tsx      # File upload only
│   ├── ImageEditorCanvas.tsx  # Cropping only
│   ├── ImageProcessingTools.tsx # Processing buttons only
│   ├── AspectRatioSelector.tsx # Aspect ratio only
│   ├── ImagePreparationContainer.tsx # Orchestrates components
│   └── ImageVersionStack.tsx   # Version history (unchanged)
```

### Performance Tips

1. **Use selectors** to subscribe to only needed data:
```tsx
// ❌ Re-renders on any store change
const store = useImageStore();

// ✅ Re-renders only when activeVersionId changes
const activeVersionId = useImageStore(state => state.activeVersionId);
```

2. **Use actions directly** for fire-and-forget operations:
```tsx
// ❌ Subscribes to store unnecessarily
const { reset } = useImageStore();

// ✅ Direct action call
useImageStore.getState().reset();
```

### Migration Checklist

- [ ] Replace `ImagePreparation` imports with `ImagePreparationContainer`
- [ ] Remove `preparedImageUrl` props from components
- [ ] Add `useActiveImage()` to components that need image data
- [ ] Update tests to mock the store instead of props
- [ ] Update any custom processing logic to use store actions
- [ ] Remove the old `image-preparation.tsx` file when ready

### Need Help?

1. Check the store state in browser console: `window.imageStoreSnapshot()`
2. Use Redux DevTools to monitor state changes
3. Review existing components in `src/components/` for patterns
4. All async actions include error handling - check the store implementation

This new architecture is designed to be intuitive and consistent. Most operations follow the same pattern: call a store action, handle the result.
