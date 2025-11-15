import { jest } from '@jest/globals';

beforeEach(() => {
  global.fetch = jest.fn();
  global.confirm = jest.fn(() => true);
});

afterEach(() => {
  jest.clearAllMocks();
});

