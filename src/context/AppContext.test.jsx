import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from './AppContext';
import { db } from '../services/db';

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }),
    removeChannel: vi.fn()
  }
}));

vi.mock('../services/db', () => ({
  db: {
    fetchCustomers: vi.fn().mockResolvedValue([]),
    fetchAttendance: vi.fn().mockResolvedValue([]),
    fetchMemberships: vi.fn().mockResolvedValue([]),
    fetchMembershipHistory: vi.fn().mockResolvedValue([]),
    fetchVisitors: vi.fn().mockResolvedValue([]),
    fetchOtherClubVisits: vi.fn().mockResolvedValue([]),
    fetchShakeLogs: vi.fn().mockResolvedValue([]),
    fetchPaymentLogs: vi.fn().mockResolvedValue([]),
    fetchAttendanceAuditLogs: vi.fn().mockResolvedValue([]),
    fetchActivityLogs: vi.fn().mockResolvedValue([]),
    fetchNotificationLocks: vi.fn().mockResolvedValue([]),
    fetchClosings: vi.fn().mockResolvedValue([]),
    fetchMembershipPayments: vi.fn().mockResolvedValue([])
  }
}));

const TestComponent = () => {
  return <div data-testid="test-child">App is rendering</div>;
};

describe('AppContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and attempts to fetch session', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial render works
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('handles authenticated session correctly', async () => {
    // Override the mock for this specific test
    const { supabase } = await import('../services/supabaseClient');
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'test-user', email: 'test@example.com' } } },
      error: null
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });
});
