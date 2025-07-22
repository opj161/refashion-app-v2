// src/services/webhook.service.ts
interface WebhookPayload {
  status: 'completed' | 'failed';
  generatedImageUrls?: (string | null)[];
  error?: string;
  historyId: string; 
}


function getWebhookSecret(): string {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    // This warning/error will now only happen at runtime.
    console.warn('CRITICAL: WEBHOOK_SECRET is not set in environment variables. Webhook calls will be insecure and likely fail.');
    throw new Error('WEBHOOK_SECRET is not configured.');
  }
  return secret;
}

export async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  const sendRequest = async (attempt: number) => {
    console.log(`[Webhook] Attempt ${attempt}: Sending webhook to: ${url}`);
    try {
      const secret = getWebhookSecret(); // Get the secret just-in-time
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Refashion-Secret': secret,
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
