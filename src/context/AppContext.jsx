import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getISTDateString, getISTTimeString, getISTShortDisplayDate } from '../utils/dateUtils';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { calculateNewMembership, calculateRenewalTotals, calculateDueAmount } from '../utils/calculations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Real User Session (Supabase Auth)
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceLocks, setAttendanceLocks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [closings, setClosings] = useState([]);
  const [otherClubMembers, setOtherClubMembers] = useState([]);
  const [memberActivityLogs, setMemberActivityLogs] = useState([]);
  const [shakeLogs, setShakeLogs] = useState([]);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [attendanceAuditLogs, setAttendanceAuditLogs] = useState([]);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState([]);
  const [settingsConfig, setSettingsConfig] = useState({
    welcomeMsg: true,
    renewalAlert: true,
    expiryAlert: true,
    phoneId: '109283748293748',
    twilioSid: 'AC8a2c1b4d3e5f6g7h8i9j0k1l2m3n4o5p',
    fromNumber: 'whatsapp:+14155238886',
    cronSchedule: '0 9 * * *'
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const customersRef = useRef([]);
  const visitorsRef = useRef([]);

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    visitorsRef.current = visitors;
  }, [visitors]);

  // ── Supabase Live Fetch & Initial Sync ───────────────────────────────────────
  // ── Supabase Live Fetch & Initial Sync ───────────────────────────────────────
  const loadSupabaseData = async () => {
    try {
      setDataLoading(true);
      const [
        dbCust,
        dbMemb,
        dbAtt,
        dbShk,
        dbPay,
        dbAct,
        dbCl,
        dbVis,
        dbMembPay,
        dbSettings,
        dbOtherVis,
        dbMembHist
      ] = await Promise.all([
        db.fetchCustomers().catch(e => { console.error("fetchCustomers error:", e); return []; }),
        db.fetchMemberships().catch(e => { console.error("fetchMemberships error:", e); return []; }),
        db.fetchAttendance().catch(e => { console.error("fetchAttendance error:", e); return []; }),
        db.fetchShakeLogs().catch(e => { console.error("fetchShakeLogs error:", e); return []; }),
        db.fetchPaymentLogs().catch(e => { console.error("fetchPaymentLogs error:", e); return []; }),
        db.fetchActivityLogs().catch(e => { console.error("fetchActivityLogs error:", e); return []; }),
        db.fetchClosings().catch(e => { console.error("fetchClosings error:", e); return []; }),
        db.fetchVisitors().catch(e => { console.error("fetchVisitors error:", e); return []; }),
        db.fetchMembershipPayments().catch(e => { console.error("fetchMembershipPayments error:", e); return []; }),
        db.fetchSettings().catch(e => { console.error("fetchSettings error:", e); return []; }),
        db.fetchOtherClubVisits().catch(e => { console.error("fetchOtherClubVisits error:", e); return []; }),
        db.fetchMembershipHistory().catch(e => { console.error("fetchMembershipHistory error:", e); return []; })
      ]);

      if (dbCust) {
        const mappedCustomers = dbCust.map(c => ({
          id: c.id,
          name: c.name,
          full_name: c.name,
          contact: c.mobile_number,
          mobile_number: c.mobile_number,
          whatsapp_number: c.whatsapp_number,
          dob: c.dob,
          gender: c.gender,
          profession: c.profession,
          referred_by: c.referral,
          address: c.address,
          joining_date: c.created_at?.split('T')[0],
          status: c.status,
          registration_date: c.created_at?.split('T')[0],
          created_by_name: c.profiles?.full_name || 'Admin',
          member_type: c.member_type || 'Member',
          purpose: c.purpose || ''
        }));
        setCustomers(mappedCustomers);
      }

      if (dbVis) {
        const mappedVisitors = dbVis.map(v => ({
          id: v.id,
          visitor_name: v.visitor_name,
          name: v.visitor_name,
          mobile_number: v.mobile_number,
          whatsapp_number: v.whatsapp_number,
          dob: v.dob,
          profession: v.profession,
          address: v.address,
          referred_by: v.referral,
          visit_date: v.created_at?.split('T')[0],
          visit_time: '12:00 PM',
          added_by_name: v.profiles?.full_name || 'Admin'
        }));
        setVisitors(mappedVisitors);
      }


      if (dbMemb) {
        const mappedMemberships = dbMemb.map(m => ({
          id: m.id,
          customerId: m.member_id,
          plan: m.plan,
          durationDays: m.duration_days,
          totalAmount: m.total_amount,
          advanceAmount: m.paid_amount,
          dueAmount: m.due_amount,
          startDate: m.start_date,
          endDate: m.end_date || getISTDateString(),
          status: m.status,
          payment_method: 'Cash',
          membershipType: m.membership_type || 'Shake'
        }));
        setMemberships(mappedMemberships);
      }

      if (dbAtt) {
        const mappedAttendance = dbAtt.map(a => ({
          id: a.id,
          customerId: a.member_id,
          date: a.date,
          status: a.attendance_status,
          checkIn: a.check_in_time,
          markedBy: a.profiles?.full_name || null,
          markedById: a.marked_by || null
        }));
        setAttendance(mappedAttendance);
      }

      if (dbShk) {
        const mapped = dbShk.map(s => {
          const name = s.source === 'visitor' 
            ? (dbVis?.find(x => x.id === s.personId)?.visitor_name || 'Visitor')
            : (dbCust?.find(x => x.id === s.personId)?.name || 'Member');
          return { ...s, personName: name, customerName: name };
        });
        setShakeLogs(mapped);
      }

      if (dbOtherVis) {
        setOtherClubMembers(dbOtherVis);
      }

      if (dbMembHist) {
        const mappedHistory = dbMembHist.map(h => ({
          id: h.id,
          membershipId: h.membership_id,
          memberId: h.member_id,
          plan: h.plan,
          durationDays: h.duration_days,
          totalAmount: h.total_amount,
          advancePaid: h.advance_paid,
          dueAmount: h.due_amount,
          timestamp: h.created_at,
          markedByName: h.marked_by_name || 'Admin',
          status: h.status,
          membershipType: h.membership_type || 'Shake'
        }));
        setMembershipHistory(mappedHistory);
      }


      if (dbPay) {
        setPaymentLogs(dbPay);
      }

      if (dbMembPay) {
        const mappedMembPay = dbMembPay.map(p => ({
          id: p.id,
          customerId: p.memberships?.members?.id || p.memberships?.member_id,
          memberName: p.memberships?.members?.name,
          amount: Number(p.amount) || 0,
          paymentMode: p.payment_methods?.name || (p.payment_method_id === 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d' ? 'Online' : 'Cash'),
          paymentPurpose: 'Subscription',
          plan: p.memberships?.plan || 'Subscription',
          date: p.payment_date ? getISTDateString(p.payment_date) : null,
          time: new Date(p.payment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          timestamp: p.payment_date
        }));
        setMemberPaymentHistory(mappedMembPay);
      }

      if (dbSettings && dbSettings.length > 0) {
        const loadedSettings = {};
        dbSettings.forEach(s => {
          let val = s.config_value;
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          loadedSettings[s.config_key] = val;
        });
        setSettingsConfig(prev => ({ ...prev, ...loadedSettings }));
      }

      if (dbAct) {
        const mappedActivity = dbAct.map(a => ({
          id: a.id,
          customerId: a.record_id,
          type: a.action,
          action_type: a.action,
          action_description: a.new_values?.description || '',
          timestamp: a.timestamp,
          performed_by_name: a.profiles?.full_name || 'Admin',
          staffId: a.profiles?.id || 'EMP-001',
          markedBy: a.profiles?.full_name || 'Admin',
          tableName: a.table_name
        }));
        setMemberActivityLogs(mappedActivity);
      }

      if (dbCl) {
        const mappedClosings = dbCl.map(c => {
          const vis = dbVis?.find(v => v.id === c.visitor_id);
          return {
            id: c.id,
            visitor_id: c.visitor_id,
            visitorId: c.visitor_id,
            visitor_name: c.remarks || '',
            visit_date: c.created_at?.split('T')[0],
            status: c.status,
            selected_type: c.status,
            created_by_user_name: vis?.profiles?.full_name || 'Admin',
            timestamp: c.created_at
          };
        });
        setClosings(mappedClosings);
      }


    } catch (err) {
      console.error('Supabase fetch failed:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Helper to ensure user profile exists in database
  const ensureProfileExists = async (sessionUser) => {
    try {
      const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
      const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
      if (!profile) {
        const { data: newProfile, error } = await supabase.from('profiles').insert([{
          id: sessionUser.id,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
          email: sessionUser.email,
          role: 'admin',
          club_id: clubId,
          status: 'Active'
        }]).select().single();
        if (error) {
          console.error("Error auto-inserting profile:", error);
        } else {
          console.log("Successfully created user profile in public.profiles:", newProfile);
          return {
            ...newProfile,
            name: newProfile.full_name
          };
        }
      } else {
        return {
          ...profile,
          name: profile.full_name
        };
      }
    } catch (e) {
      console.error("Failed to ensure user profile exists in public.profiles:", e);
    }
    return {
      id: sessionUser.id,
      role: 'admin',
      name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
      email: sessionUser.email
    };
  };

  // ── Supabase Auth Listener ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSessionData(session);
      if (session?.user) {
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSessionData(session);
      if (session?.user) {
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Supabase Realtime Subscriptions ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('supabase-realtime-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, async () => {
        try {
          const dbCust = await db.fetchCustomers();
          if (dbCust) {
            const mappedCustomers = dbCust.map(c => ({
              id: c.id,
              name: c.name,
              full_name: c.name,
              contact: c.mobile_number,
              mobile_number: c.mobile_number,
              whatsapp_number: c.whatsapp_number,
              dob: c.dob,
              gender: c.gender,
              profession: c.profession,
              referred_by: c.referral,
              address: c.address,
              joining_date: c.created_at?.split('T')[0],
              status: c.status,
              registration_date: c.created_at?.split('T')[0],
              created_by_name: c.profiles?.full_name || 'Admin',
              member_type: c.member_type || 'Member',
              purpose: c.purpose || ''
            }));
            setCustomers(mappedCustomers);
          }
        } catch (e) {
          console.error("Realtime members sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, async () => {
        try {
          const dbVis = await db.fetchVisitors();
          if (dbVis) {
            const mappedVisitors = dbVis.map(v => ({
              id: v.id,
              visitor_name: v.visitor_name,
              name: v.visitor_name,
              mobile_number: v.mobile_number,
              whatsapp_number: v.whatsapp_number,
              dob: v.dob,
              profession: v.profession,
              address: v.address,
              referred_by: v.referral,
              visit_date: v.created_at?.split('T')[0],
              visit_time: '12:00 PM',
              added_by_name: v.profiles?.full_name || 'Admin'
            }));
            setVisitors(mappedVisitors);
          }
        } catch (e) {
          console.error("Realtime visitors sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, async () => {
        try {
          const dbAtt = await db.fetchAttendance();
          if (dbAtt) {
            const mappedAttendance = dbAtt.map(a => ({
              id: a.id,
              customerId: a.member_id || a.visitor_id,
              date: a.date,
              status: a.attendance_status,
              checkIn: a.check_in_time,
              markedBy: a.marked_by_name || null,
              markedById: a.marked_by || null
            }));
            setAttendance(mappedAttendance);
          }
        } catch (e) {
          console.error("Realtime attendance sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shake_logs' }, async () => {
        try {
          const dbShk = await db.fetchShakeLogs();
          setShakeLogs(prev => {
            return dbShk.map(s => {
              const name = s.source === 'visitor'
                ? (visitorsRef.current.find(x => x.id === s.personId)?.visitor_name || 'Visitor')
                : (customersRef.current.find(x => x.id === s.personId)?.name || 'Member');
              return { ...s, personName: name, customerName: name };
            });
          });
        } catch (e) {
          console.error("Realtime shake logs sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships' }, async () => {
        try {
          const dbMemb = await db.fetchMemberships();
          if (dbMemb) {
            const mappedMemberships = dbMemb.map(m => ({
              id: m.id,
              customerId: m.member_id,
              plan: m.plan,
              durationDays: m.duration_days,
              totalAmount: m.total_amount,
              advanceAmount: m.paid_amount,
              dueAmount: m.due_amount,
              startDate: m.start_date,
              endDate: m.end_date || getISTDateString(),
              status: m.status,
              payment_method: 'Cash',
              membershipType: m.membership_type || 'Shake'
            }));
            setMemberships(mappedMemberships);
          }
        } catch (e) {
          console.error("Realtime memberships sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'closing_followups' }, async () => {
        try {
          const dbCl = await db.fetchClosings();
          if (dbCl) {
            const dbVis = await db.fetchVisitors();
            const mappedClosings = dbCl.map(c => {
              const vis = dbVis?.find(v => v.id === c.visitor_id);
              return {
                id: c.id,
                visitor_id: c.visitor_id,
                visitorId: c.visitor_id,
                visitor_name: c.remarks || '',
                visit_date: c.created_at?.split('T')[0],
                status: c.status,
                selected_type: c.status,
                created_by_user_name: vis?.profiles?.full_name || 'Admin',
                timestamp: c.created_at
              };
            });
            setClosings(mappedClosings);
          }
        } catch (e) {
          console.error("Realtime closings sync failed:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'one_day_payments' }, async () => {
        try {
          const dbPay = await db.fetchPaymentLogs();
          setPaymentLogs(dbPay);
        } catch (e) {
          console.error("Realtime sync failed for one_day_payments:", e);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_payments' }, async () => {
        try {
          const dbPay = await db.fetchPaymentLogs();
          setPaymentLogs(dbPay);
          const dbMembPay = await db.fetchMembershipPayments();
          if (dbMembPay) {
            const mappedMembPay = dbMembPay.map(p => ({
              id: p.id,
              customerId: p.memberships?.members?.id || p.memberships?.member_id,
              memberName: p.memberships?.members?.name,
              amount: Number(p.amount) || 0,
              paymentMode: p.payment_methods?.name || (p.payment_method_id === 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d' ? 'Online' : 'Cash'),
              paymentPurpose: 'Subscription',
              plan: p.memberships?.plan || 'Subscription',
              date: p.payment_date ? getISTDateString(p.payment_date) : null,
              time: new Date(p.payment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
              timestamp: p.payment_date
            }));
            setMemberPaymentHistory(mappedMembPay);
          }
        } catch (e) {
          console.error("Realtime sync failed for membership_payments:", e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Activity Log ─────────────────────────────────────────────────────────────
  const addActivityLog = (customerId, logEntry) => {
    const istDate = getISTDateString();
    const istTime = getISTTimeString();
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      customerId,
      date: istDate,
      time: istTime,
      timestamp: new Date().toISOString(),
      markedBy: user?.name || 'Admin',
      staffId: user?.id || 'EMP-001',
      ...logEntry
    };
    try {
      db.saveActivityLog({
        customer_id: customerId,
        type: logEntry.type,
        action_type: logEntry.action_type || '',
        action_description: logEntry.action_description || '',
        performed_by: user?.id || null
      });
    } catch (e) {
      console.warn('Supabase saveActivityLog failed:', e);
    }
    setMemberActivityLogs(prev => [entry, ...prev]);

    // Auto-sync shake entries to the unified shake log
    if (logEntry.type === 'shake') {
      const customer = null; // resolved at callsite if needed
      setShakeLogs(prev => [{
        id: entry.id + '_shake',
        source: 'member',
        personId: customerId,
        personName: logEntry.customerName || customerId,
        item: logEntry.item,
        date: istDate,
        time: istTime,
        timestamp: entry.timestamp,
        staffName: user?.name || 'Admin',
      }, ...prev]);
    }

    // Auto-sync payment entries to the payment log
    if (logEntry.type === 'payment') {
      setPaymentLogs(prev => [{
        id: entry.id + '_pay',
        memberId: customerId,
        memberName: logEntry.memberName || customerId,
        amount: logEntry.amount,
        paymentMode: logEntry.paymentMethod || 'Cash',
        paymentPurpose: 'One Day Payment',
        date: istDate,
        time: istTime,
        timestamp: entry.timestamp,
        staffName: user?.name || 'Admin',
        staffId: user?.id || 'EMP-001',
        note: logEntry.note,
        status: logEntry.status,
      }, ...prev]);
    }

    return entry;
  };

  const getMemberActivityLogs = (customerId) => {
    return memberActivityLogs.filter(l => l.customerId === customerId);
  };

  // ── Attendance Audit Helper ──────────────────────────────────────────────────
  const addAttendanceAudit = (customerId, customerName, prevStatus, newStatus) => {
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      customerId,
      customerName,
      prevStatus,
      newStatus,
      date: getISTDateString(),
      time: getISTTimeString(),
      timestamp: new Date().toISOString(),
      adminName: user?.name || 'Admin',
      adminId: user?.id || 'EMP-001',
    };
    setAttendanceAuditLogs(prev => [entry, ...prev]);
    return entry;
  };

  // ── Member Payment Record Helper ─────────────────────────────────────────────
  const addMemberPaymentRecord = (customerId, payload) => {
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      customerId,
      timestamp: new Date().toISOString(),
      adminName: user?.name || 'Admin',
      adminId: user?.id || 'EMP-001',
      ...payload,
    };
    setMemberPaymentHistory(prev => [entry, ...prev]);
    return entry;
  };

  // ─── Shake Type label resolver (ID → label) ─────────────────────────────────
  const SHAKE_TYPE_MAP = {
    'S':   'Shake',
    'SB':  'Shake + Beta Heart',
    'SF':  'Shake + Fiber',
    'SBF': 'Shake + Beta + Fiber',
    'D':   'Dino',
  };

  // ── Shake Helpers ────────────────────────────────────────────────────────────
  const addShakeLog = async (entry) => {
    const istDate = getISTDateString();
    const istTime = getISTTimeString();

    // Resolve shake label: if item is a short ID ('S', 'SB', etc.), convert to full label
    const resolvedItem = SHAKE_TYPE_MAP[entry.item] || entry.item;
    
    console.log("addShakeLog called with entry:", entry, "→ resolved item:", resolvedItem);
    try {
      const response = await db.saveShakeLog({
        personId: entry.personId,
        source: entry.source || 'member',
        item: resolvedItem,
        quantity: Number(entry.quantity),
        date: entry.date || istDate,
        time: entry.time || istTime,
        club_id: entry.club_id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84',
        marked_by: user?.id || null
      });

      // Refetch shake logs from database on success to keep state in sync with DB
      const dbShk = await db.fetchShakeLogs();
      const mapped = dbShk.map(s => {
        const name = s.source === 'visitor' 
          ? (visitors.find(x => x.id === s.personId)?.visitor_name || 'Visitor')
          : (customers.find(x => x.id === s.personId)?.name || 'Member');
        return { ...s, personName: name, customerName: name };
      });
      setShakeLogs(mapped);

      return response;
    } catch (e) {
      console.error('Failed to save shake log in Supabase:', e);
      throw e;
    }
  };

  const updateVisitorShake = async (visitorId, dateStr, shakeId, visitorName) => {
    const SHAKE_TYPES = [
      { id: 'S',   label: 'Shake' },
      { id: 'SB',  label: 'Shake + Beta Heart' },
      { id: 'SF',  label: 'Shake + Fiber' },
      { id: 'SBF', label: 'Shake + Beta + Fiber' },
      { id: 'D',   label: 'Dino' },
    ];

    try {
      const shakeType = SHAKE_TYPES.find(st => st.id === shakeId);
      const shakeLabel = shakeType ? shakeType.label : 'Shake';
      
      await addShakeLog({
        personId: visitorId,
        source: 'visitor',
        item: shakeLabel,
        quantity: shakeId ? 1 : 0,
        date: dateStr,
      });

      addActivityLog(visitorId, {
        customerName: visitorName,
        type: 'visitor_audit',
        action_type: 'Shake Updated',
        action_description: `Shake type updated to ${shakeId ? SHAKE_TYPES.find(st => st.id === shakeId)?.label : 'None'}`,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to save visitor shake:", e);
      throw e;
    }
  };

  const getConsumedShakes = (customerId) => {
    // Primary: read from DB-backed shakeLogs (MEMBER type)
    const fromShakeLogs = shakeLogs
      .filter(s => s.personId === customerId && s.source === 'member')
      .reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);
    // Fallback to in-memory memberActivityLogs if shakeLogs is empty (initial load)
    if (fromShakeLogs > 0 || shakeLogs.some(s => s.personId === customerId)) {
      return fromShakeLogs;
    }
    return memberActivityLogs
      .filter(l => l.customerId === customerId && l.type === 'shake')
      .reduce((sum, l) => sum + (Number(l.quantity) || 1), 0);
  };

  const getMembershipShakeStatus = (membership) => {
    const consumed = getConsumedShakes(membership.customerId);
    const allocated = Number(membership.durationDays) || 0;
    const remaining = Math.max(0, allocated - consumed);
    const isExpired = allocated > 0 && consumed >= allocated;
    // Last shake date – read from DB-backed shakeLogs first
    const memberShakeLogs = shakeLogs
      .filter(s => s.personId === membership.customerId && s.source === 'member')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastShakeDate = memberShakeLogs[0]?.date || null;
    return { consumed, allocated, remaining, isExpired, lastShakeDate };
  };

  // ── Payment Log ──────────────────────────────────────────────────────────────
  const addPaymentLog = (entry) => {
    const istDate = getISTDateString();
    const istTime = getISTTimeString();
    const log = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: istDate,
      time: istTime,
      timestamp: new Date().toISOString(),
      staffName: user?.name || 'Admin',
      staffId: user?.id || 'EMP-001',
      received_by_name: user?.name || 'Admin',
      received_by_id: user?.id || '—',
      ...entry
    };
    try {
      db.savePaymentLog({
        member_id: entry.memberId,
        amount: Number(entry.amount) || 0,
        payment_mode: entry.paymentMode || 'Cash',
        payment_purpose: entry.paymentPurpose || 'One Day Payment',
        plan: entry.plan || '',
        date: entry.date || istDate,
        time: istTime,
        totalAmount: entry.totalAmount,
        due: entry.due,
        receivedBy: user?.id
      });
    } catch (e) {
      console.warn('Supabase savePaymentLog failed:', e);
    }
    setPaymentLogs(prev => [log, ...prev]);
    return log;
  };

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const currentUser = user;
  const currentRole = user?.role || null;
  const isAuthenticated = !!user;
  const session = sessionData;

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      let userProfile = null;
      try {
        const fetchedProfile = await db.fetchUserProfile(data.user.id);
        if (fetchedProfile && fetchedProfile.status !== 'Active') {
          await supabase.auth.signOut();
          throw new Error('Your account is inactive. Please contact support.');
        }
        if (fetchedProfile) {
          userProfile = {
            ...fetchedProfile,
            name: fetchedProfile.full_name
          };
        }
      } catch (profileErr) {
        // Fallback user if profile table not migrated
        userProfile = {
          id: data.user.id,
          role: 'admin',
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email
        };
      }

      setUser(userProfile);

      // Reload all data for this admin session
      loadSupabaseData();
      
      // Log login success
      await db.saveLoginLog({
        user_id: data.user.id,
        email,
        role: userProfile?.role || 'admin',
        status: 'Success',
        device_info: navigator.userAgent,
        browser: 'Browser'
      }).catch(() => {});

      return { data, error: null };
    } catch (err) {
      await db.saveLoginLog({
        email,
        status: 'Failed',
        error_message: err.message,
        device_info: navigator.userAgent
      }).catch(() => {});

      return { data: null, error: err };
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email, password, profileData) => {
    setAuthLoading(true);
    try {
      // 1. Sign up in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${profileData.first_name} ${profileData.last_name}`,
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed - no user returned');

      // 2. Fetch default club id
      const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
      const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

      // 3. Insert profile record
      const fullName = `${profileData.first_name} ${profileData.last_name}`;
      const { data: newProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          full_name: fullName,
          email,
          mobile_number: profileData.mobile_number,
          whatsapp_number: profileData.whatsapp_number,
          dob: profileData.dob,
          gender: profileData.gender,
          profession: profileData.profession,
          purpose_of_joining: profileData.purpose_of_joining,
          role: 'admin',
          club_id: clubId,
          referred_by: profileData.referred_by,
          address: profileData.address,
          status: 'Active'
        }])
        .select()
        .single();

      if (profileErr) throw profileErr;

      // 4. If they chose Member, also insert into public.members table
      if (profileData.membership_type === 'Member') {
        const { error: memberErr } = await supabase
          .from('members')
          .insert([{
            id: data.user.id,
            club_id: clubId,
            name: fullName,
            mobile_number: profileData.mobile_number,
            whatsapp_number: profileData.whatsapp_number,
            dob: profileData.dob,
            gender: profileData.gender,
            profession: profileData.profession,
            referral: profileData.referred_by,
            member_type: 'Member',
            address: profileData.address,
            status: 'Active'
          }]);
        if (memberErr) console.error('Error inserting member record:', memberErr);
      }

      const mappedProfile = {
        ...newProfile,
        name: newProfile.full_name
      };

      setUser(mappedProfile);
      return { data, error: null };
    } catch (err) {
      console.error('Signup failed:', err);
      return { data: null, error: err };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSessionData(null);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?type=recovery`
    });
  };

  const updatePassword = async (newPassword) => {
    return supabase.auth.updateUser({ password: newPassword });
  };

  // ── Customer CRUD ────────────────────────────────────────────────────────────
  const addCustomer = async (customerData) => {
    try {
      const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
      const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

      const created = await db.createCustomer({
        club_id: clubId,
        name: customerData.name || customerData.full_name,
        mobile_number: customerData.mobile_number || customerData.contact || '',
        whatsapp_number: customerData.whatsapp_number || customerData.mobile_number || '',
        dob: customerData.dob || null,
        gender: customerData.gender || 'Male',
        profession: customerData.profession || '',
        member_type: customerData.member_type || 'Member',
        purpose: customerData.purpose || '',
        referral: customerData.referred_by || customerData.referral || '',
        address: customerData.address || '',
        status: 'Active',
        created_by: user?.id || null
      });

      if (created) {
        const mapped = {
          id: created.id,
          name: created.name,
          full_name: created.name,
          contact: created.mobile_number,
          mobile_number: created.mobile_number,
          whatsapp_number: created.whatsapp_number,
          dob: created.dob,
          gender: created.gender,
          profession: created.profession,
          member_type: created.member_type || 'Member',
          purpose: created.purpose || '',
          referred_by: created.referral,
          address: created.address,
          joining_date: created.created_at?.split('T')[0],
          status: created.status,
          registration_date: created.created_at?.split('T')[0],
          created_by_name: user?.name || 'Admin'
        };
        setCustomers(prev => [mapped, ...prev]);
        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase createCustomer sync failed:', e);
      throw e;
    }
  };

  const updateCustomer = async (customerId, updates) => {
    let id = typeof customerId === 'object' ? customerId.id : customerId;
    try {
      const updated = await db.updateCustomer(id, {
        name: updates.name,
        mobile_number: updates.mobile_number || updates.contact,
        whatsapp_number: updates.whatsapp_number,
        dob: updates.dob || null,
        gender: updates.gender,
        profession: updates.profession,
        member_type: updates.member_type,
        purpose: updates.purpose,
        referral: updates.referred_by || updates.referral,
        address: updates.address,
        status: updates.status || 'Active'
      });
      if (updated) {
        const existing = customers.find(c => c.id === id);
        const mapped = {
          id: updated.id,
          name: updated.name,
          full_name: updated.name,
          contact: updated.mobile_number,
          mobile_number: updated.mobile_number,
          whatsapp_number: updated.whatsapp_number,
          dob: updated.dob,
          gender: updated.gender,
          profession: updated.profession,
          member_type: updated.member_type || 'Member',
          purpose: updated.purpose || '',
          referred_by: updated.referral,
          address: updated.address,
          joining_date: updated.created_at?.split('T')[0],
          status: updated.status,
          registration_date: updated.created_at?.split('T')[0],
          created_by_name: existing?.created_by_name || 'Admin'
        };
        setCustomers(prev => prev.map(c => c.id === id ? mapped : c));
        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase updateCustomer sync failed:', e);
      throw e;
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      await db.deleteCustomer(customerId, user?.id || null);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return { error: null };
    } catch (e) {
      console.error('Supabase deleteCustomer sync failed:', e);
      throw e;
    }
  };

  // ── Visitor CRUD ─────────────────────────────────────────────────────────────
  const addVisitor = async (visitorData) => {
    try {
      const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
      const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

      const created = await db.createVisitor({
        club_id: clubId,
        visitor_name: visitorData.visitor_name || visitorData.name,
        mobile_number: visitorData.mobile_number || '',
        whatsapp_number: visitorData.whatsapp_number || visitorData.mobile_number || '',
        dob: visitorData.dob || null,
        profession: visitorData.profession || '',
        address: visitorData.address || '',
        referral: visitorData.referred_by || visitorData.referral || '',
        created_by: user?.id || null
      });

      if (created) {
        const mapped = {
          id: created.id,
          visitor_name: created.visitor_name,
          name: created.visitor_name,
          mobile_number: created.mobile_number,
          whatsapp_number: created.whatsapp_number,
          dob: created.dob,
          profession: created.profession,
          address: created.address,
          referred_by: created.referral,
          visit_date: created.created_at?.split('T')[0],
          visit_time: '12:00 PM',
          added_by_name: user?.name || 'Admin'
        };
        setVisitors(prev => [mapped, ...prev]);

        addActivityLog(mapped.id, {
          customerName: mapped.visitor_name,
          type: 'visitor_audit',
          action_type: 'Visitor Created',
          action_description: `Created visitor record for ${mapped.visitor_name}`,
          performed_by_name: user?.name || 'Admin',
          timestamp: new Date().toISOString(),
        });

        return { data: mapped, error: null };
      }
    } catch (e) {
      console.error('Supabase addVisitor failed:', e);
      throw e;
    }
  };

  const updateVisitor = async (id, updates) => {
    try {
      const updated = await db.updateVisitor(id, {
        visitor_name: updates.visitor_name || updates.name,
        mobile_number: updates.mobile_number,
        whatsapp_number: updates.whatsapp_number,
        dob: updates.dob || null,
        profession: updates.profession,
        address: updates.address,
        referral: updates.referred_by || updates.referral
      });

      if (updated) {
        const existing = visitors.find(v => v.id === id);
        const mapped = {
          id: updated.id,
          visitor_name: updated.visitor_name,
          name: updated.visitor_name,
          mobile_number: updated.mobile_number,
          whatsapp_number: updated.whatsapp_number,
          dob: updated.dob,
          profession: updated.profession,
          address: updated.address,
          referred_by: updated.referral,
          visit_date: updated.created_at?.split('T')[0],
          visit_time: '12:00 PM',
          added_by_name: existing?.added_by_name || 'Admin'
        };
        setVisitors(prev => prev.map(v => v.id === id ? mapped : v));

        addActivityLog(id, {
          customerName: mapped.visitor_name,
          type: 'visitor_audit',
          action_type: 'Visitor Edited',
          action_description: `Edited visitor details for ${mapped.visitor_name}`,
          performed_by_name: user?.name || 'Admin',
          timestamp: new Date().toISOString(),
        });

        return { data: mapped, error: null };
      }
    } catch (e) {
      console.error('Supabase updateVisitor failed:', e);
      throw e;
    }
  };

  const deleteVisitor = async (id) => {
    try {
      await db.deleteVisitor(id, user?.id || null);
      setVisitors(prev => prev.filter(v => v.id !== id));
      return { error: null };
    } catch (e) {
      console.error('Supabase deleteVisitor failed:', e);
      throw e;
    }
  };

  const undoDeleteVisitor = async (id) => {
    try {
      const restored = await db.undoDeleteVisitor(id);
      if (restored) {
        const existing = visitors.find(v => v.id === id);
        const mapped = {
          id: restored.id,
          visitor_name: restored.visitor_name,
          name: restored.visitor_name,
          mobile_number: restored.mobile_number,
          whatsapp_number: restored.whatsapp_number,
          dob: restored.dob,
          profession: restored.profession,
          address: restored.address,
          referred_by: restored.referral,
          visit_date: restored.created_at?.split('T')[0],
          visit_time: '12:00 PM',
          added_by_name: existing?.added_by_name || 'Admin'
        };
        setVisitors(prev => prev.map(v => v.id === id ? mapped : v));
        return { error: null };
      }
    } catch (e) {
      console.error('Supabase undoDeleteVisitor failed:', e);
      throw e;
    }
  };

  // ── Automatic Workflow for Visitors -> Closing ────────────────────────────────
  useEffect(() => {
    if (!visitors || visitors.length === 0) return;
    const today = getISTDateString();
    
    // Find past visitors who haven't been moved to closing yet
    const pastVisitors = visitors.filter(v => v.visit_date < today && !v.movedToClosing);
    
    if (pastVisitors.length > 0) {
      // Add them to closings
      setClosings(prevClosings => {
        const newClosings = [...prevClosings];
        pastVisitors.forEach(v => {
          const exists = newClosings.some(c => c.visitor_id === v.id || c.id === 'cl_' + v.id);
          if (!exists) {
            newClosings.push({
              id: 'cl_' + v.id,
              visitor_id: v.id,
              visitor_name: v.visitor_name || v.name,
              visit_date: v.visit_date,
              status: 'Pending',
              selected_type: 'Pending',
              created_by_user_name: 'Auto-Workflow',
              timestamp: new Date().toISOString()
            });
          }
        });
        return newClosings;
      });

      // Mark as moved in visitors list & write audit trail entries
      setVisitors(prev => prev.map(v => {
        if (v.visit_date < today && !v.movedToClosing) {
          // Record the audit trail entry
          addActivityLog(v.id, {
            customerName: v.visitor_name || v.name,
            type: 'visitor_audit',
            action_type: 'Automatic Transfer to Closing',
            action_description: `Automatically moved visitor ${v.visitor_name || v.name} to Closing module (visit date was ${v.visit_date})`,
            performed_by_name: 'System Auto-Workflow',
            timestamp: new Date().toISOString(),
          });
          return { ...v, movedToClosing: true, moved_to_closing_at: new Date().toISOString() };
        }
        return v;
      }));
    }
  }, [visitors]);

  // ── Attendance ───────────────────────────────────────────────────────────────
  const updateAttendance = async (record) => {
    const markerName = record.markedByName || user?.name || user?.email?.split('@')[0] || 'Admin';
    const markerId = user?.id || null;
    const mappedRecord = { ...record, markedBy: markerName, updated_at: new Date().toISOString() };
    try {
      await db.updateAttendanceRecord({
        customerId: record.customerId,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn || '-',
        markedBy: markerId,
        markedByName: markerName
      });
    } catch (e) {
      console.warn('Supabase updateAttendance sync failed:', e);
    }
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.customerId === record.customerId && a.date === record.date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...prev[idx], ...mappedRecord };
        return updated;
      }
      return [...prev, mappedRecord];
    });
  };

  const logShakePayment = async (customerId, remark, days, totalAmount, paymentStatus = 'Paid', advanceAmount = 0, dueAmount = 0, paymentMethod = 'Cash', shakeDate = null) => {
    return { data: {}, error: null };
  };

  const logVisitorShakePayment = async (visitorId, payload) => {
    return { data: {}, error: null };
  };

  const finalizeAttendance = async (dateStr) => {
    const newLock = { id: Date.now().toString(), date: dateStr, is_locked: true, locked_by_name: user?.name || 'Admin' };
    setAttendanceLocks(prev => [...prev, newLock]);
  };
  
  const fetchMonthlyAttendance = async (year, month) => attendance;

  // ── Memberships ──────────────────────────────────────────────────────────────
  const addMembership = async (membershipData) => {
    try {
      // 1. Prevent Duplicate Memberships
      const existingMembership = memberships.find(m => m.customerId === membershipData.customerId);
      if (existingMembership) {
        return await renewMembership(existingMembership.id, membershipData);
      }

      const calc = calculateNewMembership(membershipData);

      const created = await db.createMembership({
        member_id: membershipData.customerId,
        plan: membershipData.plan,
        duration_days: calc.duration_days,
        total_shake_limit: calc.duration_days,
        total_amount: calc.total_amount,
        paid_amount: calc.paid_amount,
        payment_status: calc.payment_status,
        start_date: membershipData.startDate || getISTDateString(),
        status: 'Active',
        membership_type: membershipData.membershipType || 'Shake'
      });

      if (created) {
        const mapped = {
          id: created.id,
          customerId: created.member_id,
          plan: created.plan,
          durationDays: created.duration_days,
          totalAmount: created.total_amount,
          advanceAmount: created.paid_amount,
          dueAmount: created.due_amount,
          startDate: created.start_date,
          status: created.status,
          payment_method: membershipData.paymentMethod || 'Cash',
          membershipType: created.membership_type || membershipData.membershipType || 'Shake'
        };
        setMemberships(prev => [mapped, ...prev]);

        // Create History Entry
        const historyRecord = {
          membership_id: created.id,
          member_id: created.member_id,
          plan: created.plan,
          duration_days: calc.duration_days,
          total_shake_limit: calc.duration_days,
          consumed_shakes: 0,
          start_date: created.start_date,
          status: 'Active',
          total_amount: calc.total_amount,
          advance_paid: calc.paid_amount,
          due_amount: calc.due_amount,
          marked_by: user?.id || null,
          marked_by_name: user?.name || user?.email?.split('@')[0] || 'Admin',
          membership_type: created.membership_type || membershipData.membershipType || 'Shake'
        };
        const savedHistory = await db.logMembershipHistory(historyRecord);
        if (savedHistory) {
          setMembershipHistory(prev => [{
            id: savedHistory.id,
            membershipId: savedHistory.membership_id,
            memberId: savedHistory.member_id,
            plan: savedHistory.plan,
            durationDays: savedHistory.duration_days,
            totalAmount: savedHistory.total_amount,
            advancePaid: savedHistory.advance_paid,
            dueAmount: savedHistory.due_amount,
            markedBy: savedHistory.marked_by,
            markedByName: savedHistory.marked_by_name,
            timestamp: savedHistory.created_at,
            membershipType: savedHistory.membership_type || 'Shake'
          }, ...prev]);
        }

        if (calc.paid_amount > 0) {
          addPaymentLog({
            memberId: created.member_id,
            memberName: membershipData.customerName,
            amount: calc.paid_amount,
            paymentMode: membershipData.paymentMethod || 'Cash',
            paymentPurpose: 'New Membership',
            plan: created.plan,
          });
        }

        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase createMembership failed:', e);
      throw e;
    }
  };
  
  const renewMembership = async (membershipId, data) => {
    const fresh = memberships.find(m => m.id === membershipId);
    if (!fresh) throw new Error('Membership not found');

    const calc = calculateRenewalTotals(fresh, data);

    try {
      const updated = await db.updateMembership(membershipId, {
        plan: calc.planName,
        duration_days: calc.newTotalDuration,
        total_amount: calc.newTotalAmount,
        paid_amount: calc.newPaidAmount,
        status: 'Active',
        membership_type: data.membershipType || fresh.membershipType || 'Shake'
      });

      if (updated) {
        const mapped = {
          id: updated.id,
          customerId: updated.member_id,
          plan: updated.plan,
          durationDays: updated.duration_days,
          totalAmount: updated.total_amount,
          advanceAmount: updated.paid_amount,
          dueAmount: updated.due_amount,
          startDate: updated.start_date,
          status: updated.status,
          payment_method: data.paymentMethod || 'Cash',
          membershipType: updated.membership_type || data.membershipType || fresh.membershipType || 'Shake'
        };

        setMemberships(prev => prev.map(m => m.id === membershipId ? mapped : m));

        // Create History Entry for the extension
        const historyRecord = {
          membership_id: updated.id,
          member_id: updated.member_id,
          plan: calc.planName,
          duration_days: calc.addedDuration,
          total_shake_limit: calc.addedDuration,
          consumed_shakes: 0,
          start_date: getISTDateString(),
          status: 'Active',
          total_amount: calc.addedTotal,
          advance_paid: calc.addedAdvance,
          due_amount: calc.addedDue,
          marked_by: user?.id || null,
          marked_by_name: user?.name || user?.email?.split('@')[0] || 'Admin',
          membership_type: updated.membership_type || data.membershipType || fresh.membershipType || 'Shake'
        };
        const savedHistory = await db.logMembershipHistory(historyRecord);
        if (savedHistory) {
          setMembershipHistory(prev => [{
            id: savedHistory.id,
            membershipId: savedHistory.membership_id,
            memberId: savedHistory.member_id,
            plan: savedHistory.plan,
            durationDays: savedHistory.duration_days,
            totalAmount: savedHistory.total_amount,
            advancePaid: savedHistory.advance_paid,
            dueAmount: savedHistory.due_amount,
            markedBy: savedHistory.marked_by,
            markedByName: savedHistory.marked_by_name,
            timestamp: savedHistory.created_at,
            membershipType: savedHistory.membership_type || 'Shake'
          }, ...prev]);
        }

        if (calc.addedAdvance > 0) {
          addPaymentLog({
            memberId: fresh.customerId,
            memberName: fresh.customerName,
            amount: calc.addedAdvance,
            paymentMode: data.paymentMethod || 'Cash',
            paymentPurpose: 'Membership Renewal',
            plan: calc.planName,
            date: getISTDateString(),
            time: getISTTimeString()
          });
        }

        addActivityLog(fresh.customerId, {
          customerName: fresh.customerName,
          type: 'membership_renewed',
          action_type: 'Membership Renewed',
          action_description: `${user?.name || 'Admin'} renewed membership for ${fresh.customerName || 'member'} (Plan: ${calc.planName}, Paid: ₹${calc.addedAdvance})`,
          performed_by_name: user?.name || 'Admin',
          timestamp: new Date().toISOString(),
        });

        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase renewMembership failed:', e);
      throw e;
    }
  };
  
  const addNewMember = async (data) => {
    try {
      // 1. Check if customer with this mobile number already exists
      let createdCustomer = customers.find(c => c.mobile_number === data.mobile_number || c.contact === data.mobile_number);

      if (!createdCustomer) {
        // If they do not exist, create a new customer record
        const { data: custRes, error: custErr } = await addCustomer({
          name: data.full_name,
          mobile_number: data.mobile_number,
          whatsapp_number: data.whatsapp_number,
          dob: data.dob,
          gender: data.gender,
          profession: data.profession,
          referred_by: data.referred_by,
          address: data.address,
          member_type: data.member_type || 'Member',
          purpose: data.purpose || ''
        });

        if (custErr || !custRes || !custRes[0]) throw custErr || new Error('Failed to create customer');
        createdCustomer = custRes[0];
      }

      const durationDays = data.plan === 'Other' ? Number(data.custom_duration) : (data.plan === '1 Day' ? 1 : data.plan === '10 Days' ? 10 : data.plan === '30 Days' ? 30 : 30);
      const totalAmount = Number(data.total_amount) || 0;
      const advanceAmount = Number(data.advance_amount) || 0;
      const startDate = data.membership_start_date || getISTDateString();

      // 2. Check if this customer already has a membership
      const existingMemb = memberships.find(m => m.customerId === createdCustomer.id);

      if (existingMemb) {
        // If they already have a membership, renew it in place instead of creating a duplicate
        const res = await renewMembership(existingMemb.id, {
          plan: data.plan === 'Other' ? `${data.custom_duration} Days` : data.plan,
          durationDays,
          amount: totalAmount,
          advanceAmount,
          paymentMethod: data.paymentMethod || 'Cash',
          membershipType: data.membershipType
        });
        if (res.error) throw new Error(res.error);
        return { success: true, customer: createdCustomer, membership: res.data[0] };
      } else {
        // Otherwise, create a new membership
        const { data: membRes, error: membErr } = await addMembership({
          customerId: createdCustomer.id,
          customerName: createdCustomer.name,
          plan: data.plan === 'Other' ? `${data.custom_duration} Days` : data.plan,
          durationDays,
          totalAmount,
          advanceAmount,
          startDate,
          paymentMethod: data.paymentMethod || 'Cash',
          membershipType: data.membershipType
        });

        if (membErr || !membRes || !membRes[0]) throw membErr || new Error('Failed to create membership');
        const createdMembership = membRes[0];

        addActivityLog(createdCustomer.id, {
          customerName: createdCustomer.name,
          type: 'membership_created',
          action_type: 'Membership Created',
          action_description: `Enrolled in plan: ${createdMembership.plan} (Paid: ₹${advanceAmount})`,
          performed_by_name: user?.name || 'Admin',
          timestamp: new Date().toISOString(),
        });

        return { success: true, customer: createdCustomer, membership: createdMembership };
      }
    } catch (e) {
      console.error('addNewMember failed:', e);
      throw e;
    }
  };
  
  const convertVisitorToMember = async (visitor, addData) => {
    try {
      await db.deleteVisitor(visitor.id, user?.id || null);

      const { data: custRes, error: custErr } = await addCustomer({
        name: visitor.visitor_name || visitor.name,
        mobile_number: visitor.mobile_number,
        whatsapp_number: visitor.whatsapp_number,
        dob: visitor.dob,
        gender: addData.customerData?.gender || 'Male',
        profession: visitor.profession,
        referred_by: visitor.referred_by || visitor.referral || '',
        address: visitor.address
      });

      if (custErr || !custRes || !custRes[0]) throw custErr;
      const createdCustomer = custRes[0];

      if (addData.membershipData) {
        await addMembership({
          customerId: createdCustomer.id,
          customerName: createdCustomer.name,
          plan: addData.membershipData.plan,
          durationDays: addData.membershipData.durationDays,
          totalAmount: addData.membershipData.totalAmount,
          advanceAmount: addData.membershipData.advanceAmount,
          startDate: addData.membershipData.startDate || getISTDateString(),
          paymentMethod: addData.membershipData.paymentMethod || 'Cash'
        });
      }

      setVisitors(prev => prev.filter(v => v.id !== visitor.id));
      
      const closing = closings.find(c => c.visitor_id === visitor.id);
      if (closing) {
        await db.updateClosingRecord(closing.id, {
          status: 'Converted_to_Member',
          converted_to_member_id: createdCustomer.id
        });
      }

      return { success: true };
    } catch (e) {
      console.error('convertVisitorToMember failed:', e);
      throw e;
    }
  };

  const updateMembership = async (membershipId, updates) => {
    try {
      const updated = await db.updateMembership(membershipId, {
        plan: updates.plan,
        duration_days: updates.durationDays,
        total_amount: updates.totalAmount,
        paid_amount: updates.advanceAmount,
        status: updates.status
      });
      if (updated) {
        const mapped = {
          id: updated.id,
          customerId: updated.member_id,
          plan: updated.plan,
          durationDays: updated.duration_days,
          totalAmount: updated.total_amount,
          advanceAmount: updated.paid_amount,
          dueAmount: updated.due_amount,
          startDate: updated.start_date,
          status: updated.status,
          payment_method: 'Cash'
        };
        setMemberships(prev => prev.map(m => m.id === membershipId ? mapped : m));
        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase updateMembership failed:', e);
      throw e;
    }
  };

  const deleteMembership = async (membershipId) => {
    try {
      await db.deleteMembership(membershipId);
      setMemberships(prev => prev.filter(m => m.id !== membershipId));
      return { error: null };
    } catch (e) {
      console.error('Supabase deleteMembership failed:', e);
      throw e;
    }
  };

  const fetchMembershipActivityLogs = async (membershipId) => ({ data: [], error: null });
  const sendWhatsAppAlert = async (customerId, alertType, data) => true;

  // ── Closing CRUD ─────────────────────────────────────────────────────────────
  const addClosing = async (closingData) => {
    try {
      const created = await db.createClosingRecord({
        visitor_id: closingData.visitor_id || closingData.visitorId,
        visit_date: closingData.visit_date || getISTDateString(),
        status: closingData.status || 'Pending',
        selected_type: closingData.selected_type || 'Pending'
      });
      if (created) {
        const mapped = {
          id: created.id,
          visitor_id: created.visitor_id,
          visitorId: created.visitor_id,
          visitor_name: closingData.visitor_name,
          visit_date: created.visit_date,
          status: created.status,
          selected_type: created.selected_type,
          created_by_user_name: 'Admin',
          timestamp: created.created_at
        };
        setClosings(prev => [mapped, ...prev]);
        return { data: [mapped], error: null };
      }
    } catch (e) {
      console.error('Supabase createClosingRecord failed:', e);
      throw e;
    }
  };

  const updateClosing = async (id, updates) => {
    let visitorName = '';
    let visitorId = '';
    let updated;
    
    setClosings(prev => prev.map(c => {
      if (c.id === id || c.visitor_id === id) {
        visitorName = c.visitor_name;
        visitorId = c.visitor_id || c.visitorId;
        const lastUpdatedBy = user?.name || 'Admin';
        const lastUpdatedById = user?.id || 'ADM-001';
        
        if (updates.status && updates.status !== c.status) {
          addActivityLog(visitorId, {
            customerName: visitorName,
            type: 'visitor_audit',
            action_type: 'Status Changes (Closed/Pending)',
            action_description: `Status changed to ${updates.status} by ${lastUpdatedBy}`,
            performed_by_name: lastUpdatedBy,
            timestamp: new Date().toISOString(),
          });
        }
        
        updated = { 
          ...c, 
          ...updates, 
          markedBy: lastUpdatedBy,
          markedById: lastUpdatedById,
          updated_at: new Date().toISOString() 
        };
        return updated;
      }
      return c;
    }));

    if (updated) {
      try {
        await db.updateClosingRecord(id, {
          status: updates.status,
          selected_type: updates.selected_type
        });
      } catch (e) {
        console.error('Supabase updateClosingRecord failed:', e);
        throw e;
      }
    }
    return { error: null };
  };

  const deleteClosing = async (id) => {
    let visitorName = '';
    let visitorId = '';
    setClosings(prev => prev.map(c => {
      if (c.id === id) {
        visitorName = c.visitor_name;
        visitorId = c.visitor_id || c.visitorId;
        return { ...c, delete_requested_at: new Date().toISOString() };
      }
      return c;
    }));

    try {
      await db.updateClosingRecord(id, {
        delete_requested_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Supabase deleteClosing failed:', e);
      throw e;
    }

    addActivityLog(visitorId, {
      customerName: visitorName,
      type: 'visitor_audit',
      action_type: 'Delete Request',
      action_description: `Soft delete requested by ${user?.name || 'Admin'}`,
      performed_by_name: user?.name || 'Admin',
      timestamp: new Date().toISOString(),
    });

    return { error: null };
  };

  const undoDeleteClosing = async (id) => {
    let visitorName = '';
    let visitorId = '';
    setClosings(prev => prev.map(c => {
      if (c.id === id) {
        visitorName = c.visitor_name;
        visitorId = c.visitor_id || c.visitorId;
        const updated = { ...c };
        delete updated.delete_requested_at;
        return updated;
      }
      return c;
    }));

    try {
      await db.updateClosingRecord(id, {
        delete_requested_at: null
      });
    } catch (e) {
      console.error('Supabase undoDeleteClosing failed:', e);
      throw e;
    }

    addActivityLog(visitorId, {
      customerName: visitorName,
      type: 'visitor_audit',
      action_type: 'Undo Delete',
      action_description: `Cancelled scheduled soft deletion for closing by ${user?.name || 'Admin'}`,
      performed_by_name: user?.name || 'Admin',
      timestamp: new Date().toISOString(),
    });

    return { error: null };
  };

  // ── Other Club Members ───────────────────────────────────────────────────────
  const addOtherClubMember = async (memberData) => {
    try {
      // 1. Check if member already exists by mobile
      let memberId;
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('mobile_number', memberData.mobile)
        .eq('member_type', 'Other Club Member')
        .maybeSingle();

      if (existing) {
        memberId = existing.id;
      } else {
        // Fetch a default club id to associate member
        const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
        const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

        // Create new member record
        const { data: created, error } = await supabase
          .from('members')
          .insert({
            club_id: clubId,
            name: memberData.name,
            mobile_number: memberData.mobile,
            whatsapp_number: memberData.whatsapp || memberData.mobile,
            club_name: memberData.club_name,
            member_type: 'Other Club Member',
            referral: memberData.referred_by || '',
            status: 'Active',
            created_by: user?.id || null
          })
          .select('id')
          .single();
        if (error) throw error;
        memberId = created.id;
      }

      // 2. Create visitation log in attendance table
      const { data: visit, error: visitErr } = await supabase
        .from('attendance')
        .insert({
          member_id: memberId,
          date: memberData.visit_date || getISTDateString(),
          check_in_time: memberData.visit_time || getISTTimeString(),
          attendance_status: 'Present',
          visit_reason: memberData.reason || 'Visitation'
        })
        .select()
        .single();
      if (visitErr) throw visitErr;

      // Reload database data to sync state
      await loadSupabaseData();
      return { data: visit };
    } catch (e) {
      console.error("addOtherClubMember failed:", e);
      throw e;
    }
  };

  const updateOtherClubMember = async (id, updates) => {
    try {
      const visit = otherClubMembers.find(m => m.id === id);
      if (!visit) throw new Error("Visit record not found");

      // 1. Update member details if changed
      if (updates.name || updates.club_name || updates.mobile || updates.whatsapp || updates.referred_by !== undefined) {
        await db.updateCustomer(visit.member_id, {
          name: updates.name,
          club_name: updates.club_name,
          mobile_number: updates.mobile,
          whatsapp_number: updates.whatsapp,
          referral: updates.referred_by
        });
      }

      // 2. Update attendance details
      const attUpdates = {};
      if (updates.visit_date) attUpdates.date = updates.visit_date;
      if (updates.visit_time) attUpdates.check_in_time = updates.visit_time;
      if (updates.reason) attUpdates.visit_reason = updates.reason;

      if (Object.keys(attUpdates).length > 0) {
        await db.updateOtherClubVisit(id, attUpdates);
      }

      // Reload data to sync state
      await loadSupabaseData();
      return { data: { ...visit, ...updates } };
    } catch (e) {
      console.error("updateOtherClubMember failed:", e);
      throw e;
    }
  };

  const deleteOtherClubMember = async (id) => {
    try {
      await db.deleteOtherClubVisit(id);
      await loadSupabaseData();
      return { error: null };
    } catch (e) {
      console.error("deleteOtherClubMember failed:", e);
      throw e;
    }
  };

  const saveSettingsConfig = async (newSettings) => {
    try {
      const { data: club } = await supabase.from('clubs').select('id').limit(1).maybeSingle();
      const clubId = club?.id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';
      
      const promises = Object.entries(newSettings).map(([key, val]) => 
        db.saveSetting(key, String(val), clubId)
      );
      await Promise.all(promises);
      setSettingsConfig(newSettings);
      return { success: true };
    } catch (e) {
      console.error("Failed to save settings to Supabase:", e);
      return { success: false, error: e };
    }
  };

  const refreshClosings = async () => {};
  const fetchData = loadSupabaseData;

  return (
    <AppContext.Provider value={{
      user, login, logout, signup, loading: authLoading,
      currentUser, currentRole, session, authLoading, isAuthenticated,
      customers, addCustomer, updateCustomer, deleteCustomer,
      visitors, addVisitor, updateVisitor, deleteVisitor, undoDeleteVisitor,
      otherClubMembers, addOtherClubMember, updateOtherClubMember, deleteOtherClubMember,
      attendance, updateAttendance, logShakePayment, logVisitorShakePayment, setAttendance, fetchMonthlyAttendance, attendanceLocks, finalizeAttendance,
      memberships, addMembership, renewMembership, addNewMember, fetchData, convertVisitorToMember, updateMembership, deleteMembership, fetchMembershipActivityLogs,
      memberActivityLogs, addActivityLog, getMemberActivityLogs,
      shakeLogs, addShakeLog, updateVisitorShake, getConsumedShakes, getMembershipShakeStatus,
      paymentLogs, addPaymentLog,
      attendanceAuditLogs, addAttendanceAudit,
      memberPaymentHistory, addMemberPaymentRecord,
      notifications, setNotifications, sendWhatsAppAlert,
      closings, addClosing, updateClosing, deleteClosing, undoDeleteClosing, refreshClosings,
      settingsConfig, saveSettingsConfig,
      dataLoading,
      membershipHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
