---
name: testing-patterns
description: "Jest testing patterns, factory functions, mocking strategies, and TDD workflow. Use when writing unit tests, creating test factories, or following TDD red-green-refactor cycle."
risk: unknown
source: community
date_added: "2026-02-27"
---

## Core Principles

**Test-Driven Development (TDD):**
- Write failing test FIRST
- Implement minimal code to pass
- Refactor after green
- Never write production code without a failing test

**Behavior-Driven Testing:**
- Test behavior, not implementation
- Focus on public APIs and business requirements
- Use descriptive test names that describe behavior

**Factory Pattern:**
- Create `getMockX(overrides?)` functions
- Provide sensible defaults
- Allow overriding specific properties

## Factory Examples

### Data Factory
```typescript
const getMockUser = (overrides?: Partial<User>): User => ({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  ...overrides,
});

// Usage
const admin = getMockUser({ role: 'admin' });
```

### Component Props Factory
```typescript
const getMockProps = (overrides?) => ({
  title: 'Default Title',
  count: 0,
  onPress: jest.fn(),
  isLoading: false,
  ...overrides,
});
```

## Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('Rendering', () => {
    it('should render with default props', () => {});
    it('should render loading state', () => {});
  });

  describe('User interactions', () => {
    it('should call onPress when button is clicked', () => {});
  });

  describe('Edge cases', () => {
    it('should handle empty data gracefully', () => {});
  });
});
```

## Best Practices
1. Always use factory functions for props and data
2. Test behavior, not implementation
3. Use descriptive test names
4. Organize with describe blocks
5. Clear mocks between tests
6. Keep tests focused — one behavior per test

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.
