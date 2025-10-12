import { vi, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
Object.entries(matchers).forEach(([matcherName, matcher]) => {
  // @ts-ignore
  expect.extend({ [matcherName]: matcher });
});

// Mock window.matchMedia which is not available in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver which is not available in JSDOM
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserverStub {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add to global scope
global.ResizeObserver = ResizeObserverStub as any;
global.IntersectionObserver = IntersectionObserverStub as any;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Optional: Configure test timeout
beforeAll(() => {
  // Increase timeout for tests if needed
  vi.setConfig({ testTimeout: 10000 });
});
