import { supabase } from './supabaseClient';
import { getISTDateString } from '../utils/dateUtils';

// Helper to handle errors uniformly and print detailed error logs
const handleResponse = async (promise, context = 'Query') => {
  try {
    const { data, error, status, statusText } = await promise;
    if (error) {
      console.error(`Supabase DB operation failed [${context}]:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status,
        statusText
      });
      throw error;
    }
    return data;
  } catch (err) {
    console.error(`Unhandled error in DB operation [${context}]:`, err);
    throw err;
  }
};

// ─── In-flight guard: prevents duplicate DB inserts from rapid double-clicks ───
const _inflightPayments = new Set();

export const db = {
  // ─── CLUBS ───
  fetchClubs: () =>
    handleResponse(supabase.from('clubs').select('*').order('name'), 'fetchClubs'),

  // ─── PROFILES / USERS ───
  fetchUserProfile: (userId) =>
    handleResponse(supabase.from('profiles').select('*').eq('id', userId).single(), 'fetchUserProfile'),

  // ─── MEMBERS (CUSTOMERS) ───
  fetchCustomers: () =>
    handleResponse(supabase.from('members').select('*, profiles:created_by(id, full_name)').is('deleted_at', null).order('name'), 'fetchCustomers'),

  createCustomer: (customer) =>
    handleResponse(supabase.from('members').insert([customer]).select().single(), 'createCustomer'),

  updateCustomer: (id, updates) =>
    handleResponse(supabase.from('members').update(updates).eq('id', id).select().single(), 'updateCustomer'),

  deleteCustomer: (id, adminId) =>
    handleResponse(supabase.from('members').update({ deleted_at: new Date().toISOString(), deleted_by: adminId }).eq('id', id).select().single(), 'deleteCustomer'),

  // ─── OTHER CLUB VISITS (ATTENDANCE JOINED WITH MEMBERS) ───
  fetchOtherClubVisits: async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('id, date, check_in_time, visit_reason, marked_by, profiles!marked_by(full_name), members!inner(id, name, mobile_number, whatsapp_number, referral, club_name)')
      .eq('members.member_type', 'Other Club Member');
    if (error) {
      console.error("fetchOtherClubVisits error:", error);
      throw error;
    }
    return data.map(a => ({
      id: a.id,
      member_id: a.members.id,
      name: a.members.name,
      mobile: a.members.mobile_number,
      whatsapp: a.members.whatsapp_number,
      referred_by: a.members.referral,
      club_name: a.members.club_name,
      visit_date: a.date,
      visit_time: a.check_in_time,
      reason: a.visit_reason || 'Visitation',
      marked_by: a.profiles?.full_name || null
    }));
  },

  createOtherClubVisit: (visit) =>
    handleResponse(supabase.from('attendance').insert([visit]).select().single(), 'createOtherClubVisit'),

  updateOtherClubVisit: (id, updates) =>
    handleResponse(supabase.from('attendance').update(updates).eq('id', id).select().single(), 'updateOtherClubVisit'),

  deleteOtherClubVisit: (id) =>
    handleResponse(supabase.from('attendance').delete().eq('id', id), 'deleteOtherClubVisit'),

  // ─── VISITORS ───
  fetchVisitors: () =>
    handleResponse(supabase.from('visitors').select('*, profiles:created_by(id, full_name)').is('deleted_at', null).order('created_at', { ascending: false }), 'fetchVisitors'),


  createVisitor: (visitor) =>
    handleResponse(supabase.from('visitors').insert([visitor]).select().single(), 'createVisitor'),

  updateVisitor: (id, updates) =>
    handleResponse(supabase.from('visitors').update(updates).eq('id', id).select().single(), 'updateVisitor'),

  deleteVisitor: (id, adminId) =>
    handleResponse(supabase.from('visitors').update({ deleted_at: new Date().toISOString(), deleted_by: adminId }).eq('id', id).select().single(), 'deleteVisitor'),

  undoDeleteVisitor: (id) =>
    handleResponse(supabase.from('visitors').update({ deleted_at: null, deleted_by: null }).eq('id', id).select().single(), 'undoDeleteVisitor'),

  // ─── MEMBERSHIPS ───
  fetchMemberships: () =>
    handleResponse(supabase.from('memberships').select('*').order('created_at', { ascending: false }), 'fetchMemberships'),

  createMembership: (membership) =>
    handleResponse(supabase.from('memberships').insert([membership]).select().single(), 'createMembership'),

  updateMembership: (id, updates) =>
    handleResponse(supabase.from('memberships').update(updates).eq('id', id).select().single(), 'updateMembership'),

  deleteMembership: (id) =>
    handleResponse(supabase.from('memberships').delete().eq('id', id), 'deleteMembership'),

  logMembershipHistory: (historyRecord) =>
    handleResponse(supabase.from('membership_history').insert([historyRecord]).select().single(), 'logMembershipHistory'),

  fetchMembershipHistory: () =>
    handleResponse(supabase.from('membership_history').select('*').order('created_at', { ascending: false }), 'fetchMembershipHistory'),

  // ─── ATTENDANCE ───
  fetchAttendance: async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, member_id, date, attendance_status, check_in_time, marked_by, profiles(full_name)');
      if (error) {
        console.error('Supabase DB operation failed [fetchAttendance]:', error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error('fetchAttendance error:', e);
      throw e;
    }
  },

  updateAttendanceRecord: (record) =>
    handleResponse(
      supabase.from('attendance')
        .upsert({
          member_id: record.customerId,
          date: record.date,
          attendance_status: record.status || 'Present',
          check_in_time: record.checkIn || '09:00 AM',
          marked_by: record.markedBy || null
        }, { onConflict: 'member_id,date' })
        .select(),
      'updateAttendanceRecord'
    ),

  // ─── SHAKE LOGS (CENTRALIZED SHAKE_LOGS) ───
  fetchShakeLogs: async () => {
    try {
      const { data, error } = await supabase
        .from('shake_logs')
        .select(`
          id,
          club_id,
          person_type,
          person_id,
          shake_type_id,
          quantity,
          payment_type,
          marked_by,
          date,
          time,
          shake_types:shake_type_id (name),
          profiles:marked_by (full_name)
        `);
      if (error) {
        console.error("Supabase DB operation failed [fetchShakeLogs]:", error);
        throw error;
      }
      return data.map(s => {
        let sourceVal = 'member';
        if (s.person_type === 'VISITOR') sourceVal = 'visitor';
        if (s.person_type === 'OTHER_CLUB_MEMBER') sourceVal = 'other_club';
        return {
          id: s.id,
          club_id: s.club_id,
          source: sourceVal,
          personId: s.person_id,
          shake_type_id: s.shake_type_id,
          item: s.shake_types?.name || 'Shake',
          quantity: s.quantity,
          payment_type: s.payment_type,
          markedBy: s.marked_by,
          staffName: s.profiles?.full_name || null,
          date: s.date,
          time: s.time
        };
      });
    } catch (err) {
      console.error("Error in fetchShakeLogs:", err);
      return [];
    }
  },

  saveShakeLog: async (log) => {
    try {
      console.log("Saving Visitor/Member Shake - Payload:", log);
      let personType = 'MEMBER';
      if (log.source === 'visitor') personType = 'VISITOR';
      else if (log.source === 'other_club') personType = 'OTHER_CLUB_MEMBER';

      // Get shake type ID dynamically by name
      const { data: st } = await supabase
        .from('shake_types')
        .select('id')
        .eq('name', log.item)
        .maybeSingle();

      const shakeTypeId = st?.id || log.shake_type_id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'; // Default UUID

      if (Number(log.quantity) === 0) {
        console.log("Quantity is 0, deleting log from database:", { personType, personId: log.personId, shakeTypeId, date: log.date });
        const { data, error: deleteError } = await supabase
          .from('shake_logs')
          .delete()
          .eq('person_type', personType)
          .eq('person_id', log.personId)
          .eq('shake_type_id', shakeTypeId)
          .eq('date', log.date)
          .select();

        if (deleteError) {
          console.error("Supabase shake_logs delete failed:", deleteError);
          throw deleteError;
        }
        console.log("Supabase delete response:", data);
        return null;
      }

      const activeClubId = log.club_id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

      const insertPayload = {
        club_id: activeClubId,
        person_type: personType,
        person_id: log.personId,
        shake_type_id: shakeTypeId,
        quantity: Number(log.quantity) || 1,
        payment_type: log.payment_type || 'Cash',
        marked_by: log.marked_by || null,
        date: log.date,
        time: log.time || '09:00 AM'
      };

      console.log("Inserting to shake_logs:", insertPayload);
      const { data: shake, error: shakeError } = await supabase
        .from('shake_logs')
        .insert([insertPayload])
        .select();

      if (shakeError) {
        console.error("Supabase shake_logs insert failed:", shakeError);
        throw shakeError;
      }

      console.log("Supabase insert response:", shake);

      // Verification check: Read the saved record back from Supabase
      if (shake && shake.length > 0) {
        const { data: verifiedRecord, error: verifyError } = await supabase
          .from('shake_logs')
          .select('id')
          .eq('id', shake[0].id)
          .single();
        if (verifyError || !verifiedRecord) {
          throw new Error("Verification failed: Record was upserted but could not be read back from database.");
        }
        console.log("✅ Verified: record exists in Supabase database.");
      }

      return shake;
    } catch (err) {
      console.error("Error in saveShakeLog:", err);
      throw err;
    }
  },

  // ─── SETTINGS CRUD ───
  fetchSettings: () =>
    handleResponse(supabase.from('settings').select('*'), 'fetchSettings'),

  saveSetting: async (configKey, configValue, clubId) => {
    try {
      const activeClubId = clubId || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';
      return handleResponse(
        supabase.from('settings')
          .upsert({
            club_id: activeClubId,
            config_key: configKey,
            config_value: String(configValue),
            updated_at: new Date().toISOString()
          }, { onConflict: 'club_id,config_key' })
          .select(),
        'saveSetting'
      );
    } catch (err) {
      console.error("Error in saveSetting:", err);
      throw err;
    }
  },

  // ─── PAYMENT LOGS (MERGED LEDGER & TRANSACTIONS) ───
  fetchPaymentLogs: async () => {
    try {
      const [oneDayRes, membPayRes] = await Promise.all([
        supabase.from('one_day_payments').select('*, payment_methods(name), members(name), visitors(visitor_name), profiles:received_by(full_name)').order('payment_date', { ascending: false }),
        supabase.from('membership_payments').select('*, memberships(*, members(id, name)), payment_methods(name), profiles:received_by(full_name)').order('payment_date', { ascending: false })
      ]);

      if (oneDayRes.error) throw oneDayRes.error;
      if (membPayRes.error) throw membPayRes.error;

      const oneDayMapped = (oneDayRes.data || []).map(p => ({
        id: p.id,
        memberId: p.visitor_id || p.member_id,
        memberName: p.members?.name || p.visitors?.visitor_name,
        amount: Number(p.amount) || 0,
        totalAmount: Number(p.total_amount) || Number(p.amount) || 0,
        due: Number(p.due_amount) || 0,
        paymentMode: p.payment_methods?.name || (p.payment_method_id === 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d' ? 'Online' : 'Cash'),
        paymentPurpose: 'One Day Payment',
        plan: '1 Day',
        date: p.payment_date ? getISTDateString(p.payment_date) : null,
        time: new Date(p.payment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
        timestamp: p.payment_date,
        received_by_name: p.profiles?.full_name || 'Admin',
        received_by_id: p.received_by || '—',
        staffName: p.profiles?.full_name || 'Admin',
        staffId: p.received_by || '—'
      }));

      const membPayMapped = (membPayRes.data || []).map(p => ({
        id: p.id,
        memberId: p.memberships?.members?.id || p.memberships?.member_id,
        memberName: p.memberships?.members?.name,
        amount: Number(p.amount) || 0,
        totalAmount: Number(p.memberships?.total_amount) || Number(p.amount) || 0,
        due: Number(p.memberships?.due_amount) || 0,
        paymentMode: p.payment_methods?.name || (p.payment_method_id === 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d' ? 'Online' : 'Cash'),
        paymentPurpose: 'Subscription',
        plan: p.memberships?.plan || 'Subscription',
        date: p.payment_date ? getISTDateString(p.payment_date) : null,
        time: new Date(p.payment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
        timestamp: p.payment_date,
        received_by_name: p.profiles?.full_name || 'Admin',
        received_by_id: p.received_by || '—',
        staffName: p.profiles?.full_name || 'Admin',
        staffId: p.received_by || '—'
      }));

      return [...oneDayMapped, ...membPayMapped];
    } catch (err) {
      console.error("Error in fetchPaymentLogs:", err);
      return [];
    }
  },

  fetchMembershipPayments: () =>
    handleResponse(
      supabase.from('membership_payments')
        .select('*, memberships(*, members(id, name)), payment_methods(name)')
        .order('payment_date', { ascending: false }),
      'fetchMembershipPayments'
    ),

  savePaymentLog: async (log) => {
    // ── Double-click / duplicate-request guard ───────────────────────────────
    // Build a fingerprint from the key fields that uniquely identify a payment.
    // If the exact same fingerprint is already being processed, drop the call.
    const fingerprint = [
      log.memberId || log.member_id || log.visitor_id || '',
      String(Number(log.amount) || 0),
      log.paymentPurpose || log.payment_purpose || 'One Day Payment',
      Math.floor(Date.now() / 3000) // 3-second dedup window
    ].join('|');

    if (_inflightPayments.has(fingerprint)) {
      console.warn('[savePaymentLog] Duplicate call detected, skipping:', fingerprint);
      return null;
    }
    _inflightPayments.add(fingerprint);
    setTimeout(() => _inflightPayments.delete(fingerprint), 3000);
    // ────────────────────────────────────────────────────────────────────────
    try {
      const paymentModeStr = log.paymentMode || log.payment_mode || 'Cash';
      const { data: pm } = await supabase.from('payment_methods').select('id').eq('name', paymentModeStr).maybeSingle();
      const paymentMethodId = pm?.id || (paymentModeStr === 'Online' ? 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d' : 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c');

      const targetMemberId = log.memberId || log.member_id || log.visitor_id;
      const targetAmount = Number(log.amount) || 0;
      const purpose = log.paymentPurpose || log.payment_purpose || 'One Day Payment';

      if (purpose === 'One Day Payment') {
        const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
        const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

        const isVisitor = log.source === 'visitor';
        const insertRow = {
          club_id: clubId,
          amount: targetAmount,
          total_amount: Number(log.totalAmount) || targetAmount,
          due_amount: Number(log.due) || 0,
          payment_method_id: paymentMethodId,
          payment_date: new Date().toISOString(),
          received_by: log.receivedBy || log.received_by || null
        };
        if (isVisitor) {
          insertRow.visitor_id = targetMemberId;
        } else {
          insertRow.member_id = targetMemberId;
        }

        return handleResponse(
          supabase.from('one_day_payments').insert([insertRow]).select(),
          'savePaymentLog (one_day_payments)'
        );
      } else {
        // Find active membership to associate subscription payment
        const { data: membership } = await supabase.from('memberships')
          .select('id')
          .eq('member_id', targetMemberId)
          .eq('status', 'Active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const activeMembId = membership?.id || (
          // Fallback to latest membership if no active found
          await supabase.from('memberships')
            .select('id')
            .eq('member_id', targetMemberId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ).data?.id;

        if (!activeMembId) {
          console.warn(`No membership found for member ${targetMemberId} to log payment.`);
          return null;
        }

        // Retrieve current paid_amount of the membership
        const { data: currMemb } = await supabase.from('memberships')
          .select('paid_amount')
          .eq('id', activeMembId)
          .maybeSingle();

        // Only auto-update memberships.paid_amount for generic 'Subscription' payments
        // where no other caller has already set the correct paid_amount.
        // For 'New Membership'    → createMembership already wrote initial paid_amount
        // For 'Due Payment'       → updateMembership already updated paid_amount
        // For 'Membership Renewal'→ renewMembership/updateMembership already updated paid_amount
        // For 'Extra Shake Payment'→ caller handles separately
        const purposesWhereCallerHandlesPaidAmount = [
          'New Membership', 'Due Payment', 'Membership Renewal', 'Extra Shake Payment'
        ];
        if (!purposesWhereCallerHandlesPaidAmount.includes(purpose)) {
          const currentPaid = Number(currMemb?.paid_amount) || 0;
          const newPaid = currentPaid + targetAmount;

          // Update the membership paid_amount to trigger due_amount recalculation
          await supabase.from('memberships')
            .update({ paid_amount: newPaid, updated_at: new Date().toISOString() })
            .eq('id', activeMembId);
        }

        return handleResponse(
          supabase.from('membership_payments').insert([{
            membership_id: activeMembId,
            amount: targetAmount,
            payment_method_id: paymentMethodId,
            payment_date: new Date().toISOString(),
            received_by: log.receivedBy || log.received_by || null
          }]).select(),
          'savePaymentLog (membership_payments)'
        );
      }
    } catch (err) {
      console.error("Error in savePaymentLog:", err);
      throw err;
    }
  },

  // ─── ACTIVITY/AUDIT LOGS ───
  fetchActivityLogs: () =>
    handleResponse(supabase.from('activity_logs').select('*, profiles(id, full_name)').order('timestamp', { ascending: false }), 'fetchActivityLogs'),

  saveActivityLog: (log) => {
    // Map human-readable action strings to public.record_action_type ENUM
    const actionMapping = {
      'Visitor Created': 'INSERT',
      'Visitor Edited': 'UPDATE',
      'Automatic Transfer to Closing': 'UPDATE',
      'Status Changes (Closed/Pending)': 'STATUS_CHANGE',
      'Delete Request': 'UPDATE',
      'Undo Delete': 'UPDATE',
      'Shake Updated': 'UPDATE',
      'Membership Renewed': 'MEMBERSHIP_RENEWAL',
      'Membership Created': 'MEMBERSHIP_CREATE'
    };

    const enumAction = actionMapping[log.action_type || log.action] || log.action_type || log.action || 'INSERT';

    return handleResponse(
      supabase.from('activity_logs').insert([{
        table_name: log.table_name || 'members',
        record_id: log.customer_id || log.customerId || log.record_id,
        action: enumAction,
        new_values: {
          description: log.action_description || log.action_name,
          original_action: log.action_type
        },
        performed_by: log.performed_by || null
      }]).select(),
      'saveActivityLog'
    );
  },

  // ─── CLOSINGS (CLOSING FOLLOW-UPS) ───
  fetchClosings: () =>
    handleResponse(supabase.from('closing_followups').select('*, profiles:created_by(id, full_name)'), 'fetchClosings'),

  createClosingRecord: (record) =>
    handleResponse(supabase.from('closing_followups').insert([record]).select().single(), 'createClosingRecord'),

  updateClosingRecord: (id, updates) =>
    handleResponse(supabase.from('closing_followups').update(updates).eq('id', id).select().single(), 'updateClosingRecord'),

  deleteClosingRecord: (id) =>
    handleResponse(supabase.from('closing_followups').delete().eq('id', id), 'deleteClosingRecord'),

  saveLoginLog: (log) => Promise.resolve([]),
};

