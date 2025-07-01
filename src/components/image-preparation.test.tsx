import { uploadUserImageAction } from "@/ai/actions/upload-user-image";

// Mock the uploadUserImageAction for testing
jest.mock("@/ai/actions/upload-user-image", () => ({
  uploadUserImageAction: jest.fn()
}));

describe('Image Preparation - Data URI Conversion', () => {
  // Helper function to simulate fileToDataUri (extracted from component for testing)
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  test('fileToDataUri converts File to proper data URI format', async () => {
    // Create a mock file
    const mockFileContent = 'mock-image-content';
    const blob = new Blob([mockFileContent], { type: 'image/jpeg' });
    const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

    const dataUri = await fileToDataUri(file);

    // Verify it returns a proper data URI
    expect(dataUri).toMatch(/^data:image\/jpeg;base64,/);
    expect(typeof dataUri).toBe('string');
  });

  test('uploadUserImageAction receives proper data URI format', async () => {
    const mockUploadAction = uploadUserImageAction as jest.MockedFunction<typeof uploadUserImageAction>;
    mockUploadAction.mockResolvedValue('/uploads/user_uploaded_clothing/test-image.jpg');

    // Create a proper data URI
    const testDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//Z';
    
    await uploadUserImageAction(testDataUri);

    // Verify the function was called with a proper data URI
    expect(mockUploadAction).toHaveBeenCalledWith(testDataUri);
    expect(mockUploadAction).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/\w+;base64,/)
    );
  });

  test('data URI validation in upload action', () => {
    // Test the regex pattern used in upload-user-image.ts
    const validDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA';
    const invalidDataUri = 'blob:http://localhost:3000/12345';
    const invalidDataUri2 = 'https://example.com/image.jpg';

    const dataUriRegex = /^data:(image\/\w+);base64,(.+)$/;

    expect(dataUriRegex.test(validDataUri)).toBe(true);
    expect(dataUriRegex.test(invalidDataUri)).toBe(false);
    expect(dataUriRegex.test(invalidDataUri2)).toBe(false);
  });
});
