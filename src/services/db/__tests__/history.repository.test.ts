// Mock server-only to allow testing in standard environment
jest.mock('server-only', () => ({}));

import { rowToHistoryItem } from '../history.repository';
import type { HistoryItem } from '@/lib/types';

describe('rowToHistoryItem', () => {
  it('should map a standard database row to a HistoryItem successfully', () => {
    const row = {
      id: 'test-123',
      username: 'testuser',
      timestamp: 1672531200000,
      constructedPrompt: 'A beautiful test prompt',
      originalClothingUrl: 'https://example.com/clothes.jpg',
      settingsMode: 'advanced',
      attributes: JSON.stringify({ color: 'blue', style: 'casual' }),
      edited_images: JSON.stringify(['https://example.com/edited1.jpg']),
      original_images: JSON.stringify(['https://example.com/orig1.jpg']),
      video_urls: JSON.stringify(['https://example.com/video1.mp4']),
      videoGenerationParams: JSON.stringify({ seed: 42, steps: 20 }),
      status: 'completed',
      error: null,
      webhook_url: 'https://webhook.site/test',
      image_generation_model: 'fal_gemini_2_5',
      generation_mode: 'studio'
    };

    const item: HistoryItem = rowToHistoryItem(row);

    expect(item).toEqual({
      id: 'test-123',
      username: 'testuser',
      timestamp: 1672531200000,
      constructedPrompt: 'A beautiful test prompt',
      originalClothingUrl: 'https://example.com/clothes.jpg',
      settingsMode: 'advanced',
      attributes: { color: 'blue', style: 'casual' },
      editedImageUrls: ['https://example.com/edited1.jpg'],
      originalImageUrls: ['https://example.com/orig1.jpg'],
      generatedVideoUrls: ['https://example.com/video1.mp4'],
      videoGenerationParams: { seed: 42, steps: 20 },
      status: 'completed',
      error: undefined,
      webhookUrl: 'https://webhook.site/test',
      imageGenerationModel: 'fal_gemini_2_5',
      generation_mode: 'studio'
    });
  });

  it('should handle null or undefined optional JSON fields and fallback appropriately', () => {
    const row = {
      id: 'test-456',
      username: 'testuser2',
      timestamp: 1672531300000,
      constructedPrompt: 'Simple prompt',
      originalClothingUrl: 'https://example.com/clothes2.jpg',
      settingsMode: 'basic',
      // The following are null or missing:
      attributes: null,
      edited_images: null,
      original_images: undefined,
      video_urls: null,
      videoGenerationParams: undefined,
      status: 'processing',
      error: 'Some error occurred',
      webhook_url: null,
      image_generation_model: null,
      generation_mode: null
    };

    const item: HistoryItem = rowToHistoryItem(row);

    expect(item.attributes).toEqual({});
    expect(item.editedImageUrls).toEqual([]); // Fallback to empty array
    expect(item.originalImageUrls).toBeUndefined(); // Preserved undefined fallback
    expect(item.generatedVideoUrls).toBeUndefined(); // Preserved undefined fallback
    expect(item.videoGenerationParams).toBeUndefined();
    expect(item.status).toBe('processing');
    expect(item.error).toBe('Some error occurred');
    expect(item.webhookUrl).toBeUndefined();
    expect(item.imageGenerationModel).toBe('fal_gemini_2_5'); // Default model
    expect(item.generation_mode).toBe('creative'); // Default mode
  });

  it('should handle malformed JSON gracefully', () => {
    const row = {
      id: 'test-789',
      username: 'testuser3',
      timestamp: 1672531400000,
      constructedPrompt: 'Prompt',
      originalClothingUrl: 'https://example.com/clothes3.jpg',
      settingsMode: 'basic',
      attributes: '{ malformed json ',
      edited_images: '[ "bad string ]',
      original_images: '{ not an array }',
      video_urls: 'invalid',
      videoGenerationParams: 'another invalid string',
      status: 'completed'
    };

    const item: HistoryItem = rowToHistoryItem(row);

    expect(item.attributes).toEqual({});
    expect(item.editedImageUrls).toEqual([]);
    expect(item.originalImageUrls).toBeUndefined();
    expect(item.generatedVideoUrls).toBeUndefined();
    expect(item.videoGenerationParams).toBeUndefined();
  });

  it('should fallback legacy image_generation_model google_gemini_2_0 to fal_gemini_2_5', () => {
    const row = {
      id: 'test-legacy',
      username: 'legacyuser',
      timestamp: 1672531500000,
      constructedPrompt: 'Legacy prompt',
      originalClothingUrl: 'https://example.com/clothes-legacy.jpg',
      settingsMode: 'basic',
      status: 'completed',
      image_generation_model: 'google_gemini_2_0'
    };

    const item: HistoryItem = rowToHistoryItem(row);

    expect(item.imageGenerationModel).toBe('fal_gemini_2_5');
  });

  it('should allow valid alternative models such as fal_nano_banana_pro', () => {
    const row = {
      id: 'test-alt',
      username: 'altuser',
      timestamp: 1672531600000,
      constructedPrompt: 'Alt prompt',
      originalClothingUrl: 'https://example.com/clothes-alt.jpg',
      settingsMode: 'basic',
      status: 'completed',
      image_generation_model: 'fal_nano_banana_pro'
    };

    const item: HistoryItem = rowToHistoryItem(row);

    expect(item.imageGenerationModel).toBe('fal_nano_banana_pro');
  });
});
