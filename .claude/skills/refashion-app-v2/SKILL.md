```markdown
# refashion-app-v2 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill outlines the core development patterns and conventions used in the `refashion-app-v2` TypeScript codebase. It covers file organization, code style, commit conventions, and testing patterns to help contributors write consistent, maintainable code. While no specific framework is detected, the repository follows clear conventions for file naming, imports/exports, and commit messages.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `orderHistory.test.ts`

### Import Style
- Use **relative imports** for referencing modules within the project.
  - Example:
    ```typescript
    import { getUser } from './userService';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // userService.ts
    export function getUser(id: string) { ... }
    export function updateUser(user: User) { ... }
    ```

### Commit Messages
- Follow the **conventional commit** format.
- Common prefix: `perf` (for performance improvements).
- Keep commit messages concise (average 75 characters).
  - Example:
    ```
    perf: optimize user data fetching for faster load times
    ```

## Workflows

### Code Contribution
**Trigger:** When adding new features or fixing bugs  
**Command:** `/contribute`

1. Create a new branch from `main`.
2. Make code changes following the coding conventions.
3. Write or update tests as needed.
4. Commit changes using the conventional commit format.
5. Push your branch and open a pull request.

### Testing
**Trigger:** Before pushing or merging changes  
**Command:** `/test`

1. Locate or create test files matching the `*.test.*` pattern.
2. Run the test suite using the project's test runner (framework unspecified).
3. Ensure all tests pass before submitting changes.

### Code Review
**Trigger:** When reviewing a pull request  
**Command:** `/review`

1. Check for adherence to coding conventions (file naming, imports, exports).
2. Verify commit messages follow the conventional format.
3. Confirm that relevant tests are present and passing.
4. Leave feedback or approve the pull request.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `userService.test.ts`).
- The specific testing framework is not detected, but tests are colocated with the code or in dedicated test files.
- Example test file structure:
  ```typescript
  // userService.test.ts
  import { getUser } from './userService';

  describe('getUser', () => {
    it('returns user data for a valid ID', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /contribute  | Start the code contribution workflow         |
| /test        | Run or write tests for your code             |
| /review      | Perform a code review on a pull request      |
```