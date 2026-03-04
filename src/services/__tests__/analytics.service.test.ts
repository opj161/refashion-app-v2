jest.mock('server-only', () => ({}));

import { getTopParameterUsage } from '../analytics.service';

describe('analytics.service', () => {
  describe('getTopParameterUsage', () => {
    it('throws an error for invalid parameter "invalid_param"', () => {
      // @ts-expect-error Intentionally passing invalid parameter for testing
      expect(() => getTopParameterUsage('invalid_param')).toThrow('Invalid parameter for analytics query.');
    });

    it('throws an error for empty string parameter ""', () => {
      // @ts-expect-error Intentionally passing invalid parameter for testing
      expect(() => getTopParameterUsage('')).toThrow('Invalid parameter for analytics query.');
    });

    it('throws an error for null parameter', () => {
      // @ts-expect-error Intentionally passing invalid parameter for testing
      expect(() => getTopParameterUsage(null)).toThrow('Invalid parameter for analytics query.');
    });
  });
});
