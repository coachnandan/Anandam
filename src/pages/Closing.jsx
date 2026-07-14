import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Search, Check, Filter, Clock, Calendar as CalendarIcon,
  UserCheck, UserMinus, Users, ChevronLeft, ChevronRight,
  User, X, Zap, MapPin, Phone, MessageSquare, AlertTriangle, Info, History
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTDisplayDate, getISTTimeString, getISTShortDisplayDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import VisitorCalendarModal from '../components/VisitorCalendarModal';

// Badge mapping for shake types
export const SHAKE_TYPES = [
  { id: 'S',   label: 'Shake',                    short: 'S',   color: '#D97706', bg: '#FEF3C7' },
  { id: 'SB',  label: 'Shake + Beta Heart',        short: 'SB',  color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'SF',  label: 'Shake + Fiber',             short: 'SF',  color: '#0891B2', bg: '#CFFAFE' },
  { id: 'SBF', label: 'Shake + Beta + Fiber',      short: 'SBF', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'D',   label: 'Dino',                      short: 'D',   color: '#059669', bg: '#D1FAE5' },
];

const VisitorShakeBadge = ({ shakeId }) => {
  const st = SHAKE_TYPES.find(s => s.id === shakeId || s.label === shakeId);
  if (!st) {
    return (
      <span
        className="inline-flex items-center rounded-full font-bold uppercase tracking-wider whitespace-nowrap px-2.5 py-1 text-[10px] gap-1 bg-amber-50 text-amber-600 border border-dashed border-amber-300 hover:bg-amber-100 transition-colors shadow-sm"
      >
        + Add Shake
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full font-bold uppercase tracking-wider whitespace-nowrap px-2.5 py-1 text-[10px] gap-1.5"
      style={{ color: st.color, background: st.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
      {st.label}
    </span>
  );
};

export default function Closing() {
  const {
    closings = [],
    visitors = [],
    shakeLogs = [],
    customers = [],
    memberships = [],
    updateClosing,
    deleteClosing,
    undoDeleteClosing,
    addCustomer,
    addNewMember,
    addPaymentLog,
    addMemberPaymentRecord,
    addActivityLog,
    memberActivityLogs = [],
    updateVisitorShake,
    user
  } = useAppContext();

  // Date selection states
  const todayStr = getISTDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Search & Status filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Dropdown states
  const [openShakeDropdownId, setOpenShakeDropdownId] = useState(null);
  const [openActionDropdownId, setOpenActionDropdownId] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenShakeDropdownId(null);
      setOpenActionDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Modals state
  const [activeOneDayPaymentVisitor, setActiveOneDayPaymentVisitor] = useState(null);
  const [activeMembershipVisitor, setActiveMembershipVisitor] = useState(null);
  const [viewingAuditVisitor, setViewingAuditVisitor] = useState(null);
  const [viewingConvertedList, setViewingConvertedList] = useState(false);

  // Helper to calculate previous day
  const getPreviousDayStr = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return getISTDateString(d);
  };

  // The active target visit date for the selected Closing date (visit date = S - 1 day)
  const targetVisitDate = useMemo(() => {
    return getPreviousDayStr(selectedDate);
  }, [selectedDate]);

  // Shake lookup logic
  const getVisitorShake = (visitorId, dateStr) => {
    const log = shakeLogs.find(s => s.personId === visitorId && s.date === dateStr);
    return log ? log.item : null;
  };

  // Map and filter closing list
  const enrichedClosings = useMemo(() => {
    return closings.map(c => {
      const visitor = visitors.find(v => v.id === c.visitor_id || v.id === c.visitorId) || {
        id: c.visitor_id || c.visitorId,
        visitor_name: c.visitor_name,
        mobile_number: '',
        visit_time: '',
        visit_date: c.visit_date,
        referral: '',
      };
      
      const shakeType = getVisitorShake(visitor.id, visitor.visit_date);

      return {
        ...c,
        visitor,
        shakeType,
      };
    });
  }, [closings, visitors, shakeLogs]);

  // Active closing records that came on targetVisitDate (yesterday)
  const activeClosingsList = useMemo(() => {
    return enrichedClosings.filter(c => {
      // Must match yesterday's visit date
      if (c.visit_date !== targetVisitDate) return false;
      
      // Hide if soft delete countdown expired (>24h)
      if (c.delete_requested_at) {
        const diffMs = new Date() - new Date(c.delete_requested_at);
        if (diffMs > 24 * 60 * 60 * 1000) return false;
      }
      
      return true;
    });
  }, [enrichedClosings, targetVisitDate]);

  // Summary stats (for selectedDate)
  const stats = useMemo(() => {
    // Today's scheduled closing = yesterday's visitors
    const scheduled = enrichedClosings.filter(c => c.visit_date === targetVisitDate && !c.delete_requested_at);
    const closed = scheduled.filter(c => c.status === 'Closed');
    const pending = scheduled.filter(c => c.status === 'Pending');

    // Converted totals: total customers/memberships created today
    const convertedMembers = customers.filter(c => c.joining_date === selectedDate).length;
    const convertedMemberships = memberships.filter(m => m.created_date === selectedDate).length;

    return {
      scheduled: scheduled.length,
      closed: closed.length,
      pending: pending.length,
      convertedMembers,
      convertedMemberships,
    };
  }, [enrichedClosings, targetVisitDate, customers, memberships, selectedDate]);

  // Filtered rows for listing
  const filteredList = useMemo(() => {
    let list = activeClosingsList;

    if (filterStatus !== 'All') {
      list = list.filter(c => c.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(c =>
        c.visitor_name?.toLowerCase().includes(q) ||
        c.visitor?.mobile_number?.includes(q) ||
        (c.visitor?.referral || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeClosingsList, filterStatus, searchTerm]);

  // List of converted members & memberships for display modal
  const convertedDetails = useMemo(() => {
    const membersList = customers.filter(c => c.joining_date === selectedDate);
    const membershipsList = memberships.filter(m => m.created_date === selectedDate);
    return {
      members: membersList,
      memberships: membershipsList,
    };
  }, [customers, memberships, selectedDate]);

  // 1. One Day Payment Modal React-Hook-Form
  const {
    register: regOneDay,
    handleSubmit: handleOneDaySubmit,
    watch: watchOneDay,
    setValue: setOneDayValue,
    reset: resetOneDay
  } = useForm({
    defaultValues: { amount: 250, advance: 250, paymentMethod: 'Cash' }
  });

  const oneDayAmount = watchOneDay('amount') || 0;
  const oneDayAdvance = watchOneDay('advance') || 0;
  const oneDayDue = Math.max(0, Number(oneDayAmount) - Number(oneDayAdvance));

  const onConfirmOneDayPayment = async (data) => {
    if (!activeOneDayPaymentVisitor) return;
    const v = activeOneDayPaymentVisitor;
    const payTime = getISTTimeString();
    const payDate = getISTShortDisplayDate();

    try {
      // 1. Save payment log
      addPaymentLog({
        memberId: v.visitor.id,
        memberName: v.visitor.visitor_name,
        amount: Number(data.advance),
        paymentMode: data.paymentMethod,
        paymentPurpose: 'One Day Payment',
        date: getISTDateString(),
        time: payTime,
      });

      // 2. Save transaction record in member payment history
      addMemberPaymentRecord(v.visitor.id, {
        payType: 'one_day',
        amount: Number(data.advance),
        totalAmount: Number(data.amount),
        due: oneDayDue,
        method: data.paymentMethod,
        date: payDate,
        time: payTime,
      });

      // 3. Record in audit trail
      addActivityLog(v.visitor.id, {
        customerName: v.visitor.visitor_name,
        type: 'visitor_audit',
        action_type: 'One Day Payment',
        action_description: `Processed One Day Payment of ₹${data.advance} (Due: ₹${oneDayDue}) via ${data.paymentMethod}`,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      // 4. Update closing status to Closed
      await updateClosing(v.id, { status: 'Closed', selected_type: 'Pending' });

      toast.success('One Day Payment recorded successfully!');
      setActiveOneDayPaymentVisitor(null);
      resetOneDay();
    } catch (e) {
      console.error(e);
      toast.error(`Failed to record one day payment: ${e.message || 'Operation failed.'}`);
    }
  };

  // 2. Membership Wizard Modal React-Hook-Form
  const {
    register: regMember,
    handleSubmit: handleMemberSubmit,
    watch: watchMember,
    setValue: setMemberValue,
    reset: resetMember
  } = useForm({
    defaultValues: { plan: '10 Days', total_amount: 2500, advance_amount: 2500, paymentMethod: 'Cash', member_type: 'Member' }
  });

  const memberPlan = watchMember('plan');
  const memberTotal = watchMember('total_amount') || 0;
  const memberAdvance = watchMember('advance_amount') || 0;
  const memberDue = Math.max(0, Number(memberTotal) - Number(memberAdvance));

  // Automatically update predefined prices
  useEffect(() => {
    if (memberPlan === '1 Day') {
      setMemberValue('total_amount', 250);
      setMemberValue('advance_amount', 250);
    } else if (memberPlan === '10 Days') {
      setMemberValue('total_amount', 2500);
      setMemberValue('advance_amount', 2500);
    } else if (memberPlan === '30 Days') {
      setMemberValue('total_amount', 7000);
      setMemberValue('advance_amount', 7000);
    }
  }, [memberPlan, setMemberValue]);

  const onConfirmMembership = async (data) => {
    if (!activeMembershipVisitor) return;
    const v = activeMembershipVisitor;

    try {
      // Call AppContext's addNewMember
      const result = await addNewMember({
        full_name: v.visitor.visitor_name,
        mobile_number: v.visitor.mobile_number || '9999999999',
        whatsapp_number: v.visitor.whatsapp_number || v.visitor.mobile_number,
        dob: v.visitor.dob,
        gender: v.visitor.gender,
        profession: v.visitor.profession,
        member_type: data.member_type,
        referred_by: v.visitor.referral || 'Walk-in',
        address: v.visitor.address,
        plan: data.plan,
        custom_duration: data.custom_duration,
        total_amount: data.total_amount,
        advance_amount: data.advance_amount,
        paymentMethod: data.paymentMethod,
        membership_start_date: getISTDateString(),
      });

      // Update status in closing to Closed & Converted
      await updateClosing(v.id, { status: 'Closed', selected_type: 'Membership' });

      // Record in audit trail
      addActivityLog(v.visitor.id, {
        customerName: v.visitor.visitor_name,
        type: 'visitor_audit',
        action_type: 'Membership Created',
        action_description: `Enrolled in plan: ${data.plan} (Paid: ₹${data.advance_amount}, Due: ₹${memberDue})`,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      toast.success('Membership created and user transferred to Memberships successfully!');
      setActiveMembershipVisitor(null);
      resetMember();
    } catch (e) {
      console.error(e);
      toast.error(`Failed to create membership: ${e.message || 'Operation failed.'}`);
    }
  };

  // Convert to Member directly handler
  const handleConvertToMemberDirectly = async (c) => {
    const payload = {
      name: c.visitor.visitor_name,
      full_name: c.visitor.visitor_name,
      contact: c.visitor.mobile_number || '9999999999',
      mobile_number: c.visitor.mobile_number || '9999999999',
      whatsapp_number: c.visitor.whatsapp_number || c.visitor.mobile_number,
      dob: c.visitor.dob,
      gender: c.visitor.gender,
      profession: c.visitor.profession,
      referred_by: c.visitor.referral || 'Walk-in',
      address: c.visitor.address,
      joining_date: getISTDateString(),
    };

    try {
      await addCustomer(payload);

      // Record in audit log
      addActivityLog(c.visitor.id, {
        customerName: c.visitor.visitor_name,
        type: 'visitor_audit',
        action_type: 'Converted to Member',
        action_description: `Converted visitor ${c.visitor.visitor_name} directly to a registered Member`,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      // Update status to Closed, Converted
      await updateClosing(c.id, { status: 'Closed', selected_type: 'Member' });
      toast.success('Transferred visitor to Member Details module!');
    } catch (e) {
      console.error(e);
      toast.error(`Failed to convert visitor: ${e.message || 'Operation failed.'}`);
    }
  };

  // Action status changes (Pending)
  const handleSetPending = async (c) => {
    try {
      await updateClosing(c.id, { status: 'Pending' });
      toast.info(`Visitor marked as Pending.`);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to update status: ${e.message || 'Operation failed.'}`);
    }
  };

  // Soft delete countdown calculator
  const getSoftDeleteCountdown = (c) => {
    if (!c.delete_requested_at) return '';
    const diffMs = (24 * 60 * 60 * 1000) - (new Date() - new Date(c.delete_requested_at));
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Visitor timeline audit selector
  const visitorSpecificAuditLogs = useMemo(() => {
    if (!viewingAuditVisitor) return [];
    return memberActivityLogs
      .filter(l => l.customerName === viewingAuditVisitor.visitor_name || l.customerName === viewingAuditVisitor.name)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [viewingAuditVisitor, memberActivityLogs]);

  return (
    <div className="p-6 sm:p-10 space-y-8 bg-offwhite/30 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Closing Module</h1>
          <p className="text-sm font-medium text-muted mt-1">
            Manage next-day follow-ups, record trial payments, and convert guests.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Calendar trigger */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="p-3.5 bg-white border border-beige hover:border-sage rounded-2xl transition-all shadow-sm text-forest"
            title="Monthly Calendar"
          >
            <CalendarIcon size={18} />
          </button>
          {/* Selected Date Tag */}
          <span className="px-4 py-3 bg-white border border-beige rounded-2xl text-xs font-black uppercase text-forest tracking-wider shadow-sm">
            Closing Date: {getISTDisplayDate(selectedDate)}
          </span>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-4 py-3 bg-forest text-white rounded-2xl text-xs font-extrabold uppercase hover:bg-forest-hover transition-all active:scale-95 shadow-md"
            >
              Reset to Today
            </button>
          )}
        </div>
      </div>

      {/* 3. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Today's Closings</span>
            <span className="text-2xl font-black text-forest block">{stats.scheduled}</span>
          </div>
          <div className="w-12 h-12 bg-offwhite border border-beige rounded-2xl flex items-center justify-center font-bold text-forest">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Closed Today</span>
            <span className="text-2xl font-black text-[#1F7A45] block">{stats.closed}</span>
          </div>
          <div className="w-12 h-12 bg-[#DDF5E5] border border-[#1F7A45]/10 rounded-2xl flex items-center justify-center font-bold text-[#1F7A45]">
            <Check size={20} />
          </div>
        </div>

        <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pending Today</span>
            <span className="text-2xl font-black text-[#D97706] block">{stats.pending}</span>
          </div>
          <div className="w-12 h-12 bg-[#FEF3C7] border border-[#D97706]/10 rounded-2xl flex items-center justify-center font-bold text-[#D97706]">
            <Clock size={20} />
          </div>
        </div>

        <div
          onClick={() => setViewingConvertedList(true)}
          className="bg-white border border-beige rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Converted Today</span>
            <span className="text-xs font-black text-[#7C3AED] block">
              Members: {stats.convertedMembers} | Subscriptions: {stats.convertedMemberships}
            </span>
            <span className="text-[9px] font-bold text-gray-400 underline block">Click to view lists</span>
          </div>
          <div className="w-12 h-12 bg-[#EDE9FE] border border-[#7C3AED]/10 rounded-2xl flex items-center justify-center font-bold text-[#7C3AED]">
            <UserCheck size={20} />
          </div>
        </div>
      </div>

      {/* Control panel: search & active filters reset */}
      <div className="bg-white rounded-2xl border border-beige/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" size={17} />
          <input
            type="text"
            placeholder="Search by visitor name, mobile, or referral coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-offwhite/50 border border-beige rounded-xl font-bold text-forest outline-none placeholder:text-muted/30 focus:border-sage transition-all text-sm"
          />
        </div>

        {/* Filters state display */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-beige rounded-xl font-bold uppercase tracking-wider text-[10px] text-forest outline-none cursor-pointer focus:border-sage transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Closed">Closed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Closing List table */}
      <div className="bg-white rounded-3xl border border-beige shadow-md overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 border-b border-beige">
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Visitor Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Referral By</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Marked By</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Shake Type</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Users className="mx-auto text-beige mb-3" size={40} />
                    <p className="text-sm font-bold text-muted uppercase tracking-widest">No closing records for this date</p>
                  </td>
                </tr>
              ) : (
                filteredList.map(c => {
                  const hasSoftDelete = !!c.delete_requested_at;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setOpenShakeDropdownId(openShakeDropdownId === c.id ? null : c.id);
                        setOpenActionDropdownId(null);
                      }}
                      className={`hover:bg-offwhite/30 border-b border-beige/40 last:border-0 transition-colors cursor-pointer group ${
                        hasSoftDelete ? 'bg-red-50/20 opacity-90' : ''
                      }`}
                    >
                      {/* Visitor Name (Clicking visitor profile opens audit popup) */}
                      <td className="px-8 py-6" onClick={(e) => { e.stopPropagation(); setViewingAuditVisitor(c.visitor); }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border shadow-sm transition-all text-sm ${
                            hasSoftDelete 
                              ? 'bg-red-100 border-red-200 text-red-700' 
                              : 'bg-offwhite border-beige text-forest group-hover:bg-forest group-hover:text-white'
                          }`}>
                            {c.visitor_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-extrabold text-forest text-sm flex items-center gap-2">
                              {c.visitor_name}
                              {hasSoftDelete && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded tracking-wider border border-red-200 animate-pulse">
                                  <AlertTriangle size={8} /> Deleting in {getSoftDeleteCountdown(c)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">ID: {c.visitor_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Referral By */}
                      <td className="px-8 py-6">
                        <span className="px-2.5 py-1 bg-forest/5 text-forest border border-forest/10 rounded-lg text-xs font-bold">
                          {c.visitor?.referral || 'Walk-in'}
                        </span>
                      </td>

                      {/* Marked By */}
                      <td className="px-8 py-6">
                        <p className="font-bold text-forest text-sm">{c.profiles?.full_name || 'N/A'}</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5">{c.updated_at ? new Date(c.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      </td>

                      {/* Shake Type (Interactive selector) */}
                      <td className="px-8 py-6" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => {
                              setOpenShakeDropdownId(openShakeDropdownId === c.id ? null : c.id);
                              setOpenActionDropdownId(null);
                            }}
                            className="focus:outline-none transition-all active:scale-95"
                          >
                            <VisitorShakeBadge shakeId={c.shakeType} />
                          </button>
                          {openShakeDropdownId === c.id && (
                            <div className="absolute left-0 mt-2 w-56 bg-white border border-beige rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                              {SHAKE_TYPES.map(st => (
                                <button
                                  key={st.id}
                                  onClick={() => {
                                    updateVisitorShake(c.visitor.id, c.visit_date, st.id, c.visitor.visitor_name);
                                    setOpenShakeDropdownId(null);
                                    toast.success(`${st.label} recorded.`);
                                  }}
                                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-offwhite text-[10px] font-bold uppercase tracking-wider text-forest animate-in slide-in-from-top-1"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                                  {st.label}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  updateVisitorShake(c.visitor.id, c.visit_date, '', c.visitor.visitor_name);
                                  setOpenShakeDropdownId(null);
                                  toast.info(`Shake removed.`);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider text-red-500"
                              >
                                Clear Selection
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-6" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status || 'Pending'}
                          onChange={(e) => updateClosing(c.id, { status: e.target.value })}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-widest outline-none ${
                            c.status === 'Closed' 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          {hasSoftDelete ? (
                            <button
                              onClick={() => {
                                undoDeleteClosing(c.id)
                                  .then(() => toast.success("Scheduled deletion cancelled."))
                                  .catch((e) => toast.error("Failed to cancel deletion: " + e.message));
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                              title="Undo Deletion"
                            >
                              Undo
                            </button>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(openActionDropdownId === c.id ? null : c.id);
                                  setOpenShakeDropdownId(null);
                                }}
                                className="px-3.5 py-2 bg-offwhite border border-beige hover:border-sage rounded-xl font-bold uppercase tracking-widest text-[9px] text-forest transition-all shadow-sm active:scale-95"
                              >
                                Action
                              </button>
                              {openActionDropdownId === c.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-beige rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                                  <button
                                    onClick={() => {
                                      setActiveOneDayPaymentVisitor(c);
                                      setOpenActionDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-forest hover:bg-offwhite rounded-lg transition-colors"
                                  >
                                    One Day Payment
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMembershipVisitor(c);
                                      setOpenActionDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-forest hover:bg-offwhite rounded-lg transition-colors"
                                  >
                                    Membership
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleConvertToMemberDirectly(c);
                                      setOpenActionDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-forest hover:bg-offwhite rounded-lg transition-colors"
                                  >
                                    Convert to Member
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSetPending(c);
                                      setOpenActionDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-forest hover:bg-offwhite rounded-lg transition-colors"
                                  >
                                    Set Pending
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("Delete this closing record? (Starts 24-hour soft-delete timer)")) {
                                        deleteClosing(c.id)
                                          .then(() => toast.success("Soft delete initiated. Restorable for 24h."))
                                          .catch((e) => toast.error("Delete failed: " + e.message));
                                      }
                                      setOpenActionDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    Delete (Soft-Delete)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. One Day Payment Modal Form */}
      {activeOneDayPaymentVisitor && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">One Day Payment</h3>
                <p className="text-[10px] text-sage font-bold">Process trial session payment</p>
              </div>
              <button
                onClick={() => setActiveOneDayPaymentVisitor(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleOneDaySubmit(onConfirmOneDayPayment)} className="p-6 space-y-4">
              <div>
                <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Member Name (Read-only)</label>
                <input
                  type="text"
                  readOnly
                  value={activeOneDayPaymentVisitor.visitor_name}
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-450 text-xs cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</label>
                  <input
                    type="number"
                    {...regOneDay("amount")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Advance Paid</label>
                  <input
                    type="number"
                    {...regOneDay("advance")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Due Box */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Due Amount:</span>
                <span className="text-lg font-black text-red-700">₹{oneDayDue}</span>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Payment Method</label>
                <select
                  {...regOneDay("paymentMethod")}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveOneDayPaymentVisitor(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest-hover shadow-md"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Membership Registration Modal Form */}
      {activeMembershipVisitor && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Create Membership</h3>
                <p className="text-[10px] text-sage font-bold">Enroll visitor into Membership system</p>
              </div>
              <button
                onClick={() => setActiveMembershipVisitor(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleMemberSubmit(onConfirmMembership)} className="p-6 space-y-4">
              <div>
                <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Visitor Name (Read-only)</label>
                <input
                  type="text"
                  readOnly
                  value={activeMembershipVisitor.visitor_name}
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-450 text-xs cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Membership Plan</label>
                  <select
                    {...regMember("plan")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  >
                    <option value="1 Day">1 Day (₹250)</option>
                    <option value="10 Days">10 Days (₹2,500)</option>
                    <option value="30 Days">30 Days (₹7,000)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Member Type</label>
                  <select
                    {...regMember("member_type")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  >
                    <option value="Member">Member</option>
                    <option value="Coach">Coach</option>
                  </select>
                </div>
              </div>

              {memberPlan === 'Other' && (
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    {...regMember("custom_duration")}
                    placeholder="Enter Custom Days"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</label>
                  <input
                    type="number"
                    {...regMember("total_amount")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Advance Payment</label>
                  <input
                    type="number"
                    {...regMember("advance_amount")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Due Box */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Due Amount:</span>
                <span className="text-lg font-black text-red-700">₹{memberDue}</span>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Payment Method</label>
                <select
                  {...regMember("paymentMethod")}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:border-forest outline-none text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMembershipVisitor(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest-hover shadow-md"
                >
                  Create & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Converted Members / Memberships list popup */}
      {viewingConvertedList && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-beige animate-in fade-in duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Converted Today</h3>
                <p className="text-[10px] text-sage font-bold">List of members and memberships created on {getISTDisplayDate(selectedDate)}</p>
              </div>
              <button
                onClick={() => setViewingConvertedList(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-55"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              
              {/* Members */}
              <div>
                <h4 className="text-[10px] font-black text-forest uppercase tracking-widest mb-2 pb-1 border-b border-beige">Members ({convertedDetails.members.length})</h4>
                {convertedDetails.members.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No members registered directly today.</p>
                ) : (
                  <div className="space-y-2">
                    {convertedDetails.members.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-offwhite/40 border border-beige/40 rounded-xl text-xs font-bold text-forest">
                        <span>{m.full_name || m.name}</span>
                        <span className="text-[9px] text-gray-400">Mobile: {m.mobile_number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Memberships */}
              <div>
                <h4 className="text-[10px] font-black text-forest uppercase tracking-widest mb-2 pb-1 border-b border-beige">Memberships Enrolled ({convertedDetails.memberships.length})</h4>
                {convertedDetails.memberships.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No memberships enrolled today.</p>
                ) : (
                  <div className="space-y-2">
                    {convertedDetails.memberships.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-offwhite/40 border border-beige/40 rounded-xl text-xs font-bold text-forest">
                        <span>{m.customerName}</span>
                        <span className="px-2 py-0.5 bg-forest text-white rounded text-[8px] uppercase tracking-wider">{m.plan}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. Visitor profile popup containing the complete activity history */}
      {viewingAuditVisitor && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Visitor Audit Log</h3>
                <p className="text-[10px] text-sage font-bold">Activity history for {viewingAuditVisitor.visitor_name}</p>
              </div>
              <button
                onClick={() => setViewingAuditVisitor(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {visitorSpecificAuditLogs.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No action logs found for this guest.</p>
              ) : (
                visitorSpecificAuditLogs.map((log, index) => (
                  <div key={log.id || index} className="p-3.5 bg-offwhite/50 border border-beige/50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-white border border-beige rounded text-[9px] font-extrabold text-forest uppercase tracking-wider">
                        {log.action_type || 'Update'}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400">{log.date || getISTShortDisplayDate(new Date(log.timestamp))}</span>
                    </div>
                    <p className="font-bold text-forest leading-relaxed">{log.action_description}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">
                      Performed By: {log.performed_by_name || 'Admin'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Calendar Integration */}
      {isCalendarOpen && (
        <VisitorCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onDateSelect={(dateStr) => {
            setSelectedDate(dateStr);
          }}
        />
      )}

    </div>
  );
}
