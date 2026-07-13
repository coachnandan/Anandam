/**
 * Core business logic calculations for Wellness Dashboard.
 * These functions are pure, deterministic, and isolated from React/DB state.
 */

// ── Memberships & Billing ──────────────────────────────────────────────────

export const MEMBERSHIP_RATES = {
  'Shake': 250,
  'Shake + Fiber': 345,
  'Shake + Beta Heart': 418,
  'Shake + Fiber + Beta Heart': 513,
  'Dino': 150
};

/**
 * Calculates the payment status based on total and paid amounts.
 */
export const calculatePaymentStatus = (total, paid) => {
  if (total <= 0) return 'Paid'; // Free plan or 0 cost
  if (paid >= total) return 'Paid';
  if (paid > 0) return 'Partially_Paid';
  return 'Unpaid';
};

/**
 * Calculates the due amount, ensuring it never drops below 0.
 */
export const calculateDueAmount = (total, paid) => {
  return Math.max(0, Number(total || 0) - Number(paid || 0));
};

/**
 * Calculates the properties for a new membership.
 */
export const calculateNewMembership = (data) => {
  const duration = Number(data.durationDays || data.duration) || 30;
  const total = Number(data.totalAmount || data.amount) || 0;
  const paid = Number(data.advanceAmount || data.advance || data.paidAmount) || 0;

  return {
    duration_days: duration,
    total_shake_limit: duration,
    total_amount: total,
    paid_amount: paid,
    due_amount: calculateDueAmount(total, paid),
    payment_status: calculatePaymentStatus(total, paid)
  };
};

/**
 * Calculates the properties for renewing/extending a membership.
 */
export const calculateRenewalTotals = (fresh, data) => {
  const dur = Number(data.durationDays || data.duration) || 30;
  const totalAmt = Number(data.amount || data.totalAmount) || 0;
  const advancePaid = Number(data.advanceAmount || data.advance || data.amount) || 0;

  return {
    planName: data.plan || `${dur} Days`,
    addedDuration: dur,
    addedTotal: totalAmt,
    addedAdvance: advancePaid,
    addedDue: calculateDueAmount(totalAmt, advancePaid),
    newTotalDuration: (Number(fresh.durationDays) || 0) + dur,
    newTotalAmount: (Number(fresh.totalAmount) || 0) + totalAmt,
    newPaidAmount: (Number(fresh.advanceAmount) || Number(fresh.paidAmount) || 0) + advancePaid,
  };
};

// ── Dashboard & Reports ──────────────────────────────────────────────────

/**
 * Aggregates dashboard statistics from current entities.
 */
export const calculateDashboardStats = (memberships, attendance, members, visitors, todayString) => {
  const activeMemberships = memberships.filter(m => m.status === 'Active' && m.payment_method !== 'one_day');
  
  const totalDueAmount = activeMemberships.reduce((sum, m) => sum + (Number(m.dueAmount) || 0), 0);
  
  const todayAttendance = attendance.filter(a => a.date === todayString);
  const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
  const absentsCount = todayAttendance.filter(a => a.status === 'Absent').length;
  
  const activeMembers = members.filter(m => m.status === 'Active');
  
  const todaysVisitors = visitors.filter(v => v.visit_date === todayString);

  // Expiring in next 3 days
  const todayDateObj = new Date(todayString);
  const expiryCount = activeMemberships.filter(m => {
    if (!m.endDate) return false;
    const end = new Date(m.endDate);
    const diffTime = end - todayDateObj;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  return {
    activeMembersCount: activeMembers.length,
    activeMembershipsCount: activeMemberships.length,
    presentCount,
    absentsCount,
    totalDueAmount,
    todaysVisitorsCount: todaysVisitors.length,
    expiryCount
  };
};
