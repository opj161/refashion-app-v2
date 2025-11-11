// Test file to verify form state types are correctly defined
import type { 
  ApiKeysFormState, 
  SystemPromptFormState, 
  CacheCleanupFormState, 
  UserFormState 
} from '../adminActions';

describe('Admin Form State Types', () => {
  it('should have correctly typed ApiKeysFormState', () => {
    const validState: ApiKeysFormState = {
      message: 'Test message',
      success: true,
    };
    
    expect(validState).toBeDefined();
    expect(validState.message).toBe('Test message');
    expect(validState.success).toBe(true);
  });

  it('should have correctly typed SystemPromptFormState', () => {
    const validState: SystemPromptFormState = {
      message: 'Prompt updated',
      success: true,
    };
    
    expect(validState).toBeDefined();
    expect(validState.message).toBe('Prompt updated');
  });

  it('should have correctly typed CacheCleanupFormState', () => {
    const validState: CacheCleanupFormState = {
      message: 'Cache cleaned',
      error: 'Some error',
    };
    
    expect(validState).toBeDefined();
    expect(validState.message).toBe('Cache cleaned');
    expect(validState.error).toBe('Some error');
  });

  it('should have correctly typed UserFormState', () => {
    const validState: UserFormState = {
      message: 'User created',
      success: true,
      error: undefined,
    };
    
    expect(validState).toBeDefined();
    expect(validState.message).toBe('User created');
    expect(validState.success).toBe(true);
  });

  it('should support minimal form states', () => {
    const minimalApiKeys: ApiKeysFormState = { message: '' };
    const minimalSystemPrompt: SystemPromptFormState = { message: '' };
    const minimalCache: CacheCleanupFormState = { message: '' };
    const minimalUser: UserFormState = { message: '' };
    
    expect(minimalApiKeys).toBeDefined();
    expect(minimalSystemPrompt).toBeDefined();
    expect(minimalCache).toBeDefined();
    expect(minimalUser).toBeDefined();
  });
});
