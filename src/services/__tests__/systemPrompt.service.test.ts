jest.mock('server-only', () => ({}));

import { updateSystemPrompt } from '../systemPrompt.service';
import * as settingsService from '../settings.service';

jest.mock('../settings.service');

describe('systemPrompt.service', () => {
  describe('updateSystemPrompt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call settingsService.setSetting with the correct key and prompt', () => {
      const prompt = 'You are a helpful assistant.';

      updateSystemPrompt(prompt);

      expect(settingsService.setSetting).toHaveBeenCalledWith('ai_prompt_engineer_system', prompt);
      expect(settingsService.setSetting).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string prompts', () => {
      const prompt = '';

      updateSystemPrompt(prompt);

      expect(settingsService.setSetting).toHaveBeenCalledWith('ai_prompt_engineer_system', prompt);
    });

    it('should handle multi-line string prompts', () => {
      const prompt = 'Line 1\nLine 2\nLine 3';

      updateSystemPrompt(prompt);

      expect(settingsService.setSetting).toHaveBeenCalledWith('ai_prompt_engineer_system', prompt);
    });

    it('should throw if settingsService.setSetting throws', () => {
      const expectedError = new Error('Database error');
      (settingsService.setSetting as jest.Mock).mockImplementationOnce(() => {
        throw expectedError;
      });

      expect(() => updateSystemPrompt('test')).toThrow('Database error');
    });
  });
});
