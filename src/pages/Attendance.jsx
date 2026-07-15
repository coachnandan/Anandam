import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Calendar as CalendarIcon,
  CreditCard, 
  UserPlus,
  LogOut, 
  Menu,
  X,
  Bell,
  User as UserIcon,
  Leaf,
  CheckSquare,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Activity,
  History,
  UserCheck,
  ChevronDown,
  User,
  Package,
  DollarSign,
  Plus,
  Heart,
  Sparkles,
  Shield,
  Search
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { getISTDateString, getISTTimeString, getISTDisplayDate, getISTShortDisplayDate } from '../utils/dateUtils';
import AttendanceCalendarModal from '../components/AttendanceCalendarModal';

// ─── Shake Type System ────────────────────────────────────────────────────────
export const SHAKE_TYPES = [
  { id: 'S',   label: 'Shake',                    short: 'S',   color: '#D97706', bg: '#FEF3C7' },
  { id: 'SB',  label: 'Shake + Beta Heart',        short: 'SB',  color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'SF',  label: 'Shake + Fiber',             short: 'SF',  color: '#0891B2', bg: '#CFFAFE' },
  { id: 'SBF', label: 'Shake + Beta + Fiber',      short: 'SBF', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'D',   label: 'Dino',                      short: 'D',   color: '#059669', bg: '#D1FAE5' },
];

export const getShakeType = (id) => SHAKE_TYPES.find(s => s.id === id || s.label === id);

// Default subscription prices
const PRICES = {
  S:   { 3: 750,  10: 2500, 30: 7000  },
  SB:  { 3: 1254, 10: 4180, 30: 12000 },
  SF:  { 3: 1044, 10: 3480, 30: 10000 },
  SBF: { 3: 1443, 10: 4810, 30: 14000 },
  D:   { 3: 900,  10: 3000, 30: 8500  },
};
const ONE_DAY_PRICE = 250;

// ─── ShakeBadge ──────────────────────────────────────────────────────────────
const ShakeBadge = ({ id, size = 'sm' }) => {
  const st = getShakeType(id);
  if (!st) return null;
  const cls = size === 'lg' ? 'px-3 py-1.5 text-[11px] gap-2' : 'px-2 py-0.5 text-[9px] gap-1';
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${cls}`}
      style={{ color: st.color, background: st.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
      {st.label}
    </span>
  );
};

// ─── Attendance Profile Calendar Grid ─────────────────────────────────────────
const AttendanceHistoryCalendar = ({ memberId, attendance, shakeLogs, memberActivityLogs }) => {
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
                isSelected ? 'border-green-600 bg-green-50 font-extrabold text-green-800' : 'border-transparent hover:bg-gray-50'
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
              selectedDetails.status === 'Present' ? 'bg-green-100 text-green-700' :
              selectedDetails.status === 'Absent' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
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

// ─── StatusDropdown ───────────────────────────────────────────────────────────
const StatusDropdown = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);

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
    if (disabled) {
      toast.warning("Cannot modify past attendance records.");
      return;
    }
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuH = 88; // Height of Present/Absent options
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuH + 8;
      setMenuStyle({
        position: 'fixed',
        zIndex: 9999,
        width: '112px',
        right: `${window.innerWidth - rect.right}px`,
        ...(openUpward
          ? { bottom: `${window.innerHeight - rect.top + 6}px` }
          : { top: `${rect.bottom + 6}px` }),
      });
    }
    setOpen(prev => !prev);
  };

  const styles = {
    Present: 'bg-green-50 text-green-700 border-green-300',
    Absent:  'bg-red-50 text-red-600 border-red-300',
    Pending: 'bg-gray-50 text-gray-400 border-gray-200',
  };
  const icons = {
    Present: <Check size={14} strokeWidth={3} />,
    Absent:  <X size={14} strokeWidth={3} />,
    Pending: <Clock size={14} className="opacity-40" />,
  };
  return (
    <div ref={btnRef} className="relative" style={{ display: 'inline-block' }}>
      <button
        onClick={handleToggle}
        className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 ${styles[value] || styles.Pending}`}
      >
        {icons[value] || icons.Pending}
      </button>
      {open && (
        <div style={menuStyle} className="bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
          {['Present', 'Absent'].map(opt => (
            <button key={opt} onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-wider hover:bg-gray-50 transition-colors ${value === opt ? (opt === 'Present' ? 'text-green-700 bg-green-50/50' : 'text-red-600 bg-red-50/50') : 'text-gray-600'}`}>
              {icons[opt]} {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ShakeDropdown ────────────────────────────────────────────────────────────
const ShakeDropdown = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);

  // Close when clicking outside
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
    if (disabled) {
      toast.warning("Cannot modify past shake entries.");
      return;
    }
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
          <div className="p-2 space-y-0.5">
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

// ─── ShakeBreakdownModal ──────────────────────────────────────────────────────
const ShakeBreakdownModal = ({ shakeLogs, todayStr, onClose }) => {
  const todayShakes = shakeLogs.filter(s => s.date === todayStr);
  const typeCounts = SHAKE_TYPES.map(st => ({
    ...st,
    count: todayShakes.filter(s => s.item === st.id || s.item === st.label).length,
  }));
  const sorted = [...todayShakes].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Shake Breakdown</h2>
            <p className="text-xs text-gray-400 mt-0.5">Today · {getISTDisplayDate(todayStr)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Summary Grid */}
          <div className="p-5 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Today's Summary</p>
            <div className="grid grid-cols-5 gap-2">
              {typeCounts.map(st => (
                <div key={st.id} className="flex flex-col items-center p-3 rounded-xl" style={{ background: st.bg }}>
                  <span className="text-2xl font-bold" style={{ color: st.color }}>{st.count}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wide mt-1" style={{ color: st.color + 'CC' }}>{st.short}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Detail List */}
          <div className="p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">All Entries · Chronological</p>
            {sorted.length === 0 ? (
              <p className="text-gray-300 text-sm text-center py-10">No shakes recorded yet today.</p>
            ) : (
              <div className="space-y-2">
                {sorted.map((s, i) => {
                  const st = SHAKE_TYPES.find(t => t.id === s.item || t.label === s.item);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: st?.color || '#6B7280' }}>
                        {s.personName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{s.personName}</p>
                        {st && <ShakeBadge id={st.id} />}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-700">{s.time}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{s.staffName}</p>
                        <p className="text-[9px] text-gray-400">{s.staffId || '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── OneDayPaymentModal ───────────────────────────────────────────────────────
const OneDayPaymentModal = ({ member, user, onConfirm, onClose }) => {
  const [totalAmount, setTotalAmount] = useState(ONE_DAY_PRICE);
  const [advance, setAdvance] = useState(ONE_DAY_PRICE);
  const [method, setMethod] = useState('');
  const due = Math.max(0, totalAmount - advance);
  const istDate = getISTDateString();
  const istTime = getISTTimeString();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!method) { toast.error('Select a payment method'); return; }
    onConfirm({
      type: 'oneday',
      memberId: member.id,
      memberName: member.name,
      amount: advance,
      due,
      totalAmount: totalAmount,
      method,
      date: istDate,
      time: istTime
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-green-900">One Day Payment</h2>
            <p className="text-sm text-green-700 mt-0.5 font-medium">{member.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"><X size={16} className="text-green-800" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Info */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Receiving Payment</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">{user?.name?.charAt(0) || 'A'}</div>
              <div><p className="font-bold text-gray-900 text-sm">{user?.name || 'Admin'}</p><p className="text-xs text-gray-400">{user?.id || 'EMP-001'}</p></div>
            </div>
            <div className="flex gap-6 mt-3 pt-3 border-t border-gray-200">
              <div><p className="text-[9px] text-gray-400 uppercase">Date</p><p className="text-xs font-bold text-gray-700">{getISTDisplayDate(istDate)}</p></div>
              <div><p className="text-[9px] text-gray-400 uppercase">Time</p><p className="text-xs font-bold text-gray-700">{istTime}</p></div>
            </div>
          </div>
          {/* Member Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Member Name</label>
            <input type="text" readOnly value={member.name}
              className="w-full h-11 px-4 border-2 border-gray-105 bg-gray-50 rounded-xl font-bold text-gray-500 outline-none cursor-not-allowed" />
          </div>
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Amount (₹)</label>
            <input type="number" min="0" required value={totalAmount}
              onChange={e => { const v = Number(e.target.value); setTotalAmount(v); if (advance > v) setAdvance(v); }}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 text-lg outline-none focus:border-green-400 transition-all" />
          </div>
          {/* Advance */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Advance Paid (₹)</label>
            <input type="number" min="0" max={totalAmount} value={advance}
              onChange={e => setAdvance(Number(e.target.value))}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-green-400 transition-all" />
          </div>
          {/* Due (Red Highlight Box) */}
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm font-bold text-red-750">Due Amount</p>
            <p className="text-2xl font-bold text-red-600">₹{due}</p>
          </div>
          {/* Method */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Method *</label>
            <div className="grid grid-cols-2 gap-3">
              {['Cash', 'Online'].map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${method === m ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-3.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:scale-95 transition-all shadow-md">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SubscriptionPaymentModal ─────────────────────────────────────────────────
const SubscriptionPaymentModal = ({ member, user, onConfirm, onClose }) => {
  const [duration, setDuration] = useState('10');
  const [customDays, setCustomDays] = useState('');
  const [shakeType, setShakeType] = useState('S');
  const [totalAmount, setTotalAmount] = useState(2500);
  const [advance, setAdvance] = useState(2500);
  const [method, setMethod] = useState('');

  const due = Math.max(0, totalAmount - advance);
  const finalDays = duration === 'Other' ? parseInt(customDays) || 0 : parseInt(duration);

  useEffect(() => {
    if (shakeType && duration !== 'Other') {
      const price = PRICES[shakeType]?.[parseInt(duration)];
      if (price) { setTotalAmount(price); setAdvance(price); }
    }
  }, [shakeType, duration]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!method) { toast.error('Select a payment method'); return; }
    if (finalDays < 1) { toast.error('Enter valid duration'); return; }
    onConfirm({ type: 'subscription', memberId: member.id, memberName: member.name, duration: finalDays, shakeType, totalAmount, advance, due, method, date: getISTDateString(), time: getISTTimeString() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-purple-900">Subscription Payment</h2>
            <p className="text-sm text-purple-700 mt-0.5 font-medium">{member.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"><X size={16} className="text-purple-800" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Info */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Receiving Payment</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold">{user?.name?.charAt(0) || 'A'}</div>
              <div><p className="font-bold text-gray-900 text-sm">{user?.name || 'Admin'}</p><p className="text-xs text-gray-400">{user?.id || 'EMP-001'}</p></div>
            </div>
          </div>
          {/* Duration */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Membership Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {['3', '10', '30', 'Other'].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${duration === d ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200'}`}>
                  {d === 'Other' ? 'Other' : `${d}D`}
                </button>
              ))}
            </div>
            {duration === 'Other' && (
              <input type="number" min="1" value={customDays} onChange={e => setCustomDays(e.target.value)}
                className="mt-2 w-full h-11 px-4 border-2 border-purple-200 rounded-xl font-bold text-gray-900 outline-none focus:border-purple-400 transition-all"
                placeholder="Enter days (e.g. 20)" />
            )}
          </div>
          {/* Shake Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Membership Type</label>
            <div className="space-y-1.5">
              {SHAKE_TYPES.map(st => (
                <button key={st.id} type="button" onClick={() => setShakeType(st.id)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={shakeType === st.id ? { color: st.color, background: st.bg, borderColor: st.color + '80' } : { color: '#6B7280', borderColor: '#E5E7EB', background: '#fff' }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                  {st.label}
                  {shakeType === st.id && <Check size={14} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
          {/* Total Amount */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Membership Amount (₹)</label>
            <input type="number" min="0" required value={totalAmount}
              onChange={e => { const v = Number(e.target.value); setTotalAmount(v); if (advance > v) setAdvance(v); }}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 text-lg outline-none focus:border-purple-400 transition-all" />
          </div>
          {/* Advance */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Advance Paid (₹)</label>
            <input type="number" min="0" max={totalAmount} value={advance}
              onChange={e => setAdvance(Number(e.target.value))}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-purple-400 transition-all" />
          </div>
          {/* Due */}
          {due > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm font-bold text-red-700">Due Amount</p>
              <p className="text-2xl font-bold text-red-600">₹{due.toLocaleString('en-IN')}</p>
            </div>
          )}
          {/* Method */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Method *</label>
            <div className="grid grid-cols-2 gap-3">
              {['Cash', 'Online'].map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${method === m ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-3.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-md">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MembershipProfileModal ───────────────────────────────────────────────────
const MembershipProfileModal = ({ member, user, memberships, memberActivityLogs, attendanceAuditLogs, memberPaymentHistory, attendance, todayStr, onClose, onPaymentConfirm, shakeLogs, paymentLogs }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showOneDayModal, setShowOneDayModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const activeMembership = useMemo(() =>
    [...memberships]
      .filter(m => (m.customerId === member.id || m.client_id === member.id) && m.status === 'Active')
      .sort((a, b) => new Date(b.created_date || b.createdAt || 0) - new Date(a.created_date || a.createdAt || 0))[0],
    [memberships, member.id]
  );

  const memberShakeLogs = useMemo(() =>
    memberActivityLogs.filter(l => l.customerId === member.id && l.type === 'shake').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [memberActivityLogs, member.id]
  );

  const memberAttAudit = useMemo(() =>
    (attendanceAuditLogs || []).filter(l => l.customerId === member.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [attendanceAuditLogs, member.id]
  );

  const memberPayments = useMemo(() => {
    return (paymentLogs || [])
      .filter(l => l.memberId === member.id)
      .map(p => ({
        id: p.id,
        customerId: p.memberId,
        payType: p.paymentPurpose === 'One Day Payment' ? 'oneday' : 'subscription',
        amount: p.amount,
        totalAmount: p.totalAmount || p.amount,
        due: p.due || 0,
        method: p.paymentMode || 'Cash',
        duration: p.plan === '1 Day' ? 1 : parseInt(p.plan) || 0,
        date: p.date,
        time: p.time,
        timestamp: p.timestamp,
        adminName: p.staffName || 'Admin',
        adminId: p.staffId || '—'
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [paymentLogs, member.id]);

  const consumed = memberShakeLogs.length;
  const allocated = activeMembership?.durationDays || 0;
  const remaining = Math.max(0, allocated - consumed);
  const isExpired = allocated > 0 && consumed >= allocated;
  const todayAtt = attendance.find(a => a.customerId === member.id && a.date === todayStr);
  const todayShake = shakeLogs.find(s => s.personId === member.id && s.date === todayStr);

  const tabs = [
    { id: 'overview',    label: 'Overview',    icon: <User size={13} /> },
    { id: 'attendance',  label: 'Attendance',  icon: <History size={13} /> },
    { id: 'shakes',      label: 'Shakes',      icon: <Activity size={13} /> },
    { id: 'payments',    label: 'Payments',    icon: <CreditCard size={13} /> },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-800 font-bold text-xl flex-shrink-0">
              {member.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{member.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-650'}`}>
                  {member.status || 'Inactive'}
                </span>
                {activeMembership && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">{activeMembership.plan}</span>}
                {isExpired && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 uppercase tracking-wider">Expired</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0"><X size={16} /></button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 overflow-x-auto gap-2 flex-shrink-0">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === t.id 
                    ? 'border-green-600 text-green-750 font-extrabold' 
                    : 'border-transparent text-gray-450 hover:text-gray-650'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Content Area based on Selected Tab */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Member Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Member Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                      <p className="text-sm font-bold text-gray-805 mt-0.5">{member.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                      <p className="text-sm font-bold text-gray-805 mt-0.5">{member.contact || member.mobile_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Membership Type</p>
                      <p className="text-sm font-bold text-gray-805 mt-0.5">{member.member_type || activeMembership?.plan || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Referral By</p>
                      <p className="text-sm font-bold text-gray-805 mt-0.5">{member.referred_by || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Status</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${member.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-650 border border-red-200'}`}>
                      {member.status || 'Inactive'}
                    </span>
                    {isExpired && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-655 border border-red-250 uppercase tracking-wider">
                        Expired
                      </span>
                    )}
                    {activeMembership && (
                      <span className="text-xs text-gray-450 font-bold">
                        Remaining: {remaining} / {allocated} Shakes
                      </span>
                    )}
                  </div>
                </div>

                {/* Shake Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Shake Type (Today)</h3>
                  </div>
                  <div>
                    {todayShake ? (
                      <div className="flex items-center gap-2">
                        <ShakeBadge id={todayShake.item} size="lg" />
                        <span className="text-xs text-gray-400 font-bold">Quantity: {todayShake.quantity || 1} · Marked today</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-405 bg-gray-50 p-3 rounded-lg border border-gray-150">No shake selected for today yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Visual Calendar */}
                <AttendanceHistoryCalendar
                  memberId={member.id}
                  attendance={attendance}
                  shakeLogs={shakeLogs}
                  memberActivityLogs={memberActivityLogs}
                />

                {/* Audit history list */}
                <div className="space-y-3">
                  <div className="pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Attendance Activity Logs</h3>
                  </div>
                  {memberAttAudit.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No attendance audit trail available.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {memberAttAudit.map((log, i) => (
                        <div key={log.id || i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-150 text-xs">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${log.newStatus === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-650'}`}>
                              {log.newStatus}
                            </span>
                            <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                              Marked By: <span className="font-extrabold text-gray-700">{log.adminName}</span> (ID: <span className="font-mono">{log.adminId}</span>)
                            </p>
                          </div>
                          <div className="text-right text-[10px] text-gray-400 font-bold">
                            <p className="font-bold text-gray-650">{log.date}</p>
                            <p>{log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'shakes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider font-extrabold">Shake Consumption History</h3>
                </div>
                {memberShakeLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No shake consumption history found.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {memberShakeLogs.map((log, i) => (
                      <div key={log.id || i} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <ShakeBadge id={log.item} />
                          <p className="text-[10px] text-gray-500 font-bold">
                            Quantity: <span className="text-gray-800 font-black">{log.quantity || 1}</span> · Approved By: <span className="text-gray-750 font-bold">{log.performed_by_name || log.markedBy || 'Admin'}</span>
                          </p>
                        </div>
                        <div className="text-right text-[9px] text-gray-400 font-mono">
                          <p className="font-bold">{log.date || new Date(log.timestamp).toLocaleDateString('en-IN')}</p>
                          <p>{log.time || new Date(log.timestamp).toLocaleTimeString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Payment History</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowOneDayModal(true)} className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all">
                      + One Day
                    </button>
                    <button onClick={() => setShowSubModal(true)} className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all">
                      + Subscription
                    </button>
                  </div>
                </div>

                {memberPayments.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No payment audit logs available.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {memberPayments.map((pay, i) => (
                      <div key={pay.id || i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-150 text-xs space-y-2 font-bold">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-gray-800">
                              {pay.payType === 'oneday' ? 'One Day Shake purchase' : `Subscription: ${pay.duration} Days`}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                              Payment Method: <span className="font-semibold text-gray-700">{pay.method}</span>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-[10px] text-gray-400 font-semibold">Total Amount: <span className="font-bold text-gray-700">₹{pay.totalAmount || pay.amount}</span></p>
                            <p className="text-[10px] text-gray-400 font-semibold">Paid: <span className="font-bold text-green-700">₹{pay.amount}</span></p>
                            <p className="text-[10px] text-gray-400 font-semibold">Due: <span className="font-bold text-red-600">₹{pay.due || 0}</span></p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px] text-gray-450">
                          <p className="font-semibold">
                            Received By: <span className="font-bold text-gray-700">{pay.adminName}</span> (ID: {pay.adminId})
                          </p>
                          <p className="font-mono text-gray-550">{pay.date} {pay.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showOneDayModal && (
        <OneDayPaymentModal member={member} user={user}
          onConfirm={(data) => { onPaymentConfirm(data); setShowOneDayModal(false); toast.success(`₹${data.amount} One Day payment recorded`); }}
          onClose={() => setShowOneDayModal(false)} />
      )}
      {showSubModal && (
        <SubscriptionPaymentModal member={member} user={user}
          onConfirm={(data) => { onPaymentConfirm(data); setShowSubModal(false); toast.success(`₹${data.advance} subscription recorded for ${data.duration} days`); }}
          onClose={() => setShowSubModal(false)} />
      )}
    </>
  );
};

// ─── Member Row ───────────────────────────────────────────────────────────────
const MemberRow = ({ member, record, activeMembership, consumedShakes, onStatusChange, onShakeChange, onRowClick, onPayClick, shake, isLocked, markedBy, todayOneDayPayment }) => {
  const status = record?.status || 'Pending';

  const allocated = activeMembership?.durationDays || 0;
  const remaining = Math.max(0, allocated - consumedShakes);
  const isExpired = allocated > 0 && consumedShakes >= allocated;

  const membershipStatus = isExpired ? 'Expired' : (member.status || 'Inactive');

  return (
    <div
      onClick={() => onRowClick(member)}
      className="grid grid-cols-2 sm:grid-cols-[2.2fr_1.2fr_1.2fr_1.5fr_1.2fr_auto] items-start sm:items-center gap-4 sm:gap-3 px-4 sm:px-5 py-4 hover:bg-green-50/40 transition-all cursor-pointer border-b border-gray-50 last:border-0 group"
    >
      {/* 1. Member Information */}
      <div className="col-span-2 sm:col-span-1 flex items-start sm:items-center gap-3 min-w-0 w-full mb-1 sm:mb-0">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0 group-hover:bg-green-100 group-hover:text-green-800 transition-all mt-1 sm:mt-0">
          {member.name?.charAt(0) || '?'}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 mt-0.5 text-[10px] text-gray-400">
            <span>{member.contact || member.mobile_number || '—'}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="truncate">Plan: {member.member_type || activeMembership?.plan || '—'}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="truncate">Consumed: {consumedShakes} / {allocated}</span>
          </div>
          {markedBy && (
            <p className="text-[9px] font-bold mt-1 text-green-600 sm:hidden">
              ✓ Marked by {markedBy}
            </p>
          )}
        </div>
      </div>

      {/* 2. Present Absent */}
      <div className="col-span-1 flex flex-col gap-1.5 sm:justify-start" onClick={e => e.stopPropagation()}>
        <span className="sm:hidden text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Attendance</span>
        <StatusDropdown value={status} onChange={val => onStatusChange(member.id, val, status)} disabled={isLocked} />
      </div>

      {/* 3. Option (Shake Type Dropdown) */}
      <div className="col-span-1 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
        <span className="sm:hidden text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Shake Type</span>
        <ShakeDropdown value={shake} onChange={val => onShakeChange(member.id, val)} disabled={isLocked} />
      </div>

      {/* 4. Marked By */}
      <div className="col-span-1 flex flex-col gap-1.5 hidden sm:flex">
        {markedBy ? (
          <>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700 inline-block w-fit">
              ✓ Marked
            </span>
            <span className="text-[9px] font-bold text-gray-500 truncate pl-0.5">by {markedBy}</span>
          </>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 inline-block w-fit">
            Not Marked
          </span>
        )}
      </div>

      {/* 5. Pay */}
      <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5 mt-2 sm:mt-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => {
            if (isLocked) {
              toast.warning("Cannot record payments for past attendance dates.");
              return;
            }
            onPayClick(member);
          }}
          className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[10px] font-bold uppercase tracking-wider transition-all w-full sm:w-auto ${
            isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-green-600 hover:text-white text-gray-600'
          }`}
        >
          <CreditCard size={11} /> Pay
        </button>
        {todayOneDayPayment && (
          <div className="flex flex-col gap-0.5 px-2 py-1.5 rounded-lg border border-orange-200 bg-orange-50/60 text-[8px] font-bold text-orange-700 leading-tight w-full sm:w-auto">
            <span>1-Day: ₹{(todayOneDayPayment.amount || 0).toLocaleString('en-IN')} / ₹{(todayOneDayPayment.totalAmount || 250).toLocaleString('en-IN')}</span>
            {todayOneDayPayment.due > 0 && (
              <span className="text-red-600">Due: ₹{todayOneDayPayment.due.toLocaleString('en-IN')}</span>
            )}
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <ChevronRight size={14} className="text-gray-200 group-hover:text-green-400 transition-colors" />
      </div>
    </div>
  );
};

// ─── Main Attendance ──────────────────────────────────────────────────────────
export default function Attendance() {
  const {
    customers = [], otherClubMembers = [],
    attendance = [], updateAttendance,
    memberships = [], memberActivityLogs = [], addActivityLog,
    shakeLogs = [], addShakeLog,
    paymentLogs = [], addPaymentLog,
    attendanceAuditLogs = [], addAttendanceAudit,
    memberPaymentHistory = [], addMemberPaymentRecord,
    addMembership,
    renewMembership,
    user,
    fetchData,
  } = useAppContext();

  const [historicalLoaded, setHistoricalLoaded] = useState(false);

  useEffect(() => {
    if (!historicalLoaded && fetchData) {
      fetchData({ loadHistorical: true }).then(() => setHistoricalLoaded(true));
    }
  }, [historicalLoaded, fetchData]);

  const todayStr = getISTDateString();
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileMember, setProfileMember] = useState(null);
  const [showShakeBreakdown, setShowShakeBreakdown] = useState(false);

  // New state variables for payment action selections
  const [paymentSelectMember, setPaymentSelectMember] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showDirectOneDayModal, setShowDirectOneDayModal] = useState(false);
  const [showDirectSubModal, setShowDirectSubModal] = useState(false);

  // Automatically roll over the selected date to the current date at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const liveTodayStr = getISTDateString();
      if (todayStr !== liveTodayStr) {
        setSelectedDate(prev => (prev === todayStr ? liveTodayStr : prev));
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todayStr]);

  // Shake quantity workflow states
  const [activeShakeSelection, setActiveShakeSelection] = useState(null); // { member, shakeId, quantity }
  const [showShakeConfirmation, setShowShakeConfirmation] = useState(false);

  const todayAttendance = attendance.filter(a => a.date === selectedDate);
  const todayShakeLogs = shakeLogs.filter(s => s.date === selectedDate && s.source === 'member');

  const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
  // Calculate total shakes by summing the quantities of all MEMBER shake logs for today
  const shakeCount = todayShakeLogs.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);

  const isLocked = selectedDate < todayStr;

  const query = searchTerm.toLowerCase().trim();

  const currentMembers = useMemo(() =>
    [...customers]
      .filter(c => !c.archive_status && (!query || c.name?.toLowerCase().includes(query)))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [customers, query]
  );

  const otherMembers = useMemo(() =>
    [...otherClubMembers]
      .filter(m => !query || m.name?.toLowerCase().includes(query))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [otherClubMembers, query]
  );

  const getRecord = (memberId) => todayAttendance.find(a => a.customerId === memberId);

  // ─── Status Change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (memberId, newStatus, prevStatus) => {
    const member = customers.find(c => c.id === memberId) || otherClubMembers.find(m => m.member_id === memberId);
    try {
      await updateAttendance({ customerId: memberId, date: todayStr, status: newStatus, checkIn: newStatus === 'Present' ? getISTTimeString() : '-', markedByName: user?.name || user?.email?.split('@')[0] || 'Admin' });
      if (addAttendanceAudit) {
        addAttendanceAudit(memberId, member?.name || memberId, prevStatus || 'Pending', newStatus);
      }

      // If marked Absent, automatically delete any logged shake for today
      if (newStatus === 'Absent') {
        const todaysPersonShakes = shakeLogs.filter(s => s.personId === memberId && s.date === todayStr);
        for (const shakeRecord of todaysPersonShakes) {
          await addShakeLog({
            source: shakeRecord.source || 'member',
            personId: memberId,
            personName: member?.name || member?.visitor_name || 'Member',
            item: shakeRecord.item,
            quantity: 0,
            date: todayStr,
            time: getISTTimeString(),
            staffName: user?.name || 'Admin',
          });
        }
      }
      
      // Save activity log (Audit Trail)
      addActivityLog(memberId, {
        customerName: member?.name,
        type: 'attendance_status',
        action_type: newStatus === 'Present' ? 'Present Marked' : 'Absent Marked',
        action_description: `Attendance status changed from ${prevStatus || 'Pending'} to ${newStatus} by ${user?.name || 'Admin'}`,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      toast.success(`${member?.name || 'Member'} marked ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update attendance: ${err.message || 'Operation failed.'}`);
    }
  };

  const handleShakeChange = (memberId, shakeId) => {
    const member = customers.find(c => c.id === memberId) || otherClubMembers.find(m => m.member_id === memberId);
    setActiveShakeSelection({
      member,
      shakeId,
      quantity: 1,
    });
  };

  // ─── Confirm Shake Save ───────────────────────────────────────────────────
  const handleConfirmShakeSave = async (memberId, shakeId, quantity) => {
    const member = customers.find(c => c.id === memberId) || otherClubMembers.find(m => m.member_id === memberId);
    const currentRecord = getRecord(memberId);

    try {
      // 1. Update attendance record (save the type to attendance list)
      await updateAttendance({
        customerId: memberId,
        date: todayStr,
        status: currentRecord?.status || 'Present',
        checkIn: currentRecord?.checkIn || getISTTimeString(),
        remark: quantity > 0 ? shakeId : '', // empty if 0
      });

      let actionType = 'Shake Added';
      let actionDesc = `Added ${quantity} x ${getShakeType(shakeId)?.label} shake(s) for ${member?.name}`;

      const alreadyExists = todayShakeLogs.some(s => s.personId === memberId);

      if (quantity === 0) {
        actionType = 'Shake Removed';
        actionDesc = `Removed shake entry for ${member?.name}`;
      } else if (alreadyExists) {
        actionType = 'Shake Quantity Changed';
        actionDesc = `Updated shake quantity to ${quantity} x ${getShakeType(shakeId)?.label} for ${member?.name}`;
      }

      // Add to shakeLogs - AWAIT is critical here to ensure DB write completes before UI updates
      await addShakeLog({
        source: 'member',
        personId: memberId,
        personName: member?.name || 'Member',
        item: shakeId,
        quantity: quantity,
        date: todayStr,
        time: getISTTimeString(),
        staffName: user?.name || 'Admin',
      });

      // 3. Save activity log (Audit Trail)
      addActivityLog(memberId, {
        customerId: memberId,
        customerName: member?.name,
        type: 'shake',
        item: shakeId,
        quantity: quantity,
        date: todayStr,
        time: getISTTimeString(),
        action_type: actionType,
        action_description: actionDesc,
        performed_by_name: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      toast.success(quantity > 0 ? `Confirmed ${quantity} shake(s) for ${member?.name}` : `Cleared shake for ${member?.name}`);
      setActiveShakeSelection(null);
      setShowShakeConfirmation(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to confirm shake entry: ${err.message || 'Operation failed.'}`);
    }
  };

  // ─── Payment Confirm ───────────────────────────────────────────────────────
  const handlePaymentConfirm = async (data) => {
    try {
      if (data.type === 'oneday') {
        await addPaymentLog({
          memberId: data.memberId,
          memberName: data.memberName,
          amount: data.amount,
          paymentMode: data.method,
          paymentPurpose: 'One Day Payment',
          date: data.date,
          time: data.time,
          totalAmount: data.totalAmount,
          due: data.due
        });
        if (addMemberPaymentRecord) {
          addMemberPaymentRecord(data.memberId, {
            payType: 'oneday',
            amount: data.amount,
            totalAmount: data.totalAmount,
            due: data.due,
            method: data.method,
            date: data.date,
            time: data.time,
          });
        }
        toast.success(`One-day payment of ₹${data.amount} recorded successfully.`);
      } else {
        await addPaymentLog({
          memberId: data.memberId,
          memberName: data.memberName,
          amount: data.advance,
          paymentMode: data.method,
          paymentPurpose: 'New Membership',
          plan: `${data.duration} Days`,
          totalAmount: data.totalAmount,
          due: data.due
        });
        if (addMemberPaymentRecord) {
          addMemberPaymentRecord(data.memberId, {
            payType: 'subscription',
            amount: data.advance,
            totalAmount: data.totalAmount,
            due: data.due,
            method: data.method,
            shakeType: data.shakeType,
            duration: data.duration,
            date: data.date,
            time: data.time,
          });
        }
        const existingMemb = memberships.find(m => m.customerId === data.memberId && m.status === 'Active');
        if (existingMemb) {
          if (renewMembership) {
            await renewMembership(existingMemb.id, {
              plan: `${data.duration} Days`,
              durationDays: data.duration,
              amount: data.totalAmount,
              advanceAmount: data.advance,
              paymentMethod: data.method,
            });
          }
        } else {
          if (addMembership) {
            await addMembership({
              customerId: data.memberId,
              customerName: data.memberName,
              plan: `${data.duration} Days`,
              durationDays: data.duration,
              totalAmount: data.totalAmount,
              advanceAmount: data.advance,
              startDate: data.date,
              status: 'Active',
              paymentMethod: data.method,
            });
          }
        }
        toast.success(`Subscription payment of ₹${data.advance} recorded successfully.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to process payment: ${err.message || 'Operation failed.'}`);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-gray-400 mt-1">{getISTDisplayDate(selectedDate)} · Mark present, assign shakes & record payments</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {(selectedDate !== todayStr) && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-4 py-2.5 bg-red-50 text-red-650 border border-red-100 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-red-100 transition-all"
            >
              Reset to Today <X size={14} />
            </button>
          )}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="p-3.5 bg-white border border-gray-200 hover:border-green-300 rounded-2xl transition-all shadow-sm text-gray-650 hover:text-green-600"
            title="Monthly Calendar"
          >
            <CalendarIcon size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today Present */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today Present</p>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <UserCheck size={18} className="text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-5xl font-bold text-green-600 leading-none">{presentCount}</p>
            <p className="text-xs text-gray-400 mt-2">{currentMembers.length + otherMembers.length} total members listed</p>
          </div>
        </div>

        {/* Total Shakes — Clickable */}
        <button
          onClick={() => setShowShakeBreakdown(true)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 text-left hover:border-amber-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Shakes Today</p>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Activity size={18} className="text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-5xl font-bold text-amber-600 leading-none">{shakeCount}</p>
            <p className="text-xs font-medium text-amber-400 mt-2 group-hover:text-amber-600 transition-colors">Click to view breakdown →</p>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="text"
          placeholder="Search members by name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-300 outline-none focus:border-green-300 focus:ring-4 focus:ring-green-50 transition-all shadow-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Current Club Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <h2 className="font-bold text-gray-900">Current Club Members</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            {currentMembers.length} members
          </span>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[2.2fr_1.2fr_1.2fr_1.5fr_1.2fr_auto] items-center gap-3 px-5 py-2.5 bg-gray-50/70 border-b border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Member</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Marked By</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Present / Absent</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Option</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Pay</p>
          <div className="w-5" />
        </div>

        {currentMembers.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-gray-300 text-sm">{searchTerm ? 'No members match your search' : 'No members registered yet'}</p>
          </div>
        ) : (
          currentMembers.map(member => {
            const record = getRecord(member.id);
            const markedByName = record?.markedBy || null;
            const todayOneDayPayment = paymentLogs
              .filter(p => p.memberId === member.id && p.paymentPurpose === 'One Day Payment' && p.date === selectedDate)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
            return (
              <MemberRow
                key={member.id}
                member={member}
                record={record}
                shake={shakeLogs.find(s => s.personId === member.id && s.date === selectedDate)?.item}
                activeMembership={memberships.find(m => (m.customerId === member.id || m.client_id === member.id) && m.status === 'Active')}
                consumedShakes={shakeLogs.filter(s => s.personId === member.id && s.source === 'member').reduce((sum, s) => sum + (Number(s.quantity) || 1), 0)}
                onStatusChange={handleStatusChange}
                onShakeChange={handleShakeChange}
                onRowClick={setProfileMember}
                onPayClick={(member) => {
                  setPaymentSelectMember(member);
                  setShowPaymentOptions(true);
                }}
                isLocked={isLocked}
                markedBy={markedByName}
                todayOneDayPayment={todayOneDayPayment}
              />
            );
          })
        )}
      </div>

      {/* Other Club Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="font-bold text-gray-900">Other Club Members</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            {otherMembers.length} members
          </span>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[2.2fr_1.2fr_1.2fr_1.5fr_1.2fr_auto] items-center gap-3 px-5 py-2.5 bg-gray-50/70 border-b border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Member</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Marked By</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Present / Absent</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Option</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left">Pay</p>
          <div className="w-5" />
        </div>

        {otherMembers.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-gray-300 text-sm">{searchTerm ? 'No members match your search' : 'No other club members yet'}</p>
          </div>
        ) : (
          otherMembers.map(member => {
            const record = getRecord(member.member_id);
            const markedByName = record?.markedBy || null;
            const todayOneDayPayment = paymentLogs
              .filter(p => p.memberId === member.member_id && p.paymentPurpose === 'One Day Payment' && p.date === selectedDate)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
            return (
              <MemberRow
                key={member.member_id}
                member={{ ...member, id: member.member_id }}
                record={record}
                shake={shakeLogs.find(s => s.personId === member.member_id && s.date === selectedDate)?.item}
                activeMembership={memberships.find(m => (m.customerId === member.member_id || m.client_id === member.member_id) && m.status === 'Active')}
                consumedShakes={memberActivityLogs.filter(l => l.customerId === member.member_id && l.type === 'shake').length}
                onStatusChange={handleStatusChange}
                onShakeChange={handleShakeChange}
                onRowClick={setProfileMember}
                onPayClick={(member) => {
                  setPaymentSelectMember(member);
                  setShowPaymentOptions(true);
                }}
                isLocked={isLocked}
                markedBy={markedByName}
                todayOneDayPayment={todayOneDayPayment}
              />
            );
          })
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showShakeBreakdown && (
        <ShakeBreakdownModal
          shakeLogs={shakeLogs.filter(s => s.source === 'member')}
          todayStr={todayStr}
          onClose={() => setShowShakeBreakdown(false)}
        />
      )}

      {profileMember && (
        <MembershipProfileModal
          member={profileMember}
          user={user}
          memberships={memberships}
          memberActivityLogs={memberActivityLogs}
          attendanceAuditLogs={attendanceAuditLogs}
          memberPaymentHistory={memberPaymentHistory}
          attendance={attendance}
          todayStr={todayStr}
          onClose={() => setProfileMember(null)}
          onPaymentConfirm={handlePaymentConfirm}
          shakeLogs={shakeLogs}
          paymentLogs={paymentLogs}
        />
      )}

      {isCalendarOpen && (
        <AttendanceCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onDateSelect={(dateStr) => {
            setSelectedDate(dateStr);
            setIsCalendarOpen(false);
          }}
        />
      )}


      {/* Payment Options Selection Modal */}
      {showPaymentOptions && paymentSelectMember && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowPaymentOptions(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-green-900">Select Payment Type</h2>
                <p className="text-sm text-green-700 mt-0.5 font-medium">{paymentSelectMember.name}</p>
              </div>
              <button onClick={() => setShowPaymentOptions(false)} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white">
                <X size={16} className="text-green-800" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowPaymentOptions(false);
                  setShowDirectOneDayModal(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all group text-left"
              >
                <div>
                  <p className="font-bold text-gray-800 text-sm group-hover:text-green-800">One Day Payment</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pay for single-day attendance & shake</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-green-600 transition-colors" />
              </button>
              <button
                onClick={() => {
                  setShowPaymentOptions(false);
                  setShowDirectSubModal(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all group text-left"
              >
                <div>
                  <p className="font-bold text-gray-800 text-sm group-hover:text-purple-800">Membership Payment</p>
                  <p className="text-xs text-gray-400 mt-0.5">Create or renew membership plan</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct One Day Payment Modal */}
      {showDirectOneDayModal && paymentSelectMember && (
        <OneDayPaymentModal
          member={paymentSelectMember}
          user={user}
          onConfirm={(data) => {
            handlePaymentConfirm(data);
            setShowDirectOneDayModal(false);
            setPaymentSelectMember(null);
            toast.success(`₹${data.amount} One Day payment recorded`);
          }}
          onClose={() => {
            setShowDirectOneDayModal(false);
            setPaymentSelectMember(null);
          }}
        />
      )}

      {/* Direct Membership (Subscription) Payment Modal */}
      {showDirectSubModal && paymentSelectMember && (
        <SubscriptionPaymentModal
          member={paymentSelectMember}
          user={user}
          onConfirm={(data) => {
            handlePaymentConfirm(data);
            setShowDirectSubModal(false);
            setPaymentSelectMember(null);
            toast.success(`₹${data.advance} subscription recorded for ${data.duration} days`);
          }}
          onClose={() => {
            setShowDirectSubModal(false);
            setPaymentSelectMember(null);
          }}
        />
      )}

      {/* Shake Quantity Selector Popup */}
      {activeShakeSelection && !showShakeConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-beige animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-amber-800 uppercase tracking-wider">Select Shake Quantity</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">{activeShakeSelection.member.name}</p>
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
                  className="w-12 h-12 rounded-xl bg-gray-55 border border-gray-250 hover:border-amber-300 hover:bg-amber-50 text-gray-700 font-black text-xl flex items-center justify-center transition-all"
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
                  className="w-12 h-12 rounded-xl bg-gray-55 border border-gray-250 hover:border-amber-300 hover:bg-amber-50 text-gray-700 font-black text-xl flex items-center justify-center transition-all"
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
                      handleConfirmShakeSave(activeShakeSelection.member.id, activeShakeSelection.shakeId, 0);
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
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Member Name</span>
                  <span className="text-gray-900 font-extrabold">{activeShakeSelection.member.name}</span>
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
                      activeShakeSelection.member.id,
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
    </div>
  );
}
