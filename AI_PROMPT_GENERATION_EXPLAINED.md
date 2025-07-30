# AI Prompt Generation System - Technical Documentation

## Overview

The AI Prompt Generation feature uses **Gemini 2.5 Pro** as an "elite prompt engineer and creative director" to transform user-selected parameters and clothing images into sophisticated, artistic prompts for image generation. This document explains exactly how the input to the AI prompt optimizer is constructed.

## System Architecture

```
User Parameters + Clothing Image → AI Prompt Optimizer (Gemini 2.5 Pro) → Creative Prompt → Image Generator (Gemini 2.0 Flash)
```

## Input Construction Process

### 1. Parameter Formatting (`formatParametersForAI`)

User-selected parameters are transformed from the UI form into a human-readable format:

#### Source Format (ModelAttributes object)
```typescript
{
  gender: "female",
  bodyType: "athletic_toned",
  ageRange: "young_adult_20s",
  ethnicity: "caucasian_european",
  poseStyle: "natural_relaxed_pose",
  background: "outdoor_nature_elements",
  // ... more parameters
}
```

#### Transformation Rules
1. **Filter Out Defaults**: Remove any parameters with values of `""`, `"default"`, or `"default_style"`
2. **Convert Keys**: Transform camelCase to human-readable format
   - `bodyType` → `body Type`
   - `ageRange` → `age Range`
   - `poseStyle` → `pose Style`
3. **Convert Values**: Replace underscores with spaces
   - `"athletic_toned"` → `"athletic toned"`
   - `"natural_relaxed_pose"` → `"natural relaxed pose"`
   - `"outdoor_nature_elements"` → `"outdoor nature elements"`

#### Final Formatted Output
```
gender: female
body Type: athletic toned
age Range: young adult 20s
ethnicity: caucasian european
pose Style: natural relaxed pose
background: outdoor nature elements
```

### 2. Image Processing (`imageToGenerativePart`)

The clothing image is converted into a format suitable for the AI model:

#### Input Types Supported
- **Data URI**: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`
- **Local Path**: `/uploads/user_uploaded_clothing/filename.png`
- **HTTP(S) URL**: `https://example.com/image.jpg`

#### Processing Steps
1. **Path Resolution**: Local paths are resolved to absolute filesystem paths
2. **File Reading**: Images are read as binary data
3. **MIME Type Detection**: Automatically detected from file extension
4. **Base64 Encoding**: Converted to base64 for API transmission
5. **Inline Data Format**: Structured as `{ inlineData: { mimeType, data } }`

### 3. Complete Message Construction

The final message sent to Gemini 2.5 Pro consists of:

#### System Instruction (Role Definition)
A comprehensive 2,000+ character instruction defining the AI as an "elite prompt engineer and creative director" with specific guidelines for:

- **Professional Identity**: Fashion photography expert specializing in hyperrealistic imagery
- **Core Philosophy**: "Infuse artistry into technical precision"
- **Framework Structure**: 4-layer approach (Subject & Garment, Technical, Contextual, Quality)
- **Output Requirements**: Single paragraph, no explanations, focus on clothing accuracy

#### User Content (Actual Request)
```typescript
{
  role: 'user',
  parts: [
    {
      text: `User Parameters:\n${formattedParameters}`,
    },
    {
      inlineData: {
        mimeType: 'image/png',
        data: 'base64EncodedImageData...'
      }
    }
  ],
}
```

## Example Complete Input

### Formatted Parameters Section
```
User Parameters:
gender: female
body Type: athletic toned
age Range: young adult 20s
ethnicity: caucasian european
pose Style: natural relaxed pose
background: outdoor nature elements
overall Mood: confident energetic
lighting Type: natural sunlight
```

### Image Component
- **MIME Type**: `image/png`
- **Data**: Base64-encoded clothing image
- **Purpose**: Provides visual context for accurate garment representation

## AI Configuration

### Model Settings
- **Model**: `gemini-2.5-pro`
- **Temperature**: `2.0` (Maximum creativity for varied outputs)
- **System Instruction**: Elite prompt engineer persona with detailed framework

### Multi-Key Rotation
- **Key 1**: Used for first prompt generation call
- **Key 2**: Used for second prompt generation call  
- **Key 3**: Used for third prompt generation call
- **Purpose**: Load balancing and rate limit avoidance

## Expected AI Output

The AI transforms the structured input into sophisticated prompts like:

### Example Transformation

**Input**: Basic parameters + dress image
**Output**: 
> "A confident young adult woman with an athletic, toned physique stands in a natural, graceful pose wearing an exact and faithful recreation of the elegant mauve sleeveless wrap dress shown in the provided image, rendered with complete fidelity to the attached clothing image. This full-body portrait captures her in the style of a high-end fashion magazine editorial like Vogue or Harper's Bazaar, bathed in warm, directional natural sunlight that creates beautifully soft shadows and emphasizes the photorealistic fabric texture. She poses against a serene meadow backdrop with tall, windswept grass that complements but never overpowers the dress. The image showcases hyper-detailed craftsmanship, razor-sharp focus, 8K resolution, and masterful, balanced composition."

## Error Handling & Fallbacks

### Prompt Generation Failures
- **Individual Failures**: If one of the three AI calls fails, that slot gets `null`
- **Complete Failures**: If all three fail, system falls back to traditional prompt builder
- **Partial Success**: Mixed success/failure results in hybrid approach

### File Access Issues
- **Missing Images**: Clear error messages about file not found
- **Permission Issues**: Handled with appropriate error logging
- **Format Issues**: Validation of image data URI format

## Performance Considerations

### Parallel Processing
- **3 Simultaneous Calls**: All prompt generations happen in parallel
- **Individual Timeouts**: Each call has independent timeout handling
- **Resource Distribution**: Different API keys prevent bottlenecks

### Optimization Strategies
- **Image Caching**: Base64 conversion happens once, reused for all calls
- **Parameter Formatting**: Done once before parallel execution
- **Error Isolation**: Failure in one call doesn't affect others

## Integration Points

### UI Integration
- **Toggle Switch**: `useAIPrompt` boolean flag
- **Parameter Passing**: Full `ModelAttributes` object sent to backend
- **Image Context**: Current prepared image automatically included

### Database Integration
- **History Storage**: AI-generated prompts saved as `constructedPrompt`
- **Fallback Handling**: Traditional prompts used when AI generation fails
- **User Preferences**: No persistent storage of AI preference (session-only)

## Debugging & Monitoring

### Console Logging
- **Mode Detection**: "Using AI to generate prompts..." vs "Using local prompt builder..."
- **API Key Usage**: Confirmation of which keys are being used
- **Parameter Formatting**: Debug output of formatted parameters
- **Error Details**: Comprehensive error logging with context

### Development Tools
- **Generated Prompts Array**: Visible in console for debugging
- **Individual Failures**: Specific error messages for each failed generation
- **Fallback Triggers**: Clear indication when falling back to traditional method

---

This system transforms simple user selections into sophisticated, creative prompts that leverage professional fashion photography expertise while maintaining technical precision and clothing accuracy.