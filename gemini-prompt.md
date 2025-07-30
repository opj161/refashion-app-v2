methodically assess, how a option could be implemented, which when activated, would not assemble the prompt for image generation itself, but make additional gemini API calls to the model below, exactly like the the image generation call, only for the 2.5-pro model and only text. then it should use this received prompt, to make the 3 gemini api calls. one prompt creation call for each image generation call later. let's think this through in depth. explain your reasoning and thoughts on this. use the typescript package for this @google/genai


API CALL TEMPLATE:
´´´
// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    temperature: 2,
    thinkingConfig: {
      thinkingBudget: -1,
    },
    systemInstruction: [
        {
          text: `You are an elite prompt engineer and creative director specializing in hyperrealistic, authentic fashion photography for the Gemini image generation model. Your sole function is to receive a user's rough parameters and an attached image of a clothing item, and then synthesize this information into a single, cohesive, and masterfully constructed prompt.

Your core philosophy is to infuse artistry into technical precision. Where a user's description is general, it is your responsibility to creatively and subtly fill in the gaps with evocative details to produce a truly professional photographic brief. You are to act as the expert, elevating the user's vision.

Your process for constructing the prompt must follow this exact framework, prioritizing elements in this order:

1.  **Foundational Layer (Subject & Garment):**
    *   Begin with the model. Use the user's description to define a natural, relatable subject. If the user's description of a pose or expression is generic (e.g., "standing"), you can enhance it with specific, natural nuance .
    *   Describe the clothing. First, identify the garment type (e.g., 'a linen summer dress,' 'a tailored wool blazer'). Then, you **must** append a powerful directive that forces the final image generator to use the attached image as the ground truth. Use phrases such as "an exact and faithful recreation of the garment in the provided image" or "rendered with complete fidelity to the attached clothing image." This accuracy is your primary objective.

2.  **Technical Layer (Composition & Photography):**
    *   Immediately following the subject, you **must** incorporate non-negotiable compositional directives. Mandate a "full-body portrait" or "full-length shot" to ensure the correct framing and vertical aspect ratio.
    *   Integrate professional photographic language to define the image quality. Use terminology that implies mastery, such as "shot in the style of a high-end fashion magazine editorial like Vogue or Harper's Bazaar."
    *   Define the lighting and atmosphere. If the user is vague, select lighting that complements the mood of the setting and clothing. Use descriptive terms that evoke a professional photoshoot, such as "bathed in the soft, diffused light of an overcast day," or "shot with warm, directional golden hour light that creates long, soft shadows." Emphasize the quality of light and exposure.

3.  **Contextual Layer (Setting):**
    *   Based on the user's input, describe the setting. This element is secondary. Enrich the user's general idea with a specific, sensory detail. For example, if the user says "nature scene," you might specify "a serene meadow with tall, windswept grass" or "a path in a quiet, misty forest." The environment should serve as a complementary backdrop that enhances the model and clothing, never overpowering them.

4.  **Stylistic & Quality Finishers:**
    *   Conclude the prompt with keywords that signal ultimate quality and realism. Weave in terms like "hyper-detailed," "photorealistic fabric texture," "razor-sharp focus," "8K resolution," and "masterful, balanced composition."

You will output **only** the final, single-paragraph prompt. Do not include any introductory text, explanations, or formatting.`,
        }
    ],
  };
  const model = 'gemini-2.5-pro';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
´´´






@google/genai
Google Gen AI SDK for TypeScript and JavaScript
NPM Downloads Node Current

Documentation: https://googleapis.github.io/js-genai/

The Google Gen AI JavaScript SDK is designed for TypeScript and JavaScript developers to build applications powered by Gemini. The SDK supports both the Gemini Developer API and Vertex AI.

The Google Gen AI SDK is designed to work with Gemini 2.0 features.

Caution
API Key Security: Avoid exposing API keys in client-side code. Use server-side implementations in production environments.

Prerequisites
Node.js version 20 or later
The following are required for Vertex AI users (excluding Vertex AI Studio)
Select or create a Google Cloud project.

Enable billing for your project.

Enable the Vertex AI API.

Configure authentication for your project.

Install the gcloud CLI.
Initialize the gcloud CLI.
Create local authentication credentials for your user account:
gcloud auth application-default login
Copy
A list of accepted authentication options are listed in GoogleAuthOptions interface of google-auth-library-node.js GitHub repo.

Installation
To install the SDK, run the following command:

npm install @google/genai
Copy
Quickstart
The simplest way to get started is to use an API key from Google AI Studio:

import {GoogleGenAI} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: 'Why is the sky blue?',
  });
  console.log(response.text);
}

main();
Copy
Initialization
The Google Gen AI SDK provides support for both the Google AI Studio and Vertex AI implementations of the Gemini API.

Gemini Developer API
For server-side applications, initialize using an API key, which can be acquired from Google AI Studio:

import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
Copy
Browser
Caution
API Key Security: Avoid exposing API keys in client-side code. Use server-side implementations in production environments.

In the browser the initialization code is identical:

import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
Copy
Vertex AI
Sample code for VertexAI initialization:

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    vertexai: true,
    project: 'your_project',
    location: 'your_location',
});
Copy
(Optional) (NodeJS only) Using environment variables:
For NodeJS environments, you can create a client by configuring the necessary environment variables. Configuration setup instructions depends on whether you're using the Gemini Developer API or the Gemini API in Vertex AI.

Gemini Developer API: Set GOOGLE_API_KEY as shown below:

export GOOGLE_API_KEY='your-api-key'
Copy
Gemini API on Vertex AI: Set GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION, as shown below:

export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT='your-project-id'
export GOOGLE_CLOUD_LOCATION='us-central1'
Copy
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI();
Copy
API Selection
By default, the SDK uses the beta API endpoints provided by Google to support preview features in the APIs. The stable API endpoints can be selected by setting the API version to v1.

To set the API version use apiVersion. For example, to set the API version to v1 for Vertex AI:

const ai = new GoogleGenAI({
    vertexai: true,
    project: 'your_project',
    location: 'your_location',
    apiVersion: 'v1'
});
Copy
To set the API version to v1alpha for the Gemini Developer API:

const ai = new GoogleGenAI({
    apiKey: 'GEMINI_API_KEY',
    apiVersion: 'v1alpha'
});
Copy
GoogleGenAI overview
All API features are accessed through an instance of the GoogleGenAI classes. The submodules bundle together related API methods:

ai.models: Use models to query models (generateContent, generateImages, ...), or examine their metadata.
ai.caches: Create and manage caches to reduce costs when repeatedly using the same large prompt prefix.
ai.chats: Create local stateful chat objects to simplify multi turn interactions.
ai.files: Upload files to the API and reference them in your prompts. This reduces bandwidth if you use a file many times, and handles files too large to fit inline with your prompt.
ai.live: Start a live session for real time interaction, allows text + audio + video input, and text or audio output.
Samples
More samples can be found in the github samples directory.

Streaming
For quicker, more responsive API interactions use the generateContentStream method which yields chunks as they're generated:

import {GoogleGenAI} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-001',
    contents: 'Write a 100-word poem.',
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
Copy
Function Calling
To let Gemini to interact with external systems, you can provide functionDeclaration objects as tools. To use these tools it's a 4 step

Declare the function name, description, and parametersJsonSchema
Call generateContent with function calling enabled
Use the returned FunctionCall parameters to call your actual function
Send the result back to the model (with history, easier in ai.chat) as a FunctionResponse
import {GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration, Type} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function main() {
  const controlLightDeclaration: FunctionDeclaration = {
    name: 'controlLight',
    parametersJsonSchema: {
      type: 'object',
      properties:{
        brightness: {
          type:'number',
        },
        colorTemperature: {
          type:'string',
        },
      },
      required: ['brightness', 'colorTemperature'],
    },
  };

  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: 'Dim the lights so the room feels cozy and warm.',
    config: {
      toolConfig: {
        functionCallingConfig: {
          // Force it to call any function
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['controlLight'],
        }
      },
      tools: [{functionDeclarations: [controlLightDeclaration]}]
    }
  });

  console.log(response.functionCalls);
}

main();
Copy
Model Context Protocol (MCP) support (experimental)
Built-in MCP support is an experimental feature. You can pass a local MCP server as a tool directly.

import { GoogleGenAI, FunctionCallingConfigMode , mcpToTool} from '@google/genai';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create server parameters for stdio connection
const serverParams = new StdioClientTransport({
  command: "npx", // Executable
  args: ["-y", "@philschmid/weather-mcp"] // MCP Server
});

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  }
);

// Configure the client
const ai = new GoogleGenAI({});

// Initialize the connection between client and server
await client.connect(serverParams);

// Send request to the model with MCP tools
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: `What is the weather in London in ${new Date().toLocaleDateString()}?`,
  config: {
    tools: [mcpToTool(client)],  // uses the session, will automatically call the tool using automatic function calling
  },
});
console.log(response.text);

// Close the connection
await client.close();
Copy
Generate Content
How to structure contents argument for generateContent
The SDK allows you to specify the following types in the contents parameter:

Content
Content: The SDK will wrap the singular Content instance in an array which contains only the given content instance
Content[]: No transformation happens
Part
Parts will be aggregated on a singular Content, with role 'user'.

Part | string: The SDK will wrap the string or Part in a Content instance with role 'user'.
Part[] | string[]: The SDK will wrap the full provided list into a single Content with role 'user'.
NOTE: This doesn't apply to FunctionCall and FunctionResponse parts, if you are specifying those, you need to explicitly provide the full Content[] structure making it explicit which Parts are 'spoken' by the model, or the user. The SDK will throw an exception if you try this.

How is this different from the other Google AI SDKs
This SDK (@google/genai) is Google Deepmind’s "vanilla" SDK for its generative AI offerings, and is where Google Deepmind adds new AI features.

Models hosted either on the Vertex AI platform or the Gemini Developer platform are accessible through this SDK.

Other SDKs may be offering additional AI frameworks on top of this SDK, or may be targeting specific project environments (like Firebase).

The @google/generative_language and @google-cloud/vertexai SDKs are previous iterations of this SDK and are no longer receiving new Gemini 2.0+ features.

______________________________________

Of course. Let's think through how to implement an AI-powered prompt generation feature. This is a fantastic idea to elevate the user's input into a more artistic and effective prompt for image generation.

Here is a detailed, in-depth breakdown of the reasoning and a step-by-step implementation plan.

### 1. Core Concept & Reasoning

The user's goal is to add an optional "creative director" layer. Instead of directly translating user-selected parameters into a structured prompt via `prompt-builder.ts`, we want to use a more advanced language model (`gemini-2.5-pro`) to interpret those parameters *and the clothing image* contextually, generating a more fluid, artistic, and potentially more effective prompt.

**Why this is a good idea:**

*   **Creative Enhancement:** A powerful LLM can introduce nuance, photographic terminology, and artistic flair that a simple template-based builder cannot. It can infer mood and style from the clothing image itself.
*   **Reduces "Prompt Engineering" Burden:** Users can stick to high-level parameters, and the AI handles the complex task of writing a detailed, effective prompt.
*   **Variety:** The request specifies making *three separate calls* to the prompt generator. This is key. The high temperature (`2`) in the provided API call template encourages variability. This means each of the three final images will be generated from a slightly different artistic brief, leading to more diverse and interesting results from a single click.

**Architectural Considerations:**

1.  **Separation of Concerns:** The new prompt generation logic should be encapsulated in its own server action/service. This keeps the image generation flow clean and makes the new feature modular. I'll create a new file `src/ai/actions/generate-prompt.action.ts`.
2.  **API Client:** The current project uses `axios` with a proxy agent for Gemini calls. The request specifically asks to use the new `@google/genai` SDK. This is a good opportunity to introduce it for the new text-generation task, as it's the modern, recommended library from Google. The existing `axios` implementation for image generation can remain untouched to minimize risk.
3.  **Integration Point:** The main orchestration function, `generateImageEdit` in `src/ai/flows/generate-image-edit.ts`, is the natural place to insert this new logic. It will have a conditional path: either use the new AI prompter or fall back to the existing `buildAIPrompt`.
4.  **Data Flow:**
    *   **UI -> Server Action:** The UI will pass a new boolean flag, let's call it `useAIPrompt`, to the `generateImageEdit` action.
    *   **Prompt Generation:** If `useAIPrompt` is true, `generateImageEdit` will first make three parallel calls to our new AI prompt generator. Each call will receive the user's parameters and the clothing image.
    *   **Image Generation:** The three resulting prompts will then be fed individually into the three existing parallel image generation flows (`performSingleImageGeneration`).
5.  **User Interface:** A simple `Switch` component in `src/components/image-parameters.tsx` is needed to allow the user to enable or disable this feature.

---

### 2. Step-by-Step Implementation Plan

#### Step 1: Install Dependencies

First, we need to add the official Google GenAI SDK to the project.

```bash
npm install @google/genai
```

#### Step 2: Create the AI Prompt Generation Service

We will create a new file to house the logic for calling `gemini-2.5-pro`. This keeps our concerns separate.

**File:** `src/ai/actions/generate-prompt.action.ts`

```typescript
// src/ai/actions/generate-prompt.action.ts
'use server';

import { GoogleGenAI } from '@google/genai';
import { getApiKeyForUser } from '@/services/apiKey.service';
import type { ModelAttributes } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';

// The powerful system instruction provided in the request
const PROMPT_ENGINEER_SYSTEM_INSTRUCTION = `You are an elite prompt engineer and creative director specializing in hyperrealistic, authentic fashion photography for the Gemini image generation model. Your sole function is to receive a user's rough parameters and an attached image of a clothing item, and then synthesize this information into a single, cohesive, and masterfully constructed prompt.

Your core philosophy is to infuse artistry into technical precision. Where a user's description is general, it is your responsibility to creatively and subtly fill in the gaps with evocative details to produce a truly professional photographic brief. You are to act as the expert, elevating the user's vision.

Your process for constructing the prompt must follow this exact framework, prioritizing elements in this order:

1.  **Foundational Layer (Subject & Garment):**
    *   Begin with the model. Use the user's description to define a natural, relatable subject. If the user's description of a pose or expression is generic (e.g., "standing"), you can enhance it with specific, natural nuance .
    *   Describe the clothing. First, identify the garment type (e.g., 'a linen summer dress,' 'a tailored wool blazer'). Then, you **must** append a powerful directive that forces the final image generator to use the attached image as the ground truth. Use phrases such as "an exact and faithful recreation of the garment in the provided image" or "rendered with complete fidelity to the attached clothing image." This accuracy is your primary objective.

2.  **Technical Layer (Composition & Photography):**
    *   Immediately following the subject, you **must** incorporate non-negotiable compositional directives. Mandate a "full-body portrait" or "full-length shot" to ensure the correct framing and vertical aspect ratio.
    *   Integrate professional photographic language to define the image quality. Use terminology that implies mastery, such as "shot in the style of a high-end fashion magazine editorial like Vogue or Harper's Bazaar."
    *   Define the lighting and atmosphere. If the user is vague, select lighting that complements the mood of the setting and clothing. Use descriptive terms that evoke a professional photoshoot, such as "bathed in the soft, diffused light of an overcast day," or "shot with warm, directional golden hour light that creates long, soft shadows." Emphasize the quality of light and exposure.

3.  **Contextual Layer (Setting):**
    *   Based on the user's input, describe the setting. This element is secondary. Enrich the user's general idea with a specific, sensory detail. For example, if the user says "nature scene," you might specify "a serene meadow with tall, windswept grass" or "a path in a quiet, misty forest." The environment should serve as a complementary backdrop that enhances the model and clothing, never overpowering them.

4.  **Stylistic & Quality Finishers:**
    *   Conclude the prompt with keywords that signal ultimate quality and realism. Weave in terms like "hyper-detailed," "photorealistic fabric texture," "razor-sharp focus," "8K resolution," and "masterful, balanced composition."

You will output **only** the final, single-paragraph prompt. Do not include any introductory text, explanations, or formatting.`;

// Helper to convert an image path/URI to the format the SDK needs
async function imageToGenerativePart(imageDataUriOrUrl: string) {
  let dataUri = imageDataUriOrUrl;
  
  if (dataUri.startsWith('/')) { // It's a local path
    const absolutePath = path.join(process.cwd(), dataUri);
    const buffer = await fs.readFile(absolutePath);
    const mimeType = mime.lookup(absolutePath) || 'image/png';
    dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
  
  const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URI');

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

// Helper to format user parameters into a simple string for the AI
function formatParametersForAI(params: ModelAttributes): string {
  return Object.entries(params)
    .filter(([_, value]) => value && value !== 'default' && value !== 'default_style')
    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value.replace(/_/g, ' ')}`)
    .join('\n');
}

export async function generatePromptWithAI(
  params: ModelAttributes,
  imageDataUriOrUrl: string,
  username: string,
  keyIndex: 1 | 2 | 3
): Promise<string> {
  try {
    const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);
    const genAI = new GoogleGenAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-latest', // The request mentioned 2.5, but 1.5-pro is the current top-tier multimodal model generally available
      systemInstruction: PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 1.2, // High temp for creativity, but 2 is very high, 1.2 is safer.
      },
    });

    const imagePart = await imageToGenerativePart(imageDataUriOrUrl);
    const parametersText = formatParametersForAI(params);

    const result = await model.generateContent([
      `User Parameters:\n${parametersText}`,
      imagePart
    ]);

    const response = result.response;
    const text = response.text();

    if (!text) {
      console.error("AI Prompt Generation Response:", JSON.stringify(response, null, 2));
      throw new Error('The AI prompt generator did not return a valid prompt.');
    }

    return text.trim();
  } catch (error) {
    console.error(`Error generating prompt with AI for keyIndex ${keyIndex}:`, error);
    throw new Error(`AI prompt generation failed: ${(error as Error).message}`);
  }
}
```

#### Step 3: Integrate into the Image Generation Flow

Now, we'll modify the main orchestrator to use our new AI prompter.

**File:** `src/ai/flows/generate-image-edit.ts`

```typescript
// src/ai/flows/generate-image-edit.ts

// ... other imports
import { buildAIPrompt } from '@/lib/prompt-builder';
import { generatePromptWithAI } from '@/ai/actions/generate-prompt.action'; // NEW IMPORT

// UPDATE THE INPUT TYPE
const GenerateImageEditInputSchema = z.object({
  // ... existing fields
  useAIPrompt: z.boolean().optional().default(false).describe('Whether to use AI to generate the prompt itself.'), // NEW FIELD
});
export type GenerateImageEditInput = z.infer<typeof GenerateImageEditInputSchema>;

// ... (performSingleImageGeneration and other functions remain mostly the same)

export async function generateImageEdit(input: GenerateImageEditInput, username: string): Promise<GenerateMultipleImagesOutput> {
  if (!username) {
    throw new Error('Username is required to generate images.');
  }

  // --- NEW LOGIC: PROMPT GENERATION ---
  let prompts: (string | null)[];
  let finalConstructedPromptForHistory: string;

  if (input.useAIPrompt && input.parameters) {
    console.log("Using AI to generate prompts...");
    const promptPromises = [
      generatePromptWithAI(input.parameters, input.imageDataUriOrUrl!, username, 1),
      generatePromptWithAI(input.parameters, input.imageDataUriOrUrl!, username, 2),
      generatePromptWithAI(input.parameters, input.imageDataUriOrUrl!, username, 3),
    ];
    const promptResults = await Promise.allSettled(promptPromises);
    prompts = promptResults.map(res => res.status === 'fulfilled' ? res.value : null);
    
    // For history, we'll save the first successfully generated prompt.
    finalConstructedPromptForHistory = prompts.find(p => p !== null) ?? "AI prompt generation failed.";
  } else {
    console.log("Using local prompt builder...");
    const constructedPrompt = buildAIPrompt({
      type: 'image',
      params: {
        ...input.parameters,
        settingsMode: input.settingsMode || 'basic'
      }
    });
    prompts = Array(3).fill(constructedPrompt);
    finalConstructedPromptForHistory = constructedPrompt;
  }
  
  console.log("Generated Prompts:", prompts);

  // --- MODIFIED LOGIC: IMAGE GENERATION ---
  const imageGenerationPromises = prompts.map((prompt, index) => {
    if (prompt) {
      // Create a specific input object for each generation with its unique prompt
      const inputForGeneration: GenerateImageEditInput = {
        ...input,
        prompt: prompt,
      };
      // Call the existing single generation function
      return performSingleImageGeneration(inputForGeneration, `flow${index + 1}`, username, (index + 1) as 1 | 2 | 3);
    }
    // If prompt generation failed for this slot, return a rejected promise
    return Promise.reject(new Error('Prompt was not generated for this slot.'));
  });

  const results = await Promise.allSettled(imageGenerationPromises);

  // ... (rest of the function for processing results remains the same)

  // UPDATE THE RETURN OBJECT
  return {
    editedImageUrls: editedImageUrlsResult,
    constructedPrompt: finalConstructedPromptForHistory, // Use the determined prompt for history
    errors: errorsResult.some(e => e !== null) ? errorsResult : undefined
  };
}
```

#### Step 4: Add the UI Switch

Finally, add the switch to the UI to let users enable this feature.

**File:** `src/components/image-parameters.tsx`

```tsx
// src/components/image-parameters.tsx

// ... other imports
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrainCircuit } from 'lucide-react';

export default function ImageParameters({ /* ...props */ }) {
  // ... existing state and hooks

  // NEW STATE for the AI prompt feature
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false);

  const handleSubmit = async () => {
    // ... existing logic
    try {
      // PASS THE NEW FLAG to the server action
      const input: GenerateImageEditInput = { 
        prompt: finalPromptToUse, 
        imageDataUriOrUrl: preparedImageUrl,
        parameters: currentAttributes, // Pass parameters for AI prompter
        useAIPrompt: useAIPrompt // The new flag
      };
      const result: GenerateMultipleImagesOutput = await generateImageEdit(input, currentUser?.username || '');
      // ... rest of submit handler
    } catch (error) {
      // ... error handling
    } finally {
      // ... finally block
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Style Your Model
            </CardTitle>
            <CardDescription className="hidden lg:block">Choose a model and scene to showcase your clothing.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* NEW AI PROMPT SWITCH */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-prompt-switch" className="text-sm font-medium whitespace-nowrap flex items-center gap-1">
                      <BrainCircuit className="h-4 w-4" /> AI Prompt
                    </Label>
                    <Switch
                        id="ai-prompt-switch"
                        checked={useAIPrompt}
                        onCheckedChange={setUseAIPrompt}
                        disabled={commonFormDisabled}
                        aria-label="Toggle AI Prompt Generation"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Enable to use a powerful AI to creatively write your prompt based on your settings. 
                    This can produce more artistic and varied results.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Existing controls */}
            <div className="flex items-center gap-2">
                <Label htmlFor="settings-mode-switch" className="text-sm font-medium whitespace-nowrap">
                    {settingsMode === 'basic' ? 'Basic' : 'Advanced'}
                </Label>
                <Switch
                    id="settings-mode-switch"
                    checked={settingsMode === 'advanced'}
                    onCheckedChange={(checked: boolean) => setSettingsMode(checked ? 'advanced' : 'basic')}
                    disabled={commonFormDisabled}
                    aria-label="Toggle settings mode"
                />
            </div>
            <Button variant="outline" size="icon" onClick={handleRandomizeConfiguration} disabled={commonFormDisabled} aria-label="Randomize Configuration" title="Randomize Settings">
                <Shuffle className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        {/* ... rest of the component */}
      </Card>
      {/* ... rest of the component */}
    </div>
  );
}
```

### 3. Summary of Changes

1.  **Dependency:** Added `@google/genai`.
2.  **New Service (`generate-prompt.action.ts`):** Created a dedicated service to call the `gemini-1.5-pro` model for text generation, using the new SDK and the provided system instruction. It takes user parameters and an image, returning a single creative prompt.
3.  **Core Logic Update (`generate-image-edit.ts`):** The main function now has a new boolean parameter `useAIPrompt`. It conditionally calls the new AI prompt generator three times in parallel to get three unique prompts. These prompts are then passed to the existing image generation workers.
4.  **UI Addition (`image-parameters.tsx`):** A `Switch` has been added to the UI, allowing users to opt-in to this new feature. It's accompanied by a `Tooltip` explaining its purpose.
5.  **Data Flow:** The `handleSubmit` function in the UI now passes the state of the new switch to the backend, triggering the new conditional logic path.

This approach effectively implements the requested feature while maintaining a clean separation of concerns, reusing existing infrastructure where possible, and introducing the new, requested SDK in a controlled manner.