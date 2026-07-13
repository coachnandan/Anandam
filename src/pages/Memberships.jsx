import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard, AlertTriangle, CheckCircle, Clock, ShieldAlert,
  DollarSign, Plus, X, Users, Filter, ChevronDown, Download,
  Eye, Edit3, Trash2, Activity, Calendar, History, MessageSquare,
  MapPin, Briefcase, Phone, ArrowRight, User, Info, Tag,
  Globe, Award, Sparkles, Zap, Smartphone, Search, RefreshCw,
  ChevronLeft, ChevronRight, List, Printer, Receipt
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getISTDateString, getISTTimeString, getISTShortDisplayDate, getISTDisplayDate } from '../utils/dateUtils';
import { MEMBERSHIP_RATES } from '../utils/calculations';

const SHAKE_TYPES = [
  { id: 'S',   label: 'Shake',                    short: 'S',   color: '#D97706', bg: '#FEF3C7' },
  { id: 'SB',  label: 'Shake + Beta Heart',        short: 'SB',  color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'SF',  label: 'Shake + Fiber',             short: 'SF',  color: '#0891B2', bg: '#CFFAFE' },
  { id: 'SBF', label: 'Shake + Beta + Fiber',      short: 'SBF', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'D',   label: 'Dino',                      short: 'D',   color: '#059669', bg: '#D1FAE5' },
];

// ─── Attendance Profile Calendar Grid ─────────────────────────────────────────
const AttendanceHistoryCalendar = ({ memberId, attendance = [], shakeLogs = [], memberActivityLogs = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const todayStr = getISTDateString();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayStr);

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  // Get details for a given date
  const getDateDetails = (dateStr) => {
    const attRecord = attendance.find(a => a.customerId === memberId && a.date === dateStr);
    const shakeRecord = shakeLogs.find(s => s.personId === memberId && s.date === dateStr);

    return {
      status: attRecord?.status || 'Pending',
      checkIn: attRecord?.checkIn || '—',
      shakeType: shakeRecord?.item || '—',
      shakeQuantity: shakeRecord?.quantity || 0,
      approvedBy: attRecord?.markedBy || shakeRecord?.staffName || 'System',
    };
  };

  const selectedDetails = useMemo(() => {
    return getDateDetails(selectedCalendarDate);
  }, [selectedCalendarDate, attendance, shakeLogs, memberActivityLogs]);

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-black uppercase text-gray-700 tracking-wider">{monthName}</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <span key={idx} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{day}</span>
        ))}
        {calendarCells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
          const details = getDateDetails(dateStr);
          
          let dotColor = 'bg-gray-200';
          if (details.status === 'Present') dotColor = 'bg-green-500';
          if (details.status === 'Absent') dotColor = 'bg-red-500';

          const isSelected = dateStr === selectedCalendarDate;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedCalendarDate(dateStr)}
              className={`p-1.5 rounded-lg flex flex-col items-center justify-center border transition-all text-xs ${
                isSelected ? 'border-forest bg-forest/5 font-extrabold text-forest' : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <span>{day}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
            </button>
          );
        })}
      </div>

      {/* Selected Date Details Box */}
      <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-2 text-[11px] font-bold text-gray-750">
        <div className="flex justify-between items-center pb-1 border-b border-gray-200">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest">Date Details</span>
          <span className="text-gray-900">{getISTDisplayDate(selectedCalendarDate)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Status</span>
            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
              selectedDetails.status === 'Present' ? 'bg-green-105 text-green-700' :
              selectedDetails.status === 'Absent' ? 'bg-red-105 text-red-650' : 'bg-gray-200 text-gray-500'
            }`}>
              {selectedDetails.status}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Check-in</span>
            <span className="text-gray-900">{selectedDetails.checkIn}</span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Shake Type</span>
            <span className="text-gray-900">
              {selectedDetails.shakeType !== '—' ? (
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px]">
                  {SHAKE_TYPES.find(s => s.id === selectedDetails.shakeType)?.label || selectedDetails.shakeType}
                </span>
              ) : '—'}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Quantity</span>
            <span className="text-gray-900">{selectedDetails.shakeQuantity} shake(s)</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-gray-200 flex justify-between text-[9px] text-gray-400">
          <span>Approved By:</span>
          <span className="text-gray-650">{selectedDetails.approvedBy}</span>
        </div>
      </div>
    </div>
  );
};

export default function Memberships() {
  const {
    memberships,
    customers,
    addMembership,
    addNewMember,
    renewMembership,
    updateMembership,
    deleteMembership,
    updateCustomer,
    memberActivityLogs,
    memberPaymentHistory,
    paymentLogs = [],
    attendance = [],
    shakeLogs = [],
    user,
    sendWhatsAppAlert,
    getConsumedShakes,
    addPaymentLog,
    addActivityLog,
    membershipHistory = []
  } = useAppContext();

  // State variables
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPlanHistoryOpen, setIsPlanHistoryOpen] = useState(false);
  const [selectedTimelineTx, setSelectedTimelineTx] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Profile Modal Section Edit state
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Renewal Form state (in Profile Popup)
  const [renewPlan, setRenewPlan] = useState('30 Days');
  const [renewCustomDuration, setRenewCustomDuration] = useState('');
  const [renewMembershipType, setRenewMembershipType] = useState('Shake');
  const [renewTotalAmount, setRenewTotalAmount] = useState(7000);
  const [renewAdvanceAmount, setRenewAdvanceAmount] = useState(7000);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('');

  // Handle plan auto-calculations inside Renewal Panel
  useEffect(() => {
    if (renewPlan === 'Due Payment') {
      const currentDue = activeMembership 
        ? (activeMembership.dueAmount !== undefined ? activeMembership.dueAmount : Math.max(0, (activeMembership.totalAmount || 0) - (activeMembership.advanceAmount || 0)))
        : 0;
      setRenewTotalAmount(currentDue);
      setRenewAdvanceAmount(currentDue);
    } else {
      const dailyRate = MEMBERSHIP_RATES[renewMembershipType] || 250;
      const days = renewPlan === '1 Day' ? 1 : renewPlan === '10 Days' ? 10 : renewPlan === '30 Days' ? 30 : parseInt(renewCustomDuration || 0);
      if (days > 0) {
        const calculated = dailyRate * days;
        setRenewTotalAmount(calculated);
        setRenewAdvanceAmount(calculated);
      } else {
        setRenewTotalAmount('');
        setRenewAdvanceAmount('');
      }
    }
  }, [renewPlan, activeMembership, renewMembershipType, renewCustomDuration]);

  // Form states for Add Membership using react-hook-form
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      plan: '30 Days',
      membershipType: 'Shake',
      total_amount: 7000,
      advance_amount: 7000,
      paymentMethod: '',
      gender: '',
      profession: '',
      custom_profession: '',
      member_type: 'Member',
      purpose: '',
      custom_purpose: '',
      membership_start_date: getISTDateString(),
    }
  });

  const watchPlan = watch('plan');
  const watchMembershipType = watch('membershipType');
  const watchTotal = watch('total_amount');
  const watchAdvance = watch('advance_amount');
  const watchCustomDuration = watch('custom_duration');
  const watchMobile = watch('mobile_number');
  const watchSameAsMobile = watch('same_as_mobile');
  const watchProfession = watch('profession');
  const watchPurpose = watch('purpose');

  // Copy mobile to whatsapp if checkbox is active
  useEffect(() => {
    if (watchSameAsMobile) {
      setValue('whatsapp_number', watchMobile || '');
    }
  }, [watchSameAsMobile, watchMobile, setValue]);

  // Auto-calculate Total Amount in Step 2 of registration form
  useEffect(() => {
    const dailyRate = MEMBERSHIP_RATES[watchMembershipType] || 250;
    const days = watchPlan === '1 Day' ? 1 : watchPlan === '10 Days' ? 10 : watchPlan === '30 Days' ? 30 : parseInt(watchCustomDuration || 0);
    if (watchPlan && watchPlan !== 'Other') {
      const calculated = dailyRate * days;
      setValue('total_amount', calculated);
      setValue('advance_amount', calculated);
    } else if (watchPlan === 'Other') {
      const calculated = dailyRate * days;
      setValue('total_amount', calculated || '');
      setValue('advance_amount', calculated || '');
    }
  }, [watchPlan, watchMembershipType, watchCustomDuration, setValue]);

  // Filtered and searched memberships list
  const processedMemberships = useMemo(() => {
    let result = [...memberships];

    // Status filter (Active/Expired based on Shake Consumption)
    if (filter !== 'All') {
      result = result.filter(m => {
        const shakesConsumed = getConsumedShakes(m.customerId);
        const isExpired = m.durationDays > 0 && shakesConsumed >= m.durationDays;
        const dynamicStatus = isExpired ? 'Expired' : 'Active';
        return dynamicStatus === filter;
      });
    }

    // Search bar (Member Name & Mobile Number)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(m => {
        const customer = customers.find(c => c.id === m.customerId);
        if (!customer) return false;
        const nameMatch = customer.name?.toLowerCase().includes(q) || customer.full_name?.toLowerCase().includes(q);
        const contactMatch = customer.contact?.includes(q) || customer.mobile_number?.includes(q);
        return nameMatch || contactMatch;
      });
    }

    return result;
  }, [memberships, customers, filter, searchTerm, memberActivityLogs]);

  // Form Submission for New Member Registration (2-Step Form)
  const onSubmitNewMember = async (data) => {
    if (!data.paymentMethod) {
      toast.error('Payment method is required.');
      return;
    }

    const payload = {
      ...data,
      profession: data.profession === 'Other' ? data.custom_profession : data.profession,
      purpose: data.purpose === 'Other' ? data.custom_purpose : data.purpose,
    };

    try {
      const res = await addNewMember(payload);
      if (res.success) {
        toast.success('New member registered and membership activated successfully!');
        setIsNewMemberModalOpen(false);
        setEnrollmentStep(1);
        reset();
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    }
  };

  // Open Membership Profile Popup
  const openDetailModal = (membership) => {
    setActiveMembership(membership);
    setIsEditingInfo(false);
    setRenewPlan('30 Days');
    setRenewCustomDuration('');
    setRenewMembershipType(membership.membershipType || 'Shake');
    setIsDetailModalOpen(true);
  };

  // Submit Profile edits (only editable details allowed)
  const handleSaveProfileInfo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
      name: formData.get('full_name'),
      full_name: formData.get('full_name'),
      contact: formData.get('mobile_number'),
      mobile_number: formData.get('mobile_number'),
      whatsapp_number: formData.get('whatsapp_number'),
      dob: formData.get('dob'),
      gender: formData.get('gender'),
      profession: formData.get('profession'),
      member_type: formData.get('member_type'),
      purpose: formData.get('purpose'),
      address: formData.get('address'),
    };

    try {
      await updateCustomer(activeMembership.customerId, updates);
      toast.success('Member profile details updated successfully.');
      setIsEditingInfo(false);
    } catch (err) {
      toast.error('Failed to update details.');
    }
  };

  // Handle Membership Renewal from Quick Actions
  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    if (!renewPaymentMethod) {
      toast.error('Payment method is required.');
      return;
    }

    if (renewPlan === 'Due Payment') {
      if (renewAdvanceAmount <= 0) {
        toast.error('Please enter a valid amount to pay.');
        return;
      }
      const currentDue = activeMembership.dueAmount !== undefined 
        ? activeMembership.dueAmount 
        : Math.max(0, (activeMembership.totalAmount || 0) - (activeMembership.advanceAmount || 0));
      if (renewAdvanceAmount > currentDue) {
        toast.error(`Cannot pay more than the remaining due amount of ₹${currentDue}.`);
        return;
      }

      try {
        const newAdvance = (activeMembership.advanceAmount || 0) + Number(renewAdvanceAmount);
        const res = await updateMembership(activeMembership.id, {
          plan: activeMembership.plan,
          durationDays: activeMembership.durationDays,
          totalAmount: activeMembership.totalAmount,
          advanceAmount: newAdvance,
          status: activeMembership.status
        });

        if (!res.error) {
          const customer = customers.find(c => c.id === activeMembership.customerId) || {};
          
          // Log payment
          await addPaymentLog({
            memberId: activeMembership.customerId,
            memberName: customer.name,
            amount: Number(renewAdvanceAmount),
            paymentMode: renewPaymentMethod,
            paymentPurpose: 'Due Payment',
            plan: activeMembership.plan,
            date: getISTDateString()
          });

          // Log activity
          addActivityLog(activeMembership.customerId, {
            customerName: customer.name,
            type: 'payment',
            action_type: 'Due Payment Cleared',
            action_description: `${user?.name || 'Admin'} cleared due payment of ₹${renewAdvanceAmount} for ${customer.name || 'member'} via ${renewPaymentMethod}`,
            performed_by_name: user?.name || 'Admin',
            timestamp: new Date().toISOString()
          });

          toast.success(`Due payment of ₹${renewAdvanceAmount} successfully processed!`);
          
          // Refresh active membership representation
          if (res.data && res.data[0]) {
            setActiveMembership(res.data[0]);
          }
          
          setRenewPaymentMethod('');
        } else {
          toast.error(res.error);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to process due payment.');
      }
      return;
    }

    const duration = renewPlan === 'Other' ? Number(renewCustomDuration) : (renewPlan === '1 Day' ? 1 : renewPlan === '10 Days' ? 10 : 30);
    if (!duration || duration <= 0) {
      toast.error('Please specify a valid duration.');
      return;
    }

    try {
      const res = await renewMembership(activeMembership.id, {
        plan: renewPlan === 'Other' ? `${renewCustomDuration} Days` : renewPlan,
        durationDays: duration,
        amount: renewTotalAmount,
        advanceAmount: renewAdvanceAmount,
        paymentMethod: renewPaymentMethod,
        membershipType: renewMembershipType
      });

      if (!res.error) {
        toast.success('Membership successfully renewed!');
        // Refresh active membership representation
        if (res.data && res.data[0]) {
          setActiveMembership(res.data[0]);
        }
        
        // Reset renewal form states
        setRenewCustomDuration('');
        setRenewPaymentMethod('');
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Renewal failed.');
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-10 bg-offwhite/30 min-h-screen">
      {/* Upper Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Membership Module</h1>
          <p className="text-sm font-medium text-muted mt-1">Complete member records, profiles, and attendance metrics.</p>
        </div>
        <button
          onClick={() => {
            setEnrollmentStep(1);
            reset();
            setIsNewMemberModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-forest hover:bg-forest-hover text-white rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-forest/15 hover:shadow-xl active:scale-95 shrink-0"
        >
          <Plus size={16} /> Add New Membership
        </button>
      </div>

      {/* Control panel: search & status filter */}
      <div className="bg-white rounded-2xl border border-beige/65 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" size={18} />
          <input
            type="text"
            placeholder="Search by member name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 bg-offwhite/50 border border-beige rounded-xl font-bold text-forest outline-none placeholder:text-muted/30 focus:border-sage transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {['All', 'Active', 'Expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-forest text-white border-forest shadow-md'
                  : 'bg-white text-muted border-beige hover:border-sage'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Membership List Table */}
      <div className="bg-white rounded-3xl border border-beige/60 shadow-md overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 border-b border-beige">
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Engagement Plan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Membership Progress</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-forest uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedMemberships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users className="mx-auto text-beige mb-3" size={40} />
                    <p className="text-sm font-bold text-muted uppercase tracking-widest">No active memberships found</p>
                  </td>
                </tr>
              ) : (
                processedMemberships.map(membership => {
                  const customer = customers.find(c => c.id === membership.customerId);
                  const shakesConsumed = getConsumedShakes(membership.customerId);
                  const totalShakes = membership.durationDays || 0;
                  const shakesRemaining = Math.max(0, totalShakes - shakesConsumed);
                  const isExpired = totalShakes > 0 && shakesConsumed >= totalShakes;
                  const dynamicStatus = isExpired ? 'Expired' : 'Active';

                  const progressPercent = totalShakes > 0 ? Math.min(100, Math.round((shakesConsumed / totalShakes) * 100)) : 0;
                  
                  return (
                    <tr
                      key={membership.id}
                      onClick={() => openDetailModal(membership)}
                      className="hover:bg-offwhite/30 border-b border-beige/40 last:border-0 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-offwhite border border-beige text-forest font-bold rounded-xl flex items-center justify-center shadow-sm group-hover:bg-forest group-hover:text-white transition-all">
                            {customer?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-extrabold text-forest text-sm">{customer?.name || 'Practitioner'}</p>
                            <p className="text-[10px] text-muted font-mono mt-0.5">{customer?.contact || customer?.mobile_number || 'No contact'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Engagement Plan */}
                      <td className="px-8 py-6">
                        <p className="font-bold text-forest text-sm flex items-center gap-1.5">
                          {membership.plan}
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[9px] font-black uppercase tracking-wider">
                            {membership.membershipType || 'Shake'}
                          </span>
                        </p>
                        <p className="text-[10px] text-sage font-bold mt-0.5">Value: ₹{(membership.totalAmount || membership.amount || 0).toLocaleString('en-IN')}</p>
                      </td>

                      {/* Membership Progress */}
                      <td className="px-8 py-6 max-w-xs">
                        <div className="space-y-1.5">
                          <div className="w-full bg-beige/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: isExpired ? '#EF4444' : '#1F4D3A'
                              }}
                            />
                          </div>
                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                            Consumed: <span className="font-bold text-forest">{shakesConsumed}</span> / {totalShakes} Shakes ({progressPercent}%)
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-widest border transition-all ${
                          dynamicStatus === 'Active'
                            ? 'bg-green-150 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-150'
                        }`}>
                          {dynamicStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(membership)}
                            className="p-2.5 text-muted hover:text-forest bg-offwhite border border-beige hover:border-sage rounded-xl transition-all shadow-sm"
                            title="Preview Profile"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              openDetailModal(membership);
                            }}
                            className="p-2.5 text-forest hover:text-white hover:bg-gold border border-beige hover:border-gold rounded-xl transition-all shadow-sm"
                            title="Renew Membership"
                          >
                            <Clock size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this membership record? This action cannot be undone.")) {
                                deleteMembership(membership.id);
                                toast.success("Membership deleted successfully.");
                              }
                            }}
                            className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 border border-beige hover:border-red-500 rounded-xl transition-all shadow-sm"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* 2-Step New Member Enrollment Modal */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 lg:left-64 bg-gray-900/60 z-[100] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-beige animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-forest tracking-tight">Wellness Enrollment</h2>
                <p className="text-xs font-semibold text-sage/75 mt-0.5">Register a member and select plan.</p>
              </div>
              <button
                onClick={() => {
                  setIsNewMemberModalOpen(false);
                  setEnrollmentStep(1);
                }}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 border border-green-100 shadow-sm"
              >
                <X size={16} className="text-forest" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitNewMember)} className="p-6 space-y-6">
              {/* Stepper Indicators */}
              <div className="flex gap-2">
                {[1, 2].map(step => (
                  <div
                    key={step}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      enrollmentStep >= step ? 'bg-forest' : 'bg-beige/60'
                    }`}
                  />
                ))}
              </div>

              {enrollmentStep === 1 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                  <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-1 border-b border-beige">Step 1: Member Information</h3>
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      {...register("full_name", { required: "Full name is required" })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                    />
                    {errors.full_name && <span className="text-red-500 text-[10px] mt-1 block">{errors.full_name.message}</span>}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      {...register("mobile_number", { required: "Mobile number is required" })}
                      placeholder="e.g. 9876543210"
                      className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                    />
                    {errors.mobile_number && <span className="text-red-500 text-[10px] mt-1 block">{errors.mobile_number.message}</span>}
                  </div>

                  {/* WhatsApp Number with same-as-mobile checkbox */}
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
                      className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* DOB and Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date of Birth *</label>
                      <input
                        type="date"
                        {...register("dob", { required: "Date of birth is required" })}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Gender *</label>
                      <select
                        {...register("gender", { required: "Gender is required" })}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Profession (Predefined options + other input) */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Profession *</label>
                      <select
                        {...register("profession", { required: "Profession is required" })}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      >
                        <option value="">Select Profession</option>
                        <option value="Student">Student</option>
                        <option value="Employee">Employee</option>
                        <option value="Government Employee">Government Employee</option>
                        <option value="Retired Person">Retired Person</option>
                        <option value="Business Owner">Business Owner</option>
                        <option value="Homemaker">Homemaker</option>
                        <option value="Professional">Professional</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {watchProfession === 'Other' && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Specify Custom Profession *</label>
                        <input
                          type="text"
                          {...register("custom_profession", { required: watchProfession === 'Other' ? "Custom profession is required" : false })}
                          placeholder="e.g. Graphic Designer"
                          className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Member Type and Referral */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Member Type *</label>
                      <select
                        {...register("member_type")}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      >
                        <option value="Member">Member</option>
                        <option value="Coach">Coach</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Referral By *</label>
                      <input
                        type="text"
                        {...register("referred_by", { required: "Referral info is required" })}
                        placeholder="Name or Referral Source"
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      />
                      {errors.referred_by && <span className="text-red-500 text-[10px] mt-1 block">{errors.referred_by.message}</span>}
                    </div>
                  </div>

                  {/* Purpose of Joining (New Member Form) */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Purpose of Joining *</label>
                      <select
                        {...register("purpose", { required: "Purpose is required" })}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      >
                        <option value="">Select Purpose</option>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                        <option value="Energy & Fitness">Energy & Fitness</option>
                        <option value="Healthy Breakfast">Healthy Breakfast</option>
                        <option value="Skin Health">Skin Health</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {watchPurpose === 'Other' && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Specify Custom Purpose *</label>
                        <input
                          type="text"
                          {...register("custom_purpose", { required: watchPurpose === 'Other' ? "Custom purpose is required" : false })}
                          placeholder="Specify custom purpose"
                          className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Address *</label>
                    <input
                      type="text"
                      {...register("address", { required: "Address is required" })}
                      placeholder="Street name, City, State"
                      className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                    />
                    {errors.address && <span className="text-red-500 text-[10px] mt-1 block">{errors.address.message}</span>}
                  </div>
                </div>
              )}

              {enrollmentStep === 2 && (() => {
                const total = parseFloat(watchTotal) || 0;
                const paid = parseFloat(watchAdvance) || 0;
                const due = Math.max(0, total - paid);
                
                return (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                    <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-1 border-b border-beige">Step 2: Membership Details</h3>

                    {/* Start Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Membership Start Date *</label>
                      <input
                        type="date"
                        {...register("membership_start_date")}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      />
                    </div>

                    {/* Membership Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Membership Type *</label>
                      <select
                        {...register("membershipType")}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      >
                        {Object.entries(MEMBERSHIP_RATES).map(([name, rate]) => (
                          <option key={name} value={name}>
                            {name} (₹{rate}/day)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan duration */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Membership Duration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['1 Day', '10 Days', '30 Days', 'Other'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setValue('plan', p)}
                            className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                              watchPlan === p
                                ? 'bg-forest text-white border-forest shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-forest/20'
                            }`}
                          >
                            {p === 'Other' ? 'Other' : p.replace(' Days', 'D').replace(' Day', 'D')}
                          </button>
                        ))}
                      </div>
                      {watchPlan === 'Other' && (
                        <input
                          type="number"
                          min="1"
                          {...register("custom_duration", { required: watchPlan === 'Other' ? 'Custom duration is required' : false })}
                          placeholder="Enter custom duration (days)"
                          className="mt-2 w-full h-11 px-4 border-2 border-forest/30 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                        />
                      )}
                    </div>

                    {/* Total Amount (Editable) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Total Amount (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        {...register("total_amount", { required: "Total amount is required" })}
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      />
                    </div>

                    {/* Advance Payment */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Advance Payment (₹)</label>
                      <input
                        type="number"
                        min="0"
                        max={watchTotal}
                        {...register("advance_amount")}
                        placeholder="Enter advance received amount"
                        className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-forest transition-all"
                      />
                    </div>

                    {/* Due (Red Highlight Box) */}
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between">
                      <p className="text-sm font-bold text-red-700">Due Amount</p>
                      <p className="text-2xl font-bold text-red-600">₹{due}</p>
                    </div>

                    {/* Payment Method selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Payment Method *</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Cash', 'Online'].map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setValue('paymentMethod', method)}
                            className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                              watch('paymentMethod') === method
                                ? 'bg-forest text-white border-forest shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-forest/20'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-4 pt-4 border-t border-beige">
                {enrollmentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setEnrollmentStep(1)}
                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMemberModalOpen(false);
                      setEnrollmentStep(1);
                    }}
                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                )}

                {enrollmentStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => setEnrollmentStep(2)}
                    className="flex-[2] py-3.5 rounded-xl bg-forest text-white text-sm font-bold hover:bg-forest-hover transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-[2] py-3.5 rounded-xl bg-forest text-white text-sm font-bold hover:bg-forest-hover transition-all shadow-md active:scale-95"
                  >
                    Confirm Membership
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redesigned Membership Profile Popup */}
      {isDetailModalOpen && activeMembership && (() => {
        const customer = customers.find(c => c.id === activeMembership.customerId) || {};
        const shakesConsumed = getConsumedShakes(activeMembership.customerId);
        const totalShakes = activeMembership.durationDays || 0;
        const shakesRemaining = Math.max(0, totalShakes - shakesConsumed);
        const postExpiryShakes = Math.max(0, shakesConsumed - totalShakes);
        const shakePrice = totalShakes > 0 ? (activeMembership.totalAmount / totalShakes) : 230;
        const totalExtraCharge = Math.round(postExpiryShakes * shakePrice);
        const extraPaid = (paymentLogs || [])
          .filter(p => p.memberId === activeMembership.customerId && p.paymentPurpose === 'Extra Shake Payment')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const extraChargeDue = Math.max(0, totalExtraCharge - extraPaid);
        
        const attendanceCount = attendance.filter(a => a.customerId === activeMembership.customerId && a.status === 'Present').length;
        
        const rawPayments = (paymentLogs || [])
          .filter(p => p.memberId === activeMembership.customerId)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Deduplicate to avoid showing both temporary local logs and synced database records
        const uniquePayments = [];
        const seenKeys = new Set();
        rawPayments.forEach(p => {
          const key = `${p.amount}-${p.date}-${p.paymentMode || p.method || 'Cash'}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniquePayments.push(p);
          }
        });

        let runningTotalPlan = 0;
        let runningTotalPaid = 0;

        const payments = uniquePayments.map(p => {
          const isDuePayment = p.paymentPurpose === 'Due Payment';
          const planValue = isDuePayment ? 0 : (p.totalAmount || p.amount || 0);
          
          runningTotalPlan += planValue;
          runningTotalPaid += (p.amount || 0);
          
          const runningDue = Math.max(0, runningTotalPlan - runningTotalPaid);

          return {
            id: p.id,
            amount: p.amount,
            totalAmount: p.totalAmount || p.amount,
            planValue: planValue,
            due: runningDue,
            runningPaid: runningTotalPaid,
            method: p.paymentMode || 'Cash',
            date: p.date,
            time: p.time,
            timestamp: p.timestamp,
            adminName: p.staffName || 'Admin',
            adminId: p.staffId || '—',
            plan: p.plan || 'Subscription',
            paymentPurpose: p.paymentPurpose
          };
        }).reverse();
        const logs = memberActivityLogs.filter(l => l.customerId === activeMembership.customerId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Section 1: Payment Timeline (plan purchases, due payments, advances only)
        const paymentTimeline = payments;

        // Section 2: Combined Activity Log (Build completely from memberActivityLogs audit trail)
        const activityLog = (() => {
          const items = (memberActivityLogs || [])
            .filter(log => log.customerId === activeMembership.customerId)
            .map(log => {
              const logDate = log.timestamp ? log.timestamp.split('T')[0] : getISTDateString();
              const logTime = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
              
              return {
                id: log.id,
                type: log.type || 'audit',
                action_type: log.action_type || 'Activity',
                description: log.action_description || 'Status update',
                date: logDate,
                time: logTime,
                timestamp: log.timestamp || new Date().toISOString(),
                loggedBy: log.performed_by_name || log.markedBy || 'Admin',
                tableName: log.tableName
              };
            });

          return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        })();

        const progressPercent = totalShakes > 0 ? Math.min(100, Math.round((shakesConsumed / totalShakes) * 100)) : 0;
        const isExpired = totalShakes > 0 && shakesConsumed >= totalShakes;
        const dynamicStatus = isExpired ? 'Expired' : 'Active';

        return (
          <div className="fixed inset-0 lg:left-64 bg-gray-900/60 z-[100] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-beige animate-in fade-in slide-in-from-bottom-6 duration-300 my-8">
              {/* Header */}
              <div className="px-8 py-6 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-forest text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md shadow-forest/15">
                    {customer.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-forest tracking-tight">{customer.name || 'Profile'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2.5 py-1 bg-forest/10 text-forest rounded-lg text-[9px] font-bold uppercase tracking-wider">ID: {customer.id}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                        dynamicStatus === 'Active' ? 'bg-green-150 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-150'
                      }`}>
                        {dynamicStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-green-100 hover:bg-gray-50 shadow-sm"
                >
                  <X size={18} className="text-forest" />
                </button>
              </div>

              {/* Popup Content Grid */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
                
                {/* Section A: Member Information (col-span-4) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-beige">
                    <h3 className="text-xs font-bold text-forest uppercase tracking-widest flex items-center gap-1.5">
                      <User size={14} className="text-sage" /> A. Member Information
                    </h3>
                    {!isEditingInfo ? (
                      <button
                        onClick={() => setIsEditingInfo(true)}
                        className="text-[9px] font-bold text-sage hover:text-forest flex items-center gap-1 bg-offwhite px-2 py-1 rounded border border-beige hover:border-sage transition-all uppercase tracking-wider"
                      >
                        <Edit3 size={10} /> Edit Info
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingInfo(false)}
                        className="text-[9px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditingInfo ? (
                    <div className="bg-offwhite/40 border border-beige rounded-2xl p-5 space-y-4 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                        <p className="font-extrabold text-forest mt-0.5">{customer.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mobile</p>
                          <p className="font-bold text-forest mt-0.5">{customer.contact || customer.mobile_number}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp</p>
                          <p className="font-bold text-forest mt-0.5">{customer.whatsapp_number || customer.contact || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth</p>
                          <p className="font-bold text-forest mt-0.5">{customer.dob || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gender</p>
                          <p className="font-bold text-forest mt-0.5">{customer.gender || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Profession</p>
                        <p className="font-bold text-forest mt-0.5">{customer.profession || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Member Type</p>
                        <p className="font-bold text-forest mt-0.5">{customer.member_type || 'Member'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Purpose of Joining</p>
                        <p className="font-bold text-forest mt-0.5">{customer.purpose || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Referral By</p>
                        <p className="font-bold text-forest mt-0.5">{customer.referred_by || customer.referralSource || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Address</p>
                        <p className="font-bold text-forest mt-0.5">{customer.address || '—'}</p>
                      </div>
                      <div className="pt-3 border-t border-beige/60 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-300">Join Date</span>
                          <span className="font-bold">{customer.joining_date || customer.joiningDate || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-300">Created By</span>
                          <span className="font-bold">{customer.created_by_name || 'Admin'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfileInfo} className="bg-white border border-sage/30 rounded-2xl p-5 space-y-4 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                        <input type="text" name="full_name" defaultValue={customer.name} required className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Mobile</label>
                          <input type="tel" name="mobile_number" defaultValue={customer.contact || customer.mobile_number} required className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</label>
                          <input type="tel" name="whatsapp_number" defaultValue={customer.whatsapp_number || customer.contact} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
                          <input type="date" name="dob" defaultValue={customer.dob} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                          <select name="gender" defaultValue={customer.gender} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Profession</label>
                        <input type="text" name="profession" defaultValue={customer.profession} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Member Type</label>
                          <select name="member_type" defaultValue={customer.member_type || 'Member'} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest">
                            <option value="Member">Member</option>
                            <option value="Coach">Coach</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Purpose of Joining</label>
                          <input type="text" name="purpose" defaultValue={customer.purpose} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                        <input type="text" name="address" defaultValue={customer.address} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:border-forest" />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-forest text-white font-bold rounded-xl uppercase tracking-wider text-[10px] hover:bg-forest-hover transition-all">Save Profile Details</button>
                    </form>
                  )}
                </div>

                {/* Right Area (col-span-8) */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Row of Section B & C */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Section B: Membership Summary */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                        <Award size={14} className="text-sage" /> B. Membership Summary
                      </h3>
                      <div className="bg-white border border-beige rounded-2xl p-5 space-y-3.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Current Plan:</span>
                          <span className="font-extrabold text-forest text-sm bg-offwhite px-2 py-1 rounded border border-beige">{activeMembership.plan}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Membership Type:</span>
                          <span className="font-extrabold text-green-700 text-sm bg-green-50 px-2 py-1 rounded border border-green-100">{activeMembership.membershipType || 'Shake'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Total Shakes:</span>
                          <span className="font-extrabold text-forest">{totalShakes} Shakes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Shakes Consumed:</span>
                          <span className="font-extrabold text-green-700">{shakesConsumed} Shakes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Remaining Shakes:</span>
                          <span className="font-extrabold text-red-600">{shakesRemaining} Shakes</span>
                        </div>
                        <div 
                          onClick={() => setIsPlanHistoryOpen(true)}
                          className="flex justify-between items-center cursor-pointer hover:bg-forest/5 p-1 rounded-lg transition-all group"
                          title="Click to view plan purchase history"
                        >
                          <span className="text-gray-400 font-bold flex items-center gap-1 group-hover:text-forest">
                            Total Plan Amount <Info size={12} className="text-gray-400 group-hover:text-forest" />
                          </span>
                          <span className="font-extrabold text-forest group-hover:underline">
                            ₹{(activeMembership.totalAmount || activeMembership.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-bold">Advance Paid:</span>
                          <span className="font-extrabold text-green-700">₹{(activeMembership.advanceAmount || activeMembership.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-beige/60">
                          <div className="bg-red-50/60 border border-red-150 rounded-xl p-2.5 text-center">
                            <span className="block text-[9px] text-red-700 font-bold uppercase tracking-wider mb-0.5">Due Amount</span>
                            <span className="font-extrabold text-red-600 text-sm">
                              ₹{(activeMembership.dueAmount !== undefined 
                                ? activeMembership.dueAmount 
                                : Math.max(0, (activeMembership.totalAmount || 0) - (activeMembership.advanceAmount || 0))
                              ).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-gray-50/60 border border-gray-150 rounded-xl p-2.5 text-center">
                            <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Advance Paid</span>
                            <span className="font-extrabold text-gray-800 text-sm">
                              ₹{(activeMembership.advanceAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section C: Membership Progress */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                        <Activity size={14} className="text-sage" /> C. Membership Progress
                      </h3>
                      <div className="bg-white border border-beige rounded-2xl p-5 space-y-4 text-xs">
                        {/* Attendance Progress */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                            <span>Attendance Progress</span>
                            <span className="text-forest">{attendanceCount} Visits Marked</span>
                          </div>
                          <div className="w-full bg-offwhite border border-beige rounded-xl p-3 font-bold text-forest flex items-center justify-between text-xs shadow-sm">
                            <span>Total Attendance Marked</span>
                            <span className="text-sm text-forest font-extrabold bg-white px-2 py-0.5 border rounded">{attendanceCount} days</span>
                          </div>
                        </div>

                        {/* Shake Progress & Visual Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                            <span>Shake Progress (Primary)</span>
                            <span className="text-forest">{progressPercent}% Consumed</span>
                          </div>
                          <div className="w-full bg-beige/50 h-3 rounded-full overflow-hidden mb-3 border border-beige">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: isExpired ? '#EF4444' : '#1F4D3A'
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-offwhite p-2 border border-beige rounded-xl">
                              <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400">Purchased</span>
                              <span className="text-sm font-extrabold text-forest">{totalShakes}</span>
                            </div>
                            <div className="bg-green-50/50 p-2 border border-green-100 rounded-xl">
                              <span className="block text-[8px] font-bold uppercase tracking-wider text-green-700">Consumed</span>
                              <span className="text-sm font-extrabold text-green-800">{shakesConsumed}</span>
                            </div>
                            <div className="bg-red-50 p-2 border border-red-100 rounded-xl">
                              <span className="block text-[8px] font-bold uppercase tracking-wider text-red-500">Remaining</span>
                              <span className="text-sm font-extrabold text-red-600">{shakesRemaining}</span>
                            </div>
                          </div>
                        </div>

                        {/* Extra Post-Expiry Shakes Feature */}
                        {postExpiryShakes > 0 && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-amber-105 text-amber-800 border border-amber-300">
                                  ⚠️ Expiry Overuse Alert
                                </span>
                                <h4 className="text-xs font-bold text-amber-900 mt-1">Post-Expiry Shakes Owed</h4>
                              </div>
                              <span className="text-sm font-black text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                                {postExpiryShakes} Shakes
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                              Member consumed {postExpiryShakes} extra shake(s) after their {totalShakes} shake quota expired.
                            </p>
                            
                            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-amber-200/50">
                              <div className="bg-white/60 p-2 border border-amber-150 rounded-xl">
                                <span className="block text-[7px] font-bold uppercase tracking-wider text-amber-600">Total Owed</span>
                                <span className="text-xs font-extrabold text-amber-900">₹{totalExtraCharge}</span>
                              </div>
                              <div className="bg-white/60 p-2 border border-amber-150 rounded-xl">
                                <span className="block text-[7px] font-bold uppercase tracking-wider text-amber-600">Total Paid</span>
                                <span className="text-xs font-extrabold text-green-700">₹{extraPaid}</span>
                              </div>
                              <div className="bg-white/60 p-2 border border-amber-150 rounded-xl">
                                <span className="block text-[7px] font-bold uppercase tracking-wider text-amber-600">Due Dues</span>
                                <span className="text-xs font-extrabold text-red-650">₹{extraChargeDue}</span>
                              </div>
                            </div>

                            {extraChargeDue > 0 && (
                              <div className="pt-2 flex items-center gap-2">
                                <div className="flex-1">
                                  <input
                                    id="extraPayAmount"
                                    type="number"
                                    defaultValue={extraChargeDue}
                                    placeholder="Amount"
                                    className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900 outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    id="extraPayMethod"
                                    className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-950 outline-none focus:border-amber-500"
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const amountInput = document.getElementById('extraPayAmount');
                                    const methodSelect = document.getElementById('extraPayMethod');
                                    const payAmt = Number(amountInput?.value) || 0;
                                    const payMethod = methodSelect?.value || 'Cash';
                                    
                                    if (payAmt <= 0) {
                                      toast.error('Please enter a valid amount.');
                                      return;
                                    }
                                    
                                    try {
                                      await addPaymentLog({
                                        memberId: activeMembership.customerId,
                                        customerName: customer.name,
                                        amount: payAmt,
                                        paymentMode: payMethod,
                                        paymentPurpose: 'Extra Shake Payment',
                                        plan: activeMembership.plan,
                                        totalAmount: totalExtraCharge,
                                        due: Math.max(0, extraChargeDue - payAmt)
                                      });
                                      
                                      await addActivityLog(activeMembership.customerId, {
                                        customerName: customer.name,
                                        type: 'payment',
                                        action_type: 'Payment Logged',
                                        action_description: `Logged payment of ₹${payAmt} via ${payMethod} for ${postExpiryShakes} post-expiry shakes.`,
                                        performed_by_name: user?.name || 'Admin',
                                        timestamp: new Date().toISOString()
                                      });
                                      
                                      toast.success('Dues logged successfully!');
                                    } catch (err) {
                                      toast.error('Failed to log payment.');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-all shrink-0 shadow-sm"
                                >
                                  Settle
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual Attendance Profile Calendar */}
                        <div className="pt-2 border-t border-beige/60">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Attendance Calendar History</span>
                          <AttendanceHistoryCalendar
                            memberId={activeMembership.customerId}
                            attendance={attendance}
                            shakeLogs={shakeLogs}
                            memberActivityLogs={memberActivityLogs}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Section: Membership History */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                      <List size={14} className="text-sage" /> Membership Plan History
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                      {membershipHistory.filter(h => h.membershipId === activeMembership.id).length === 0 ? (
                        <p className="text-xs text-gray-400 bg-gray-50 border border-dashed rounded-xl py-6 text-center">No history records found.</p>
                      ) : (
                        membershipHistory
                          .filter(h => h.membershipId === activeMembership.id)
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                          .map((hist, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-beige flex flex-col md:flex-row justify-between gap-4 shadow-sm hover:border-sage transition-all">
                            <div className="space-y-1">
                              <span className="text-forest font-bold text-sm bg-offwhite px-2 py-0.5 rounded border border-beige inline-block mb-1">{hist.plan} ({hist.durationDays} Days)</span>
                              <p className="text-xs text-gray-500 font-semibold">{new Date(hist.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                              <p className="text-[10px] text-gray-400 font-bold">Marked By: <span className="text-forest">{hist.markedByName}</span></p>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-right">
                              <div>
                                <span className="block text-[9px] text-gray-400 font-bold uppercase">Total</span>
                                <span className="text-xs font-extrabold text-forest">₹{(hist.totalAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-gray-400 font-bold uppercase">Advance</span>
                                <span className="text-xs font-extrabold text-green-700">₹{(hist.advancePaid || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-red-500 font-bold uppercase">Due</span>
                                <span className="text-xs font-extrabold text-red-600">₹{(hist.dueAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>



                  {/* Section E: Separated Activity Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* E1: Attendance History */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-sage" /> E1. Attendance & Shake Log
                      </h3>
                      <div className="max-h-56 overflow-y-auto no-scrollbar rounded-xl border border-gray-100 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Log Type</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Description</p>
                        </div>
                        {/* Table Body */}
                        {(() => {
                          const attLogs = activityLog.filter(entry => {
                            const desc = (entry.description || '').toLowerCase();
                            const act = (entry.action_type || '').toLowerCase();
                            const type = (entry.type || '').toLowerCase();
                            const isAttendance = type === 'attendance_status' || act === 'attendance' || desc.includes('marked present') || desc.includes('marked absent') || desc.includes('attendance');
                            const isShake = type === 'shake' || act.includes('shake') || desc.includes('shake');
                            return isAttendance || isShake;
                          });

                          if (attLogs.length === 0) {
                            return <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50">No attendance or shake records.</div>;
                          }

                          return (
                            <div className="divide-y divide-gray-50">
                              {attLogs.map((entry, i) => {
                                const desc = (entry.description || '').toLowerCase();
                                const act = (entry.action_type || '').toLowerCase();
                                const type = (entry.type || '').toLowerCase();

                                const isAttendance = type === 'attendance_status' || act === 'attendance' || desc.includes('marked present') || desc.includes('marked absent') || desc.includes('attendance');

                                let badgeLabel = '✓ Present';
                                let badgeStyle = 'bg-green-50 text-green-700 border border-green-200';

                                if (isAttendance) {
                                  const isAbsent = act.includes('absent') || desc.includes('to absent') || desc.endsWith('absent');
                                  const isPresent = !isAbsent && (act.includes('present') || desc.includes('present') || desc.includes('✓'));
                                  badgeLabel = isPresent ? '✓ Present' : '✗ Absent';
                                  badgeStyle = isPresent ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200';
                                } else {
                                  badgeLabel = '🥛 Shake Log';
                                  badgeStyle = 'bg-purple-50 text-purple-700 border border-purple-200';
                                }

                                return (
                                  <div key={entry.id || i} className="grid grid-cols-[1.2fr_1.5fr_1.5fr] gap-2 px-3 py-2.5 hover:bg-green-50/30 transition-colors text-xs items-center">
                                    <div>
                                      <p className="font-bold text-gray-800 text-[10px]">{entry.date}</p>
                                      <p className="text-[8px] text-gray-400 font-mono">{entry.time}</p>
                                    </div>
                                    <div>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                        {entry.description}
                                        <span className="text-gray-400 font-normal"> — by </span>
                                        <span className="text-forest">{entry.loggedBy}</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* E2: Updates & Changes Log */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-forest uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                        <History size={14} className="text-sage" /> E2. Plan & Profile Updates
                      </h3>
                      <div className="max-h-56 overflow-y-auto no-scrollbar rounded-xl border border-gray-100 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Update Type</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Change Description</p>
                        </div>
                        {/* Table Body */}
                        {(() => {
                          const systemLogs = activityLog.filter(entry => {
                            const desc = (entry.description || '').toLowerCase();
                            const act = (entry.action_type || '').toLowerCase();
                            const type = (entry.type || '').toLowerCase();
                            const isAttendance = type === 'attendance_status' || act === 'attendance' || desc.includes('marked present') || desc.includes('marked absent') || desc.includes('attendance');
                            const isShake = type === 'shake' || act.includes('shake') || desc.includes('shake');
                            return !isAttendance && !isShake;
                          });

                          if (systemLogs.length === 0) {
                            return <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50">No updates recorded.</div>;
                          }

                          return (
                            <div className="divide-y divide-gray-50">
                              {systemLogs.map((entry, i) => {
                                const desc = (entry.description || '').toLowerCase();
                                const act = (entry.action_type || '').toLowerCase();

                                let badgeLabel = 'Profile Update';
                                let badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-250';

                                if (act.includes('membership') || act.includes('renewal') || act.includes('create') || desc.includes('enroll') || desc.includes('membership') || desc.includes('renewed') || desc.includes('plan') || entry.tableName === 'memberships') {
                                  badgeLabel = '💳 Membership Update';
                                  badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200';
                                }

                                return (
                                  <div key={entry.id || i} className="grid grid-cols-[1.2fr_1.5fr_1.5fr] gap-2 px-3 py-2 hover:bg-green-50/30 transition-colors text-xs items-center">
                                    <div>
                                      <p className="font-bold text-gray-800 text-[10px]">{entry.date}</p>
                                      <p className="text-[8px] text-gray-400 font-mono">{entry.time}</p>
                                    </div>
                                    <div>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                        {entry.description}
                                        <span className="text-gray-400 font-normal"> — by </span>
                                        <span className="text-forest">{entry.loggedBy}</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-green-50/50 border border-green-100 rounded-3xl space-y-5">
                    <h4 className="text-xs font-extrabold text-forest uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <RefreshCw size={14} className="animate-spin duration-[4000ms]" /> Quick Action: Renew Plan
                    </h4>
                    
                    <form onSubmit={handleRenewalSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Select Membership Type */}
                      {renewPlan !== 'Due Payment' && (
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Select Membership Type</label>
                          <select
                            value={renewMembershipType}
                            onChange={e => setRenewMembershipType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-255 rounded-xl font-bold text-gray-800 outline-none focus:border-forest"
                          >
                            {Object.entries(MEMBERSHIP_RATES).map(([name, rate]) => (
                              <option key={name} value={name}>
                                {name} (₹{rate}/day)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Select Plan */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Select Membership Plan</label>
                        <select
                          value={renewPlan}
                          onChange={e => setRenewPlan(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-255 rounded-xl font-bold text-gray-800 outline-none focus:border-forest"
                        >
                          <option value="1 Day">1 Day (₹{(MEMBERSHIP_RATES[renewMembershipType] || 250) * 1})</option>
                          <option value="10 Days">10 Days (₹{(MEMBERSHIP_RATES[renewMembershipType] || 250) * 10})</option>
                          <option value="30 Days">30 Days (₹{(MEMBERSHIP_RATES[renewMembershipType] || 250) * 30})</option>
                          <option value="Other">Other (Custom)</option>
                          <option value="Due Payment">Due Payment</option>
                        </select>
                      </div>

                      {/* Custom Days */}
                      {renewPlan === 'Other' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Enter Duration (Days)</label>
                          <input
                            type="number"
                            min="1"
                            value={renewCustomDuration}
                            onChange={e => setRenewCustomDuration(e.target.value)}
                            placeholder="e.g. 15"
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-255 rounded-xl font-bold text-gray-800 outline-none focus:border-forest"
                          />
                        </div>
                      )}

                      {/* Total Amount */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                          {renewPlan === 'Due Payment' ? 'Total Due Amount (₹)' : 'Total Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={renewTotalAmount}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRenewTotalAmount(val);
                            if (renewAdvanceAmount > val) setRenewAdvanceAmount(val);
                          }}
                          readOnly={renewPlan !== 'Other'}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-255 rounded-xl font-bold text-gray-800 outline-none focus:border-forest"
                        />
                      </div>

                      {/* Advance Paid */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                          {renewPlan === 'Due Payment' ? 'Amount to Pay (₹)' : 'Advance Paid (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={renewTotalAmount}
                          value={renewAdvanceAmount}
                          onChange={e => setRenewAdvanceAmount(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-250 rounded-xl font-bold text-gray-800 outline-none focus:border-forest"
                        />
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Payment Method *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Cash', 'Online'].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setRenewPaymentMethod(m)}
                              className={`py-2 rounded-lg border-2 text-[11px] font-bold transition-all ${
                                renewPaymentMethod === m
                                  ? 'bg-forest text-white border-forest'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-forest/20'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calculated Due highlighted box */}
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                        <span className="font-bold text-red-700">
                          {renewPlan === 'Due Payment' ? 'Remaining Due Amount' : 'Calculated Due Amount'}
                        </span>
                        <span className="font-extrabold text-red-600 text-lg">₹{Math.max(0, renewTotalAmount - renewAdvanceAmount)}</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-forest text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-forest-hover transition-all shadow-md active:scale-95 col-span-1 md:col-span-2"
                      >
                        {renewPlan === 'Due Payment' ? 'Confirm Payment & Save' : 'Confirm Renewal & Save'}
                      </button>
                    </form>
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {isPlanHistoryOpen && activeMembership && (
        <div className="fixed inset-0 lg:left-64 bg-gray-900/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-forest tracking-tight">Plan Purchase History</h3>
                <p className="text-[10px] font-semibold text-sage mt-0.5">Chronological breakdown of plans purchased by this member.</p>
              </div>
              <button
                onClick={() => setIsPlanHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 border border-green-100 shadow-sm"
              >
                <X size={14} className="text-forest" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto no-scrollbar">
              {(() => {
                const planPurchases = (paymentLogs || [])
                  .filter(p => p.memberId === activeMembership.customerId && p.paymentPurpose !== 'Due Payment' && p.paymentPurpose !== 'One Day Payment')
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first
                
                if (planPurchases.length === 0) {
                  return <p className="text-xs text-gray-400 text-center py-6">No plan purchases recorded.</p>;
                }
                
                return planPurchases.map((purchase, idx) => (
                  <div key={purchase.id || idx} className="p-4 bg-offwhite/50 border border-beige/40 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-forest text-sm">{purchase.plan || 'Membership Plan'}</p>
                      <p className="text-[10px] text-gray-450 font-semibold mt-1">
                        Added by: <span className="text-gray-700 font-bold">{purchase.received_by_name || 'Admin'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-800 text-sm">₹{(purchase.amount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-muted font-mono mt-1">{purchase.date}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedTimelineTx && (
        <div className="fixed inset-0 lg:left-64 bg-gray-900/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-forest tracking-tight">Receipt Details</h3>
                <p className="text-[10px] font-semibold text-sage mt-0.5">Detailed activity audit trail receipt.</p>
              </div>
              <button
                onClick={() => setSelectedTimelineTx(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 border border-green-100 shadow-sm"
              >
                <X size={14} className="text-forest" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-bold">
              <div className="bg-offwhite border border-beige rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Action:</span>
                  <span className="px-2 py-0.5 bg-forest text-white rounded text-[8px] uppercase tracking-wide">
                    {selectedTimelineTx.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-800">{selectedTimelineTx.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-gray-850 font-mono">{selectedTimelineTx.time}</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] text-sage uppercase tracking-wider mb-1">Details</p>
                <p className="text-gray-800 leading-relaxed font-bold text-xs">{selectedTimelineTx.description}</p>
              </div>

              {selectedTimelineTx.type === 'payment' && (
                <div className="bg-green-50/30 border border-green-100 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Plan Value:</span>
                    <span className="text-gray-800">₹{(selectedTimelineTx.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Amount Paid:</span>
                    <span className="text-green-700">₹{(selectedTimelineTx.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-green-200">
                    <span className="text-red-700">Remaining Due:</span>
                    <span className="text-red-650 font-extrabold text-sm">₹{(selectedTimelineTx.due || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="bg-beige/10 border border-beige/40 rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] text-sage uppercase tracking-wider mb-1">Processed By</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Staff Name:</span>
                  <span className="text-gray-800">{selectedTimelineTx.adminName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Staff ID:</span>
                  <span className="text-gray-600 font-mono">{selectedTimelineTx.adminId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. BILL INVOICE MODAL                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isBillModalOpen && activeMembership && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-offwhite border-b border-beige p-6 flex justify-between items-center shrink-0 print:hidden">
              <h2 className="text-lg font-extrabold text-forest flex items-center gap-2">
                <Receipt size={20} className="text-sage" /> Consolidated Membership Bill
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-forest hover:bg-forest-hover text-white p-2 rounded-xl transition-all shadow-sm"
                  title="Print Bill"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setIsBillModalOpen(false)}
                  className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 p-2 rounded-xl border border-beige hover:border-red-150 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Bill Content (Printable Area) */}
            <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6" id="printable-bill">
              
              {/* Bill Header */}
              <div className="text-center border-b-2 border-forest pb-6 space-y-1">
                <h1 className="text-2xl font-extrabold text-forest uppercase tracking-widest">Wellness Club</h1>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Membership Invoice</p>
              </div>

              {/* 1. Member Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-forest uppercase tracking-widest border-b border-beige pb-1">1. Member Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold bg-offwhite p-4 rounded-xl border border-beige">
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase text-[9px] tracking-wider">Member Name</p>
                    <p className="text-forest text-sm">{activeMembership.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase text-[9px] tracking-wider">Member ID</p>
                    <p className="text-gray-800 font-mono text-sm">{activeMembership.customerId?.slice(0, 8) || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase text-[9px] tracking-wider">Contact Number</p>
                    <p className="text-gray-800 text-sm">{activeMembership.customerPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 uppercase text-[9px] tracking-wider">Membership Status</p>
                    <p className={`text-sm ${activeMembership.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{activeMembership.status}</p>
                  </div>
                </div>
              </div>

              {/* Compute shared data for summaries */}
              {(() => {
                const memberHistory = membershipHistory.filter(h => h.membershipId === activeMembership.id);
                const grandTotal = memberHistory.reduce((sum, h) => sum + (h.totalAmount || 0), 0);
                const grandAdvance = memberHistory.reduce((sum, h) => sum + (h.advancePaid || 0), 0);
                const currentDue = activeMembership.dueAmount !== undefined ? activeMembership.dueAmount : Math.max(0, grandTotal - grandAdvance);
                const totalDuration = memberHistory.reduce((sum, h) => sum + (h.durationDays || 0), 0);
                
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 2. Membership Summary */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-extrabold text-forest uppercase tracking-widest border-b border-beige pb-1">2. Membership Summary</h3>
                        <div className="bg-white border border-beige p-4 rounded-xl space-y-3 text-xs font-bold">
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Total Duration</span>
                            <span className="text-forest">{totalDuration} Days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Start Date</span>
                            <span className="text-gray-800">{activeMembership.startDate ? new Date(activeMembership.startDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Expiry Date</span>
                            <span className="text-gray-800">{activeMembership.endDate ? new Date(activeMembership.endDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Financial Summary */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-extrabold text-forest uppercase tracking-widest border-b border-beige pb-1">3. Financial Summary</h3>
                        <div className="bg-white border border-beige p-4 rounded-xl space-y-3 text-xs font-bold">
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Total Membership Amount</span>
                            <span className="text-gray-800">₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Total Advance Paid</span>
                            <span className="text-green-700">₹{grandAdvance.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 uppercase text-[10px] tracking-wider">Total Amount Paid</span>
                            <span className="text-green-700">₹{grandAdvance.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-400 uppercase text-[10px] tracking-wider">Total Due Amount</span>
                            <span className="text-red-600">₹{currentDue.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Membership Billing History */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold text-forest uppercase tracking-widest border-b border-beige pb-1">4. Membership Billing History</h3>
                      
                      <table className="w-full text-left text-[10px] font-bold border-collapse border border-beige">
                        <thead>
                          <tr className="bg-forest text-white uppercase tracking-wider">
                            <th className="p-2 border border-forest-hover">Date & Time</th>
                            <th className="p-2 border border-forest-hover">Plan Duration</th>
                            <th className="p-2 border border-forest-hover text-right">Total</th>
                            <th className="p-2 border border-forest-hover text-right">Advance</th>
                            <th className="p-2 border border-forest-hover text-right">Due</th>
                            <th className="p-2 border border-forest-hover text-center">Status</th>
                            <th className="p-2 border border-forest-hover">Marked By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const sortedHistory = [...memberHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                            if (sortedHistory.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="7" className="p-4 text-center text-gray-400">No history records found.</td>
                                </tr>
                              );
                            }

                            return sortedHistory.map((hist, idx) => {
                              const isPaid = (hist.dueAmount || 0) <= 0;
                              return (
                                <tr key={idx} className="border-b border-beige last:border-0 hover:bg-offwhite/50 transition-colors">
                                  <td className="p-2 text-gray-600">{new Date(hist.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                  <td className="p-2 text-forest">{hist.durationDays} Days</td>
                                  <td className="p-2 text-right text-gray-800">₹{(hist.totalAmount || 0).toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right text-green-700">₹{(hist.advancePaid || 0).toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right text-red-600">₹{(hist.dueAmount || 0).toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {isPaid ? 'Paid' : 'Due'}
                                    </span>
                                  </td>
                                  <td className="p-2 text-gray-600 truncate max-w-[80px]">{hist.markedByName || 'System'}</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* 5. Bill Totals */}
                    <div className="flex justify-end pt-4 border-t-2 border-forest mt-6">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                          <span className="uppercase tracking-widest">Total Membership Amount</span>
                          <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                          <span className="uppercase tracking-widest">Total Amount Paid</span>
                          <span>₹{grandAdvance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-green-700">
                          <span className="uppercase tracking-widest">Total Advance Paid</span>
                          <span>₹{grandAdvance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-extrabold text-red-600 pt-2 border-t border-beige">
                          <span className="uppercase tracking-widest">Total Due Amount</span>
                          <span>₹{currentDue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              {/* Footer */}
              <div className="pt-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <p>Thank you for your business.</p>
                <p>Generated by Wellness Dashboard System</p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
