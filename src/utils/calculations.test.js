import { describe, it, expect } from 'vitest';
import { 
  calculatePaymentStatus, 
  calculateDueAmount, 
  calculateNewMembership,
  calculateRenewalTotals,
  calculateDashboardStats
} from './calculations';

describe('Calculations Utility', () => {
  describe('calculatePaymentStatus', () => {
    it('returns Paid when total is 0 or less', () => {
      expect(calculatePaymentStatus(0, 0)).toBe('Paid');
      expect(calculatePaymentStatus(-10, 0)).toBe('Paid');
    });

    it('returns Paid when paid >= total', () => {
      expect(calculatePaymentStatus(100, 100)).toBe('Paid');
      expect(calculatePaymentStatus(100, 150)).toBe('Paid');
    });

    it('returns Partially_Paid when 0 < paid < total', () => {
      expect(calculatePaymentStatus(100, 50)).toBe('Partially_Paid');
      expect(calculatePaymentStatus(100, 1)).toBe('Partially_Paid');
    });

    it('returns Unpaid when paid is 0 and total > 0', () => {
      expect(calculatePaymentStatus(100, 0)).toBe('Unpaid');
      expect(calculatePaymentStatus(100, -50)).toBe('Unpaid');
    });
  });

  describe('calculateDueAmount', () => {
    it('calculates simple difference', () => {
      expect(calculateDueAmount(100, 20)).toBe(80);
    });

    it('never returns negative due amount', () => {
      expect(calculateDueAmount(100, 150)).toBe(0);
      expect(calculateDueAmount(0, 50)).toBe(0);
    });

    it('handles falsy or malformed inputs safely', () => {
      expect(calculateDueAmount(null, undefined)).toBe(0);
      expect(calculateDueAmount('100', '20')).toBe(80); // coercion
    });
  });

  describe('calculateNewMembership', () => {
    it('parses correct defaults for empty data', () => {
      const res = calculateNewMembership({});
      expect(res.duration_days).toBe(30);
      expect(res.total_amount).toBe(0);
      expect(res.paid_amount).toBe(0);
      expect(res.due_amount).toBe(0);
      expect(res.payment_status).toBe('Paid');
    });

    it('parses explicitly provided data', () => {
      const res = calculateNewMembership({ durationDays: 15, totalAmount: 500, advanceAmount: 200 });
      expect(res.duration_days).toBe(15);
      expect(res.total_amount).toBe(500);
      expect(res.paid_amount).toBe(200);
      expect(res.due_amount).toBe(300);
      expect(res.payment_status).toBe('Partially_Paid');
    });
  });

  describe('calculateRenewalTotals', () => {
    it('aggregates old and new totals safely', () => {
      const existing = { durationDays: 30, totalAmount: 1000, advanceAmount: 1000 };
      const incoming = { durationDays: 15, totalAmount: 500, advanceAmount: 200 };
      
      const res = calculateRenewalTotals(existing, incoming);
      expect(res.newTotalDuration).toBe(45);
      expect(res.newTotalAmount).toBe(1500);
      expect(res.newPaidAmount).toBe(1200);
      expect(res.addedDue).toBe(300);
      expect(res.planName).toBe('15 Days');
    });
  });

  describe('calculateDashboardStats', () => {
    it('calculates dashboard metrics accurately', () => {
      const memberships = [
        { status: 'Active', payment_method: 'Cash', dueAmount: 500, endDate: '2026-07-15' },
        { status: 'Active', payment_method: 'one_day', dueAmount: 0 },
        { status: 'Inactive', dueAmount: 200 } // Should be ignored
      ];
      const attendance = [
        { date: '2026-07-12', status: 'Present' },
        { date: '2026-07-12', status: 'Absent' },
        { date: '2026-07-11', status: 'Present' }
      ];
      const members = [
        { status: 'Active' },
        { status: 'Inactive' }
      ];
      const visitors = [
        { visit_date: '2026-07-12' },
        { visit_date: '2026-07-10' }
      ];

      const stats = calculateDashboardStats(memberships, attendance, members, visitors, '2026-07-12');
      
      expect(stats.activeMembersCount).toBe(1);
      expect(stats.activeMembershipsCount).toBe(1);
      expect(stats.totalDueAmount).toBe(500);
      expect(stats.presentCount).toBe(1);
      expect(stats.absentsCount).toBe(1);
      expect(stats.todaysVisitorsCount).toBe(1);
      expect(stats.expiryCount).toBe(1); // 15th is 3 days from 12th
    });
  });
});
