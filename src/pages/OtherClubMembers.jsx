import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, Search, Phone, Calendar as CalendarIcon, 
  Building, MessageSquare, Edit2, Trash2, Users, ArrowRight,
  X, CreditCard, DollarSign, UserCheck, History, Landmark, Check, Coffee, ChevronDown
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import OtherClubMemberEditModal from '../components/OtherClubMemberEditModal';
import OtherClubMemberAddModal from '../components/OtherClubMemberAddModal';
import CalendarSelectModal from '../components/CalendarSelectModal';
import { getISTDateString, getISTTimeString, getISTDisplayDate } from '../utils/dateUtils';
import { supabase } from '../services/supabaseClient';
import { db } from '../services/db';

export const SHAKE_TYPES = [
  { id: 'S', label: 'Shake', short: 'Shake', color: '#059669', bg: '#ECFDF5' },
  { id: 'SB', label: 'Shake + Beta Heart', short: 'Beta Heart', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'SF', label: 'Shake + Fiber', short: 'Fiber', color: '#D97706', bg: '#FEF3C7' },
  { id: 'SBF', label: 'Shake + Beta + Fiber', short: 'Beta + Fiber', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'D', label: 'Dino', short: 'Dino', color: '#EC4899', bg: '#FDF2F8' }
];

const getShakeType = (shakeId) => {
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

export default function OtherClubMembers() {
  const { 
    otherClubMembers = [], 
    addOtherClubMember, 
    updateOtherClubMember, 
    deleteOtherClubMember,
    addPaymentLog,
    addMembership,
    paymentLogs = [],
    shakeLogs = [],
    addShakeLog,
    user
  } = useAppContext();

  // Dialog/modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [oneDayPaymentMember, setOneDayPaymentMember] = useState(null);
  const [membershipPaymentMember, setMembershipPaymentMember] = useState(null);
  const [activeShakeSelection, setActiveShakeSelection] = useState(null);
  const [shakeQuantity, setShakeQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // One Day Payment Form states
  const [oneDayAmount, setOneDayAmount] = useState('200');
  const [oneDayMode, setOneDayMode] = useState('Cash');

  // Membership Enrollment Form states
  const [membPlan, setMembPlan] = useState('1 Month');
  const [membDuration, setMembDuration] = useState('30');
  const [membTotal, setMembTotal] = useState('3000');
  const [membPaid, setMembPaid] = useState('3000');
  const [membMode, setMembMode] = useState('Cash');

  const todayStr = getISTDateString();
  
  // Stats
  const todayCount = otherClubMembers.filter(m => m.visit_date === todayStr).length;
  const totalCount = otherClubMembers.length;
  const uniqueClubs = new Set(otherClubMembers.map(m => m.club_name?.toLowerCase().trim())).size;

  const handleAddSave = async (payload) => {
    try {
      await addOtherClubMember(payload);
      toast.success(`${payload.name} visitation logged successfully!`);
    } catch (err) {
      toast.error('Failed to log visit: ' + (err.message || err.details || err));
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the visitation record for ${name}?`)) {
      try {
        await deleteOtherClubMember(id);
        toast.success('Record deleted.');
      } catch (err) {
        toast.error('Failed to delete visitation record: ' + (err.message || err.details || err));
      }
    }
  };

  const handleEditSave = async (id, updatedData) => {
    try {
      await updateOtherClubMember(id, updatedData);
      toast.success('Record updated successfully.');
    } catch (err) {
      toast.error('Failed to update record: ' + (err.message || err.details || err));
    }
  };

  // Shake selection trigger
  const handleShakeClick = (member, shakeId) => {
    const todayVisitShake = shakeLogs.find(s => s.personId === member.member_id && s.date === todayStr && s.source === 'other_club');
    setShakeQuantity(todayVisitShake ? todayVisitShake.quantity : 1);
    setActiveShakeSelection({ member, shakeId });
  };

  // Confirm shake save
  const handleConfirmShake = async () => {
    if (!activeShakeSelection) return;
    const { member, shakeId } = activeShakeSelection;
    try {
      await addShakeLog({
        personId: member.member_id,
        source: 'other_club',
        item: shakeId,
        quantity: shakeQuantity,
        date: todayStr,
        time: getISTTimeString()
      });
      toast.success(shakeQuantity > 0 ? `Logged ${shakeQuantity} shake(s) for ${member.name}` : `Cleared shake for ${member.name}`);
      setActiveShakeSelection(null);
    } catch (err) {
      toast.error("Failed to log shake: " + (err.message || err));
    }
  };

  // One Day Payment confirm handler
  const handleConfirmOneDayPayment = async () => {
    if (!oneDayPaymentMember) return;
    try {
      const amt = Number(oneDayAmount);
      if (isNaN(amt) || amt <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      await addPaymentLog({
        memberId: oneDayPaymentMember.member_id,
        memberName: oneDayPaymentMember.name,
        amount: amt,
        paymentMode: oneDayMode,
        paymentPurpose: 'One Day Payment',
        plan: '1 Day',
        source: 'member'
      });

      toast.success(`One Day Payment of ₹${amt} logged for ${oneDayPaymentMember.name}`);
      setOneDayPaymentMember(null);
    } catch (err) {
      toast.error(`Payment failed: ${err.message || 'Operation failed'}`);
    }
  };

  // Membership payment confirm handler
  const handleConfirmMembershipPayment = async () => {
    if (!membershipPaymentMember) return;
    try {
      const duration = Number(membDuration);
      const total = Number(membTotal);
      const paid = Number(membPaid);

      if (isNaN(duration) || duration <= 0 || isNaN(total) || total <= 0) {
        toast.error("Please enter valid plan details");
        return;
      }

      // 1. Create membership
      await addMembership({
        customerId: membershipPaymentMember.member_id,
        customerName: membershipPaymentMember.name,
        plan: membPlan,
        durationDays: duration,
        totalAmount: total,
        advanceAmount: paid,
        paymentMethod: membMode
      });

      // 2. Convert other club member to a regular member
      const { error } = await supabase
        .from('members')
        .update({ member_type: 'Club Member' })
        .eq('id', membershipPaymentMember.member_id);
      if (error) throw error;

      toast.success(`${membershipPaymentMember.name} converted to regular membership successfully!`);
      setMembershipPaymentMember(null);

      // Force page refresh of local cache/reload
      window.location.reload();
    } catch (err) {
      toast.error(`Failed to convert member: ${err.message || 'Operation failed'}`);
    }
  };

  // Filtered members for table search
  const filteredMembers = otherClubMembers.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      m.name?.toLowerCase().includes(term) ||
      m.club_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Other Club Members</h2>
          <p className="text-sm text-gray-500 mt-1">Check-in visitation logs and calendar lookup for external guest members.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-luxury-primary flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Top 3 Visual Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Today Count Metric */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 flex flex-col justify-between h-36 shadow-sm hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Checked In Today</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Users className="text-emerald-600" size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{todayCount}</h3>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">Total external visitors today</p>
          </div>
        </div>

        {/* Card 2: Interactive Calendar Trigger */}
        <div 
          onClick={() => setIsCalendarModalOpen(true)}
          className="bg-white rounded-xl border border-gray-200/80 p-5 flex flex-col justify-between h-36 shadow-sm hover:border-[#006c49]/40 hover:shadow-md transition-all duration-250 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Visitation Calendar</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
              <CalendarIcon className="text-blue-600" size={18} />
            </div>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1 group-hover:text-[#006c49] transition-colors">
                Search by Date 
              </p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Click to check previous check-ins</p>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-[#006c49] group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Card 3: Clubs Represented Metric */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 flex flex-col justify-between h-36 shadow-sm hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">External Clubs</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Building className="text-purple-600" size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{uniqueClubs}</h3>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">Unique clubs ({totalCount} total visits)</p>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">Visitation Directory</h3>
          
          <div className="relative w-full sm:w-60">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </span>
            <input 
              type="text"
              placeholder="Search by Name or Club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Club Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Date & Time</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shake Options</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Options</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400 font-medium">No records found.</td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const todayVisitShake = shakeLogs.find(s => s.personId === member.member_id && s.date === todayStr);
                  const shakeValue = todayVisitShake ? todayVisitShake.item : null;

                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => setViewingProfile(member)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs">
                            {member.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{member.name}</p>
                            {member.referred_by && member.referred_by !== '-' && (
                              <p className="text-[10px] text-gray-400 font-medium">Ref: {member.referred_by}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Building size={12} className="text-gray-400" />
                          {member.club_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <p className="font-semibold text-gray-800">
                          {new Date(member.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{member.visit_time || '12:00 PM'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald/10 text-primary border border-emerald/20">
                          {member.reason}
                        </span>
                      </td>
                      {/* Shake Dropdown Column */}
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <ShakeDropdown value={shakeValue} onChange={(val) => handleShakeClick(member, val)} />
                      </td>
                      {/* Payment Column */}
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOneDayPaymentMember(member)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase transition-all"
                          >
                            One Day Pay
                          </button>
                          <button
                            onClick={() => setMembershipPaymentMember(member)}
                            className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase transition-all"
                          >
                            Enroll Membership
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setEditingMember(member)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(member.id, member.name)}
                            className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <OtherClubMemberAddModal 
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
        />
      )}

      {/* Edit Modal */}
      {editingMember && (
        <OtherClubMemberEditModal 
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Calendar Date-Search & Visitation List Modal */}
      {isCalendarModalOpen && (
        <CalendarSelectModal 
          otherClubMembers={otherClubMembers}
          onClose={() => setIsCalendarModalOpen(false)}
        />
      )}

      {/* Profile Detail & Payment History View Modal */}
      {viewingProfile && (() => {
        const pHistory = paymentLogs.filter(p => p.memberId === viewingProfile.member_id || p.memberId === viewingProfile.id);
        return (
          <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-beige animate-in fade-in duration-200">
              <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-forest uppercase tracking-wider">Other Club Member Profile</h3>
                  <p className="text-[10px] text-sage font-bold">Visitation and payment logs</p>
                </div>
                <button
                  onClick={() => setViewingProfile(null)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center border hover:bg-gray-50"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto no-scrollbar">
                <div className="bg-offwhite border border-beige rounded-xl p-4 space-y-3">
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Full Name</span>
                    <span className="text-sm font-extrabold text-forest">{viewingProfile.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Club Name</span>
                      <span className="font-bold text-forest">{viewingProfile.club_name}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400">Reason</span>
                      <span className="font-bold text-forest">{viewingProfile.reason}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-beige grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-bold uppercase">
                    <div>
                      <span>Visit Date & Time</span>
                      <span className="block text-forest">{viewingProfile.visit_date} {viewingProfile.visit_time || '12:00 PM'}</span>
                    </div>
                    <div>
                      <span>Contact</span>
                      <span className="block text-forest">{viewingProfile.mobile || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment History Section */}
                <div className="space-y-2.5">
                  <h4 className="font-extrabold uppercase tracking-widest text-[9px] text-forest flex items-center gap-1.5">
                    <History size={13} /> Payment History
                  </h4>
                  {pHistory.length === 0 ? (
                    <p className="text-gray-450 font-bold uppercase text-[9px] bg-offwhite p-3 rounded-xl border border-beige/40 text-center">No payment history found.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {pHistory.map((p) => (
                        <div key={p.id} className="p-3 bg-offwhite border border-beige rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 bg-emerald/10 text-emerald-700 rounded text-[8px] font-extrabold uppercase tracking-wider">
                              {p.paymentPurpose}
                            </span>
                            <p className="text-[10px] font-bold text-gray-900 mt-1">₹{p.amount}</p>
                            <p className="text-[8px] text-gray-450">{getISTDisplayDate(p.date)} {p.time}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px] font-bold">
                              {p.paymentMode}
                            </span>
                            <p className="text-[8px] text-gray-400 mt-1.5">Collector: {p.staffName || 'Admin'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Shake Quantity Selection Popup Modal */}
      {activeShakeSelection && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest">Select Quantity</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {activeShakeSelection.shakeId ? getShakeType(activeShakeSelection.shakeId)?.label : 'Clear Shake'}
                </p>
              </div>
              <button
                onClick={() => setActiveShakeSelection(null)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-emerald-150"
              >
                <X size={13} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShakeQuantity(q => Math.max(0, q - 1))}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-base transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-xl font-black text-gray-800">{shakeQuantity}</span>
                <button
                  type="button"
                  onClick={() => setShakeQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-base transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setActiveShakeSelection(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-[10px] text-gray-500 hover:bg-gray-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShake}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-md"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* One Day Payment Dialog Overlay */}
      {oneDayPaymentMember && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-amber-800 uppercase tracking-wider">One Day Payment</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">{oneDayPaymentMember.name}</p>
              </div>
              <button
                onClick={() => setOneDayPaymentMember(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-amber-150"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block font-bold uppercase text-[9px] text-gray-400">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={oneDayAmount}
                  onChange={(e) => setOneDayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold uppercase text-[9px] text-gray-400">Payment Method</label>
                <select
                  value={oneDayMode}
                  onChange={(e) => setOneDayMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setOneDayPaymentMember(null)}
                  className="flex-1 py-3 border border-gray-250 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOneDayPayment}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-md text-center"
                >
                  Confirm Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Membership Dialog Overlay */}
      {membershipPaymentMember && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-green-50 border-b border-green-150 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-green-900 uppercase tracking-wider">Enroll Membership</h3>
                <p className="text-xs text-green-700 font-medium mt-0.5">{membershipPaymentMember.name}</p>
              </div>
              <button
                onClick={() => setMembershipPaymentMember(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-green-200"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[8px] text-gray-400 mb-1">Plan Name</label>
                  <select
                    value={membPlan}
                    onChange={(e) => setMembPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-850"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="Personal Training">Personal Training</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-[8px] text-gray-400 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={membDuration}
                    onChange={(e) => setMembDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[8px] text-gray-400 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={membTotal}
                    onChange={(e) => setMembTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-850"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[8px] text-gray-400 mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={membPaid}
                    onChange={(e) => setMembPaid(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-850"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[8px] text-gray-400 mb-1">Payment Mode</label>
                <select
                  value={membMode}
                  onChange={(e) => setMembMode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-850"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setMembershipPaymentMember(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMembershipPayment}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md text-center"
                >
                  Enroll Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
