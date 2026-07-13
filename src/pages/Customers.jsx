import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus, Search, Filter, X, Edit3, Trash2, ChevronLeft, ChevronRight,
  Phone, MapPin, Briefcase, Activity, CreditCard, CalendarClock,
  ChevronDown, User as UserIcon, CheckCircle, XCircle, Coffee,
  Banknote, Clock, Calendar, FileText, Eye, ShieldCheck, MoreVertical,
  Check, RefreshCw
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { getISTDisplayDate, getISTDateString, getISTTimeString } from '../utils/dateUtils';
import { MEMBERSHIP_RATES } from '../utils/calculations';

// ─── Dropdown Badge Helper ───────────────────────────────────────────────────
function Badge({ children, color = 'green' }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    muted: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] border ${map[color]}`}>
      {children}
    </span>
  );
}

// ─── Centered Premium Modal Shell ─────────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} border border-gray-100 animate-in zoom-in-95 duration-300 my-6`}>
        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-forest tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-1 font-medium">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-3 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md">
            <X size={20} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon size={14} className="mt-0.5 text-sage shrink-0" />}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
        <p className="text-sm font-bold text-forest mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function Customers() {
  const {
    customers, addCustomer, updateCustomer, deleteCustomer, dataLoading,
    addMembership, getMemberActivityLogs, addActivityLog, memberships, user
  } = useAppContext();

  // ── Table States ──
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // ── Modal States ──
  const [modal, setModal] = useState(null); // 'add'|'profile'|'membership'|'convert'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form States ──
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  // Watch fields for logic
  const mobileWatch = watch('mobile_number');
  const whatsappWatch = watch('whatsapp_number');
  const sameAsMobileWatch = watch('same_as_mobile');
  const professionWatch = watch('profession');
  const purposeWatch = watch('purpose');
  const genderWatch = watch('gender');
  const memberTypeWatch = watch('member_type');

  // Referral Auto Suggestion States
  const [referralSearch, setReferralSearch] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showReferralDropdown, setShowReferralDropdown] = useState(false);

  // Sync WhatsApp number to mobile number if checkbox is checked
  useEffect(() => {
    if (sameAsMobileWatch && mobileWatch) {
      setValue('whatsapp_number', mobileWatch);
    }
  }, [sameAsMobileWatch, mobileWatch, setValue]);

  // Convert to Membership State
  const [convStartDate, setConvStartDate] = useState(getISTDateString());
  const [convDuration, setConvDuration] = useState('10 Days');
  const [convCustomDays, setConvCustomDays] = useState('');
  const [convMembershipType, setConvMembershipType] = useState('Shake');
  const [convAmount, setConvAmount] = useState(2500);
  const [convAdvance, setConvAdvance] = useState(2500);
  const [convMethod, setConvMethod] = useState('Cash');

  // ── Constants ──
  const itemsPerPage = 8;

  const professionOptions = [
    'Student', 'Housewife', 'Working Professional', 'Business Owner',
    'Health Coach', 'Gym Owner', 'Retired', 'Self Employed', 'Other'
  ];

  const purposeOptions = [
    'Weight Loss', 'Weight Gain', 'Fitness', 'Better Health',
    'Business Opportunity', 'Wellness Coaching', 'Nutrition', 'Lifestyle Improvement', 'Other'
  ];

  // ── Referral Suggestion List ──
  const referralSuggestions = useMemo(() => {
    if (!referralSearch.trim()) return customers.slice(0, 5);
    const lower = referralSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower));
  }, [customers, referralSearch]);

  // ── Filter and search logic ──
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.contact || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Modal Opener ──
  const openModal = (type, customer = null) => {
    setSelectedCustomer(customer);
    setActiveDropdown(null);
    if (type === 'add') {
      reset({
        joining_date: getISTDateString(),
        same_as_mobile: false,
        whatsapp_number: '',
        gender: '',
        profession: '',
        purpose: '',
        member_type: '',
        custom_profession: '',
        custom_purpose: ''
      });
      setSelectedReferral(null);
      setReferralSearch('');
    } else if (type === 'profile' && customer) {
      // Set values for edit form in preview & edit mode
      reset({
        full_name: customer.name || '',
        mobile_number: customer.contact || customer.mobile_number || '',
        whatsapp_number: customer.whatsapp_number || '',
        same_as_mobile: customer.whatsapp_number === (customer.contact || customer.mobile_number),
        dob: customer.dob || '',
        gender: customer.gender || '',
        profession: customer.profession ? (professionOptions.includes(customer.profession) ? customer.profession : 'Other') : '',
        custom_profession: customer.profession ? (professionOptions.includes(customer.profession) ? '' : customer.profession) : '',
        purpose: customer.purpose ? (purposeOptions.includes(customer.purpose) ? customer.purpose : 'Other') : '',
        custom_purpose: customer.purpose ? (purposeOptions.includes(customer.purpose) ? '' : customer.purpose) : '',
        member_type: customer.member_type || 'Member',
        referred_by: customer.referred_by || '',
        address: customer.address || '',
        joining_date: customer.joining_date || getISTDateString()
      });
      const referrer = customers.find(c => c.name === customer.referred_by) || null;
      setSelectedReferral(referrer ? { id: referrer.id, name: referrer.name } : { id: 'manual', name: customer.referred_by });
      setReferralSearch(customer.referred_by || '');
    } else if (type === 'convert' && customer) {
      setConvStartDate(getISTDateString());
      setConvDuration('10 Days');
      setConvCustomDays('');
      setConvAmount(2500);
      setConvAdvance(2500);
      setConvMethod('Cash');
    }
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedCustomer(null);
  };

  // Synchronize duration and default amounts for conversions
  useEffect(() => {
    const dailyRate = MEMBERSHIP_RATES[convMembershipType] || 250;
    const days = convDuration === '1 Day' ? 1 : convDuration === '10 Days' ? 10 : convDuration === '30 Days' ? 30 : parseInt(convCustomDays || 0);
    if (days > 0) {
      const calculated = dailyRate * days;
      setConvAmount(calculated);
      setConvAdvance(calculated);
    } else {
      setConvAmount('');
      setConvAdvance('');
    }
  }, [convDuration, convMembershipType, convCustomDays]);

  // ── Profile Creation / Modification ──
  const onSubmitProfile = async (data) => {
    if (isSubmitting) return;
    if (!selectedReferral) {
      toast.error('Please select a referrer.');
      return;
    }
    setIsSubmitting(true);

    const finalProfession = data.profession === 'Other' ? data.custom_profession : data.profession;
    const finalPurpose = data.purpose === 'Other' ? data.custom_purpose : data.purpose;
    const finalReferral = selectedReferral.name;

    const payload = {
      name: data.full_name,
      contact: data.mobile_number,
      whatsapp_number: data.whatsapp_number,
      dob: data.dob,
      gender: data.gender,
      profession: finalProfession,
      purpose: finalPurpose,
      member_type: data.member_type,
      referred_by: finalReferral,
      address: data.address,
      joining_date: data.joining_date || getISTDateString()
    };

    try {
      if (selectedCustomer) {
        // Track changes to make audit log
        const oldProfile = selectedCustomer;
        const changes = [];
        const trackChange = (field, oldVal, newVal) => {
          if (oldVal !== newVal) {
            changes.push({
              field,
              oldValue: oldVal || '—',
              newValue: newVal || '—'
            });
          }
        };

        trackChange('Full Name', oldProfile.name, payload.name);
        trackChange('Mobile Number', oldProfile.contact, payload.contact);
        trackChange('WhatsApp Number', oldProfile.whatsapp_number, payload.whatsapp_number);
        trackChange('DOB', oldProfile.dob, payload.dob);
        trackChange('Gender', oldProfile.gender, payload.gender);
        trackChange('Profession', oldProfile.profession, payload.profession);
        trackChange('Purpose', oldProfile.purpose, payload.purpose);
        trackChange('Member Type', oldProfile.member_type, payload.member_type);
        trackChange('Referred By', oldProfile.referred_by, payload.referred_by);
        trackChange('Address', oldProfile.address, payload.address);

        await updateCustomer(selectedCustomer.id, payload);

        // Log audit log for every change
        changes.forEach(c => {
          addActivityLog(selectedCustomer.id, {
            type: 'edit',
            fieldName: c.field,
            previousValue: c.oldValue,
            newValue: c.newValue,
            editedBy: user?.name || 'Admin',
            adminUserId: user?.id || 'ADM-001',
            date: getISTDateString(),
            time: getISTTimeString()
          });
        });

        toast.success('Member profile updated successfully.');
      } else {
        const result = await addCustomer(payload);
        if (result?.duplicate) {
          toast.info('Profile already exists for this mobile number.');
        } else {
          toast.success('Member Profile Created Successfully.');
        }
      }
      closeModal();
      reset();
    } catch (error) {
      toast.error(`Error: ${error.message || 'Operation failed.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Convert to Membership ──
  const handleConvertToMembership = async (e) => {
    e.preventDefault();
    const finalDurationDays = convDuration === 'Other' ? parseInt(convCustomDays) : (convDuration === '1 Day' ? 1 : convDuration === '10 Days' ? 10 : 30);
    if (convDuration === 'Other' && (!convCustomDays || finalDurationDays < 1)) {
      toast.error('Please enter a valid custom duration.');
      return;
    }

    try {
      // Create membership record
      await addMembership({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        plan: convDuration === 'Other' ? `${finalDurationDays} Days` : convDuration,
        durationDays: finalDurationDays,
        totalAmount: parseFloat(convAmount),
        advanceAmount: parseFloat(convAdvance),
        startDate: convStartDate,
        paymentMethod: convMethod,
        membershipType: convMembershipType
      });

      // Audit log entry for membership creation
      addActivityLog(selectedCustomer.id, {
        type: 'membership_created',
        plan: convDuration === 'Other' ? `${finalDurationDays} Days` : convDuration,
        durationDays: finalDurationDays,
        totalAmount: parseFloat(convAmount),
        advancePaid: parseFloat(convAdvance),
        dueAmount: Math.max(0, parseFloat(convAmount) - parseFloat(convAdvance)),
        paymentMethod: convMethod,
        createdBy: user?.name || 'Admin',
        adminUserId: user?.id || 'ADM-001',
        date: getISTDateString(),
        time: getISTTimeString()
      });

      toast.success('Membership activated successfully.');
      closeModal();
    } catch (error) {
      toast.error(`Failed to activate membership: ${error.message}`);
    }
  };

  // ── Soft Delete / Archive with 24 Hours Countdown ──
  const handleArchiveProfile = (customer) => {
    if (window.confirm(`Are you sure you want to archive ${customer.name}? This profile will enter pending archive state.`)) {
      const archiveTimestamp = new Date().toISOString();
      updateCustomer(customer.id, {
        archive_status: 'Archive Pending',
        archived_by: user?.name || 'Admin',
        archived_by_id: user?.id || 'ADM-001',
        archive_at: archiveTimestamp
      });
      addActivityLog(customer.id, {
        type: 'archive_request',
        archivedBy: user?.name || 'Admin',
        adminUserId: user?.id || 'ADM-001',
        date: getISTDateString(),
        time: getISTTimeString()
      });
      toast.info('Profile archive request submitted. 24h countdown started.');
    }
  };

  const handleRestoreProfile = (customer) => {
    updateCustomer(customer.id, {
      archive_status: null,
      archived_by: null,
      archived_by_id: null,
      archive_at: null
    });
    addActivityLog(customer.id, {
      type: 'restore_profile',
      restoredBy: user?.name || 'Admin',
      adminUserId: user?.id || 'ADM-001',
      date: getISTDateString(),
      time: getISTTimeString()
    });
    toast.success('Profile restored successfully.');
  };

  // ── Real-Time Countdown Renderer ──
  const renderCountdown = (archiveAtStr) => {
    const archiveTime = new Date(archiveAtStr);
    const expireTime = new Date(archiveTime.getTime() + 24 * 60 * 60 * 1000);
    const diff = expireTime - new Date();
    if (diff <= 0) return 'Archiving...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} Hours ${mins} Minutes`;
  };

  // Close active dropdowns on window click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-dropdown]')) setActiveDropdown(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="space-y-12">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-bold text-forest tracking-tight">Member Management</h1>
          <p className="text-muted mt-2 font-medium">Register and configure client profiles, membership levels, and audit trail records.</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="w-full lg:w-auto flex items-center justify-center px-8 py-4 bg-forest text-white rounded-xl font-semibold uppercase tracking-[0.15em] text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20 active:scale-95"
        >
          <Plus size={18} className="mr-2 text-gold" />
          Add New Member
        </button>
      </div>

      {/* ── Member Table ── */}
      <div className="luxury-card overflow-hidden bg-white">
        <div className="p-8 sm:p-10 border-b border-beige flex flex-col sm:flex-row gap-6 items-center bg-offwhite/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/40" size={20} />
            <input
              type="text"
              placeholder="Search members by name, ID or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-white border border-beige rounded-xl text-forest font-bold text-sm placeholder-muted/30 focus:ring-4 focus:ring-sage/10 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-4 bg-white border border-beige rounded-xl text-forest font-semibold uppercase tracking-widest text-[10px] outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-sage/10 transition-all"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 text-muted text-[10px] font-semibold uppercase tracking-[0.2em] border-b border-beige">
                <th className="px-10 py-6">Member Profile</th>
                <th className="px-10 py-6 hidden lg:table-cell">Profession</th>
                <th className="px-10 py-6 hidden lg:table-cell">Purpose</th>
                <th className="px-10 py-6 hidden xl:table-cell">Referred By</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {dataLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-10 py-8"><div className="w-28 h-4 bg-sage/10 rounded" /></td>
                    <td className="px-10 py-8 hidden lg:table-cell"><div className="w-24 h-4 bg-sage/10 rounded" /></td>
                    <td className="px-10 py-8 hidden lg:table-cell"><div className="w-24 h-4 bg-sage/10 rounded" /></td>
                    <td className="px-10 py-8 hidden xl:table-cell"><div className="w-24 h-4 bg-sage/10 rounded" /></td>
                    <td className="px-10 py-8"><div className="w-16 h-6 bg-sage/10 rounded-xl" /></td>
                    <td className="px-10 py-8 text-right"><div className="inline-block w-10 h-10 bg-sage/10 rounded-xl" /></td>
                  </tr>
                ))
              ) : currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-muted font-medium">No members found.</td>
                </tr>
              ) : (
                currentCustomers.map((customer) => {
                  const isArchivePending = customer.archive_status === 'Archive Pending';
                  return (
                    <tr key={customer.id} className="hover:bg-offwhite transition-colors group">
                      {/* Name */}
                      <td className="px-10 py-8">
                        <div className="flex items-center">
                          <div className="w-14 h-14 rounded-xl bg-offwhite border border-beige flex items-center justify-center text-forest font-semibold text-lg mr-5 shadow-sm group-hover:bg-forest group-hover:text-white transition-all">
                            {customer?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-forest text-base leading-tight">{customer?.name || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">{customer?.id || 'NO_ID'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Profession */}
                      <td className="px-10 py-8 hidden lg:table-cell">
                        <p className="text-sm font-bold text-forest flex items-center"><Briefcase size={14} className="mr-2 text-sage" /> {customer.profession || '—'}</p>
                      </td>
                      {/* Purpose */}
                      <td className="px-10 py-8 hidden lg:table-cell">
                        <p className="text-sm font-bold text-forest flex items-center"><Activity size={14} className="mr-2 text-gold" /> {customer.purpose || '—'}</p>
                      </td>
                      {/* Referred By */}
                      <td className="px-10 py-8 hidden xl:table-cell">
                        <p className="text-sm font-bold text-forest flex items-center"><UserIcon size={14} className="mr-2 text-sage" /> {customer.referred_by || 'Direct'}</p>
                      </td>
                      {/* Status */}
                      <td className="px-10 py-8">
                        {isArchivePending ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-semibold uppercase tracking-[0.15em] bg-red-50 text-red-600 border border-red-200">
                            Archive Pending
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-semibold uppercase tracking-[0.15em] border ${customer.status === 'Active' ? 'bg-emerald/5 text-emerald border-emerald/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {customer.status}
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-10 py-8 text-right relative" data-dropdown>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === customer.id ? null : customer.id); }}
                          className="p-3 text-muted hover:text-forest bg-offwhite border border-beige rounded-xl transition-all shadow-sm group-hover:shadow-md"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {activeDropdown === customer.id && (
                          <div className="absolute right-14 top-12 w-56 bg-white rounded-xl shadow-lg border border-beige z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                            {isArchivePending ? (
                              <>
                                <button
                                  onClick={() => { handleRestoreProfile(customer); setActiveDropdown(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-emerald-600 hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                                >
                                  <RefreshCw size={16} className="mr-3" /> Restore Profile
                                </button>
                                <div className="px-6 py-4 text-left text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50/50">
                                  <p>Archive Status: Pending</p>
                                  <p className="mt-1 normal-case tracking-normal text-muted">Remaining: {renderCountdown(customer.archive_at)}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openModal('profile', customer)}
                                  className="w-full px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                                >
                                  <Eye size={16} className="mr-3 text-sage" /> Preview & Edit
                                </button>
                                <button
                                  onClick={() => openModal('convert', customer)}
                                  className="w-full px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                                >
                                  <CreditCard size={16} className="mr-3 text-gold" /> Convert to Membership
                                </button>
                                <button
                                  onClick={() => { handleArchiveProfile(customer); setActiveDropdown(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors flex items-center"
                                >
                                  <Trash2 size={16} className="mr-3" /> Archive Profile
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-10 py-8 bg-offwhite/30 border-t border-beige flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} members
            </p>
            <div className="flex items-center space-x-3">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODAL: Add / Edit Profile ═══════════════════════════════════════ */}
      {(modal === 'add' || modal === 'profile') && (
        <ModalShell
          title={selectedCustomer ? 'Preview & Edit Profile' : 'New Member Profile'}
          subtitle="Configure demographic and registration records."
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
            <div>
              <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.3em] mb-4">Personal Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Full Name *</label>
                  <input {...register('full_name', { required: 'Full name is required' })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Priyanshu Sahu" />
                  {errors.full_name && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.full_name.message}</span>}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Mobile Number *</label>
                  <input {...register('mobile_number', { required: 'Mobile number is required', pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digit number' } })} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="10-digit number" />
                  {errors.mobile_number && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.mobile_number.message}</span>}
                </div>

                {/* WhatsApp */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">WhatsApp Number</label>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-muted cursor-pointer">
                      <input type="checkbox" {...register('same_as_mobile')} className="rounded border-beige text-forest focus:ring-sage/10" />
                      Same as Mobile Number
                    </label>
                  </div>
                  <input {...register('whatsapp_number')} disabled={sameAsMobileWatch} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20 disabled:opacity-50" placeholder="Same as mobile if checked" />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Date of Birth</label>
                  <input
                    {...register('dob')}
                    type="date"
                    style={{ colorScheme: 'light', color: '#14532D' }}
                    className="w-full h-14 px-6 bg-white border-2 border-forest/30 rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-forest/20 focus:border-forest transition-all"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Gender *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue('gender', g)}
                        className={`py-3.5 rounded-xl text-xs font-bold border transition-all ${genderWatch === g ? 'bg-forest text-white border-forest' : 'bg-offwhite border-beige text-forest hover:bg-beige/20'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" {...register('gender', { required: 'Gender is required' })} />
                  {errors.gender && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.gender.message}</span>}
                </div>

                {/* Profession + Purpose — stacked in one full-width section */}
                <div className="sm:col-span-2 space-y-5 p-5 bg-offwhite/60 rounded-xl border border-beige/60">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">↗ Profession &amp; Purpose</p>

                  {/* Profession */}
                  <div>
                    <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Profession</label>
                    <select {...register('profession')} className="w-full h-14 px-6 bg-white border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Profession</option>
                      {professionOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {professionWatch === 'Other' && (
                      <div className="mt-3">
                        <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Specify Profession *</label>
                        <input {...register('custom_profession', { required: 'Please specify your profession' })} className="w-full h-14 px-6 bg-white border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" placeholder="Enter your profession" />
                        {errors.custom_profession && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.custom_profession.message}</span>}
                      </div>
                    )}
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Purpose of Joining</label>
                    <select {...register('purpose')} className="w-full h-14 px-6 bg-white border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Purpose</option>
                      {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {purposeWatch === 'Other' && (
                      <div className="mt-3">
                        <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Specify Purpose *</label>
                        <input {...register('custom_purpose', { required: 'Please specify purpose' })} className="w-full h-14 px-6 bg-white border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" placeholder="Enter purpose" />
                        {errors.custom_purpose && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.custom_purpose.message}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Type */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Type *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Member', 'Coach'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('member_type', t)}
                        className={`py-4 rounded-xl text-xs font-bold border transition-all ${memberTypeWatch === t ? 'bg-forest text-white border-forest' : 'bg-offwhite border-beige text-forest hover:bg-beige/20'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" {...register('member_type', { required: 'Membership type is required' })} />
                  {errors.member_type && <span className="text-red-400 text-[10px] font-semibold px-1 mt-1 block">{errors.member_type.message}</span>}
                </div>

                {/* Referred By - Searchable Dropdown */}
                <div className="sm:col-span-2 relative">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Referred By *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referralSearch}
                      onChange={(e) => {
                        setReferralSearch(e.target.value);
                        setShowReferralDropdown(true);
                        setSelectedReferral(null);
                      }}
                      onFocus={() => setShowReferralDropdown(true)}
                      placeholder="Search name of members / coaches..."
                      className="w-full h-14 pl-6 pr-12 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                    />
                    {selectedReferral && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    )}
                  </div>
                  {showReferralDropdown && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-beige rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto no-scrollbar">
                      {referralSuggestions.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReferral({ id: 'manual', name: referralSearch });
                            setShowReferralDropdown(false);
                          }}
                          className="w-full text-left px-5 py-3 text-xs font-bold text-forest hover:bg-offwhite"
                        >
                          Use Custom: "{referralSearch}"
                        </button>
                      ) : (
                        referralSuggestions.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedReferral({ id: s.id, name: s.name });
                              setReferralSearch(s.name);
                              setShowReferralDropdown(false);
                            }}
                            className="w-full text-left px-5 py-3 text-xs font-bold text-forest hover:bg-offwhite border-b border-gray-50 flex items-center justify-between"
                          >
                            <span>{s.name} ({s.member_type || 'Member'})</span>
                            {selectedReferral?.id === s.id && <Check size={14} className="text-emerald-500" />}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {!selectedReferral && (
                    <span className="text-amber-500 text-[10px] font-semibold px-1 mt-1 block">Selection from suggestions or custom registration name is required</span>
                  )}
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Address</label>
                  <textarea {...register('address')} rows={2} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all resize-none" placeholder="Optional" />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 bg-white text-muted border border-beige rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Discard</button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedReferral}
                className="flex-[2] px-6 py-4 bg-forest text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving…' : selectedCustomer ? 'Update Profile' : 'Establish Profile'}
              </button>
            </div>
          </form>

          {/* Chronological Audit Log History Section (only in Preview & Edit mode) */}
          {selectedCustomer && (
            <div className="mt-8 border-t border-beige pt-6">
              <p className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                <Clock size={12} /> Audit Trial / Profile History
              </p>
              <div className="bg-white rounded-xl border border-beige divide-y divide-gray-100 max-h-48 overflow-y-auto no-scrollbar">
                {getMemberActivityLogs(selectedCustomer.id).filter(l => l.type === 'edit').length === 0 ? (
                  <p className="text-xs text-muted font-medium p-4 text-center">No modification logs registered yet.</p>
                ) : (
                  getMemberActivityLogs(selectedCustomer.id).filter(l => l.type === 'edit').map(log => (
                    <div key={log.id} className="p-4 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-forest uppercase text-[9px] tracking-wider bg-sage/10 px-2 py-0.5 rounded">Field Changed: {log.fieldName}</span>
                        <span className="text-[9px] text-muted">{log.date} · {log.time}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 font-medium text-muted">
                        <div>Old: <span className="text-red-500 line-through">{log.previousValue}</span></div>
                        <div>New: <span className="text-emerald-600 font-bold">{log.newValue}</span></div>
                      </div>
                      <p className="text-[9px] text-muted/65 mt-1 font-bold">Edited by: {log.editedBy} (ID: {log.adminUserId})</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* ═══ MODAL: Convert to Membership ═══════════════════════════════════════ */}
      {modal === 'convert' && selectedCustomer && (() => {
        const parsedAmt = parseFloat(convAmount) || 0;
        const parsedAdv = parseFloat(convAdvance) || 0;
        const dueAmount = Math.max(0, parsedAmt - parsedAdv);

        return (
          <ModalShell
            title="Convert to Membership"
            subtitle={`Configure membership levels for ${selectedCustomer.name}`}
            onClose={closeModal}
          >
            <form onSubmit={handleConvertToMembership} className="space-y-6">
              {/* Fixed Information - Read Only */}
              <div className="bg-offwhite p-5 rounded-xl border border-beige/65 grid grid-cols-2 gap-3 text-xs font-bold text-forest">
                <div>Member Name: <span className="text-muted ml-1">{selectedCustomer.name}</span></div>
                <div>Gender: <span className="text-muted ml-1">{selectedCustomer.gender || '—'}</span></div>
                <div>Contact Number: <span className="text-muted ml-1">{selectedCustomer.contact || selectedCustomer.mobile_number || '—'}</span></div>
                <div>Referral By: <span className="text-muted ml-1">{selectedCustomer.referred_by || '—'}</span></div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Start Date *</label>
                <input
                  type="date"
                  required
                  min={getISTDateString()}
                  value={convStartDate}
                  onChange={(e) => setConvStartDate(e.target.value)}
                  className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                />
              </div>

              {/* Membership Type Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Type *</label>
                <select
                  value={convMembershipType}
                  onChange={(e) => setConvMembershipType(e.target.value)}
                  className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                >
                  {Object.entries(MEMBERSHIP_RATES).map(([name, rate]) => (
                    <option key={name} value={name}>
                      {name} (₹{rate}/day)
                    </option>
                  ))}
                </select>
              </div>

              {/* Membership Duration Options */}
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Duration *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1 Day', '10 Days', '30 Days', 'Other'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setConvDuration(opt)}
                      className={`py-3.5 rounded-xl text-xs font-bold border transition-all ${convDuration === opt ? 'bg-forest text-white border-forest' : 'bg-offwhite border-beige text-forest hover:bg-beige/20'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Duration Input */}
              {convDuration === 'Other' && (
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Enter Custom Days *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={convCustomDays}
                    onChange={(e) => setConvCustomDays(e.target.value)}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                    placeholder="e.g. 15, 45, 60"
                  />
                </div>
              )}

              {/* Total Amount & Advance Payment Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={convAmount}
                    onChange={(e) => setConvAmount(e.target.value)}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Advance Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={convAdvance}
                    onChange={(e) => setConvAdvance(e.target.value)}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                  />
                </div>
              </div>

              {/* Due Amount Highlight Info Box */}
              {dueAmount > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-xs flex justify-between items-center">
                  <span>DUE AMOUNT PENALTIES</span>
                  <span>₹{dueAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cash', 'Online'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConvMethod(m)}
                      className={`py-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${convMethod === m ? 'bg-forest text-white border-forest' : 'bg-offwhite border-beige text-forest hover:bg-beige/20'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 bg-white text-muted border border-beige rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Cancel</button>
                <button
                  type="submit"
                  className="flex-[2] px-6 py-4 bg-forest text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20"
                >
                  Confirm Membership
                </button>
              </div>
            </form>
          </ModalShell>
        );
      })()}

      {/* ═══ MODAL: View Membership Details Profile ══════════════════════════ */}
      {modal === 'profile' && selectedCustomer && (() => {
        // Find existing membership details for this customer if any
        const m = memberships.find(mb => mb.customerId === selectedCustomer.id);
        if (!m) return null;

        const totalAmt = parseFloat(m.totalAmount) || 0;
        const advAmt = parseFloat(m.advanceAmount) || 0;
        const dueAmt = Math.max(0, totalAmt - advAmt);

        return (
          <div className="mt-8 border-t border-beige pt-6">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <CreditCard size={12} /> Separate Membership Profile
            </p>
            <div className="bg-offwhite/50 p-6 rounded-2xl border border-beige/60 grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs font-bold text-forest">
              <FieldRow label="Membership Type" value={m.membershipType || 'Shake'} icon={Coffee} />
              <FieldRow label="Membership Start Date" value={m.startDate} icon={Calendar} />
              <FieldRow label="Duration" value={`${m.durationDays} Days`} icon={CalendarClock} />
              <FieldRow label="Total Amount" value={`₹${totalAmt.toLocaleString('en-IN')}`} icon={Banknote} />
              <FieldRow label="Advance Paid" value={`₹${advAmt.toLocaleString('en-IN')}`} icon={Banknote} />
              <FieldRow label="Due Amount" value={`₹${dueAmt.toLocaleString('en-IN')}`} icon={Banknote} />
              <FieldRow label="Payment Method" value={m.paymentMethod || '—'} icon={CreditCard} />
              <FieldRow label="Membership Status" value={m.status || 'Active'} icon={ShieldCheck} />
              <FieldRow label="Created By" value={m.created_by_name || 'Admin'} icon={UserIcon} />
              <FieldRow label="Created Date" value={m.created_date || '—'} icon={Calendar} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
