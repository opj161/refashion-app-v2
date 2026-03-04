import 'server-only';
jest.mock('server-only', () => {
  return {};
});

import { getSetting } from '../settings.service';
import * as dbService from '@/services/db';

jest.mock('@/services/db', () => ({
  getDb: jest.fn()
}));

describe('settings.service', () => {
  let mockDb: any;
  let mockStmt: any;

  beforeEach(() => {
    mockStmt = {
      get: jest.fn()
    };
    mockDb = {
      prepare: jest.fn().mockReturnValue(mockStmt)
    };
    (dbService.getDb as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return the value from the database if it exists', () => {
      mockStmt.get.mockReturnValue({ value: 'false' });

      const result = getSetting('feature_video_generation');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?');
      expect(mockStmt.get).toHaveBeenCalledWith('feature_video_generation');
      expect(result).toBe('false');
    });

    it('should return the default value if the key does not exist in the database', () => {
      mockStmt.get.mockReturnValue(undefined);

      const result = getSetting('feature_video_generation');

      expect(dbService.getDb).toHaveBeenCalled();
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?');
      expect(mockStmt.get).toHaveBeenCalledWith('feature_video_generation');
      expect(result).toBe('true'); // The default value in DEFAULTS
    });
  });
});
