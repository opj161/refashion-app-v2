# Introduction

*(Source: `https://docs.fal.ai/model-apis.md`)*

# Introduction to Model APIs

> fal Model APIs provide access to 600+ production-ready generative media models through a single, unified API. The service offers the world's largest collection of open image, video, voice, and audio generation models, all accessible with one line of code.

### Key features:

* **600+ generative media models**: Access to the best open image, video, voice and audio generation models
* **Single API access**: All models accessible through one unified API - no need to manage multiple endpoints
* **Production-ready**: Models optimized for speed and reliability in production environments
* **Instant scaling**: Scale from 1 to thousands of requests without infrastructure management
* **Cost-effective**: Up to 10× cost reduction compared to self-hosted GPU solutions
* **Fast inference**: Fastest inference engine for diffusion models
* **Security & compliance**: Built-in security features with SOC 2 compliance

The Model APIs enable developers to integrate state-of-the-art generative AI capabilities into their applications without the complexity of managing servers or infrastructure, focusing on building great user experiences rather than DevOps.

For additional platform management APIs (model metadata, pricing, usage, analytics), see the [Platform APIs](/platform-apis/for-models) documentation.


---

# Connect to Cursor

*(Source: `https://docs.fal.ai/model-apis/mcp.md`)*

# Connect fal to Cursor

> Access complete fal documentation in your IDE with Model Context Protocol

## Connect fal to Cursor with MCP

The Model Context Protocol (MCP) enables Cursor to access the entire fal documentation and fal.ai website directly within your IDE. This supercharges your development workflow and makes migration seamless by giving you instant access to:

* **Complete documentation** - Browse all fal docs without leaving your IDE
* **API references** - Get real-time information about models, endpoints, and parameters
* **Code examples** - Access working code snippets and best practices instantly
* **Contextual assistance** - AI-powered suggestions based on fal's complete knowledge base

Follow these simple steps to get started:

### Step 1: Open Command Palette

On Cursor, use `Cmd+Shift+P` (`Ctrl+Shift+P` on Windows) to open up the command palette.

### Step 2: Search for MCP Settings

Search for "Open MCP settings".

### Step 3: Add Custom MCP

Select **Add custom MCP**. This will open the `mcp.json` file.

### Step 4: Configure fal Server

In `mcp.json`, add the following configuration:

```json  theme={null}
{
  "mcpServers": {
    "fal": {
      "url": "https://docs.fal.ai/mcp"
    }
  }
}
```

That's it! Save the file and restart Cursor. You now have the complete fal ecosystem at your fingertips.

## What You Can Do With MCP

Once connected, Cursor can:

* **Answer questions** about any fal model, API, or feature using the complete documentation
* **Generate code** with context from fal's entire knowledge base
* **Debug faster** with instant access to error explanations and solutions
* **Migrate seamlessly** from other platforms with contextual guidance
* **Discover features** you didn't know existed through intelligent suggestions

## What is MCP?

Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. By connecting Cursor to fal via MCP, you're giving your AI assistant complete access to fal's documentation and resources, making it an expert in all things fal.

## Need Help?

If you encounter any issues or have questions, please visit our [support page](/model-apis/support) or join our [Discord community](https://discord.gg/fal-ai).


---

# Quickstart

*(Source: `https://docs.fal.ai/model-apis/quickstart.md`)*

# Quickstart

> In this example, we’ll be using one of our most popular model endpoints, [FLUX.1 [dev]](https://fal.ai/models/fal-ai/flux/dev).

Before we proceed, you need to create an [API key](https://fal.ai/dashboard/keys).

This key will be used to authenticate your requests to the fal API.

<CodeGroup>
  ```javascript Javascript icon="js" theme={null}
  npm install --save @fal-ai/client
  ```

  ```python Python icon="python" theme={null}
  pip install fal-client
  ```
</CodeGroup>

<CodeGroup>
  ```javascript Javascript icon="js" theme={null}
  fal.config({
    credentials: "PASTE_YOUR_FAL_KEY_HERE",
  });
  ```

  ```python Python icon="python" theme={null}
  export FAL_KEY="PASTE_YOUR_FAL_KEY_HERE"
  ```
</CodeGroup>

Now you can call our Model API endpoint using the fal [client](/model-apis/model-endpoints):

<CodeGroup>
  ```javascript Javascript icon="js" theme={null}
  import { fal } from "@fal-ai/client";

  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt:
        "Photo of a rhino dressed suit and tie sitting at a table in a bar with a bar stools, award winning photography, Elke vogelsang",
    },
  });
  ```

  ```python Python icon="python" theme={null}
  import fal_client

  handler = fal_client.submit(
    "fal-ai/flux/dev",
    arguments={
        "prompt": "photo of a rhino dressed suit and tie sitting at a table in a bar with a bar stools, award winning photography, Elke vogelsang"
    },
  )

  result = handler.get()
  print(result)
  ```
</CodeGroup>

We have made other popular models such as Flux Realism, Flux Lora Training SDXL Finetunes, Stable Video Diffusion, ControlNets, Whisper and more available as ready-to-use APIs so that you can easily integrate them into your applications.

<CardGroup cols={2}>
  <Card title="fal-ai/flux/schnell" href="https://fal.ai/models/fal-ai/flux/schnell" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=acb6c6d26e96bc2b2d1f091cf53749db" data-og-width="512" width="512" data-og-height="384" height="384" data-path="images/model-apis/image-1.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f849124f383ae7652ed5a8d9617fd864 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4a79536b14a3ca7b6a8811b7ff8285e1 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b81358952508521129a4709c44335c45 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7a38bc1b24cd8710013ea75660cd3fc4 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d432d3bb36e0602084403abe4f666b27 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-1.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=83ba79d3622f9cca5c409e815e89fb0b 2500w">
    `text-to-image`

    FLUX.1 \[schnell] is a 12 billion parameter flow transformer that generates high-quality images from text in 1 to 4 steps, suitable for personal and commercial use.

    `optimized`
  </Card>

  <Card title="fal-ai/ flux-pro/v1.1-ultra" href="https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c83d4264197702aeb7b6cea96de61110" data-og-width="869" width="869" data-og-height="622" height="622" data-path="images/model-apis/image-2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=29864f1d2454096e4c03096b15a4dcde 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=075934e2fb509e2952e491ca0eb0f412 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d2179e2e6a54a80978d4062add89692c 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=94038a9637ad076ed7a158215b1f079e 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=0e98a70cf55bbfc75c88a269a0410b24 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/model-apis/image-2.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3977854bd05d63e6dd4e7db67be8686c 2500w">
    `text-to-image`

    FLUX1.1 \[pro] ultra is the newest version of FLUX1.1 \[pro], maintaining professional-grade image quality while delivering up to 2K resolution with improved photo realism.

    `flux` `2k` `realism`
  </Card>
</CardGroup>

Check out our [Model Playgrounds](https://fal.ai/models) to tinker with these models and let us know on our [Discord](https://discord.gg/fal-ai) if you want to see other ones listed.

Once you find a model that you want to use, you can grab its URL from the “API” tab. The API tab provides some important information about the model including its source code and examples of how you can call it.


---

# Generate Images from Text Tutorial

*(Source: `https://docs.fal.ai/model-apis/guides/generate-images-from-text.md`)*

# Generate Images from Text Tutorial

## How to Generate Images using the fal API

To generate images using the fal API, you need to send a request to the appropriate endpoint with the desired input parameters. The API uses pre-trained models to generate images based on the provided text prompt. This allows you to create images by simply describing what you want in natural language.

Here’s an example of how to generate an image using the fal API from text:

```js  theme={null}
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt: "a face of a cute puppy, in the style of pixar animation",
  },
});
```

## How to select the model to use

fal offers a variety of image generation models. You can select the model that best fits your needs based on the style and quality of the images you want to generate. Here are some of the available models:

* [fal-ai/flux/dev](https://fal.ai/models/fal-ai/flux/dev): FLUX.1 \[dev] is a 12 billion parameter flow transformer that generates high-quality images from text. It is suitable for personal and commercial use.
* [fal-ai/recraft-v3](https://fal.ai/models/fal-ai/recraft-v3): Recraft V3 is a text-to-image model with the ability to generate long texts, vector art, images in brand style, and much more. As of today, it is SOTA in image generation, proven by Hugging Face’s industry-leading Text-to-Image Benchmark by Artificial Analysis.
* [fal-ai/stable-diffusion-v35-large](https://fal.ai/models/fal-ai/stable-diffusion-v35-large): Stable Diffusion 3.5 Large is a Multimodal Diffusion Transformer (MMDiT) text-to-image model that features improved performance in image quality, typography, complex prompt understanding, and resource-efficiency.

To select a model, simply specify the model ID in the subscribe method as shown in the example above. You can find more models and their descriptions in the [Text to Image Models](https://fal.ai/models?categories=text-to-image) page.


---

# Generate Videos from Image Tutorial

*(Source: `https://docs.fal.ai/model-apis/guides/generate-videos-from-image.md`)*

# Generate Videos from Image Tutorial

## How to Generate Videos using the fal API

fal offers a simple and easy-to-use API that allows you to generate videos from your images using pre-trained models. This endpoint is perfect for creating video clips from your images for various use cases such as social media, marketing, and more.

Here is an example of how to generate videos using the fal API:

```js  theme={null}
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
  input: {
    prompt: "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage.",
    image_url: "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
  },
});
```

## How to select the model to use

fal offers a variety of video generation models. You can select the model that best fits your needs based on the style and quality of the images you want to generate. Here are some of the available models:

* [fal-ai/minimax-video](https://fal.ai/models/fal-ai/minimax-video/image-to-video): Generate video clips from your images using MiniMax Video model.
* [fal-ai/luma-dream-machine](https://fal.ai/models/fal-ai/luma-dream-machine/image-to-video): Generate video clips from your images using Luma Dream Machine v1.5
* [fal-ai/kling-video/v1/standard](https://fal.ai/models/fal-ai/kling-video/v1/standard/image-to-video): Generate video clips from your images using Kling 1.0

To select a model, simply specify the model ID in the subscribe method as shown in the example above. You can find more models and their descriptions in the [Image to Video Models](https://fal.ai/models?categories=image-to-video) page.


---

# Convert Speech to Text

*(Source: `https://docs.fal.ai/model-apis/guides/convert-speech-to-text.md`)*

# Convert Speech to Text Tutorial

## How to Convert Speeches using the fal API

To convert speeches to text using the fal API, you need to send a request to the appropriate endpoint with the desired input parameters. The API uses pre-trained models to convert speeches to text based on the provided audio file. This allows you to convert speeches to text by simply providing the audio file.

Here is an example of how to convert speeches to text using the fal API:

```js  theme={null}
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/whisper", {
  input: {
    audio_url: "https://storage.googleapis.com/falserverless/model_tests/whisper/dinner_conversation.mp3"
  },
});
```

## How to select the model to use

fal offers a variety of speech-to-text models. You can select the model that best fits your needs based on the quality and accuracy of the speech-to-text conversion. Here are some of the available models:

* [fal-ai/whisper](https://fal.ai/models/fal-ai/whisper): Whisper is a model for speech transcription and translation.
* [fal-ai/wizper](https://fal.ai/models/fal-ai/wizper): Wizper is Whisper v3 Large — but optimized by our inference wizards. Same WER, double the performance!

To select a model, simply specify the model ID in the subscribe method as shown in the example above. You can find more models and their descriptions in the [Text to Image Models](https://fal.ai/models?categories=text-to-image) page.


---

# Custom Workflow UI

*(Source: `https://docs.fal.ai/model-apis/guides/custom-workflow-ui.md`)*

# Custom Workflow UI Tutorial

## How to create a custom workflow UI

If you want to create your custom workflow and execute it using the fal API, you need to create a json object that describes the workflow. You can use the following template to create your custom workflow. Basically, a workflow definition must have an input node, a fal model node, and an output node. The input node is the request to the fal API. The fal model node is the model that you want to use. You can add as many fal model nodes as you want. The output node is the response from the fal API.

```json  theme={null}
{
  // Input node / Request
  "input": {
    "id": "input",
    "type": "input",
    "depends": [],
    "input": {
      "prompt": ""
    }
  },

  // A fal model node
  "node_1": {
    "id": "node_1",
    "type": "run",
    "depends": ["input"],
    // The app is the model endpoint id
    "app": "fal-ai/flux/dev",
    "input": {
      // The prompt value is coming from the Input node
      "prompt": "$input.prompt"
    }
  },

  // Another fal model node
  "node_2": {
    "id": "node_2",
    "type": "run",
    "depends": ["node_1"],
    // The app is the model endpoint id
    "app": "fal-ai/bria/background/remove",
    "input": {
      // The image_url value is coming from the "node_1" node
      "image_url": "$node_1.images.0.url"
    }
  },

  // Output node / Response
  "output": {
    "id": "output",
    "type": "display",
    "depends": ["node_2"],
    "fields": {
      "image": "$node_2.image"
    }
  }
}
```

## How to find model input and output fields

Every fal model has input and output fields. You can find the input and output fields using the following URL:

```bash  theme={null}
https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=[endpoint_id]
```

For example:

```bash  theme={null}
https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/flux/dev
```

## How to execute a custom workflow

You can execute a custom workflow using `workflows/execute` endpoint.

```js  theme={null}
const stream = await fal.stream(`workflows/execute`, {
    input: {
        // The input to the workflow
        input: {
            prompt: "A beautiful sunset over a calm ocean"
        },
        // The workflow definition
        workflow: {
          "input": {
            "id": "input",
            "type": "input",
            "depends": [],
            "input": {
              "prompt": ""
            }
          },
          "node_1": {
            "id": "node_1",
            "type": "run",
            "depends": ["input"],
            "app": "fal-ai/flux/dev",
            "input": {
              "prompt": "$input.prompt"
            }
          },
          "node_2": {
            "id": "node_2",
            "type": "run",
            "depends": ["node_1"],
            "app": "fal-ai/bria/background/remove",
            "input": {
              "image_url": "$node_1.images.0.url"
            }
          },
          "output": {
            "id": "output",
            "type": "display",
            "depends": ["node_2"],
            "fields": {
              "image": "$node_2.image"
            }
          }
        },
    },
});

stream.on("data", (event) => {
  console.log(event);
});

const result = await stream.done();
```


---

# Use LLMs

*(Source: `https://docs.fal.ai/model-apis/guides/use-llms.md`)*

# Use LLMs Tutorial

> fal provides an easy-to-use API for generating text using Language Models (LLMs). You can use the `fal-ai/any-llm` endpoint to generate text based on a given prompt and model.

Here’s an example of how to use the `fal-ai/any-llm` endpoint to generate text using the `anthropic/claude-3.5-sonnet` model:

```js  theme={null}
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/any-llm", {
  input: {
    model: "anthropic/claude-3.5-sonnet",
    prompt: "What is the meaning of life?"
  },
});
```

## How to select LLM model to use

fal offers a variety of LLM models. You can select the model that best fits your needs based on the style and quality of the text you want to generate. Here are some of the available models:

* `anthropic/claude-3.5-sonnet`: Claude 3.5 Sonnet
* `google/gemini-pro-1.5`: Gemini Pro 1.5
* `meta-llama/llama-3.2-3b-instruct`: Llama 3.2 3B Instruct
* `openai/gpt-4o`: GPT-4o

To select a model, simply specify the model ID in the `model` field as shown in the example above. You can find more LLMs in the [Any LLM](https://fal.ai/models/fal-ai/any-llm) page.


---

# Using fal within an n8n workflow

*(Source: `https://docs.fal.ai/model-apis/guides/n8n.md`)*

# Using fal within an n8n workflow

> This guide will demonstrate, step-by-step, how to use fal within an n8n workflow.

## Prerequisites

* An n8n account ([https://n8n.io/](https://n8n.io/))
* A fal account ([https://fal.ai/dashboard](https://fal.ai/dashboard))
* A fal API key (generated from your account dashboard)

## Workflow Overview

This n8n workflow consists of three main HTTP requests:

<Steps>
  <Step title="Submit Request">
    Send a POST request to initiate content generation
  </Step>

  <Step title="Check Status">
    Poll the status of your request using GET
  </Step>

  <Step title="Retrieve Result">
    Fetch the final generated content
  </Step>
</Steps>

## Step 1: Create Your Workflow

<Steps>
  <Step>
    In n8n, create a new workflow
  </Step>

  <Step>
    Start with a **Manual Trigger** node to initiate the workflow manually
  </Step>
</Steps>

<Frame>
    <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=86505fc90245b94c09161f2a1762d388" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/01.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=0756f3c20b31b58155911d8608554561 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=8089bb3c91804cf214af74486b5ea93f 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=06b5466a9c5535eb6656f10b164fd4ed 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c0f168126f19f333b6f4566bdcc2a22b 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=bc5d31ab988e4bf21b5104436503a4bc 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/01.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=bc49450f220c2f7086870b18f7ce3702 2500w" />
</Frame>

## Step 2: Submit Request (POST)

### Add HTTP Request Node

<Steps>
  <Step>
    Add an **HTTP Request** node after your trigger
  </Step>

  <Step>
    Set the **Method** to `POST`
  </Step>
</Steps>

<Frame>
    <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=cd7de677bed6fd24446726e7fdfd5999" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/02.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=827b8db128b7fd6de5486d8f1f8d93e4 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=1b19b83b4ceb7690dedb98f5aa27b7aa 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c927e915a36bf97569e39b59422b7523 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b75437d5e328274a727a135f17e96752 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=5b945f8296b2f56d47d05382a578e35d 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/02.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2119d07b793fdac6106040f9c1790118 2500w" />
</Frame>

### Configure the URL

<Steps>
  <Step>
    Navigate to [fal.ai](https://fal.ai/dashboard) and select your desired model (e.g., `fal-ai/veo3/fast`)

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3f36e5adf0e0359186dc049e83546101" alt="" data-og-width="2458" width="2458" data-og-height="1912" height="1912" data-path="images/n8n/03.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ee6f10b9cb4ea5aa17f24b0fd025e102 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7b13b69f233c9b572b60b5698c8346d8 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c61b6ceb2aa6d7529d4a15546922f8c5 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=6368233ac0c836a068489e46cef306b2 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=0a53f4a1890b395640f9ba64b0e09005 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/03.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4decc72ccaac4e2e7b116a17c7689c4d 2500w" />
    </Frame>
  </Step>

  <Step>
    Click on the **API** tab, select "HTTP (cURL)" and "Submit a request". Copy and save the URL and data JSON as those will be needed for later.

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c9b0c680a03dd7291a1457743c8ebb62" alt="" data-og-width="2028" width="2028" data-og-height="906" height="906" data-path="images/n8n/04.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=8b0cc90ac1423173c44c0c7dad8cc8af 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=79fac73a65658123239a47ac943b200c 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b245b8fdf7e4ecda70c115e326f1c57f 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=fd3749a6fa4397ff5bae8e4c026e64be 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d329e22a88789eb78594997195b26578 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/04.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=eb3f4967dec35ed10b1e5d145f6f64b8 2500w" />
    </Frame>
  </Step>

  <Step>
    Copy the URL (e.g., `https://queue.fal.run/fal-ai/veo3/fast`) and paste it into the URL field in n8n

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c1d3192e62f6b9d6868d2ae32e4004dd" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/05.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3c62734f33078b0dc1eb4e4b5120ce65 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=fd5055d828a6973d48f5f8afac08c15c 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=1437aafb58d10c8d116602a442358e27 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=11c1e432888301d0eb26d4cbd131b530 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=6228c6e26fab88eb752e54c9f8b4a67a 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/05.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a902e4db2c42f03b4e826d8ed6825604 2500w" />
    </Frame>
  </Step>
</Steps>

### Set Up Authentication

<Steps>
  <Step>
    Navigate to [fal.ai API Keys](https://fal.ai/dashboard/keys), create a new key and copy its value.

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d2104fe703ca052d8123a24e5f2a85df" alt="" data-og-width="2448" width="2448" data-og-height="1420" height="1420" data-path="images/n8n/06.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=072ed9391e6b7a2bd8443f47ff1dca8c 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c805627ab55bc4e36aebba59eba2eb09 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c06b134389d7238174e83910c8e8f97c 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2491e02e96f5d873d2e762a9b878e641 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3f749b045170dd25bb732f9f294f7823 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/06.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=089c474c299c5c54a16e18b0bc922811 2500w" />
    </Frame>
  </Step>

  <Step>
    Back in n8n, in the **Authentication** section, select **Generic Credential Type**
  </Step>

  <Step>
    Choose **Header Auth** from the dropdown
  </Step>

  <Step>
    Click **+ Create new credential**
  </Step>

  <Step>
    Set:

    * **Name**: `Authorization`
    * **Value**: `Key YOUR_FAL_KEY`
  </Step>

  <Step>
    Save the credential and close

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7dc459c9cb98b714d5faa0e7950ae1dc" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/07.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=cb2564b9830f1dd3a90362431bafa719 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=6307fdeef810bd2e2c8aecf1347cce57 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d7f4a0320be6798e2bd186b8551e7a94 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=8319dc0ac48faf5085b20800ea3b47ec 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a1ad65e05d1b93a5562dcbe9b69a04ff 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/07.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=18e184ed851a1fc535538a9f13a103c7 2500w" />
    </Frame>
  </Step>
</Steps>

### Configure Request Body

<Steps>
  <Step>
    Toggle **Send Body** to `ON`
  </Step>

  <Step>
    Set **Body Content Type** to `JSON`
  </Step>

  <Step>
    Choose **Specify Body** as `USING JSON`

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=5fc79b5a0908e101aafa7fd35b5d476f" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/08.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=132918bff45c72f7e0fd332a8b8eb36b 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=762a918fa8e3ddffcb8d640cbc9ac699 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=97460d9b98bd3657c31cdf0143522ab0 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3507ca45e89ea45f7325ac67354edf67 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=e126b31ce8fb3034cf8e6080889c6391 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/08.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c8d0684d0ddb384784645998e341ef86 2500w" />
    </Frame>
  </Step>

  <Step>
    In fal, go again to the model page, select **JSON** from dropdown and copy the payload

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=6e0c82d5d7c580e9aa49ec9e8ea66ada" alt="" data-og-width="2502" width="2502" data-og-height="1646" height="1646" data-path="images/n8n/09.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=9e9436717a579d224cc43c5930134d60 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=97d03901481022ac31b17168e369be83 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f2073a2b459b4aa900852d091565fd37 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=eb3c1123da0c56f5e5bd4c1b1aa270f4 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=374aa20625f025fa871548811946eb37 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/09.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=62139155bb8297f5885e7d285e7e18f1 2500w" />
    </Frame>
  </Step>

  <Step>
    Copy the JSON payload and paste it into n8n's JSON text box

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ad419e143400976fa0a08921b391c968" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/10.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a5f2e37957bb4751f408d5e581dab74b 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=eecc8287c6215e43e56f3b92a9e44c69 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=51b966c9938322c6fa062eb14d71fd18 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=daba9636c3126d62a087bf03cf2edee8 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=98661ee337e10926573e46d07fc23dae 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/10.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=85baa41dd2e1cb5faa239c929f9e5fc2 2500w" />
    </Frame>
  </Step>
</Steps>

### Execute the Node

<Steps>
  <Step>
    Click **Execute Node** to test the request. You should receive a response with a request ID.

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c8cdd5bb3f4083774e498441e820dbd9" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/11.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=1438c4a36d0ea3ea1fc1665a441d3c8f 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f8b8c4db4d7d76990ba426a33293db21 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2054f586e71ea51216b21ef58a5433d0 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c5ca6f18ddeec141cc1fb306272074df 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2afa37e20febc6284e3274b63ed5190c 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/11.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c113187212b668bf4bd92ac5a726bb46 2500w" />
    </Frame>
  </Step>
</Steps>

## Step 3: Check Status (GET)

### Add Second HTTP Request Node

<Steps>
  <Step>
    Click on the first HTTP Request node and add another **HTTP Request** node
  </Step>

  <Step>
    Set the **Method** to `GET`
  </Step>
</Steps>

### Configure Status Check URL

<Steps>
  <Step>
    In fal, go to your model's **API** section and find the **GET** URL for status checking

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d8963881f4ac744d8e40644115f0aeaa" alt="" data-og-width="2032" width="2032" data-og-height="542" height="542" data-path="images/n8n/12.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=143490dc2aa2cb59d2dd9e48d3d2c209 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ebd9a073f14853c7f85131c9e671e581 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=6bd21c85bfe9aa7edc7938ea85dabce5 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=622555e905a6bb8c0f7b7f014e7468b6 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b1d758490f965a0324016116e0f362d2 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/12.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=13a17cb5cee39c10753317fd86981453 2500w" />
    </Frame>
  </Step>

  <Step>
    Copy this URL and paste it into the URL field
  </Step>

  <Step>
    You'll need to replace the request ID from the previous step on this URL, with `{{ $json.request_id }}`

    <Frame>
            <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ded90911ad1c72b9f3dd21e580dfdf63" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/13.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a6651aeb1e6fee81431ea56048692e76 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c84c3619f527d92acae4a59a21d5ebe2 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=84e7978739896711b2dbcb3b3ef81102 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=cbd6305f270192ec4d572285ab097f42 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2de3a9a709acb9da91f3f385fd970ffe 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/13.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f011de50f1d6eabf6d9c450ec412efc0 2500w" />
    </Frame>
  </Step>
</Steps>

### Set Authentication

<Steps>
  <Step>
    Use the same **Header Auth** credential created earlier
  </Step>

  <Step>
    Select your existing **Authorization** credential
  </Step>
</Steps>

### Execute the Node

1. This will check the status of your generation request.

<Frame>
    <img src="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=80f6186759e48b38a2512042c4fa2c79" alt="" data-og-width="2266" width="2266" data-og-height="1646" height="1646" data-path="images/n8n/14.webp" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=d05fce8b098de8089681af9812ec17e1 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b833d6b033b14f0e8edb5a01ca821a83 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c225e3433e8f7f8b24ed02f7be40b1c6 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=628a5fad59d0aff29e720efc6692eb36 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=0bae9c80c3671c0ea8ffb0f35c8e3d2e 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/n8n/14.webp?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=fe84869a0ce3bbc0d2f38d432a84501f 2500w" />
</Frame>

## Step 4: Retrieve Result (GET)

### Add Third HTTP Request Node

1. Add a final **HTTP Request** node
2. Set the **Method** to `GET`

### Configure Result URL

1. Use the result URL provided in the status response by setting the URL to `{{ $json.request_url }}`

### Set Authentication

1. Use the same **Header Auth** credential

### Execute the Node

This will retrieve your final generated content.

## Testing Your Workflow

<Steps>
  <Step>
    Save your workflow
  </Step>

  <Step>
    Click **Execute Workflow** to run the complete process
  </Step>

  <Step>
    Monitor each node to ensure successful execution
  </Step>

  <Step>
    Check the final node output for your generated content
  </Step>
</Steps>

## Best Practices

* **Error Handling**: Add error handling nodes to manage failed requests
* **Delays**: Consider adding **Wait** nodes between status checks to avoid overwhelming the API
* **Conditional Logic**: Use **IF** nodes to check status before proceeding to result retrieval
* **Data Transformation**: Use **Set** nodes to extract and format specific data from responses

## Troubleshooting

* **401 Unauthorized**: Check that your API key is correctly set in the authentication header
* **Request ID Missing**: Ensure the first POST request completed successfully and returned a request ID
* **Status Still Processing**: Add appropriate delays between status checks
* **Invalid JSON**: Verify your JSON payload matches the model's expected format

## Next Steps

Once you have a working workflow, you can:

* Connect it to external triggers (webhooks, schedules, etc.)
* Integrate with other services in your n8n workflow
* Add data processing and transformation steps
* Set up notifications for completed generations


---

# Fastest FLUX in the Planet

*(Source: `https://docs.fal.ai/model-apis/fast-flux.md`)*

# Fastest FLUX Endpoint

> We believe fal has the fastest FLUX endpoint in the planet. If you can find a faster one, we guarantee to beat it within one week. 🤝

<CardGroup>
  <Card title="fal-ai/ flux/schnell" href="https://fal.ai/models/fal-ai/flux/schnell" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=63ca3f10d0a6a8ed0b743648881b95a1" data-og-width="512" width="512" data-og-height="384" height="384" data-path="images/image-7.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=55745d928da1454277b67f5991b8d8de 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=09492c1fa42f1007eb04771651540985 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=5db3ec0e5f94314a4ff604d00d588ed0 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a8d434179f6c82e7a3e0a5d5c460d68b 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7d122a20a95e881c52db50a544548aca 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-7.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4e302d835d0f1f6b13d7541bacd6d4ad 2500w">
    `text-to-image`

    FLUX.1 \[schnell] is a 12 billion parameter flow transformer that generates high-quality images from text in 1 to 4 steps, suitable for personal and commercial use.

    `optimized`
  </Card>

  <Card title="fal-ai/ flux/dev" href="https://fal.ai/models/fal-ai/flux/dev" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=77817a3db0b964ce72ac78f06b891404" data-og-width="512" width="512" data-og-height="384" height="384" data-path="images/image-8.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=9628b5346769eacc886dea59453d5cff 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=787f0b714b4a871e99b77b1e500be24e 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=21131caef7e458705c7f6f2d08a9e3ad 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=3174a94c02afbc6e75155e9ca1045749 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b1aaba5b36d8ee3616123f4fb6eb7a9e 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-8.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=8ae68e42140fbc137d84b0c5bb3b8c45 2500w">
    `text-to-image`

    FLUX.1 \[dev] is a 12 billion parameter flow transformer that generates high-quality images from text. It is suitable for personal and commercial use.

    `flux`
  </Card>
</CardGroup>

Here is a quick guide on how to use this model from an API in less than 1 minute.

Before we proceed, you need to create an [API key](https://fal.ai/dashboard/keys).

This key secret will be used to authenticate your requests to the fal API.

```js  theme={null}
fal.config({
  credentials: "PASTE_YOUR_FAL_KEY_HERE",
});
```

Now you can call our Model API endpoint using the [fal js client](/model-apis/model-endpoints):

```js  theme={null}
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt:
      "photo of a rhino dressed suit and tie sitting at a table in a bar with a bar stools, award winning photography, Elke vogelsang",
  },
});
```

<Note>
  **Note:**

  <h4>Image Uploads Should Not Waste GPU Cycles</h4>

  <p>
    We upload the output image in a background thread so we don't charge any GPU
    time for time spent on the GPU that is not directly inference.
  </p>
</Note>


---

# Models Endpoints Introduction

*(Source: `https://docs.fal.ai/model-apis/model-endpoints.md`)*

# Model Endpoints API | fal.ai Reference

> Model endpoints are the entry point to interact with the fal API. They are exposed through simple HTTP APIs that can be called from any programming language.

In the next sections you will learn how to call these endpoints in 3 ways:

* `https://queue.fal.run` exposes our [Queue](/model-apis/model-endpoints/queue), the recommended way to interact with the fal API
* `https://fal.run` allows [synchronous execution](/model-apis/model-endpoints/synchronous-requests) of models
* `wss://ws.fal.run` allows submitting requests via a [WebSocket connection](/model-apis/model-endpoints/websockets)

We also offer [clients](/model-apis/clients) for some of the popular programming languages used by our community.

<Warning>
  **There is no api.fal.ai domain**

  Note that the fal API does not use the `api.fal.ai` domain. Please refer to the 3 options above.
</Warning>


---

# Queue

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/queue.md`)*

# Queue API | fal.ai Reference

> For requests that take longer than several seconds, as it is usually the case with AI models, we provide a queue system.

It offers granular control in dealing with surges in traffic, allows you to cancel requests and monitor the current position within the queue, and removes the need to keep long running connections open.

### Queue endpoints

The queue functionality is exposed via standardized per-model paths under `https://queue.fal.run`.

| Endpoint                                                                   | Method | Description                                          |
| :------------------------------------------------------------------------- | :----- | :--------------------------------------------------- |
| **`https://queue.fal.run/{model_id}`**                                     | POST   | Adds a request to the queue for a top-level path     |
| **`https://queue.fal.run/{model_id}/{subpath}`**                           | POST   | Adds a request to the queue for an optional subpath  |
| **`https://queue.fal.run/{model_id}/requests/{request_id}/status`**        | GET    | Gets the status of a request                         |
| **`https://queue.fal.run/{model_id}/requests/{request_id}/status/stream`** | GET    | Streams the status of a request until it's completed |
| **`https://queue.fal.run/{model_id}/requests/{request_id}`**               | GET    | Gets the response of a request                       |
| **`https://queue.fal.run/{model_id}/requests/{request_id}/cancel`**        | PUT    | Cancels a request that has not started processing    |

Parameters:

* `model_id`: the model ID consists of a namespace and model name separated by a slash, e.g. `fal-ai/fast-sdxl`. Many models expose only a single
  top-level endpoint, so you can directly call them by `model_id`.
* `subpath`: some models expose different capabilities at different sub-paths, e.g. `fal-ai/flux/dev`. The subpath (`/dev` in this case) should be used
  when making the request, but not when getting request status or results
* `request_id` is returned after adding a request to the queue. This is the identifier you use to check the status and get results and logs

### Submit a request

Here is an example of using curl to submit a request which will add it to the queue:

```bash  theme={null}
curl -X POST https://queue.fal.run/fal-ai/fast-sdxl \
  -H "Authorization: Key $FAL_KEY" \
  -d '{"prompt": "a cat"}'
```

Here's an example of a response with the `request_id`:

```json  theme={null}
{
  "request_id": "80e732af-660e-45cd-bd63-580e4f2a94cc",
  "response_url": "https://queue.fal.run/fal-ai/fast-sdxl/requests/80e732af-660e-45cd-bd63-580e4f2a94cc",
  "status_url": "https://queue.fal.run/fal-ai/fast-sdxl/requests/80e732af-660e-45cd-bd63-580e4f2a94cc/status",
  "cancel_url": "https://queue.fal.run/fal-ai/fast-sdxl/requests/80e732af-660e-45cd-bd63-580e4f2a94cc/cancel"
}
```

The payload helps you to keep track of your request with the `request_id`, and provides you with the necessary information to get the status of your request, cancel it or get the response once it's ready, so you don't have to build these endpoints yourself.

### Request status

Once you have the request id you may use this request id to get the status of the request. This endpoint will give you information about your request's status, it's position in the queue or the response itself if the response is ready.

```sh  theme={null}
curl -X GET https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}/status
```

Here's an example of a response with the `IN_QUEUE` status:

```json  theme={null}
{
  "status": "IN_QUEUE",
  "queue_position": 0,
  "response_url": "https://queue.fal.run/fal-ai/fast-sdxl/requests/80e732af-660e-45cd-bd63-580e4f2a94cc"
}
```

#### Status types

Queue `status` can have one of the following types and their respective properties:

* **`IN_QUEUE`**:

  * `queue_position`: The current position of the task in the queue.
  * `response_url`: The URL where the response will be available once the task is processed.

* **`IN_PROGRESS`**:

  * `logs`: An array of logs related to the request. Note that it needs to be enabled, as explained in the next section.
  * `response_url`: The URL where the response will be available.

* **`COMPLETED`**:
  * `logs`: An array of logs related to the request. Note that it needs to be enabled, as explained in the next section.
  * `response_url`: The URL where the response is available.

#### Logs

Logs are disabled by default. In order to enable logs for your request, you need to send the `logs=1` query parameter when getting the status of your request. For example:

```sh  theme={null}
curl -X GET https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}/status?logs=1
```

When enabled, the `logs` attribute in the queue status contains an array of log entries, each represented by the `RequestLog` type. A `RequestLog` object has the following attributes:

* `message`: a string containing the log message.
* `level`: the severity of the log, it can be one of the following:
  * `STDERR` | `STDOUT` | `ERROR` | `INFO` | `WARN` | `DEBUG`
* `source`: indicates the source of the log.
* `timestamp`: a string representing the time when the log was generated.

These logs offer valuable insights into the status and progress of your queued tasks, facilitating effective monitoring and debugging.

#### Streaming status

If you want to keep track of the status of your request in real-time, you can use the streaming endpoint.
The response is `text/event-stream` and each event is a JSON object with the status of the request exactly as the non-stream endpoint.

This endpoint will keep the connection open until the status of the request changes to `COMPLETED`.

It supports the same `logs` query parameter as the status.

```sh  theme={null}
curl -X GET https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}/status/stream
```

Here is an example of a stream of status updates:

```bash  theme={null}
$ curl https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status/stream?logs=1 --header "Authorization: Key $FAL_KEY"

data: {"status": "IN_PROGRESS", "request_id": "3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "response_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "status_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status", "cancel_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/cancel", "logs": [], "metrics": {}}

data: {"status": "IN_PROGRESS", "request_id": "3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "response_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "status_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status", "cancel_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/cancel", "logs": [{"timestamp": "2024-12-20T15:37:17.120314", "message": "INFO:TRYON:Preprocessing images...", "labels": {}}, {"timestamp": "2024-12-20T15:37:17.286519", "message": "INFO:TRYON:Running try-on model...", "labels": {}}], "metrics": {}}

data: {"status": "IN_PROGRESS", "request_id": "3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "response_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "status_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status", "cancel_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/cancel", "logs": [], "metrics": {}}

: ping

data: {"status": "IN_PROGRESS", "request_id": "3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "response_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "status_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status", "cancel_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/cancel", "logs": [], "metrics": {}}

data: {"status": "COMPLETED", "request_id": "3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "response_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf", "status_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/status", "cancel_url": "https://queue.fal.run/fashn/tryon/requests/3e3e5b55-45fb-4e5c-b4d1-05702dffc8bf/cancel", "logs": [{"timestamp": "2024-12-20T15:37:32.161184", "message": "INFO:TRYON:Finished running try-on model.", "labels": {}}], "metrics": {"inference_time": 17.795265674591064}}
```

### Cancelling a request

If your request has not started processing (status is `IN_QUEUE`), you may attempt to cancel it.

```sh  theme={null}
curl -X PUT https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}/cancel
```

If the request has not already started processing, you will get a `202 Accepted` response with the following body:

```json  theme={null}
{
  "status": "CANCELLATION_REQUESTED"
}
```

Note that a request may still be executed after getting this response if it was very late in the queue process.

If the request is already processed, you will get a `400 Bad Request` response with this body:

```json  theme={null}
{
  "status": "ALREADY_COMPLETED"
}
```

### Getting the response

Once you get the `COMPLETED` status, the `response` will be available along with its `logs`.

```sh  theme={null}
curl -X GET https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}
```

Here's an example of a response with the `COMPLETED` status:

```json  theme={null}
{
  "status": "COMPLETED",
  "logs": [
    {
      "message": "2020-05-04 14:00:00.000000",
      "level": "INFO",
      "source": "stdout",
      "timestamp": "2020-05-04T14:00:00.000000Z"
    }
  ],
  "response": {
    "message": "Hello World!"
  }
}
```

<Note>
  **A simple queue recipe**

  Submit your request and let our client handle the status tracking for you. The next section details how the fal client simplifies building apps with fal functions.
</Note>

### Using webhook callbacks

Instead of polling for the request status, you can have fal call a webhook when a request is finished. Please refer to the [Webhooks page](/model-apis/model-endpoints/webhooks).


---

# Webhooks

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/webhooks.md`)*

# Webhooks API | fal.ai Reference

> Webhooks work in tandem with the queue system explained above, it is another way to interact with our queue. By providing us a webhook endpoint you get notified when the request is done as opposed to polling it.

Here is how this works in practice, it is very similar to submitting something to the queue but we require you to pass an extra `fal_webhook` query parameter.

To utilize webhooks, your requests should be directed to the `queue.fal.run` endpoint, instead of the standard `fal.run`. This distinction is crucial for enabling webhook functionality, as it ensures your request is handled by the queue system designed to support asynchronous operations and notifications.

```bash  theme={null}
curl --request POST \
  --url 'https://queue.fal.run/fal-ai/flux/dev?fal_webhook=https://url.to.your.app/api/fal/webhook' \
  --header "Authorization: Key $FAL_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
  "prompt": "Photo of a cute dog"
}'
```

The request will be queued and you will get a response with the `request_id` and `gateway_request_id`:

```json  theme={null}
{
  "request_id": "024ca5b1-45d3-4afd-883e-ad3abe2a1c4d",
  "gateway_request_id": "024ca5b1-45d3-4afd-883e-ad3abe2a1c4d"
}
```

These two will be mostly the same, but if the request failed and was retried, `gateway_request_id` will have the value of the last tried request, while
`request_id` will be the value used in the queue API.

Once the request is done processing in the queue, a `POST` request is made to the webhook URL, passing the request info and the resulting `payload`. The `status` indicates whether the request was successful or not.

<Note>
  **When to use it?**

  Webhooks are particularly useful for requests that can take a while to process and/or the result is not needed immediately. For example, if you are training a model, which is a process than can take several minutes or even hours, webhooks could be the perfect tool for the job.
</Note>

### Successful result

The following is an example of a successful request:

```json highlight={4} theme={null}
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "gateway_request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "OK",
  "payload": {
    "images": [
      {
        "url": "https://url.to/image.png",
        "content_type": "image/png",
        "file_name": "image.png",
        "file_size": 1824075,
        "width": 1024,
        "height": 1024
      }
    ],
    "seed": 196619188014358660
  }
}
```

### Response errors

When an error happens, the `status` will be `ERROR`. The `error` property will contain a message and the `payload` will provide the error details. For example, if you forget to pass the required `model_name` parameter, you will get the following response:

```json highlight={4,5} theme={null}
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "gateway_request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "ERROR",
  "error": "Invalid status code: 422",
  "payload": {
    "detail": [
      {
        "loc": ["body", "prompt"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
}
```

### Payload errors

For the webhook to include the payload, it must be valid JSON. So if there is an error serializing it, `payload` is set to `null` and a `payload_error` will include details about the error.

```json highlight={5,6} theme={null}
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "gateway_request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "OK",
  "payload": null,
  "payload_error": "Response payload is not JSON serializable. Either return a JSON serializable object or use the queue endpoint to retrieve the response."
}
```

### Retry policy

If the webhook fails to deliver the payload, it will retry 10 times in the span of 2 hours.

### Verifying Your Webhook

To ensure the security and integrity of incoming webhook requests, you must verify that they originate from the expected source. This involves validating a cryptographic signature included in the request using a set of public keys. Below is a step-by-step guide to the verification process, followed by example implementations in Python and JavaScript.

#### Verification Process

<Steps>
  <Step title="Fetch the JSON Web Key Set (JWKS)">
    * Retrieve the public keys from the JWKS endpoint: `https://rest.alpha.fal.ai/.well-known/jwks.json`.
    * The JWKS contains a list of public keys in JSON format, each with an `x` field holding a base64url-encoded ED25519 public key.
    * **Note**: The JWKS is cacheable to reduce network requests. Ensure your implementation caches the keys and refreshes them after the cache duration expires. Do not cache longer than 24 hours since they can change.
  </Step>

  <Step title="Extract Required Headers">
    * Obtain the following headers from the incoming webhook request:
      * `X-Fal-Webhook-Request-Id`: The unique request ID.
      * `X-Fal-Webhook-User-Id`: Your user ID.
      * `X-Fal-Webhook-Timestamp`: The timestamp when the request was generated (in Unix epoch seconds).
      * `X-Fal-Webhook-Signature`: The cryptographic signature in hexadecimal format.
    * If any header is missing, the request is invalid.
  </Step>

  <Step title="Verify the Timestamp">
    * Compare the `X-Fal-Webhook-Timestamp` with the current Unix timestamp.
    * Allow a leeway of ±5 minutes (300 seconds) to account for clock skew and network delays.
    * If the timestamp differs by more than 300 seconds, reject the request to prevent replay attacks.
  </Step>

  <Step title="Construct the Message">
    * Compute the SHA-256 hash of the request body (raw bytes, not JSON-parsed).
    * Concatenate the following in strict order, separated by newline characters (`\n`):
      * `X-Fal-Webhook-Request-Id`
      * `X-Fal-Webhook-User-Id`
      * `X-Fal-Webhook-Timestamp`
      * Hex-encoded SHA-256 hash of the request body
    * Encode the resulting string as UTF-8 bytes to form the message to verify.
  </Step>

  <Step title="Verify the Signature">
    * Decode the `X-Fal-Webhook-Signature` from hexadecimal to bytes.
    * For each public key in the JWKS:
      * Decode the `x` field from base64url to bytes.
      * Use an ED25519 verification function (e.g., from PyNaCl in Python or libsodium in JavaScript) to verify the signature against the constructed message.
    * If any key successfully verifies the signature, the request is valid.
    * If no key verifies the signature, the request is invalid.
  </Step>
</Steps>

#### Example Implementations

Below are simplified functions to verify webhook signatures by passing the header values and request body directly. These examples handle the verification process as described above and include JWKS caching.

<Tabs>
  <Tab title="python" icon="python">
    **Install dependencies**:

    ```bash  theme={null}
    pip install pynacl requests
    ```

    **Verification function**:

    ```python  theme={null}
    import base64
    import hashlib
    import time
    from typing import Optional
    import requests
    from nacl.signing import VerifyKey
    from nacl.exceptions import BadSignatureError
    from nacl.encoding import HexEncoder

    JWKS_URL = "https://rest.alpha.fal.ai/.well-known/jwks.json"
    JWKS_CACHE_DURATION = 24 * 60 * 60  # 24 hours in seconds
    _jwks_cache = None
    _jwks_cache_time = 0

    def fetch_jwks() -> list:
        """Fetch and cache JWKS, refreshing after 24 hours."""
        global _jwks_cache, _jwks_cache_time
        current_time = time.time()
        if _jwks_cache is None or (current_time - _jwks_cache_time) > JWKS_CACHE_DURATION:
            response = requests.get(JWKS_URL, timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json().get("keys", [])
            _jwks_cache_time = current_time
        return _jwks_cache

    def verify_webhook_signature(
        request_id: str,
        user_id: str,
        timestamp: str,
        signature_hex: str,
        body: bytes
    ) -> bool:
        """
        Verify a webhook signature using provided headers and body.

        Args:
            request_id: Value of X-Fal-Webhook-Request-Id header.
            user_id: Value of X-Fal-Webhook-User-Id header.
            timestamp: Value of X-Fal-Webhook-Timestamp header.
            signature_hex: Value of X-Fal-Webhook-Signature header (hex-encoded).
            body: Raw request body as bytes.

        Returns:
            bool: True if the signature is valid, False otherwise.
        """
        # Validate timestamp (within ±5 minutes)
        try:
            timestamp_int = int(timestamp)
            current_time = int(time.time())
            if abs(current_time - timestamp_int) > 300:
                print("Timestamp is too old or in the future.")
                return False
        except ValueError:
            print("Invalid timestamp format.")
            return False

        # Construct the message to verify
        try:
            message_parts = [
                request_id,
                user_id,
                timestamp,
                hashlib.sha256(body).hexdigest()
            ]
            if any(part is None for part in message_parts):
                print("Missing required header value.")
                return False
            message_to_verify = "\n".join(message_parts).encode("utf-8")
        except Exception as e:
            print(f"Error constructing message: {e}")
            return False

        # Decode signature
        try:
            signature_bytes = bytes.fromhex(signature_hex)
        except ValueError:
            print("Invalid signature format (not hexadecimal).")
            return False

        # Fetch public keys
        try:
            public_keys_info = fetch_jwks()
            if not public_keys_info:
                print("No public keys found in JWKS.")
                return False
        except Exception as e:
            print(f"Error fetching JWKS: {e}")
            return False

        # Verify signature with each public key
        for key_info in public_keys_info:
            try:
                public_key_b64url = key_info.get("x")
                if not isinstance(public_key_b64url, str):
                    continue
                public_key_bytes = base64.urlsafe_b64decode(public_key_b64url)
                verify_key = VerifyKey(public_key_bytes.hex(), encoder=HexEncoder)
                verify_key.verify(message_to_verify, signature_bytes)
                return True
            except (BadSignatureError, Exception) as e:
                print(f"Verification failed with a key: {e}")
                continue

        print("Signature verification failed with all keys.")
        return False
    ```
  </Tab>

  <Tab title="javascript" icon="js">
    **Install dependencies**:

    ```bash  theme={null}
    npm install libsodium-wrappers node-fetch
    ```

    **Verification function**:

    ```javascript  theme={null}
    const crypto = require('crypto');
    const sodium = require('libsodium-wrappers');
    const fetch = require('node-fetch');

    const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json';
    const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let jwksCache = null;
    let jwksCacheTime = 0;

    async function fetchJwks() {
        const currentTime = Date.now();
        if (!jwksCache || (currentTime - jwksCacheTime) > JWKS_CACHE_DURATION) {
            const response = await fetch(JWKS_URL, { timeout: 10000 });
            if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
            jwksCache = (await response.json()).keys || [];
            jwksCacheTime = currentTime;
        }
        return jwksCache;
    }

    async function verifyWebhookSignature(requestId, userId, timestamp, signatureHex, body) {
        /*
         * Verify a webhook signature using provided headers and body.
         *
         * @param {string} requestId - Value of x-fal-webhook-request-id header.
         * @param {string} userId - Value of x-fal-webhook-user-id header.
         * @param {string} timestamp - Value of x-fal-webhook-timestamp header.
         * @param {string} signatureHex - Value of x-fal-webhook-signature header (hex-encoded).
         * @param {Buffer} body - Raw request body as a Buffer.
         * @returns {Promise<boolean>} True if the signature is valid, false otherwise.
         */
        await sodium.ready;

        // Validate timestamp (within ±5 minutes)
        try {
            const timestampInt = parseInt(timestamp, 10);
            const currentTime = Math.floor(Date.now() / 1000);
            if (Math.abs(currentTime - timestampInt) > 300) {
                console.error('Timestamp is too old or in the future.');
                return false;
            }
        } catch (e) {
            console.error('Invalid timestamp format:', e);
            return false;
        }

        // Construct the message to verify
        try {
            const messageParts = [
                requestId,
                userId,
                timestamp,
                crypto.createHash('sha256').update(body).digest('hex')
            ];
            if (messageParts.some(part => part == null)) {
                console.error('Missing required header value.');
                return false;
            }
            const messageToVerify = messageParts.join('\n');
            const messageBytes = Buffer.from(messageToVerify, 'utf-8');

            // Decode signature
            let signatureBytes;
            try {
                signatureBytes = Buffer.from(signatureHex, 'hex');
            } catch (e) {
                console.error('Invalid signature format (not hexadecimal).');
                return false;
            }

            // Fetch public keys
            let publicKeysInfo;
            try {
                publicKeysInfo = await fetchJwks();
                if (!publicKeysInfo.length) {
                    console.error('No public keys found in JWKS.');
                    return false;
                }
            } catch (e) {
                console.error('Error fetching JWKS:', e);
                return false;
            }

            // Verify signature with each public key
            for (const keyInfo of publicKeysInfo) {
                try {
                    const publicKeyB64Url = keyInfo.x;
                    if (typeof publicKeyB64Url !== 'string') continue;
                    const publicKeyBytes = Buffer.from(publicKeyB64Url, 'base64url');
                    const isValid = sodium.crypto_sign_verify_detached(signatureBytes, messageBytes, publicKeyBytes);
                    if (isValid) return true;
                } catch (e) {
                    console.error('Verification failed with a key:', e);
                    continue;
                }
            }

            console.error('Signature verification failed with all keys.');
            return false;
        } catch (e) {
            console.error('Error constructing message:', e);
            return false;
        }
    }
    ```
  </Tab>
</Tabs>

#### Usage Notes

* **Caching the JWKS**: The JWKS can be cached for 24 hours to minimize network requests. The example implementations include basic in-memory caching.
* **Timestamp Validation**: The ±5-minute leeway ensures robustness against minor clock differences. Adjust this value if your use case requires stricter or looser validation.
* **Error Handling**: The examples include comprehensive error handling for missing headers, invalid signatures, and network issues. Log errors appropriately for debugging.
* **Framework Integration**: For frameworks like FastAPI (Python) or Express (JavaScript), ensure the raw request body is accessible. For Express, use `express.raw({ type: 'application/json' })` middleware before JSON parsing.


---

# Synchronous Requests

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/synchronous-requests.md`)*

# Synchronous Requests API | fal.ai Reference

> While our [Queue system](/model-apis/model-endpoints/queue) is the more reliable and recommended way to submit requests, we also support synchronous requests via `https://fal.run`.

Synchronous endpoints are beneficial if when you know the request is quick and you are looking for minimal latency. The drawbacks are:

* You need to keep the connection open until receiving the result
* The request cannot be interrupted
* If the connection is interrupted there is not way to obtain the result
* You will be charged for the full request whether or not you were able to receive the result

The endpoint format and parameters are similar to the Queue ones:

| Endpoint                                   | Method | Description                                         |
| :----------------------------------------- | :----- | :-------------------------------------------------- |
| **`https://fal.run/{model_id}`**           | POST   | Adds a request to the queue for a top-level path    |
| **`https://fal.run/{model_id}/{subpath}`** | POST   | Adds a request to the queue for an optional subpath |

Parameters:

* `model_id`: the model ID consists of a namespace and model name separated by a slash, e.g. `fal-ai/fast-sdxl`. Many models expose only a single
  top-level endpoint, so you can directly call them by `model_id`.
* `subpath`: some models expose different capabilities at different sub-paths, e.g. `fal-ai/flux/dev`. The subpath (`/dev` in this case) should be used

### Submit a request

Here is an example of using the curl command to submit a synchronous request:

```bash  theme={null}
curl -X POST https://fal.run/fal-ai/fast-sdxl \
  -H "Authorization: Key $FAL_KEY" \
  -d '{"prompt": "a cat"}'
```

The response will come directly from the model:

```json  theme={null}
{
  "images": [
    {
      "url": "https://v3.fal.media/files/rabbit/YYbm6L3DaXYHDL1_A4OaL.jpeg",
      "width": 1024,
      "height": 1024,
      "content_type": "image/jpeg"
    }
  ],
  "timings": {
    "inference": 2.507048434985336
  },
  "seed": 15860307465884635512,
  "has_nsfw_concepts": [
    false
  ],
  "prompt": "a cat"
}
```


---

# HTTP over WebSockets

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/websockets.md`)*

# HTTP over WebSockets API | fal.ai Reference

> For applications that require real-time interaction or handle streaming, fal offers a WebSocket-based integration. This allows you to establish a persistent connection and stream data back and forth between your client and the fal API using the same format as the HTTP endpoints.

### WebSocket Endpoint

To utilize the WebSocket functionality, use the `wss` protocol with the the `ws.fal.run` domain:

```
wss://ws.fal.run/{model_id}
```

### Communication Protocol

Once connected, the communication follows a specific protocol with JSON messages for control flow and raw data for the actual response stream:

1. **Payload Message:** Send a JSON message containing the payload for your application. This is equivalent to the request body you would send to the HTTP endpoint.

2. **Start Metadata:** Receive a JSON message containing the HTTP response headers from your application. This allows you to understand the type and structure of the incoming response stream.

3. **Response Stream:** Receive the actual response data as a sequence of messages. These can be binary chunks for media content or a JSON object for structured data, depending on the `Content-Type` header.

4. **End Metadata:** Receive a final JSON message indicating the end of the response stream. This signals that the request has been fully processed and the next payload will be processed.

### Example Interaction

Here's an example of a typical interaction with the WebSocket API:

**Client Sends (Payload Message):**

```json  theme={null}
{"prompt": "generate a 10-second audio clip of a cat purring"}
```

**Server Responds (Start Metadata):**

```json  theme={null}
{
  "type": "start",
  "request_id": "5d76da89-5d75-4887-a715-4302bf435614",
  "status": 200,
  "headers": {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Transfer-Encoding": "chunked",
    // ...
  }
}
```

**Server Sends (Response Stream):**

```
<binary audio data chunk 1>
<binary audio data chunk 2>
...
<binary audio data chunk N>
```

**Server Sends (Completion Message):**

```json  theme={null}
{
  "type": "end",
  "request_id": "5d76da89-5d75-4887-a715-4302bf435614",
  "status": 200,
  "time_to_first_byte_seconds": 0.577083
}
```

<Note>
  **Benefits of WebSockets**

  * **Real-time Updates:** Ideal for applications that require immediate feedback, such as interactive AI models or live data visualization.
  * **Efficient Data Transfer:** Enables streaming large data volumes without the overhead of multiple HTTP requests.
  * **Persistent Connection:** Reduces latency and improves performance by maintaining an open connection throughout the interaction.
</Note>

This WebSocket integration provides a powerful mechanism for building dynamic and responsive AI applications on the fal platform. By leveraging the streaming capabilities, you can unlock new possibilities for creative and interactive user experiences.

### Example Program

For instance, should you want to make fast prompts to any LLM, you can use `fal-ai/any-llm`.

```python  theme={null}
import fal.apps

with fal.apps.ws("fal-ai/any-llm") as connection:
    for i in range(3):
        connection.send(
            {
                "model": "google/gemini-flash-1.5",
                "prompt": f"What is the meaning of life? Respond in {i} words.",
            }
        )

    # they should be in order
    for i in range(3):
        import json

        response = json.loads(connection.recv())
        print(response)
```

And running this program would output:

```bash  theme={null}
{'output': '(Silence)\n', 'partial': False, 'error': None}
{'output': 'Growth\n', 'partial': False, 'error': None}
{'output': 'Personal fulfillment.\n', 'partial': False, 'error': None}
```

### Example Program with Stream

The `fal-ai/any-llm/stream` model is a streaming model that can generate text in real-time. Here's an example of how you can use it:

```python  theme={null}
with fal.apps.ws("fal-ai/any-llm/stream") as connection:
    # NOTE: this app responds in 'text/event-stream' format
    # For example:
    #
    #    event: event
    #    data: {"output": "Growth", "partial": true, "error": null}

    for i in range(3):
        connection.send(
            {
                "model": "google/gemini-flash-1.5",
                "prompt": f"What is the meaning of life? Respond in {i+1} words.",
            }
        )

    for i in range(3):
        for bs in connection.stream():
            lines = bs.decode().replace("\r\n", "\n").split("\n")

            event = {}
            for line in lines:
                if not line:
                    continue
                key, value = line.split(":", 1)
                event[key] = value.strip()

            print(event["data"])

        print("----")
```

And running this program would output:

```bash  theme={null}
{"output": "Perspective", "partial": true, "error": null}
{"output": "Perspective.\n", "partial": true, "error": null}
{"output": "Perspective.\n", "partial": true, "error": null}
{"output": "Perspective.\n", "partial": false, "error": null}
----
{"output": "Find", "partial": true, "error": null}
{"output": "Find meaning.\n", "partial": true, "error": null}
{"output": "Find meaning.\n", "partial": true, "error": null}
{"output": "Find meaning.\n", "partial": false, "error": null}
----
{"output": "Be", "partial": true, "error": null}
{"output": "Be, love, grow.\n", "partial": true, "error": null}
{"output": "Be, love, grow.\n", "partial": true, "error": null}
{"output": "Be, love, grow.\n", "partial": false, "error": null}
----
```


---

# Server-side integration

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/server-side.md`)*

# Server-side integration API | fal.ai Reference

> Although the endpoints are designed to be called directly from the client, it is not safe to keep API Keys in client side code. Most use cases require developers to create their own server-side APIs, that call a 3rd party service, fal, and then return the result to the client. It is a straightforward process, but always get in the way of developers and teams trying to focus on their own business, their own idea.

Therefore, we implemented the client libraries to support a proxy mode, which allows you to use the client libraries in the client, while keeping the API Keys in your own server-side code.

## Ready-to-use proxy implementations

We provide ready-to-use proxy implementations for the following languages/frameworks:

* [Node.js with Next.js](/model-apis/integrations/nextjs): a Next.js API route handler that can be used in any Next.js app. It supports both Page and App routers. We use it ourselves in all of our apps in production.
* [Node.js with Express](https://github.com/fal-ai/serverless-js/tree/main/apps/demo-express-app): an Express route handler that can be used in any Express app. You can also implement custom logic and compose together with your own handlers.

That's it for now, but we are looking out for our community needs and will add more implementations in the future. If you have any requests, join our community in our [Discord server](https://discord.gg/fal-ai).

## The proxy formula

In case fal doesn't provide a plug-and-play proxy implementation for your language/framework, you can use the following formula to implement your own proxy:

1. Provide a single endpoint that will ingest all requests from the client (e.g. `/api/fal/proxy` is commonly used as the default route path).
2. The endpoint must support both `GET` and `POST` requests. When an unsupported HTTP method is used, the proxy must return status code `405`, Method Not Allowed.
3. The URL the proxy needs to call is provided by the `x-fal-target-url` header. If the header is missing, the proxy must return status code `400`, Bad Request. In case it doesn't point to a valid URL, or the URL's domain is not `*.fal.ai` or `*.fal.run`, the proxy must return status code `412`, Precondition Failed.
4. The request body, when present, is always in the JSON format - i.e. `content-type` header is `application/json`. Any other type of content must be rejected with status code `415`, Unsupported Media Type.
5. The proxy must add the `authorization` header in the format of `Key <your-api-key>` to the request it sends to the target URL. Your API key should be resolved from the environment variable `FAL_KEY`.
6. The response from the target URL will always be in the JSON format, the proxy must return the same response to the client.
7. The proxy must return the same HTTP status code as the target URL.
8. The proxy must return the same headers as the target URL, except for the `content-length` and `content-encoding` headers, which should be set by the your own server/framework automatically.

<Note>
  **Use the power of LLMs**

  The formula above was written in a way that should be easy to follow, including by LLMs. Try using ChatGPT or Co-pilot with the formula above and your should get a good starting point for your own implementation. Let us know if you try that!
</Note>

## Configure the client

To use the proxy, you need to configure the client to use the proxy endpoint. You can do that by setting the `proxyUrl` option in the client configuration:

```js  theme={null}
import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "/api/fal/proxy",
});
```

## Example implementation

You can find a reference implementation of the proxy formula using TypeScript, which supports both Express and Next.js, in [serverless-js/libs/proxy/src/index.ts](https://github.com/fal-ai/serverless-js/blob/main/libs/proxy/src/index.ts).


---

# Workflows

*(Source: `https://docs.fal.ai/model-apis/model-endpoints/workflows.md`)*

# Workflow endpoints API | fal.ai Reference

> Workflows are a way to chain multiple models together to create a more complex pipeline. This allows you to create a single endpoint that can take an input and pass it through multiple models in sequence. This is useful for creating more complex models that require multiple steps, or for creating a single endpoint that can handle multiple tasks.

## Workflow as an API

Workflow APIs work the same way as other model endpoints, you can simply send a request and get a response back. However, it is common for workflows to contain multiple steps and produce intermediate results, as each step contains their own response that could be relevant in your use-case.

Therefore, workflows benefit from the **streaming** feature, which allows you to get partial results as they are being generated.

## Workflow events

The workflow API will trigger a few events during its execution, these events can be used to monitor the progress of the workflow and get intermediate results. Below are the events that you can expect from a workflow stream:

### The `submit` event

This events is triggered every time a new step has been submitted to execution. It contains the `app_id`, `request_id` and the `node_id`.

```json  theme={null}
{
  "type": "submit",
  "node_id": "stable_diffusion_xl",
  "app_id": "fal-ai/fast-sdxl",
  "request_id": "d778bdf4-0275-47c2-9f23-16c27041cbeb"
}
```

### The `completion` event

This event is triggered upon the completion of a specific step.

```json  theme={null}
{
  "type": "completion",
  "node_id": "stable_diffusion_xl",
  "output": {
    "images": [
      {
        "url": "https://fal.media/result.jpeg",
        "width": 1024,
        "height": 1024,
        "content_type": "image/jpeg"
      }
    ],
    "timings": { "inference": 2.1733 },
    "seed": 6252023,
    "has_nsfw_concepts": [false],
    "prompt": "a cute puppy"
  }
}
```

### The `output` event

The `output` event means that the workflow has completed and the final result is ready.

```json  theme={null}
{
  "type": "output",
  "output": {
    "images": [
      {
        "url": "https://fal.media/result.jpeg",
        "width": 1024,
        "height": 1024,
        "content_type": "image/jpeg"
      }
    ]
  }
}
```

### The `error` event

The `error` event is triggered when an error occurs during the execution of a step. The `error` object contains the `error.status` with the HTTP status code, an error `message` as well as `error.body` with the underlying error serialized.

```json  theme={null}
{
  "type": "error",
  "node_id": "stable_diffusion_xl",
  "message": "Error while fetching the result of the request d778bdf4-0275-47c2-9f23-16c27041cbeb",
  "error": {
    "status": 422,
    "body": {
      "detail": [
        {
          "loc": ["body", "num_images"],
          "msg": "ensure this value is less than or equal to 8",
          "type": "value_error.number.not_le",
          "ctx": { "limit_value": 8 }
        }
      ]
    }
  }
}
```

## Example

A cool and simple example of the power of workflows is `workflows/fal-ai/sdxl-sticker`, which consists of three steps:

<Steps>
  <Step>
    Generates an image using `fal-ai/fast-sdxl`.
  </Step>

  <Step>
    Remove the background of the image using `fal-ai/imageutils/rembg`.
  </Step>

  <Step>
    Converts the image to a sticker using `fal-ai/face-to-sticker`.
  </Step>
</Steps>

What could be a tedious process of running and coordinating three different models is now a single endpoint that you can call with a single request.

<Tabs>
  <Tab title="Javascript" icon="js">
    ```js  theme={null}
    import { fal } from "@fal-ai/client";

    const stream = await fal.stream("workflows/fal-ai/sdxl-sticker", {
    input: {
      prompt: "a face of a cute puppy, in the style of pixar animation",
    },
    });

    for await (const event of stream) {
    console.log("partial", event);
    }

    const result = await stream.done();

    console.log("final result", result);
    ```
  </Tab>

  <Tab title="python" icon="python">
    ```python  theme={null}
    import fal_client

    stream = fal_client.stream(
        "workflows/fal-ai/sdxl-sticker",
        arguments={
            "prompt": "a face of a cute puppy, in the style of pixar animation",
        },
    )
    for event in stream:
        print(event)
    ```
  </Tab>

  <Tab title="python (async)" icon="python">
    ```python  theme={null}
    import asyncio
    import fal_client

    async def main():
        stream = await fal_client.stream_async(
            "workflows/fal-ai/sdxl-sticker",
            arguments={
                "prompt": "a face of a cute puppy, in the style of pixar animation",
            },
        )

        async for event in stream:
            print(event)


    if __name__ == "__main__":
        asyncio.run(main())
    ```
  </Tab>

  <Tab title="Swift" icon="swift">
    <Note>
      **Coming soon**

      The Swift client does not support streaming yet.
    </Note>
  </Tab>
</Tabs>

## Type definitions

Below are the type definition in TypeScript of events that you can expect from a workflow stream:

```ts  theme={null}
type WorkflowBaseEvent = {
  type: "submit" | "completion" | "error" | "output";
  node_id: string;
};

export type WorkflowSubmitEvent = WorkflowBaseEvent & {
  type: "submit";
  app_id: string;
  request_id: string;
};

export type WorkflowCompletionEvent<Output = any> = WorkflowBaseEvent & {
  type: "completion";
  app_id: string;
  output: Output;
};

export type WorkflowDoneEvent<Output = any> = WorkflowBaseEvent & {
  type: "output";
  output: Output;
};

export type WorkflowErrorEvent = WorkflowBaseEvent & {
  type: "error";
  message: string;
  error: any;
};
```


---

# Client Libraries

*(Source: `https://docs.fal.ai/model-apis/client.md`)*

# Client Libraries

## Introduction

fal provides official client libraries for multiple programming languages, offering a seamless interface to interact with our platform.

## Supported Languages

We officially support the following languages:

<CardGroup cols={3}>
  <Card title="JavaScript/TypeScript" icon="js" />

  <Card title="Python" icon="python" />

  <Card title="Swift (iOS)" icon="swift" />

  <Card title="Java" icon="java" />

  <Card title="Kotlin" icon="code" />

  <Card title="Dart (Flutter)" icon="code" />
</CardGroup>

<Note>
  **Don't see your language?**

  We are working on adding support for more languages. Reach out on our [Discord Community](https://discord.gg/fal-ai) and let us know which language you would like to see next.

  In the meantime, you can use the [REST API directly](/model-apis/model-endpoints).
</Note>

## Installation

First, add the client as a dependency in your project:

<CodeGroup>
  ```bash npm theme={null}
  npm install --save @fal-ai/client
  ```

  ```bash yarn theme={null}
  yarn add @fal-ai/client
  ```

  ```bash pnpm theme={null}
  pnpm add @fal-ai/client
  ```

  ```bash bun theme={null}
  bun add @fal-ai/client
  ```

  ```bash pip theme={null}
  pip install fal-client
  ```

  ```bash Flutter theme={null}
  flutter pub add fal_client
  ```

  ```swift Swift Package theme={null}
  .package(url: "https://github.com/fal-ai/fal-swift.git", from: "0.5.6")
  ```

  ```groovy Gradle (Java) theme={null}
  implementation 'ai.fal.client:fal-client:0.7.1'
  ```

  ```xml Maven (Java) theme={null}
  <dependency>
    <groupId>ai.fal.client</groupId>
    <artifactId>fal-client</artifactId>
    <version>0.7.1</version>
  </dependency>
  ```

  ```groovy Gradle (Kotlin) theme={null}
  implementation 'ai.fal.client:fal-client-kotlin:0.7.1'
  ```

  ```xml Maven (Kotlin) theme={null}
  <dependency>
    <groupId>ai.fal.client</groupId>
    <artifactId>fal-client-kotlin</artifactId>
    <version>0.7.1</version>
  </dependency>
  ```
</CodeGroup>

<Note>
  **Java Async Support**

  If your code relies on asynchronous operations via `CompletableFuture` or `Future`, you can use the `ai.fal.client:fal-client-async` artifact instead, which contains the necessary APIs for asynchronous programming.
</Note>

## Features

### 1. Call an endpoint

Endpoints requests are managed by a queue system. This allows fal to provide a reliable and scalable service.

The `subscribe` method allows you to submit a request to the queue and wait for the result.

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt: "a cat",
      seed: 6252023,
      image_size: "landscape_4_3",
      num_images: 4,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log(result.data);
  console.log(result.requestId);
  ```

  ```python Python theme={null}
  import fal_client

  def on_queue_update(update):
      if isinstance(update, fal_client.InProgress):
          for log in update.logs:
             print(log["message"])

  result = fal_client.subscribe(
      "fal-ai/flux/dev",
      arguments={
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      },
      with_logs=True,
      on_queue_update=on_queue_update,
  )

  print(result)
  ```

  ```python Python (async) theme={null}
  import asyncio
  import fal_client

  async def subscribe():
      def on_queue_update(update):
          if isinstance(update, fal_client.InProgress):
              for log in update.logs:
                  print(log["message"])

      result = await fal_client.subscribe_async(
          "fal-ai/flux/dev",
          arguments={
              "prompt": "a cat",
              "seed": 6252023,
              "image_size": "landscape_4_3",
              "num_images": 4
          },
          on_queue_update=on_queue_update,
      )

      print(result)


  if __name__ == "__main__":
      asyncio.run(subscribe())
  ```

  ```swift Swift theme={null}
  import FalClient

  let result = try await fal.subscribe(
      to: "fal-ai/flux/dev",
      input: [
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      ],
      includeLogs: true
  ) { update in
      if case let .inProgress(logs) = update {
          print(logs)
      }
  }
  ```

  ```java Java theme={null}
  import ai.fal.client.*;
  import ai.fal.client.queue.*;

  var fal = FalClient.withEnvCredentials();

  var input = Map.of(
      "prompt", "a cat",
      "seed", 6252023,
      "image_size", "landscape_4_3",
      "num_images", 4
  );
  var result = fal.subscribe("fal-ai/flux/dev",
      SubscribeOptions.<JsonObject>builder()
          .input(input)
          .logs(true)
          .resultType(JsonObject.class)
          .onQueueUpdate(update -> {
              if (update instanceof QueueStatus.InProgress) {
                  System.out.println(((QueueStatus.InProgress) update).getLogs());
              }
          })
          .build()
  );
  ```

  ```kotlin Kotlin theme={null}
  import ai.fal.client.kt

  val fal = createFalClient()

  val input = mapOf<String, Any>(
      "prompt" to "a cat",
      "seed" to 6252023,
      "image_size" to "landscape_4_3",
      "num_images" to 4
  )
  val result = fal.subscribe("fal-ai/flux/dev", input, options = SubscribeOptions(
      logs = true
  )) { update ->
      if (update is QueueStatus.InProgress) {
        println(update.logs)
      }
  }
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final output = await fal.subscribe("fal-ai/flux/dev",
    input: {
      "prompt": "a cat",
      "seed": 6252023,
      "image_size": "landscape_4_3",
      "num_images": 4
    },
    logs: true,
    webhookUrl: "https://optional.webhook.url/for/results",
    onQueueUpdate: (update) { print(update); }
  );
  print(output.requestId);
  print(output.data);
  ```
</CodeGroup>

### 2. Queue Management

You can manage the queue using the following methods:

#### Submit a Request

Submit a request to the queue using the `queue.submit` method.

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const { request_id } = await fal.queue.submit("fal-ai/flux/dev", {
    input: {
      prompt: "a cat",
      seed: 6252023,
      image_size: "landscape_4_3",
      num_images: 4,
    },
    webhookUrl: "https://optional.webhook.url/for/results",
  });
  ```

  ```python Python theme={null}
  import fal_client

  handler = fal_client.submit(
      "fal-ai/flux/dev",
      arguments={
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      },
      webhook_url="https://optional.webhook.url/for/results",
  )

  request_id = handler.request_id
  ```

  ```python Python (async) theme={null}
  import asyncio
  import fal_client

  async def submit():
      handler = await fal_client.submit_async(
          "fal-ai/flux/dev",
          arguments={
              "prompt": "a cat",
              "seed": 6252023,
              "image_size": "landscape_4_3",
              "num_images": 4
          },
          webhook_url="https://optional.webhook.url/for/results",
      )

      request_id = handler.request_id
      print(request_id)
  ```

  ```swift Swift theme={null}
  import FalClient

  let job = try await fal.queue.submit(
      "fal-ai/flux/dev",
      input: [
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      ],
      webhookUrl: "https://optional.webhook.url/for/results"
  )
  ```

  ```java Java theme={null}
  import ai.fal.client.*;
  import ai.fal.client.queue.*;

  var fal = FalClient.withEnvCredentials();

  var input = Map.of(
      "prompt", "a cat",
      "seed", 6252023,
      "image_size", "landscape_4_3",
      "num_images", 4
  );
  var job = fal.queue().submit("fal-ai/flux/dev",
      SubmitOptions.<JsonObject>builder()
          .input(input)
          .webhookUrl("https://optional.webhook.url/for/results")
          .resultType(JsonObject.class)
          .build()
  );
  ```

  ```kotlin Kotlin theme={null}
  import ai.fal.client.kt

  val fal = createFalClient()

  val input = mapOf<String, Any>(
      "prompt" to "a cat",
      "seed" to 6252023,
      "image_size" to "landscape_4_3",
      "num_images" to 4
  )

  val job = fal.queue.submit("fal-ai/flux/dev", input, options = SubmitOptions(
      webhookUrl = "https://optional.webhook.url/for/results"
  ))
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final job = await fal.queue.submit("fal-ai/flux/dev",
    input: {
      "prompt": "a cat",
      "seed": 6252023,
      "image_size": "landscape_4_3",
      "num_images": 4
    },
    webhookUrl: "https://optional.webhook.url/for/results"
  );
  print(job.requestId);
  ```
</CodeGroup>

This is useful when you want to submit a request to the queue and retrieve the result later. You can save the `request_id` and use it to retrieve the result later.

<Note>
  **Webhooks**

  For long-running requests, such as **training jobs**, you can use webhooks to receive the result asynchronously. You can specify the webhook URL when submitting a request.
</Note>

#### Check Request Status

Retrieve the status of a specific request in the queue:

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const status = await fal.queue.status("fal-ai/flux/dev", {
    requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
    logs: true,
  });
  ```

  ```python Python theme={null}
  status = fal_client.status("fal-ai/flux/dev", request_id, with_logs=True)
  ```

  ```python Python (async) theme={null}
  status = await fal_client.status_async("fal-ai/flux/dev", request_id, with_logs=True)
  ```

  ```swift Swift theme={null}
  import FalClient

  let status = try await fal.queue.status(
      "fal-ai/flux/dev",
      of: "764cabcf-b745-4b3e-ae38-1200304cf45b",
      includeLogs: true
  )
  ```

  ```java Java theme={null}
  import ai.fal.client.*;
  import ai.fal.client.queue.*;

  var fal = FalClient.withEnvCredentials();

  var job = fal.queue().status("fal-ai/flux/dev", QueueStatusOptions
      .withRequestId("764cabcf-b745-4b3e-ae38-1200304cf45b"));
  ```

  ```kotlin Kotlin theme={null}
  import ai.fal.client.kt

  val fal = createFalClient()

  val job = fal.queue.status("fal-ai/flux/dev",
      requestId = "764cabcf-b745-4b3e-ae38-1200304cf45b",
      options = StatusOptions(
          logs = true
      )
  )
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final job = await fal.queue.status("fal-ai/flux/dev",
    requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
    logs: true
  );

  print(job.requestId);
  print(job.status);
  ```
</CodeGroup>

#### Retrieve Request Result

Get the result of a specific request from the queue:

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const result = await fal.queue.result("fal-ai/flux/dev", {
    requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  });

  console.log(result.data);
  console.log(result.requestId);
  ```

  ```python Python theme={null}
  result = fal_client.result("fal-ai/flux/dev", request_id)
  ```

  ```python Python (async) theme={null}
  result = await fal_client.result_async("fal-ai/flux/dev", request_id)
  ```

  ```swift Swift theme={null}
  import FalClient

  let result = try await fal.queue.response(
      "fal-ai/flux/dev",
      of: "764cabcf-b745-4b3e-ae38-1200304cf45b"
  )
  ```

  ```java Java theme={null}
  import ai.fal.client.*;
  import ai.fal.client.queue.*;

  var fal = FalClient.withEnvCredentials();

  var result = fal.queue().result("fal-ai/flux/dev", QueueResultOptions
      .withRequestId("764cabcf-b745-4b3e-ae38-1200304cf45b"));
  ```

  ```kotlin Kotlin theme={null}
  import ai.fal.client.kt

  val fal = createFalClient()

  val result = fal.queue.result("fal-ai/flux/dev",
      requestId = "764cabcf-b745-4b3e-ae38-1200304cf45b"
  )
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final output = await fal.queue.result("fal-ai/flux/dev",
    requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
  );

  print(output.requestId);
  print(output.data);
  ```
</CodeGroup>

### 3. File Uploads

Some endpoints require files as input. However, since the endpoints run asynchronously, processed by the queue, you will need to provide URLs to the files instead of the actual file content.

Luckily, the client library provides a way to upload files to the server and get a URL to use in the request.

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
  const url = await fal.storage.upload(file);
  ```

  ```python Python theme={null}
  url = fal_client.upload_file("path/to/file")
  ```

  ```python Python (async) theme={null}
  url = fal_client.upload_file_async("path/to/file")
  ```

  ```swift Swift theme={null}
  import FalClient

  let data = try await Data(contentsOf: URL(fileURLWithPath: "/path/to/file"))
  let url = try await fal.storage.upload(data)
  ```

  ```java Java theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```kotlin Kotlin theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:cross_file/cross_file.dart';
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final file = XFile("path/to/file");
  final url = await fal.storage.upload(file);
  ```
</CodeGroup>

### 4. Streaming

Some endpoints support streaming:

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const stream = await fal.stream("fal-ai/flux/dev", {
    input: {
      prompt: "a cat",
      seed: 6252023,
      image_size: "landscape_4_3",
      num_images: 4,
    },
  });

  for await (const event of stream) {
    console.log(event);
  }

  const result = await stream.done();
  ```

  ```python Python theme={null}
  import fal_client

  def stream():
      stream = fal_client.stream(
          "fal-ai/flux/dev",
          arguments={
              "prompt": "a cat",
              "seed": 6252023,
              "image_size": "landscape_4_3",
              "num_images": 4
          },
      )
      for event in stream:
          print(event)


  if __name__ == "__main__":
      stream()
  ```

  ```python Python (async) theme={null}
  import asyncio
  import fal_client

  async def stream():
      stream = fal_client.stream_async(
          "fal-ai/flux/dev",
          arguments={
              "prompt": "a cat",
              "seed": 6252023,
              "image_size": "landscape_4_3",
              "num_images": 4
          },
      )
      async for event in stream:
          print(event)


  if __name__ == "__main__":
      asyncio.run(stream())
  ```

  ```swift Swift theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```java Java theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```kotlin Kotlin theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```dart Dart (Flutter) theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```
</CodeGroup>

### 5. Realtime Communication

For the endpoints that support real-time inference via WebSockets, you can use the realtime client that abstracts the WebSocket connection, re-connection, serialization, and provides a simple interface to interact with the endpoint:

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const connection = fal.realtime.connect("fal-ai/flux/dev", {
    onResult: (result) => {
      console.log(result);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  connection.send({
    prompt: "a cat",
    seed: 6252023,
    image_size: "landscape_4_3",
    num_images: 4,
  });
  ```

  ```python Python theme={null}
  # Not implemented yet
  # This functionality is not available on this client yet.
  ```

  ```python Python (async) theme={null}
  # Not implemented yet
  # This functionality is not available on this client yet.
  ```

  ```swift Swift theme={null}
  import FalClient

  let connection = try fal.realtime.connect(to: "fal-ai/flux/dev") { result in
      switch result {
      case let .success(data):
          print(data)
      case let .failure(error):
          print(error)
      }
  }

  connection.send([
      "prompt": "a cat",
      "seed": 6252023,
      "image_size": "landscape_4_3",
      "num_images": 4
  ])
  ```

  ```java Java theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```kotlin Kotlin theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```

  ```dart Dart (Flutter) theme={null}
  // Not implemented yet
  // This functionality is not available on this client yet.
  ```
</CodeGroup>

### 6. Run

The endpoints can also be called directly instead of using the queue system.

<Warning>
  **Prefer the queue**

  We **do not recommend** this use most use cases as it will block the client
  until the response is received. Moreover, if the connection is closed before
  the response is received, the request will be lost.
</Warning>

<CodeGroup>
  ```javascript JavaScript/TypeScript theme={null}
  import { fal } from "@fal-ai/client";

  const result = await fal.run("fal-ai/flux/dev", {
    input: {
      prompt: "a cat",
      seed: 6252023,
      image_size: "landscape_4_3",
      num_images: 4,
    },
  });

  console.log(result.data);
  console.log(result.requestId);
  ```

  ```python Python theme={null}
  import fal_client

  result = fal_client.run(
      "fal-ai/flux/dev",
      arguments={
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      },
  )

  print(result)
  ```

  ```python Python (async) theme={null}
  import asyncio
  import fal_client

  async def submit():
      result = await fal_client.run_async(
          "fal-ai/flux/dev",
          arguments={
              "prompt": "a cat",
              "seed": 6252023,
              "image_size": "landscape_4_3",
              "num_images": 4
          },
      )

      print(result)


  if __name__ == "__main__":
      asyncio.run(submit())
  ```

  ```swift Swift theme={null}
  import FalClient

  let result = try await fal.run(
      "fal-ai/flux/dev",
      input: [
          "prompt": "a cat",
          "seed": 6252023,
          "image_size": "landscape_4_3",
          "num_images": 4
      ])
  ```

  ```java Java theme={null}
  import ai.fal.client.*;

  var fal = FalClient.withEnvCredentials();

  var input = Map.of(
      "prompt", "a cat",
      "seed", 6252023,
      "image_size", "landscape_4_3",
      "num_images", 4
  );

  var result = fal.run("fal-ai/flux/dev", RunOptions.withInput(input));
  ```

  ```kotlin Kotlin theme={null}
  import ai.fal.client.kt

  val fal = createFalClient()

  val input = mapOf<String, Any>(
      "prompt" to "a cat",
      "seed" to 6252023,
      "image_size" to "landscape_4_3",
      "num_images" to 4
  )

  val result = fal.run("fal-ai/flux/dev", input)
  ```

  ```dart Dart (Flutter) theme={null}
  import 'package:fal_client/fal_client.dart';

  final fal = FalClient.withCredentials("FAL_KEY");

  final output = await fal.run("fal-ai/flux/dev",
    input: {
      "prompt": "a cat",
      "seed": 6252023,
      "image_size": "landscape_4_3",
      "num_images": 4
    });

  print(output.requestId);
  print(output.data);
  ```
</CodeGroup>

## API References

For a complete list of available methods and their parameters, please refer to the language-specific API Reference documentation:

* [JavaScript/TypeScript API Reference](https://fal-ai.github.io/fal-js/reference)
* [Python API Reference](https://fal-ai.github.io/fal/client)
* [Swift (iOS) API Reference](https://swiftpackageindex.com/fal-ai/fal-swift/documentation/falclient)
* [Java API Reference](https://fal-ai.github.io/fal-java/fal-client/index.html)
* [Kotlin API Reference](https://fal-ai.github.io/fal-java/fal-client-kotlin/fal-client-kotlin/ai.fal.client.kt/index.html)
* [Dart (Flutter) API Reference](https://pub.dev/documentation/fal_client/latest)

## Examples

Check out some of the examples below to see real-world use cases of the client libraries:

* **JavaScript**: See `fal.realtime` in action with SDXL Lightning: [https://github.com/fal-ai/sdxl-lightning-demo-app](https://github.com/fal-ai/sdxl-lightning-demo-app)
* **Dart (Flutter)**: Simple Flutter app using fal image inference: [https://pub.dev/packages/fal\_client/example](https://pub.dev/packages/fal_client/example)

## Migration Guide

### JavaScript: Migrating from `serverless-client` to `client`

As fal no longer uses "serverless" as part of the AI provider branding, we also made sure that's reflected in our libraries. However, that's not the only thing that changed in the new client. There was lot's of improvements that happened thanks to our community feedback.

So, if you were using the `@fal-ai/serverless-client` package, you can upgrade to the new `@fal-ai/client` package by following these steps:

<Steps>
  <Step>
    Remove the `@fal-ai/serverless-client` package from your project:

    ```bash  theme={null}
    npm uninstall @fal-ai/serverless-client
    ```
  </Step>

  <Step>
    Install the new `@fal-ai/client` package:

    ```bash  theme={null}
    npm install --save @fal-ai/client
    ```
  </Step>

  <Step>
    Update your imports:

    ```js  theme={null}
    import * as fal from "@fal-ai/serverless-client"; // [!code --]
    import { fal } from "@fal-ai/client"; // [!code ++]
    ```
  </Step>

  <Step>
    Now APIs return a `Result<Output>` type that contains the `data` which is the API output and the `requestId`. This is a breaking change from the previous version, that allows us to return extra data to the caller without future breaking changes.

    ```js  theme={null}
    const data = fal.subscribe(endpointId, { input }); // [!code --]
    const { data, requestId } = fal.subscribe(endpointId, { input }); // [!code ++]
    ```
  </Step>
</Steps>

<Note>
  **Note**

  The `fal` object is now a named export from the package that represents a singleton instance of the `FalClient` and was added to make it as easy as possible to migrate from the old singleton-only client. However, starting in `1.0.0` you can create multiple instances of the `FalClient` with the `createFalClient` function.
</Note>

## Support

If you encounter any issues or have questions, please:

* Visit the respective GitHub repositories:
  * [JavaScript/TypeScript](https://github.com/fal-ai/fal-js)
  * [Python](https://github.com/fal-ai/fal)
  * [Swift](https://github.com/fal-ai/fal-swift)
  * [Java/Kotlin](https://github.com/fal-ai/fal-java)
  * [Dart (Flutter)](https://github.com/fal-ai/fal-dart)
* Join our [Discord Community](https://discord.gg/fal-ai)


---

# Authentication

*(Source: `https://docs.fal.ai/model-apis/authentication.md`)*

# Authentication Authentication | fal.ai Model APIs Docs

<CardGroup>
  <Card title="GitHub Authentication" href="/model-apis/authentication/github" icon="github" horizontal />

  <Card title="Key-Based Authentication" href="/model-apis/authentication/key-based" icon="key" horizontal />
</CardGroup>


---

# Key-based

*(Source: `https://docs.fal.ai/model-apis/authentication/key-based.md`)*

# Key-Based Authentication Authentication

There are two main reasons to use key-based authentication:

1. When calling [ready-to-use models](https://fal.ai/models)
2. In headless remote environments or CI/CD (where GitHub authentication is not available)

## Generating the keys

Navigate to our dashboard keys page and generate a key from the UI [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)

## Scopes

Scopes provide a way to control the permissions and access level of a given key. By assigning scopes to keys, you can limit the operations that each key can perform. Currently there are only two scopes, `ADMIN` and `API`. If you are just consuming [ready-to-use models](https://fal.ai/models), we recommend that you use the `API` scope.

### API scope

* Grants access to ready-to-use models.

### ADMIN scope

* Grants full access to private models.
* Grants full access to CLI operations.
* Grants access to ready-to-use models.
* Grants access to [Platform APIs](/platform-apis).


---

# GitHub

*(Source: `https://docs.fal.ai/model-apis/authentication/github.md`)*

# GitHub Authentication Authentication

> `fal` uses GitHub authentication by default which means that you need to have a [GitHub account](https://github.com/login) to use it.

## Logging in

[Installing fal](/model-apis/quickstart) Python library lets you use the `fal` CLI, which you can use to authenticate. In your terminal, you can run the following command:

```
fal auth login
```

Follow the instructions on your terminal to confirm your credentials. Once you're done, you should get a success message in your terminal.

<Note>
  **Beta alert!**

  fal sdk is an enterprise feature. Once you run the login command, you will get
  an error that you should reach out to [support@fal.ai](mailto:support@fal.ai). Shoot us an email with how
  you are planning to use fal, and we will make sure to get you access asap.
</Note>

Now you're ready to write your first fal function!

<Note>
  **Note:**

  Your login credentials are persisted on your local machine and cannot be transferred to another machine. If you want to use fal in your CI/CD, you will need to use [key-based credentials](/model-apis/authentication/key-based).
</Note>


---

# Next.js

*(Source: `https://docs.fal.ai/model-apis/integrations/nextjs.md`)*

# Add fal.ai to your Next.js app Integration

## You will learn how to:

<Steps>
  <Step>
    Install the fal.ai libraries
  </Step>

  <Step>
    Add a server proxy to protect your credentials
  </Step>

  <Step>
    Generate an image using SDXL
  </Step>
</Steps>

## Prerequisites

1. Have an existing Next.js app or create a new one using `npx create-next-app`
2. Have a [fal.ai](https://fal.ai) account
3. Have an API Key. You can [create one here](https://fal.ai/dashboard/keys)

## 1. Install the fal.ai libraries

Using your favorite package manager, install both the `@fal-ai/client` and `@fal-ai/server-proxy` libraries.

<CodeGroup>
  ```bash npm icon="npm" theme={null}
  npm install @fal-ai/client @fal-ai/server-proxy
  ```

  ```bash yarn icon="yarn" theme={null}
  yarn add @fal-ai/client @fal-ai/server-proxy
  ```

  ```bash pnpm icon="square-terminal" theme={null}
  pnpm add @fal-ai/client @fal-ai/server-proxy
  ```
</CodeGroup>

## 2. Setup the proxy

The proxy will protect your API Key and prevent it from being exposed to the client. Usually app implementation have to handle that integration themselves, but in order to make the integration as smooth as possible, we provide a drop-in proxy implementation that can be integrated with either the **Page Router** or the **App Router**.

### 2.1. Page Router

If you are using the **Page Router** (i.e. `src/pages/_app.js`), create an API handler in `src/pages/api/fal/proxy.js` (or `.ts` in case of TypeScript), and re-export the built-in proxy handler:

```ts  theme={null}
export { handler as default } from "@fal-ai/server-proxy/nextjs";
```

### 2.2. App Router

If you are using the **App Router** (i.e. `src/app/page.jsx`) create a route handler in `src/app/api/fal/proxy/route.js` (or `.ts` in case of TypeScript), and re-export the route handler:

```ts  theme={null}
import { route } from "@fal-ai/server-proxy/nextjs";

export const { GET, POST } = route;
```

### 2.3. Setup the API Key

Make sure you have your API Key available as an environment variable. You can setup in your `.env.local` file for development and also in your hosting provider for production, such as [Vercel](https://vercel.com/docs/projects/environment-variables).

```sh  theme={null}
FAL_KEY="key_id:key_secret"
```

### 2.4. Custom proxy logic

It's common for applications to execute custom logic before or after the proxy handler. For example, you may want to add a custom header to the request, or log the request and response, or apply some rate limit. The good news is that the proxy implementation is simply a standard Next.js API/route handler function, which means you can compose it with other handlers.

For example, let's assume you want to add some analytics and apply some rate limit to the proxy handler:

```ts  theme={null}
import { route } from "@fal-ai/server-proxy/nextjs";

// Let's add some custom logic to POST requests - i.e. when the request is
// submitted for processing
export const POST = (req) => {
  // Add some analytics
  analytics.track("fal.ai request", {
    targetUrl: req.headers["x-fal-target-url"],
    userId: req.user.id,
  });

  // Apply some rate limit
  if (rateLimiter.shouldLimit(req)) {
    res.status(429).json({ error: "Too many requests" });
  }

  // If everything passed your custom logic, now execute the proxy handler
  return route.POST(req);
};

// For GET requests we will just use the built-in proxy handler
// But you could also add some custom logic here if you need
export const GET = route.GET;
```

Note that the URL that will be forwarded to server is available as a header named `x-fal-target-url`. Also, keep in mind the example above is just an example, `rateLimiter` and `analytics` are just placeholders.

The example above used the app router, but the same logic can be applied to the page router and its `handler` function.

## 3. Configure the client

On your main file (i.e. `src/pages/_app.jsx` or `src/app/page.jsx`), configure the client to use the proxy:

```ts  theme={null}
import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "/api/fal/proxy",
});
```

<Note>
  **Protect your API Key**

  Although the client can be configured with credentials, use that only for rapid prototyping. We recommend you always use the proxy to avoid exposing your API Key in the client before you deploy your web application. See the [server-side guide](/model-apis/model-endpoints/server-side) for more details.
</Note>

## 4. Generate an image

Now that the client is configured, you can generate an image using `fal.subscribe` and pass the model id and the input parameters:

```ts  theme={null}
const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt,
    image_size: "square_hd",
  },
  pollInterval: 5000,
  logs: true,
  onQueueUpdate(update) {
    console.log("queue update", update);
  },
});

const imageUrl = result.images[0].url;
```

See more about Flux Dev used in this example on [fal.ai/models/fal-ai/flux/dev](https://fal.ai/models/fal-ai/flux/dev).

## What's next?

Image generation is just one of the many cool things you can do with fal. Make sure you:

* Check our demo application at [github.com/fal-ai/serverless-js/apps/demo-nextjs-app-router](https://github.com/fal-ai/fal-js/tree/main/apps/demo-nextjs-app-router)
* Check all the available [Model APIs](https://fal.ai/models)
* Learn how to write your own model APIs on [Introduction to serverless functions](/serverless)
* Read more about function endpoints on [private serverless models](/serverless)
* Check the next page to learn how to [deploy your app to Vercel](/model-apis/integrations/vercel)


---

# Vercel

*(Source: `https://docs.fal.ai/model-apis/integrations/vercel.md`)*

# Add fal.ai to your Next.js app Integration

## You will learn how to:

* Connect a Next.js app deployed on Vercel to fal.ai

## Prerequisites

<Steps>
  <Step>
    A [fal.ai](https://fal.ai) account
  </Step>

  <Step>
    A [Vercel account](https://vercel.com)
  </Step>

  <Step>
    A Next.js app. Check the [Next.js guide](/model-apis/integrations/nextjs) if you don't have one yet.
  </Step>

  <Step>
    App deployed on Vercel. Run `npx vercel` in your app directory to deploy it in case you haven't done it yet.
  </Step>
</Steps>

## Vercel official integration

The recommended way to add fal.ai to your app deployed on Vercel is to use the official integration. You can find it in the [Vercel marketplace](https://vercel.com/integrations/fal).

Click on **Add integration** and follow the steps. After you're done, re-deploy your app and you're good to go!

<Frame>
  ![Vercel integration](https://integrations-og-image.vercel.sh/api/og/fal?42673700034a7509d66487f3ed68a2bd)
</Frame>

## Manual setup

You can also manually add fal credentials to your Vercel environment manually.

<Steps>
  <Step>
    Go to your [fal.ai dashboard](https://fal.ai/dashboard/keys), create an **API-scoped** key and copy it. Make sure you create an alias do identify which app is using it.
  </Step>

  <Step>
    Go to your app settings in Vercel and add a new environment variable called `FAL_KEY` with the value of the key you just copied. You can choose other names, but keep in mind that the default convention of fal-provided libraries is `FAL_KEY`.
  </Step>

  <Step>
    Re-deploy your app and you're good to go!
  </Step>
</Steps>


---

# Real-Time Introduction

*(Source: `https://docs.fal.ai/model-apis/real-time.md`)*

# Real-Time Models | fal.ai Real-Time Models

> Real-time AI is here! With the recent introduction of Latent Consistency Models (LCM) and distilled models like Stability's SDXL Turbo and SD Turbo, it is now possible to generate images in under 100ms.

This fast inference capability opens up new possibilities for application types that were previously not feasible, such as real-time creativity tools and using the camera as a real-time model input.

You can find the fastest real time models in fal's [Model Registry](https://fal.ai/models).

<CardGroup>
  <Card title="fal-ai/ fast-lcm-diffusion" href="https://fal.ai/models/fal-ai/fast-lcm-diffusion" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c4ed37d4c5ef36528cfa2b6a79eddcd9" data-og-width="864" width="864" data-og-height="808" height="808" data-path="images/image-6.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4ad5e021a52b785a39abb88690811dba 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=5b305d8913dbcd4b47f120b450c5f09b 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=03fa127494d85d75380fb84d2f2e4cf2 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7a2445ee67e6b11bfa87f71f1ccb9664 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4b884e5fc0a829e31327b8444117fe88 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b6bd89d15211b46d0b436b595b76f71c 2500w">
    `text-to-image`

    Run SDXL at the speed of light

    `real-time` `lcm`
  </Card>

  <Card title="fal-ai/ fast-turbo-diffusion" href="https://fal.ai/models/fal-ai/fast-turbo-diffusion" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a5eb3affecfe0e642fd722ebf728f088" data-og-width="512" width="512" data-og-height="512" height="512" data-path="images/image-5.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=105416d066f434723771549be191af7f 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=1e24fc146798f3fc306431b21d5a92a6 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f9ad70c638da5afa47aa4ce9ca4434b5 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2c9c0c086cfc926028ce336d0617148b 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=399e79862f8d6328dcfd5f7c6d7900da 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ba10528d4d2b6cbe58db0d71c8684112 2500w">
    `text-to-image`

    Run SDXL at the speed of light

    `real-time` `optimized`
  </Card>
</CardGroup>


---

# Real-Time Quickstart

*(Source: `https://docs.fal.ai/model-apis/real-time/quickstart.md`)*

# Real Time Models Quickstart | fal.ai Real-Time Models

> In this example, we'll be using our most popular [optimized ultra fast latent consistency model](https://fal.ai/models/fast-lcm-diffusion-turbo/api).

All our Model Endpoint's support HTTP/REST. Additionally our real-time models support WebSockets. You can use the HTTP/REST endpoint for any real time model but if you are sending back to back requests using websockets gives the best results.

<CardGroup>
  <Card title="fal-ai/ fast-lcm-diffusion" href="https://fal.ai/models/fal-ai/fast-lcm-diffusion" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=c4ed37d4c5ef36528cfa2b6a79eddcd9" data-og-width="864" width="864" data-og-height="808" height="808" data-path="images/image-6.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4ad5e021a52b785a39abb88690811dba 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=5b305d8913dbcd4b47f120b450c5f09b 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=03fa127494d85d75380fb84d2f2e4cf2 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=7a2445ee67e6b11bfa87f71f1ccb9664 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=4b884e5fc0a829e31327b8444117fe88 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-6.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=b6bd89d15211b46d0b436b595b76f71c 2500w">
    `text-to-image`

    Run SDXL at the speed of light

    `real-time` `lcm`
  </Card>

  <Card title="fal-ai/ fast-turbo-diffusion" href="https://fal.ai/models/fal-ai/fast-turbo-diffusion" img="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=a5eb3affecfe0e642fd722ebf728f088" data-og-width="512" width="512" data-og-height="512" height="512" data-path="images/image-5.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=280&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=105416d066f434723771549be191af7f 280w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=560&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=1e24fc146798f3fc306431b21d5a92a6 560w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=840&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=f9ad70c638da5afa47aa4ce9ca4434b5 840w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=1100&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=2c9c0c086cfc926028ce336d0617148b 1100w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=1650&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=399e79862f8d6328dcfd5f7c6d7900da 1650w, https://mintcdn.com/fal-d8505a2e/_1QeqsRe91WUAOCJ/images/image-5.png?w=2500&fit=max&auto=format&n=_1QeqsRe91WUAOCJ&q=85&s=ba10528d4d2b6cbe58db0d71c8684112 2500w">
    `text-to-image`

    Run SDXL at the speed of light

    `real-time` `optimized`
  </Card>
</CardGroup>

Before we proceed, you need to create your [API key](https://fal.ai/dashboard/keys).

```js  theme={null}
import { fal } from "@fal-ai/client";

fal.config({
  credentials: "PASTE_YOUR_FAL_KEY_HERE",
});

const connection = fal.realtime.connect("fal-ai/fast-lcm-diffusion", {
  onResult: (result) => {
    console.log(result);
  },
  onError: (error) => {
    console.error(error);
  },
});

connection.send({
  prompt:
    "an island near sea, with seagulls, moon shining over the sea, light house, boats int he background, fish flying over the sea",
  sync_mode: true,
  image_url:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
});
```

You can read more about the real time clients in our [real time client docs](/model-apis/model-endpoints) section.

<Note>
  **Note:**

  For the fastest inference speed use **512x512** input dimensions for `image_url`.
</Note>

**To get the best performance from this model:**

* Make sure the image is provided as a base64 encoded data url.
* Make sure the image\_url is exactly **512x512**.
* Make sure sync\_mode is true, this will make sure you also get a base64 encoded data url back from our API.

You can also use **768x768** or **1024x1024** as your image dimensions, the inference will be faster for this configuration compared to random dimensions but wont be as fast as **512x512**.

**Video Tutorial:**
*Latent Consistency - Build a Real-Time AI Image App with WebSockets, Next.js, and fal.ai by <a href="https://twitter.com/dabit3">Nader Dabit</a>*

<Frame>
  <iframe width="100%" height="420" src="https://www.youtube.com/embed/freyCo3pcz4?si=OFfGsi0xwJVe__Yt" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen />
</Frame>


---

# Keeping fal API Secrets Safe

*(Source: `https://docs.fal.ai/model-apis/real-time/secrets.md`)*

# Keeping fal API Secrets Safe | fal.ai Real-Time Models

> Real-time models using WebSockets present challenges in ensuring the security of API secrets.

The WebSocket connection is established directly from the browser or native mobile application, making it unsafe to embed API keys and secrets directly into the client. To address this, we have developed additional tools to enable secure authentication with our servers without introducing unnecessary intermediaries between the client and our GPU servers. Instead of using traditional API keys, we recommend utilizing short-lived [JWT](https://jwt.io/) tokens for authentication.

Easiest way to communicate with fal using websockets is through our [javascript](https://github.com/fal-ai/fal-js) and [swift](https://github.com/fal-ai/fal-swift) clients and a [server proxy](/model-apis/model-endpoints/server-side).

<Note>
  **Server Side Proxy**

  Checkout our [Server Side Integration](/model-apis/model-endpoints/server-side#ready-to-use-proxy-implementations) section to learn more about using a ready made proxy with your Node.js or Next.js app or implement your own.
</Note>

When `fal.realtime.connect` is invoked the fal client gets a short lived [JWT](https://jwt.io/) token through a server proxy to authenticate with fal services. This token is refreshed automatically by the client when it is needed.

<CodeGroup>
  ```js Javascript icon="js" theme={null}
  import { fal } from "@fal-ai/client";

  fal.config({
    proxyUrl: "/api/fal/proxy",
  });

  const { send } = fal.realtime.connect("fal-ai/fast-lcm-diffusion", {
    connectionKey: "realtime-demo",
    throttleInterval: 128,
    onResult(result) {
      // display
    },
  });
  ```

  ```swift Swift icon="swift" theme={null}
  import FalClient
  let fal = FalClient.withProxy("http://localhost:3333/api/fal/proxy")

  let connection = try fal.realtime.connect(
      to: OptimizedLatentConsistency,
      connectionKey: "PencilKitDemo",
      throttleInterval: .milliseconds(128)
  ) { (result: Result<LcmResponse, Error>)  in
      if case let .success(data) = result,
          let image = data.images.first {
          let data = try? Data(contentsOf: URL(string: image.url)!)
          DispatchQueue.main.async {
              self.currentImage = data
          }
      }
  }
  ```
</CodeGroup>

Checkout the [FalRealtimeSampleApp (swift)](https://github.com/fal-ai/fal-swift/tree/main/Sources/Samples/FalRealtimeSampleApp) and [realtime demo (js)](https://github.com/fal-ai/fal-js/blob/main/apps/demo-nextjs-app-router/app/realtime/page.tsx) for more details.


---

# Errors

*(Source: `https://docs.fal.ai/model-apis/errors.md`)*

# FAILED TO DOWNLOAD

Could not download content from:
`https://docs.fal.ai/model-apis/platform-apis.md`

---

# FAQ

*(Source: `https://docs.fal.ai/model-apis/faq.md`)*

# FAQ | fal.ai Documentation

<AccordionGroup>
  <Accordion title="When logging-in with GitHub I am asked for a one-time code that I never receive in my email">
    Logging with GitHub means that the one-time code It’s being sent to the primary email in your GitHub account.

    You may have created your GitHub account with an email you no longer monitor, so check [their documentation](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/changing-your-primary-email-address) on how to find out which one it is set as and change it if appropriate.
  </Accordion>

  <Accordion title="What is the retention policy for the files generated by fal.ai?">
    The files generated by fal.ai are guaranteed to be available for at least **7 days**. After that, they may be deleted at any time. We recommend that you download and store on your own storage any files that you want to keep for longer.
  </Accordion>

  <Accordion title="Can I use the generated files for commercial purposes?">
    Each model has its own license. Most of the endpoints available at fal are available for commercial use. Check for the label on each model page:

    * `Commercial use` : Commercial use is allowed. Even when the underlying model is not open-source, if it’s marked with this badge it means that fal has the necessary rights to provide the service for commercial use.
    * `Research only` : This model is available for research purposes only. You can use the API to generate images for research purposes, but you cannot use them for commercial purposes.
  </Accordion>

  <Accordion title="What is the Partner API?">
    * `Partner API` : Partner APIs are hosted by our partners. Therefore, we cannot offer percentage discount on them and cannot guarantee their availability.
  </Accordion>

  <Accordion title="Is there a rate limit?">
    The rate limit for the API is **10 concurrent tasks** per user, across all endpoints. For enterprise customers, we can scale this up, [contact us](/model-apis) if you need more rate limits.

    Note that we reserve the right to prioritize API requests over requests made through our Playground UI.
  </Accordion>

  <Accordion title="Do you charge for failed requests?">
    Failures originated from our side, such as server errors or any HTTP status 5xx, are not charged. However, if the failure is due to an error in the request, such as an invalid input, which can result in HTTP status 422, the request will be charged.
  </Accordion>

  <Accordion title="Do my credits expire?">
    Yes, the credits you purchase expire in 365 days. Free credits or credits from coupons expire in 90 days.
  </Accordion>

  <Accordion title="Can I switch to an invoice-based payment?">
    Yes, we offer invoice-based payments for customers with higher volumes. Please [contact us](/model-apis) with information about your expected load.
  </Accordion>

  <Accordion title="Do I pay for cold starts?">
    No, although cold start for our main endpoints is very rare, you will not be charged for them when they happen.
  </Accordion>

  <Accordion title="Can I deploy my own models?">
    If you want access to deploy a model or app for your private use, please [contact us](/model-apis).
  </Accordion>

  <Accordion title="Do you offer discounts?">
    Yes, we offer discounts for customers with higher volumes. Please [contact us](/model-apis) with information about your expected load.
  </Accordion>
</AccordionGroup>


---

# Support | fal.ai Model APIs Docs

*(Source: `https://docs.fal.ai/model-apis/support.md`)*

# Support | fal.ai Model APIs Docs

> Support documentation for fal.ai AI APIs. Developer guide with examples, best practices, and implementation details.

## Contact Us

If you need assistance, please reach out to us at [support@fal.ai](mailto:support@fal.ai).

## Join Our Community

Join our Discord community for discussions and updates: [Discord](https://discord.gg/DKzw22Vf).

## Quickstart Guide

New to fal.ai? Check out our [Quickstart Guide](/serverless/getting-started/quick-start) to get started quickly.
