import { setSetting, getSetting, getBooleanSetting, getAllSettings, SettingKey } from '../settings.service';
import * as dbService from '@/services/db';

jest.mock('@/services/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('server-only', () => ({}));

describe('settings.service', () => {
  let mockRun: jest.Mock;
  let mockGet: jest.Mock;
  let mockAll: jest.Mock;
  let mockPrepare: jest.Mock;
  let mockDb: any;

  beforeEach(() => {
    mockRun = jest.fn();
    mockGet = jest.fn();
    mockAll = jest.fn();
    mockPrepare = jest.fn().mockImplementation((query) => {
      if (query.includes('INSERT OR REPLACE')) {
        return { run: mockRun };
      } else if (query.includes('SELECT value FROM settings WHERE key = ?')) {
        return { get: mockGet };
      } else if (query.includes('SELECT key, value FROM settings')) {
        return { all: mockAll };
      }
      return {};
    });
    mockDb = { prepare: mockPrepare };

    (dbService.getDb as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setSetting', () => {
    it('should call db.prepare and stmt.run with correct arguments', () => {
      setSetting('feature_video_generation', 'false');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockPrepare).toHaveBeenCalledWith('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      expect(mockRun).toHaveBeenCalledWith('feature_video_generation', 'false');
    });

    it('should handle setting other keys', () => {
      setSetting('feature_image_upscaling', 'true');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockPrepare).toHaveBeenCalledWith('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      expect(mockRun).toHaveBeenCalledWith('feature_image_upscaling', 'true');
    });
  });

  describe('getSetting', () => {
    it('should return value from db if it exists', () => {
      mockGet.mockReturnValue({ value: 'custom_value' });

      const result = getSetting('feature_video_generation');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockPrepare).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?');
      expect(mockGet).toHaveBeenCalledWith('feature_video_generation');
      expect(result).toBe('custom_value');
    });

    it('should return default value if key does not exist in db', () => {
      mockGet.mockReturnValue(undefined);

      const result = getSetting('feature_video_generation');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockPrepare).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?');
      expect(mockGet).toHaveBeenCalledWith('feature_video_generation');
      expect(result).toBe('true'); // Default value for this key
    });
  });

  describe('getBooleanSetting', () => {
    it('should return true if setting value is "true"', () => {
      mockGet.mockReturnValue({ value: 'true' });

      const result = getBooleanSetting('feature_video_generation');

      expect(result).toBe(true);
    });

    it('should return false if setting value is "false"', () => {
      mockGet.mockReturnValue({ value: 'false' });

      const result = getBooleanSetting('feature_video_generation');

      expect(result).toBe(false);
    });

    it('should return false if setting value is something else', () => {
      mockGet.mockReturnValue({ value: 'invalid' });

      const result = getBooleanSetting('feature_video_generation');

      expect(result).toBe(false);
    });
  });

  describe('getAllSettings', () => {
    it('should return default settings if db is empty', () => {
      mockAll.mockReturnValue([]);

      const result = getAllSettings();

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockPrepare).toHaveBeenCalledWith('SELECT key, value FROM settings');
      expect(mockAll).toHaveBeenCalled();
      expect(result.feature_video_generation).toBe('true');
      expect(result.feature_image_upscaling).toBe('true');
    });

    it('should override default settings with db values', () => {
      mockAll.mockReturnValue([
        { key: 'feature_video_generation', value: 'false' }
      ]);

      const result = getAllSettings();

      expect(result.feature_video_generation).toBe('false');
      expect(result.feature_image_upscaling).toBe('true'); // Still default
    });

    it('should ignore keys from db that are not in DEFAULTS', () => {
      mockAll.mockReturnValue([
        { key: 'invalid_key', value: 'something' }
      ]);

      const result = getAllSettings();

      expect((result as any).invalid_key).toBeUndefined();
    });
  });
});
