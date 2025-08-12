import { getBufferFromLocalPath } from './server-fs.utils';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module for consistent testing
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('server-fs.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.join.mockImplementation((...args) => args.join('/'));
    
    // Mock process.cwd() to return a consistent value
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getBufferFromLocalPath', () => {
    describe('Success Cases', () => {
      it('should successfully read a valid uploads file', async () => {
        const testBuffer = Buffer.from('test file content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/test-image.png');
        
        expect(result).toBe(testBuffer);
        expect(mockPath.join).toHaveBeenCalledWith('/test/project', 'uploads');
        expect(mockPath.join).toHaveBeenCalledWith('/test/project/uploads', 'test-image.png');
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/project/uploads/test-image.png');
      });

      it('should handle nested upload paths correctly', async () => {
        const testBuffer = Buffer.from('nested file content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/processed_images/user_123/image.jpg');
        
        expect(result).toBe(testBuffer);
        expect(mockPath.join).toHaveBeenCalledWith('/test/project/uploads', 'processed_images/user_123/image.jpg');
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/project/uploads/processed_images/user_123/image.jpg');
      });

      it('should handle paths with special characters', async () => {
        const testBuffer = Buffer.from('special chars content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/test-file_with-special.chars.png');
        
        expect(result).toBe(testBuffer);
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/project/uploads/test-file_with-special.chars.png');
      });
    });

    describe('Security - Path Validation', () => {
      it('should reject paths not starting with /uploads/', async () => {
        await expect(getBufferFromLocalPath('/etc/passwd')).rejects.toThrow(
          'Invalid path: Must be within /uploads/'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should reject empty paths', async () => {
        await expect(getBufferFromLocalPath('')).rejects.toThrow(
          'Invalid path: Must be within /uploads/'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should reject relative paths', async () => {
        await expect(getBufferFromLocalPath('uploads/test.png')).rejects.toThrow(
          'Invalid path: Must be within /uploads/'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should reject paths with null bytes', async () => {
        await expect(getBufferFromLocalPath('/uploads/test\0.png')).rejects.toThrow(
          'Invalid path: Must be within /uploads/'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });
    });

    describe('Security - Path Traversal Prevention', () => {
      it('should reject path traversal attempts with ../', async () => {
        // Mock path.join to simulate path traversal resolution
        mockPath.join
          .mockReturnValueOnce('/test/project/uploads') // uploadsDir
          .mockReturnValueOnce('/test/project/etc/passwd'); // absoluteFilePath after traversal
        
        await expect(getBufferFromLocalPath('/uploads/../../../etc/passwd')).rejects.toThrow(
          'Forbidden: Path traversal attempt detected.'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should reject complex path traversal attempts', async () => {
        // Mock path.join to simulate complex traversal
        mockPath.join
          .mockReturnValueOnce('/test/project/uploads') // uploadsDir
          .mockReturnValueOnce('/test/project/sensitive'); // absoluteFilePath after traversal
        
        await expect(getBufferFromLocalPath('/uploads/images/../../../sensitive/data.txt')).rejects.toThrow(
          'Forbidden: Path traversal attempt detected.'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should reject attempts to access parent directories', async () => {
        // Mock path.join to simulate parent directory access
        mockPath.join
          .mockReturnValueOnce('/test/project/uploads') // uploadsDir
          .mockReturnValueOnce('/test/project'); // absoluteFilePath (parent of uploads)
        
        await expect(getBufferFromLocalPath('/uploads/../config.json')).rejects.toThrow(
          'Forbidden: Path traversal attempt detected.'
        );
        
        expect(mockFs.readFile).not.toHaveBeenCalled();
      });

      it('should allow legitimate nested paths within uploads', async () => {
        const testBuffer = Buffer.from('legitimate nested content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        // Mock path.join to return legitimate nested path
        mockPath.join
          .mockReturnValueOnce('/test/project/uploads') // uploadsDir
          .mockReturnValueOnce('/test/project/uploads/user_data/images/photo.jpg'); // legitimate nested path
        
        const result = await getBufferFromLocalPath('/uploads/user_data/images/photo.jpg');
        
        expect(result).toBe(testBuffer);
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/project/uploads/user_data/images/photo.jpg');
      });
    });

    describe('File System Error Handling', () => {
      it('should propagate file not found errors', async () => {
        const fileNotFoundError = new Error('ENOENT: no such file or directory');
        (fileNotFoundError as any).code = 'ENOENT';
        mockFs.readFile.mockRejectedValue(fileNotFoundError);
        
        await expect(getBufferFromLocalPath('/uploads/nonexistent.png')).rejects.toThrow(
          'ENOENT: no such file or directory'
        );
      });

      it('should propagate permission errors', async () => {
        const permissionError = new Error('EACCES: permission denied');
        (permissionError as any).code = 'EACCES';
        mockFs.readFile.mockRejectedValue(permissionError);
        
        await expect(getBufferFromLocalPath('/uploads/restricted.png')).rejects.toThrow(
          'EACCES: permission denied'
        );
      });

      it('should propagate other file system errors', async () => {
        const ioError = new Error('EIO: i/o error');
        (ioError as any).code = 'EIO';
        mockFs.readFile.mockRejectedValue(ioError);
        
        await expect(getBufferFromLocalPath('/uploads/corrupted.png')).rejects.toThrow(
          'EIO: i/o error'
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle paths with multiple slashes', async () => {
        const testBuffer = Buffer.from('multiple slashes content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads//test//image.png');
        
        expect(result).toBe(testBuffer);
        // The path.join should normalize the path
        expect(mockPath.join).toHaveBeenCalledWith('/test/project/uploads', '/test//image.png');
      });

      it('should handle paths with trailing slashes', async () => {
        const testBuffer = Buffer.from('trailing slash content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/folder/image.png/');
        
        expect(result).toBe(testBuffer);
        expect(mockPath.join).toHaveBeenCalledWith('/test/project/uploads', 'folder/image.png/');
      });

      it('should handle the uploads root directory edge case', async () => {
        // Mock path.join to return the uploads directory itself
        mockPath.join
          .mockReturnValueOnce('/test/project/uploads') // uploadsDir
          .mockReturnValueOnce('/test/project/uploads'); // absoluteFilePath (same as uploadsDir)
        
        const testBuffer = Buffer.from('root directory content');
        mockFs.readFile.mockResolvedValue(testBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/');
        
        expect(result).toBe(testBuffer);
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/project/uploads');
      });
    });

    describe('Buffer Handling', () => {
      it('should return the exact buffer from fs.readFile', async () => {
        const originalBuffer = Buffer.from('exact buffer content', 'utf8');
        mockFs.readFile.mockResolvedValue(originalBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/test.txt');
        
        expect(result).toBe(originalBuffer);
        expect(Buffer.isBuffer(result)).toBe(true);
      });

      it('should handle empty files', async () => {
        const emptyBuffer = Buffer.alloc(0);
        mockFs.readFile.mockResolvedValue(emptyBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/empty.txt');
        
        expect(result).toBe(emptyBuffer);
        expect(result.length).toBe(0);
      });

      it('should handle large files', async () => {
        const largeBuffer = Buffer.alloc(1024 * 1024, 'a'); // 1MB buffer
        mockFs.readFile.mockResolvedValue(largeBuffer);
        
        const result = await getBufferFromLocalPath('/uploads/large-file.bin');
        
        expect(result).toBe(largeBuffer);
        expect(result.length).toBe(1024 * 1024);
      });
    });
  });
});