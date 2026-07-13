import { describe, it, expect, vi } from 'vitest';
import { db } from './db';

// Mock supabase client to avoid real network requests
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  }
}));

describe('Database Service (db.js)', () => {
  it('exports db object with expected methods', () => {
    expect(db).toBeDefined();
    expect(typeof db.fetchCustomers).toBe('function');
    expect(typeof db.createCustomer).toBe('function');
    expect(typeof db.fetchVisitors).toBe('function');
  });

  // Example unit test for a simple method signature validation
  // Full testing requires comprehensive mocking of supabase data returns
  it('should have required methods for all entities', () => {
    const requiredMethods = [
      'fetchCustomers', 'createCustomer', 'updateCustomer', 'deleteCustomer',
      'fetchMemberships', 'createMembership', 'updateMembership', 'deleteMembership',
      'fetchVisitors', 'createVisitor'
    ];

    requiredMethods.forEach(method => {
      expect(typeof db[method]).toBe('function', `Missing method: ${method}`);
    });
  });
});
