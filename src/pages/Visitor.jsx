import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  UserPlus, Plus, Search, Phone, Clock, Calendar as CalendarIcon,
  X, FileText, MapPin, Trash2, Edit3, ChevronLeft, ChevronRight, ChevronDown,
  User, Users, Briefcase, Award, History, Check, Info, Smartphone, AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTTimeString, getISTDisplayDate, getISTShortDisplayDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import VisitorCalendarModal from '../components/VisitorCalendarModal';

export const SHAKE_TYPES = [
  { id: 'S',   label: 'Shake',                    short: 'S',   color: '#D97706', bg: '#FEF3C7' },
  { id: 'SB',  label: 'Shake + Beta Heart',        short: 'SB',  color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'SF',  label: 'Shake + Fiber',             short: 'SF',  color: '#0891B2', bg: '#CFFAFE' },
  { id: 'SBF', label: 'Shake + Beta + Fiber',      short: 'SBF', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'D',   label: 'Dino',                      short: 'D',   color: '#059669', bg: '#D1FAE5' },
];

export const getShakeType = (shakeId) => {
  return SHAKE_TYPES.find(st => st.id === shakeId || st.label === shakeId);
};

const ShakeDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuH = 228;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuH + 8;
      setMenuStyle({
        position: 'fixed',
        zIndex: 9999,
        width: '212px',
        right: `${window.innerWidth - rect.right}px`,
        ...(openUpward
          ? { bottom: `${window.innerHeight - rect.top + 6}px` }
          : { top: `${rect.bottom + 6}px` }),
      });
    }
    setOpen(prev => !prev);
  };

  const selected = getShakeType(value);

  return (
    <div ref={btnRef} style={{ display: 'inline-block' }}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02] whitespace-nowrap"
        style={selected
          ? { color: selected.color, background: selected.bg, borderColor: selected.color + '60' }
          : { color: '#9CA3AF', background: '#F9FAFB', borderColor: '#E5E7EB' }}
      >
        {selected
          ? <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.color }} />{selected.short}</>
          : <><Plus size={10} />Shake</>}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div style={menuStyle} className="bg-white rounded-xl border border-gray-100 shadow-2xl">
          <div className="p-2 space-y-0.5 text-left">
            {SHAKE_TYPES.map(st => (
              <button
                key={st.id}
                onClick={(e) => { e.stopPropagation(); onChange(st.id); setOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[11px] font-semibold hover:bg-gray-50 transition-colors text-gray-700"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                {st.label}
                {value === st.id && <Check size={10} className="ml-auto" style={{ color: st.color }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

export default function Visitor() {
  const {
    visitors = [],
    addVisitor,
    updateVisitor,
    deleteVisitor,
    undoDeleteVisitor,
    shakeLogs = [],
    memberActivityLogs = [],
    paymentLogs = [],
    addShakeLog,
    addActivityLog,
    user
  } = useAppContext();

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  
  // Dashboard Summary Card Filters / Modal states
  const [referralStatsOpen, setReferralStatsOpen] = useState(false);
  const [selectedReferralFilter, setSelectedReferralFilter] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showYesterdayOnly, setShowYesterdayOnly] = useState(false);

  // Profile view modal state
  const [viewingVisitorProfile, setViewingVisitorProfile] = useState(null);

  // Shake confirmation states
  const [activeShakeSelection, setActiveShakeSelection] = useState(null); // { visitor, shakeId, quantity }
  const [showShakeConfirmation, setShowShakeConfirmation] = useState(false);

  const todayStr = getISTDateString();

  const handleShakeClick = (visitor, currentShakeId) => {
    setActiveShakeSelection({
      visitor,
      shakeId: currentShakeId || 'S', // Default to Shake
      quantity: 1,
    });
  };

  const handleConfirmShakeSave = async (visitorId, shakeId, quantity) => {
    const visitor = visitors.find(v => v.id === visitorId);
    try {
      await addShakeLog({
        source: 'visitor',
        personId: visitorId,
        personName: visitor?.visitor_name || 'Visitor',
        item: shakeId,
        quantity: quantity,
        date: todayStr,
        time: getISTTimeString(),
        staffName: user?.name || 'Admin',
      });

      let actionType = 'Shake Added';
      let actionDesc = `Added ${quantity} x ${SHAKE_TYPES.find(st => st.id === shakeId || st.label === shakeId)?.label || 'Shake'} shake(s) for ${visitor?.visitor_name}`;

      const alreadyExists = shakeLogs.some(s => s.personId === visitorId && s.date === todayStr);

      if (quantity === 0) {
        actionType = 'Shake Removed';
        actionDesc = `Removed shake entry for ${visitor?.visitor_name}`;
      } else if (alreadyExists) {
        actionType = 'Shake Quantity Changed';
        actionDesc = `Updated shake quantity to ${quantity} x ${SHAKE_TYPES.find(st => st.id === shakeId || st.label === shakeId)?.label || 'Shake'} for ${visitor?.visitor_name}`;
      }

      // Add to activity logs
      addActivityLog(visitorId, {
        customerName: visitor?.visitor_name,
        type: 'visitor_audit',
        action_type: actionType,
        action_description: actionDesc,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      toast.success(quantity > 0 ? `Confirmed ${quantity} shake(s) for ${visitor?.visitor_name}` : `Cleared shake for ${visitor?.visitor_name}`);
      setActiveShakeSelection(null);
      setShowShakeConfirmation(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to confirm shake entry: ${err.message || 'Operation failed.'}`);
    }
  };

  // react-hook-form setup
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      visitor_name: '',
      mobile_number: '',
      whatsapp_number: '',
      dob: '',
      gender: '',
      profession: '',
      custom_profession: '',
      referral: '',
      address: '',
    }
  });

  const watchMobile = watch('mobile_number');
  const watchSameAsMobile = watch('same_as_mobile');
  const watchProfession = watch('profession');

  // Copy Mobile to WhatsApp when checked
  useEffect(() => {
    if (watchSameAsMobile) {
      setValue('whatsapp_number', watchMobile || '');
    }
  }, [watchSameAsMobile, watchMobile, setValue]);

  const totalShakesForSelectedDate = useMemo(() => {
    return shakeLogs.filter(s => s.source === 'visitor' && s.date === selectedDate)
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  }, [shakeLogs, selectedDate]);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getISTDateString(d);
  }, []);

  // Filter out visitors whose soft delete countdown has expired (>24 hours)
  const activeVisitorsList = useMemo(() => {
    return visitors.filter(v => {
      if (v.delete_requested_at) {
        const diffMs = new Date() - new Date(v.delete_requested_at);
        if (diffMs > 24 * 60 * 60 * 1000) {
          return false; // Automatically hidden from active list
        }
      }
      // Hide if moved to Closing
      if (v.movedToClosing) {
        return false;
      }
      return true;
    });
  }, [visitors]);

  // Compute stats for dashboard
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthVisitors = useMemo(() => {
    return activeVisitorsList.filter(v => v.visit_date?.startsWith(currentMonthStr));
  }, [activeVisitorsList, currentMonthStr]);

  const todayVisitors = useMemo(() => {
    return activeVisitorsList.filter(v => v.visit_date === todayStr);
  }, [activeVisitorsList, todayStr]);

  const yesterdayVisitors = useMemo(() => {
    // Note: Yesterday's visitors are moved to Closing automatically at midnight, 
    // but they remain visible in this yesterday's visitor helper if we lookup the historical log
    // or if we check the master visitors list.
    return visitors.filter(v => v.visit_date === yesterdayStr && !v.delete_requested_at);
  }, [visitors, yesterdayStr]);

  // Group monthly visitors by referral
  const referralGrouping = useMemo(() => {
    const groups = {};
    monthVisitors.forEach(v => {
      const ref = v.referral || 'Unknown / Walk-in';
      groups[ref] = (groups[ref] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [monthVisitors]);

  // Shake lookup logic
  const getVisitorShake = (visitorId, dateStr) => {
    const log = shakeLogs.find(s => s.personId === visitorId && s.date === dateStr);
    return log ? log.item : null;
  };

  // Filter active list based on all options
  const finalFilteredVisitorsList = useMemo(() => {
    let list = activeVisitorsList;

    if (showTodayOnly) {
      list = list.filter(v => v.visit_date === todayStr);
    } else if (showYesterdayOnly) {
      // Historical yesterday list
      list = visitors.filter(v => v.visit_date === yesterdayStr && !v.delete_requested_at);
    } else {
      // Filter by selected calendar date
      list = list.filter(v => v.visit_date === selectedDate);
    }

    if (selectedReferralFilter) {
      list = list.filter(v => (v.referral || 'Unknown / Walk-in') === selectedReferralFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(v =>
        v.visitor_name?.toLowerCase().includes(q) ||
        v.mobile_number?.includes(q)
      );
    }

    return list;
  }, [activeVisitorsList, visitors, selectedDate, showTodayOnly, showYesterdayOnly, selectedReferralFilter, searchTerm, todayStr, yesterdayStr]);

  // Handle Add/Edit visitor submission
  const onSubmitVisitor = async (data) => {
    const payload = {
      visitor_name: data.visitor_name,
      mobile_number: data.mobile_number,
      whatsapp_number: data.whatsapp_number || data.mobile_number,
      dob: data.dob,
      gender: data.gender,
      profession: data.profession === 'Other' ? data.custom_profession : data.profession,
      referral: data.referral,
      address: data.address,
      visit_date: editingVisitor ? editingVisitor.visit_date : todayStr,
      visit_time: editingVisitor ? editingVisitor.visit_time : getISTTimeString(),
    };

    try {
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, payload);
        toast.success('Visitor details updated successfully!');
      } else {
        await addVisitor(payload);
        toast.success('Visitor registered successfully!');
      }
      setIsAddModalOpen(false);
      setEditingVisitor(null);
      reset();
    } catch (err) {
      console.error('Visitor operation failed:', err);
      toast.error(`Operation failed: ${err.message || 'Please try again.'}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingVisitor(null);
    reset({
      visitor_name: '',
      mobile_number: '',
      whatsapp_number: '',
      dob: '',
      gender: '',
      profession: '',
      custom_profession: '',
      referral: '',
      address: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVisitor(v);
    setValue('visitor_name', v.visitor_name || '');
    setValue('mobile_number', v.mobile_number || '');
    setValue('whatsapp_number', v.whatsapp_number || '');
    setValue('dob', v.dob || '');
    setValue('gender', v.gender || '');
    setValue('profession', v.profession || '');
    setValue('custom_profession', v.profession || '');
    setValue('referral', v.referral || '');
    setValue('address', v.address || '');
    setIsAddModalOpen(true);
  };

  // Calculate remaining countdown string for soft deletes
  const getSoftDeleteCountdown = (v) => {
    if (!v.delete_requested_at) return '';
    const diffMs = (24 * 60 * 60 * 1000) - (new Date() - new Date(v.delete_requested_at));
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get Visitor Audit History
  const visitorAuditLogs = useMemo(() => {
    return memberActivityLogs
      .filter(l => l.type === 'visitor_audit')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [memberActivityLogs]);

  return (
    <div className="p-6 sm:p-10 space-y-8 bg-offwhite/30 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Visitor Module</h1>
          <p className="text-sm font-medium text-muted mt-1">Manage first-time guests, track referrals, and workflow closures.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="p-3.5 bg-white border border-beige hover:border-sage rounded-2xl transition-all shadow-sm text-forest"
            title="Monthly Calendar"
          >
            <CalendarIcon size={18} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-forest hover:bg-forest-hover text-white rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-forest/15 hover:shadow-xl active:scale-95"
          >
            <Plus size={16} /> Add New Visitor
          </button>
        </div>
      </div>

      {/* 6. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Visitors This Month */}
        <div
          onClick={() => {
            setSelectedReferralFilter('');
            setShowTodayOnly(false);
            setShowYesterdayOnly(false);
            setReferralStatsOpen(true);
          }}
          className="bg-white border border-beige rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Visitors This Month</span>
            <span className="text-2xl font-black text-forest block">{monthVisitors.length}</span>
            <span className="text-[10px] font-bold text-sage underline block">View Referral Rankings</span>
          </div>
          <div className="w-12 h-12 bg-offwhite text-forest border border-beige rounded-2xl flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Today's Visitors */}
        <div
          onClick={() => {
            setSelectedReferralFilter('');
            setShowYesterdayOnly(false);
            setShowTodayOnly(true);
          }}
          className={`border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
            showTodayOnly ? 'bg-green-50/50 border-forest' : 'bg-white border-beige'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Today's Visitors</span>
            <span className="text-2xl font-black text-forest block">{todayVisitors.length}</span>
            <span className="text-[10px] font-bold text-sage block">Filter to Today</span>
          </div>
          <div className="w-12 h-12 bg-offwhite text-forest border border-beige rounded-2xl flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 3: Yesterday's Visitors */}
        <div
          onClick={() => {
            setSelectedReferralFilter('');
            setShowTodayOnly(false);
            setShowYesterdayOnly(true);
          }}
          className={`border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
            showYesterdayOnly ? 'bg-amber-50/40 border-gold' : 'bg-white border-beige'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Yesterday's Visitors</span>
            <span className="text-2xl font-black text-forest block">{yesterdayVisitors.length}</span>
            <span className="text-[10px] font-bold text-sage block">Filter to Yesterday (Historical)</span>
          </div>
          <div className="w-12 h-12 bg-offwhite text-forest border border-beige rounded-2xl flex items-center justify-center font-bold">
            <CalendarIcon size={20} />
          </div>
        </div>
      </div>

      {/* Control panel: search & active filters reset */}
      <div className="bg-white rounded-2xl border border-beige/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" size={17} />
          <input
            type="text"
            placeholder="Search visitors by name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-offwhite/50 border border-beige rounded-xl font-bold text-forest outline-none placeholder:text-muted/30 focus:border-sage transition-all text-sm"
          />
        </div>

        {/* Filters state display */}
        <div className="flex items-center gap-2 flex-wrap">
          {(showTodayOnly || showYesterdayOnly || selectedReferralFilter || selectedDate !== todayStr) && (
            <button
              onClick={() => {
                setShowTodayOnly(false);
                setShowYesterdayOnly(false);
                setSelectedReferralFilter('');
                setSelectedDate(todayStr);
              }}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 hover:bg-red-100 transition-all"
            >
              Reset Filters <X size={12} />
            </button>
          )}
          <span className="text-xs text-muted font-bold uppercase tracking-wider bg-offwhite px-3 py-2 border rounded-xl">
            Showing: {showTodayOnly ? "Today's list" : showYesterdayOnly ? "Yesterday's list" : `Date: ${getISTDisplayDate(selectedDate)}`}
            {selectedReferralFilter && ` | Ref: ${selectedReferralFilter}`}
            {` | Shakes Today: ${totalShakesForSelectedDate}`}
          </span>
        </div>
      </div>

      {/* Visitor List */}
      <div className="bg-white rounded-3xl border border-beige shadow-md overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 border-b border-beige">
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Referral By</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Visit Time</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Shake Type</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredVisitorsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users className="mx-auto text-beige mb-3" size={40} />
                    <p className="text-sm font-bold text-muted uppercase tracking-widest">No matching visitors found</p>
                  </td>
                </tr>
              ) : (
                finalFilteredVisitorsList.map(v => {
                  const hasSoftDelete = !!v.delete_requested_at;
                  const visitorShake = getVisitorShake(v.id, v.visit_date);
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setViewingVisitorProfile(v)}
                      className={`hover:bg-offwhite/30 border-b border-beige/40 last:border-0 transition-colors cursor-pointer group ${
                        hasSoftDelete ? 'bg-red-50/20 opacity-90' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border shadow-sm transition-all text-sm ${
                            hasSoftDelete 
                              ? 'bg-red-100 border-red-200 text-red-700' 
                              : 'bg-offwhite border-beige text-forest group-hover:bg-forest group-hover:text-white'
                          }`}>
                            {v.visitor_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-extrabold text-forest text-sm flex items-center gap-2">
                              {v.visitor_name}
                              {hasSoftDelete && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded tracking-wider border border-red-200 animate-pulse">
                                  <AlertTriangle size={8} /> Deleting in {getSoftDeleteCountdown(v)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">ID: {v.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Referral */}
                      <td className="px-8 py-6">
                        <span className="px-2.5 py-1 bg-forest/5 text-forest border border-forest/10 rounded-lg text-xs font-bold">
                          {v.referral || 'Unknown / Walk-in'}
                        </span>
                      </td>

                      {/* Visit Time */}
                      <td className="px-8 py-6">
                        <p className="font-bold text-forest text-sm">{v.visit_time}</p>
                        <p className="text-[9px] text-muted font-mono mt-0.5">{v.visit_date}</p>
                      </td>

                      {/* Shake Type */}
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <ShakeDropdown value={visitorShake} onChange={(val) => handleShakeClick(v, val)} />
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          {hasSoftDelete ? (
                            <button
                              onClick={() => {
                                undoDeleteVisitor(v.id);
                                toast.success("Scheduled deletion cancelled.");
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                              title="Undo Deletion"
                            >
                              Undo
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEdit(v)}
                                className="p-2.5 text-muted hover:text-forest bg-offwhite border border-beige hover:border-sage rounded-xl transition-all shadow-sm"
                                title="Edit Details"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Move this visitor record to soft deletion queue?")) {
                                    deleteVisitor(v.id);
                                    toast.success("Soft delete timer started. Visible for 24 hours.");
                                  }
                                }}
                                className="p-2.5 rounded-xl border bg-offwhite border-beige text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                                title="Soft Delete (24h Countdown)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
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

      {/* Add / Edit Visitor Modal Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-beige animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-forest tracking-tight">
                  {editingVisitor ? 'Edit Visitor Details' : 'Add New Visitor'}
                </h2>
                <p className="text-xs font-semibold text-sage/75 mt-0.5">Collect first-time guest parameters.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-green-100 hover:bg-gray-50 shadow-sm"
              >
                <X size={16} className="text-forest" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitVisitor)} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input
                  type="text"
                  {...register("visitor_name", { required: "Visitor name is required" })}
                  placeholder="e.g. Priyanshu Sahu"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                />
                {errors.visitor_name && <span className="text-red-500 text-[10px] mt-1 block">{errors.visitor_name.message}</span>}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  {...register("mobile_number", { required: "Mobile number is required" })}
                  placeholder="e.g. 9876543210"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                />
                {errors.mobile_number && <span className="text-red-500 text-[10px] mt-1 block">{errors.mobile_number.message}</span>}
              </div>

              {/* WhatsApp Number with copy checkbox */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">WhatsApp Number</label>
                  <label className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("same_as_mobile")}
                      className="rounded border-gray-300 text-forest focus:ring-forest"
                    />
                    Same as Mobile
                  </label>
                </div>
                <input
                  type="tel"
                  {...register("whatsapp_number")}
                  disabled={watchSameAsMobile}
                  placeholder="e.g. 9876543210"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    {...register("dob")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Gender</label>
                  <select
                    {...register("gender")}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Profession Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Profession</label>
                <select
                  {...register("profession")}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm mb-2"
                >
                  <option value="">Select Profession</option>
                  <option value="Student">Student</option>
                  <option value="Housewife">Housewife</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Other">Other</option>
                </select>
                {watchProfession === 'Other' && (
                  <input
                    type="text"
                    {...register("custom_profession")}
                    placeholder="Enter custom profession"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm mt-2 animate-in slide-in-from-top-1"
                  />
                )}
              </div>

              {/* Referral By (Required) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Referral By *</label>
                <input
                  type="text"
                  {...register("referral", { required: "Referral By is required" })}
                  placeholder="e.g. Priyanshu / Walk-in"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                />
                {errors.referral && <span className="text-red-500 text-[10px] mt-1 block">{errors.referral.message}</span>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Address</label>
                <input
                  type="text"
                  {...register("address")}
                  placeholder="Street name, City, State"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-650 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest-hover transition-all shadow-md active:scale-95"
                >
                  Save Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral groupings rankings popup */}
      {referralStatsOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Referral Stats This Month</h3>
                <p className="text-[11px] text-sage font-bold">Grouped counts of monthly visitors</p>
              </div>
              <button
                onClick={() => setReferralStatsOpen(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-3.5 max-h-72 overflow-y-auto no-scrollbar">
              {referralGrouping.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No referral data recorded for this month.</p>
              ) : (
                referralGrouping.map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedReferralFilter(name);
                      setReferralStatsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-offwhite/50 hover:bg-forest/5 border border-beige/60 hover:border-forest/20 rounded-xl transition-all text-left text-xs font-bold text-forest"
                  >
                    <span>{name}</span>
                    <span className="px-2.5 py-0.5 bg-forest text-white rounded-lg text-[10px] font-black">{count} Visitors</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visitor Profile View & Edit Panel */}
      {viewingVisitorProfile && (() => {
        const v = viewingVisitorProfile;
        const hasSoftDelete = !!v.delete_requested_at;
        return (
          <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in fade-in duration-200">
              <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Visitor Profile</h3>
                  <p className="text-[10px] text-sage font-bold">Details and historic audit trail</p>
                </div>
                <button
                  onClick={() => setViewingVisitorProfile(null)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto no-scrollbar">
                <div className="bg-offwhite border border-beige rounded-xl p-4 space-y-3.5">
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Full Name</span>
                    <span className="text-sm font-extrabold text-forest">{v.visitor_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Mobile</span>
                      <span className="font-bold text-forest">{v.mobile_number || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">WhatsApp</span>
                      <span className="font-bold text-forest">{v.whatsapp_number || '—'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">DOB</span>
                      <span className="font-bold text-forest">{v.dob || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Gender</span>
                      <span className="font-bold text-forest">{v.gender || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Profession</span>
                    <span className="font-bold text-forest">{v.profession || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Referral By</span>
                    <span className="font-bold text-forest">{v.referral || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Address</span>
                    <span className="font-bold text-forest">{v.address || '—'}</span>
                  </div>
                  <div className="pt-2 border-t border-beige grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-bold uppercase">
                    <div>
                      <span>Visit Date</span>
                      <span className="block text-forest">{v.visit_date} {v.visit_time}</span>
                    </div>
                    <div>
                      <span>Status</span>
                      <span className="block text-forest">{v.movedToClosing ? 'Moved to Closing' : 'Active Guest'}</span>
                    </div>
                  </div>
                </div>

                {/* Shake History */}
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase tracking-widest text-[9px] text-forest">Shake History</h4>
                  {shakeLogs.filter(s => s.personId === v.id).length === 0 ? (
                    <p className="text-gray-450 font-bold uppercase text-[9px] bg-offwhite p-3 rounded-xl border border-beige/40">No shakes logged yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {shakeLogs.filter(s => s.personId === v.id).map(s => {
                        const hasPaid = paymentLogs.some(p => (p.memberId === v.id || p.customerId === v.id) && p.date === s.date);
                        return (
                          <div key={s.id} className="flex justify-between items-center p-2.5 bg-offwhite border border-beige rounded-xl">
                            <div>
                              <span className="font-extrabold text-forest text-[11px]">{getShakeType(s.item)?.label || s.item}</span>
                              <div className="flex gap-2 text-[9px] text-gray-400 mt-0.5">
                                <span>{getISTDisplayDate(s.date)}</span>
                                <span>•</span>
                                <span>{s.time}</span>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase mt-1.5 ${hasPaid ? 'bg-emerald/10 text-emerald-700' : 'bg-red-55 text-red-650'}`}>
                                {hasPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-forest text-xs block">{s.quantity} Shake(s)</span>
                              <span className="block text-[8px] text-gray-400 mt-1">By {s.staffName || 'Admin'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Edit Button from Profile Popup */}
                <button
                  onClick={() => {
                    handleOpenEdit(v);
                    setViewingVisitorProfile(null);
                  }}
                  className="w-full py-3 bg-forest hover:bg-forest-hover text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
                >
                  Edit Profile Details
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 9. Read-only Audit Trail Panel (at page bottom) */}
      <div className="bg-white rounded-3xl border border-beige p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-forest uppercase tracking-[0.2em] flex items-center gap-1.5 pb-2 border-b border-beige">
          <History size={16} className="text-sage" /> Visitor Module Audit Trail
        </h3>
        <div className="space-y-3.5 max-h-56 overflow-y-auto pr-2 no-scrollbar">
          {visitorAuditLogs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No visitor audit logs recorded.</p>
          ) : (
            visitorAuditLogs.map((log, i) => (
              <div key={log.id || i} className="p-4 bg-offwhite/45 border border-beige/40 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 bg-white border border-beige rounded text-[9px] font-extrabold text-forest uppercase tracking-wider">
                    {log.action_type || 'Audit Log'}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">{log.date} {log.time}</span>
                </div>
                <p className="font-bold text-forest leading-relaxed">{log.action_description}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">
                  Performed By: {log.markedBy || 'System'} (ID: {log.staffId || 'EMP-001'})
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shake Quantity Selector Popup */}
      {activeShakeSelection && !showShakeConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-amber-800 uppercase tracking-wider">Select Shake Quantity</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">{activeShakeSelection.visitor.visitor_name}</p>
              </div>
              <button
                onClick={() => setActiveShakeSelection(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-amber-150"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-center">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Selected Shake Type</span>
                <span
                  className="inline-flex items-center rounded-full font-bold uppercase tracking-wider px-3 py-1.5 text-xs gap-1.5"
                  style={{
                    color: getShakeType(activeShakeSelection.shakeId)?.color,
                    background: getShakeType(activeShakeSelection.shakeId)?.bg
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getShakeType(activeShakeSelection.shakeId)?.color }} />
                  {getShakeType(activeShakeSelection.shakeId)?.label}
                </span>
              </div>

              {/* [-] Quantity Controls [+] */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    setActiveShakeSelection(prev => ({
                      ...prev,
                      quantity: Math.max(0, prev.quantity - 1)
                    }));
                  }}
                  className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-255 hover:border-amber-305 hover:bg-amber-55 text-gray-700 font-black text-xl flex items-center justify-center transition-all"
                >
                  -
                </button>
                <span className="text-3xl font-black text-gray-900 w-8">{activeShakeSelection.quantity}</span>
                <button
                  onClick={() => {
                    setActiveShakeSelection(prev => ({
                      ...prev,
                      quantity: prev.quantity + 1
                    }));
                  }}
                  className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-255 hover:border-amber-305 hover:bg-amber-55 text-gray-700 font-black text-xl flex items-center justify-center transition-all"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveShakeSelection(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (activeShakeSelection.quantity === 0) {
                      handleConfirmShakeSave(activeShakeSelection.visitor.id, activeShakeSelection.shakeId, 0);
                    } else {
                      setShowShakeConfirmation(true);
                    }
                  }}
                  className="flex-[2] py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shake Confirmation Modal */}
      {showShakeConfirmation && activeShakeSelection && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-green-900 uppercase tracking-wider">Confirm Shake Entry</h3>
                <p className="text-xs text-green-700 font-medium mt-0.5">Please review the details below</p>
              </div>
              <button
                onClick={() => setShowShakeConfirmation(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-green-150"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-bold text-gray-700">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Visitor Name</span>
                  <span className="text-gray-900 font-extrabold">{activeShakeSelection.visitor.visitor_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Shake Type</span>
                  <span
                    className="inline-flex items-center rounded-full font-bold uppercase tracking-wider px-2.5 py-1 text-[10px] gap-1"
                    style={{
                      color: getShakeType(activeShakeSelection.shakeId)?.color,
                      background: getShakeType(activeShakeSelection.shakeId)?.bg
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: getShakeType(activeShakeSelection.shakeId)?.color }} />
                    {getShakeType(activeShakeSelection.shakeId)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Quantity</span>
                  <span className="text-gray-900 font-extrabold text-sm">{activeShakeSelection.quantity} Shake(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Date</span>
                  <span className="text-gray-900">{getISTShortDisplayDate()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Time</span>
                  <span className="text-gray-900">{getISTTimeString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShakeConfirmation(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleConfirmShakeSave(
                      activeShakeSelection.visitor.id,
                      activeShakeSelection.shakeId,
                      activeShakeSelection.quantity
                    );
                  }}
                  className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md animate-pulse"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Calendar Modal component integration */}
      {isCalendarOpen && (
        <VisitorCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onDateSelect={(dateStr) => {
            setShowTodayOnly(false);
            setShowYesterdayOnly(false);
            setSelectedDate(dateStr);
          }}
        />
      )}

    </div>
  );
}
