import { jest } from '@jest/globals';
import { trackUserUpload } from '../history.repository';
import { getDb } from '../connection';

jest.mock('../connection', () => ({
  getDb: jest.fn(),
}));

jest.mock('server-only', () => ({}));
jest.mock('react', () => ({
  cache: jest.fn((fn) => fn),
}));

describe('history.repository', () => {
  describe('trackUserUpload', () => {
    let mockRun: any;
    let mockPrepare: any;
    let mockDb: any;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z').getTime());

      mockRun = jest.fn();
      mockPrepare = jest.fn((query: string) => {
        return { run: mockRun, get: jest.fn(), all: jest.fn() };
      });

      mockDb = {
        prepare: mockPrepare,
        transaction: jest.fn((cb) => cb),
      };

      (getDb as jest.Mock).mockReturnValue(mockDb);

      // Clear `preparedStatements` cache by resetting modules
      jest.resetModules();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should track user upload by running the prepared statement with correct parameters', async () => {
      // Setup the mock module for `../connection` to return the `mockDb` object
      jest.doMock('../connection', () => ({
        getDb: jest.fn().mockReturnValue(mockDb)
      }));
      jest.doMock('server-only', () => ({}));
      jest.doMock('react', () => ({
        cache: jest.fn((fn) => fn),
      }));

      // Import the dynamically mocked module
      const { trackUserUpload } = await import('../history.repository');

      const username = 'testuser';
      const fileUrl = 'https://example.com/file.jpg';

      trackUserUpload(username, fileUrl);

      // `getPreparedStatements` calls `getDb().prepare(...)` for several statements, including trackUpload
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_uploads')
      );

      // We expect run to have been called with the correct parameters
      expect(mockRun).toHaveBeenCalledWith(
        username,
        fileUrl,
        1672531200000 // 2023-01-01T00:00:00.000Z in ms
      );
    });
  });
});
