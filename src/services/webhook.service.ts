// src/services/webhook.service.ts
interface WebhookPayload {
  status: 'completed' | 'failed';
  generatedImageUrls?: (string | null)[];
  error?: string;
  historyId: string; 
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn('CRITICAL: WEBHOOK_SECRET is not set in environment variables. Webhook calls will be insecure and likely fail.');
}

export async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  if (!WEBHOOK_SECRET) {
    console.error(`Cannot send webhook to ${url}: WEBHOOK_SECRET is not configured.`);
    return;
  }

  const sendRequest = async (attempt: number) => {
    console.log(`[Webhook] Attempt ${attempt}: Sending webhook to: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Refashion-Secret': WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Webhook failed with status ${response.status}: ${responseBody}`);
      }
      
      console.log(`[Webhook] Attempt ${attempt}: Successfully sent webhook to ${url}. Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error(`[Webhook] Attempt ${attempt} failed for ${url}:`, error);
      return false;
    }
  };

  for (let i = 1; i <= 3; i++) {
    const success = await sendRequest(i);
    if (success) {
      return;
    }
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 5000 * i));
    }
  }

  console.error(`[Webhook] Final attempt failed. Giving up on sending webhook to ${url}.`);
}
