import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, CalendarCheck, Coffee, UserPlus, Banknote, Wifi,
  AlertTriangle, X, Search, ChevronLeft, ChevronRight,
  Clock, Phone, CreditCard, TrendingUp, ArrowUpRight,
  CheckCircle, XCircle, RefreshCw, MoreHorizontal, Eye,
  Zap, BarChart2, Activity, DollarSign, IndianRupee
} from 'lucide-react';
import { db } from '../services/db';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTDisplayDate, getStartOfWeekIST } from '../utils/dateUtils';

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function useSearchAndPage(data, searchKeys, pageSize = 8) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const lower = q.toLowerCase();
    return data.filter(item =>
      searchKeys.some(k => String(item[k] || '').toLowerCase().includes(lower))
    );
  }, [data, q, searchKeys]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => { setQ(''); setPage(1); };
  return { q, setQ, page, setPage, filtered, paged, totalPages, reset };
}

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtINR = (n) => `₹${fmt(n)}`;
const fmtTime = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  } catch { return ts; }
};
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

// ─── KPI Card ────────────────────────────────────────────────────────────────



// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ title, value, sub, icon: Icon, theme, iconColor, onClick, loading, badge, badgeStyle }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 text-left w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${theme}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-current/10`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${badgeStyle}`}>
            <Eye size={9} /> Details
          </div>
        </div>

        {loading ? (
          <div className="w-20 h-9 bg-current/20 animate-pulse rounded-xl mb-2" />
        ) : (
          <p className="text-4xl font-black tracking-tight leading-none mb-1">{value}</p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{title}</p>
        {sub && <p className="text-[9px] mt-1 font-medium opacity-70">{sub}</p>}
        {badge && (
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
            <ArrowUpRight size={10} /> {badge}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function DashModal({ title, subtitle, icon: Icon, onClose, children, maxWidth = 'max-w-4xl' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto no-scrollbar">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 my-6`}>
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center">
                <Icon size={18} className="text-forest" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-forest tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-muted mt-0.5 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-muted hover:text-forest bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ q, setQ, placeholder = 'Search…' }) {
  return (
    <div className="relative mb-5">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40" size={16} />
      <input
        value={q} onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-offwhite border border-beige rounded-xl text-sm font-semibold text-forest placeholder-muted/30 outline-none focus:ring-4 focus:ring-sage/10"
      />
    </div>
  );
}

// ─── Paginator ────────────────────────────────────────────────────────────────

function Paginator({ page, setPage, totalPages, total, pageSize }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">{from}–{to} of {total}</p>
      <div className="flex gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="p-2 bg-white border border-beige rounded-lg hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="p-2 bg-white border border-beige rounded-lg hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Table Shell ─────────────────────────────────────────────────────────────

function DTable({ heads, children, empty = 'No records found.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-offwhite text-muted text-[9px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
            {heads.map(h => <th key={h} className="px-5 py-4">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm">
          {React.Children.count(children) === 0
            ? <tr><td colSpan={heads.length} className="px-5 py-10 text-center text-muted font-medium">{empty}</td></tr>
            : children}
        </tbody>
      </table>
    </div>
  );
}

function TRow({ children }) {
  return <tr className="hover:bg-offwhite/60 transition-colors">{children}</tr>;
}
function TD({ children, className = '' }) {
  return <td className={`px-5 py-3.5 font-semibold text-forest ${className}`}>{children}</td>;
}

function StatusBadge({ label, color }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    muted: 'bg-gray-50 text-gray-500 border-gray-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${map[color] || map.muted}`}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 1: Total Members ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function MembersPopup({ members, memberships, onClose }) {
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(members, ['name', 'id', 'profession'], 10);
  return (
    <DashModal title="Active Members" subtitle={`${members.length} club members`} icon={Users} onClose={onClose}>
      <SearchBar q={q} setQ={setQ} placeholder="Search by name, ID…" />
      <DTable heads={['Member', 'Type', 'Join Date', 'Plan', 'Status']}>
        {paged.map(m => {
          const ms = memberships.find(mb => mb.customerId === m.id);
          return (
            <TRow key={m.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest font-bold text-sm shrink-0">{m.name?.charAt(0) || '?'}</div>
                  <div>
                    <p className="font-bold text-forest">{m.name}</p>
                    <p className="text-[9px] text-muted uppercase tracking-widest">{String(m.id || '').slice(0, 8)}</p>
                  </div>
                </div>
              </TD>
              <TD><StatusBadge label={m.member_type || 'Member'} color="blue" /></TD>
              <TD className="text-muted text-xs">{fmtDate(m.registration_date || m.joining_date)}</TD>
              <TD className="text-muted text-xs">{ms?.plan || '—'}</TD>
              <TD><StatusBadge label={m.status} color={m.status === 'Active' ? 'green' : 'red'} /></TD>
            </TRow>
          );
        })}
      </DTable>
      <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={10} />
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 2: Attendance ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AttendancePopup({ attendees, shakeLogs, memberships, customers, todayStr, onClose }) {
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(attendees, ['customerName', 'markedBy'], 10);

  const getShakeToday = (customerId) =>
    shakeLogs.some(s => s.personId === customerId && s.source === 'member' && s.date === todayStr);

  const getMembershipPlan = (customerId) =>
    memberships.find(m => m.customerId === customerId)?.plan || '—';

  return (
    <DashModal title="Attendance Today" subtitle={`${attendees.length} checked in`} icon={CalendarCheck} onClose={onClose}>
      <SearchBar q={q} setQ={setQ} placeholder="Search by name…" />
      <DTable heads={['Member', 'Time', 'Status', 'Membership', 'Shake Today']}>
        {paged.map(a => (
          <TRow key={a.id}>
            <TD>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {(a.customerName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-forest">{a.customerName || a.customerId}</p>
                  <p className="text-[9px] text-muted">by {a.markedBy}</p>
                </div>
              </div>
            </TD>
            <TD className="text-muted text-xs">{a.time || fmtTime(a.timestamp)}</TD>
            <TD><StatusBadge label={a.status} color={a.status === 'Present' ? 'green' : 'red'} /></TD>
            <TD className="text-muted text-xs">{getMembershipPlan(a.customerId)}</TD>
            <TD>
              {getShakeToday(a.customerId)
                ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle size={13} /> Yes</span>
                : <span className="flex items-center gap-1 text-muted font-bold text-xs"><XCircle size={13} /> No</span>}
            </TD>
          </TRow>
        ))}
      </DTable>
      <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={10} />
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 3: Total Shakes ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ShakePopup({ memberShakes, visitorShakes, otherClubShakes, closingShakes, todayStr, onClose }) {
  const [drillSource, setDrillSource] = useState(null);

  const total = memberShakes.length + visitorShakes.length + otherClubShakes.length + closingShakes;

  const categories = [
    { key: 'member', label: 'Club Members', count: memberShakes.length, data: memberShakes, theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white', iconColor: 'text-forest group-hover:text-white', icon: Users },
    { key: 'visitor', label: 'Visitors', count: visitorShakes.length, data: visitorShakes, theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white', iconColor: 'text-forest group-hover:text-white', icon: UserPlus },
    { key: 'otherClub', label: 'Other Club', count: otherClubShakes.length, data: otherClubShakes, theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white', iconColor: 'text-forest group-hover:text-white', icon: Activity },
    { key: 'closing', label: 'Closing Entries', count: closingShakes, data: [], theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white', iconColor: 'text-forest group-hover:text-white', icon: BarChart2 },
  ];

  // Calculate shake-wise type counts dynamically
  const shakeTypeCounts = {
    'S': { label: 'Shake', count: 0, color: '#059669', bg: '#ECFDF5' },
    'SB': { label: 'Shake + Beta Heart', count: 0, color: '#3B82F6', bg: '#EFF6FF' },
    'SF': { label: 'Shake + Fiber', count: 0, color: '#D97706', bg: '#FEF3C7' },
    'SBF': { label: 'Shake + Beta + Fiber', count: 0, color: '#8B5CF6', bg: '#F5F3FF' },
    'D': { label: 'Dino', count: 0, color: '#EC4899', bg: '#FDF2F8' }
  };

  [...memberShakes, ...visitorShakes, ...otherClubShakes].forEach(s => {
    let itemKey = s.item;
    if (itemKey === 'Shake') itemKey = 'S';
    else if (itemKey === 'Shake + Beta Heart') itemKey = 'SB';
    else if (itemKey === 'Shake + Fiber' || itemKey === 'Shake + Fibre') itemKey = 'SF';
    else if (itemKey === 'Shake + Beta + Fiber' || itemKey === 'Shake + Fiber + Beta Heart') itemKey = 'SBF';
    else if (itemKey === 'Dino' || itemKey === 'Dyno') itemKey = 'D';

    if (shakeTypeCounts[itemKey]) {
      shakeTypeCounts[itemKey].count += s.quantity || 1;
    }
  });

  if (drillSource) {
    const cat = categories.find(c => c.key === drillSource);
    return (
      <DashModal title={`${cat.label} — Shake Detail`} subtitle={`${cat.count} shake${cat.count !== 1 ? 's' : ''} today`} icon={Coffee} onClose={onClose} maxWidth="max-w-3xl">
        <button onClick={() => setDrillSource(null)} className="flex items-center gap-2 text-xs font-bold text-forest hover:text-sage transition-colors mb-5">
          <ChevronLeft size={14} /> Back to Overview
        </button>
        {cat.data.length === 0 ? (
          <div className="text-center py-12 text-muted font-medium">No individual records available for this category.</div>
        ) : (
          <DTable heads={['Person', 'Item', 'Time', 'Staff']}>
            {cat.data.map((s, i) => (
              <TRow key={i}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest flex items-center justify-center font-bold text-sm">
                      {(s.personName || s.customerName || '?').charAt(0)}
                    </div>
                    <span className="font-bold">{s.personName || s.customerName || s.customerId || '—'}</span>
                  </div>
                </TD>
                <TD><StatusBadge label={s.item || 'Shake'} color="green" /></TD>
                <TD className="text-muted text-xs">{s.time || fmtTime(s.timestamp)}</TD>
                <TD className="text-muted text-xs">{s.markedBy || s.staffName || '—'}</TD>
              </TRow>
            ))}
          </DTable>
        )}
      </DashModal>
    );
  }

  return (
    <DashModal title="Total Shakes Today" subtitle={`${total} shakes across all sources`} icon={Coffee} onClose={onClose} maxWidth="max-w-2xl">
      {/* Category cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => cat.key !== 'closing' && setDrillSource(cat.key)}
            className={`group rounded-2xl p-5 text-left transition-all border ${cat.theme} ${cat.key !== 'closing' ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default opacity-90'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <cat.icon size={18} className={cat.iconColor} />
              {cat.key !== 'closing' && <span className="text-[8px] uppercase font-bold tracking-widest opacity-60">Click to drill down</span>}
            </div>
            <p className="text-3xl font-black">{cat.count}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">{cat.label}</p>
          </button>
        ))}
      </div>

      {/* Shake Type Breakdown */}
      <div className="mb-6 p-5 bg-offwhite border border-beige rounded-2xl space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-forest border-b border-beige pb-1.5">Daily Shake Type Breakdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Object.entries(shakeTypeCounts).map(([key, st]) => (
            <div key={key} className="flex items-center justify-between p-2.5 bg-white border border-beige/40 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                <span className="text-xs font-bold text-gray-700">{st.label}</span>
              </div>
              <span className="text-sm font-extrabold text-forest">{st.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total Bar */}
      <div className="bg-forest text-white border border-forest rounded-2xl p-6">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">Grand Total Today</p>
        <div className="grid grid-cols-5 gap-3 text-center">
          {categories.map(c => (
            <div key={c.key}>
              <p className="text-2xl font-black">{c.count}</p>
              <p className="text-white/50 text-[8px] font-bold uppercase tracking-wider">{c.label.split(' ')[0]}</p>
            </div>
          ))}
          <div className="border-l border-white/20 pl-3">
            <p className="text-3xl font-black text-white">{total}</p>
            <p className="text-white/50 text-[8px] font-bold uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 4: Visitors Today ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function VisitorsPopup({ visitors, memberActivityLogs, todayStr, onClose }) {
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(visitors, ['visitor_name', 'mobile_number', 'referred_by'], 10);
  return (
    <DashModal title="Visitors Today" subtitle={`${visitors.length} new visitors`} icon={UserPlus} onClose={onClose}>
      <SearchBar q={q} setQ={setQ} placeholder="Search by name or phone…" />
      <DTable heads={['Visitor', 'Mobile', 'Visit Time', 'Referred By', 'Shake']}>
        {paged.map(v => (
          <TRow key={v.id}>
            <TD>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm shrink-0">
                  {(v.visitor_name || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-forest">{v.visitor_name || 'Unknown'}</p>
                  <p className="text-[9px] text-muted">by {v.added_by_name || '—'}</p>
                </div>
              </div>
            </TD>
            <TD className="text-muted text-xs"><span className="flex items-center gap-1"><Phone size={11} />{v.mobile_number || '—'}</span></TD>
            <TD className="text-muted text-xs"><span className="flex items-center gap-1"><Clock size={11} />{v.visit_time || '—'}</span></TD>
            <TD className="text-muted text-xs">{v.referred_by || v.referral || '—'}</TD>
            <TD>
              {v.shake_taken
                ? <StatusBadge label="Yes" color="green" />
                : <StatusBadge label="No" color="muted" />}
            </TD>
          </TRow>
        ))}
      </DTable>
      <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={10} />
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 5 & 6: Revenue (Cash / Online) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function RevenuePopup({ mode, logs, total, onClose }) {
  // Deduplicate logs aggressively by logical composite key, ignoring time completely.
  // If a member has the exact same amount for the exact same purpose on the same day,
  // we count it only once. This catches duplicates generated manually hours apart.
  // Key = Member + Amount + Purpose + Date
  const seenKeys = new Set();
  const dedupedLogs = logs.filter(p => {
    const key = [p.memberId || p.memberName, p.amount, p.paymentPurpose, p.date].join('|');
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const dedupedTotal = dedupedLogs.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(dedupedLogs, ['memberName', 'paymentPurpose', 'staffName'], 10);
  const isCash = mode === 'Cash';

  return (
    <DashModal
      title={`${mode} Revenue Today`}
      subtitle={`${fmtINR(dedupedTotal)} from ${dedupedLogs.length} transaction${dedupedLogs.length !== 1 ? 's' : ''}`}
      icon={isCash ? Banknote : Wifi}
      onClose={onClose}
    >
      {/* Summary banner */}
      <div className={`rounded-2xl p-5 mb-5 ${isCash ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
        <p className="text-white/70 text-[9px] font-bold uppercase tracking-[0.25em]">Total {mode} Collected Today</p>
        <p className="text-4xl font-black text-white mt-1">{fmtINR(dedupedTotal)}</p>
      </div>

      <SearchBar q={q} setQ={setQ} placeholder="Search by member, purpose…" />
      <DTable heads={['Member', 'Amount', 'Purpose / Plan', 'Mode', 'Date', 'Time', 'Entered By']}>
        {paged.map(p => (
          <TRow key={p.id}>
            <TD>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${isCash ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {(p.memberName || '?').charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{p.memberName || '—'}</span>
                  {(p.due > 0) && <span className="text-[9px] text-red-500 font-bold">Due: {fmtINR(p.due)}</span>}
                </div>
              </div>
            </TD>
            <TD className="font-black text-forest">{fmtINR(p.amount)}</TD>
            <TD>
              <div className="flex flex-col items-start gap-1">
                <StatusBadge label={p.paymentPurpose || 'Payment'} color={isCash ? 'green' : 'blue'} />
                {p.plan && p.plan !== '1 Day' && <span className="text-[10px] text-muted font-medium">{p.plan}</span>}
              </div>
            </TD>
            <TD><StatusBadge label={p.paymentMode || mode} color={isCash ? 'green' : 'blue'} /></TD>
            <TD className="text-muted text-xs">{fmtDate(p.date)}</TD>
            <TD className="text-muted text-xs">{p.time || fmtTime(p.timestamp)}</TD>
            <TD className="text-muted text-xs font-bold">{p.staffName || '—'}</TD>
          </TRow>
        ))}
      </DTable>
      <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={10} />
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 7: Expired Memberships ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ExpiredMembershipsPopup({ expiredData, customers, onRenew, onClose }) {
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(expiredData, ['customerName', 'plan'], 8);

  return (
    <DashModal title="Expired Memberships" subtitle={`${expiredData.length} memberships exhausted (shake-based)`} icon={AlertTriangle} onClose={onClose} maxWidth="max-w-5xl">
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5 mb-5 flex items-center gap-4">
        <AlertTriangle size={28} className="text-white shrink-0" />
        <div>
          <p className="text-white font-bold">Shake-Based Expiry</p>
          <p className="text-white/70 text-xs mt-0.5">Memberships expire when all allocated shakes are consumed, regardless of calendar date.</p>
        </div>
      </div>

      <SearchBar q={q} setQ={setQ} placeholder="Search by member name or plan…" />
      <DTable heads={['Member', 'Plan', 'Allocated', 'Consumed', 'Remaining', 'Last Shake', 'Status', 'Action']}>
        {paged.map(item => {
          const customer = customers.find(c => c.id === item.customerId);
          return (
            <TRow key={item.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                    {(item.customerName || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-forest">{item.customerName}</p>
                    <p className="text-[9px] text-muted">{customer?.contact || customer?.mobile_number || '—'}</p>
                  </div>
                </div>
              </TD>
              <TD><StatusBadge label={item.plan} color="purple" /></TD>
              <TD className="text-center">
                <span className="font-black text-forest">{item.allocated}</span>
                <span className="text-[9px] text-muted ml-1">shakes</span>
              </TD>
              <TD className="text-center">
                <span className="font-black text-red-600">{item.consumed}</span>
              </TD>
              <TD className="text-center">
                <span className={`font-black ${item.remaining === 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.remaining}</span>
              </TD>
              <TD className="text-muted text-xs">{fmtDate(item.lastShakeDate) || '—'}</TD>
              <TD><StatusBadge label="Expired" color="red" /></TD>
              <TD>
                <button
                  onClick={() => onRenew && onRenew(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-forest-hover transition-all"
                >
                  <RefreshCw size={10} /> Renew
                </button>
              </TD>
            </TRow>
          );
        })}
      </DTable>
      <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={8} />
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POPUP 8: Due Amount ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function DueAmountPopup({ dueData, onClose, onPaymentRecorded }) {
  const { q, setQ, paged, page, setPage, totalPages, filtered } = useSearchAndPage(dueData, ['customerName', 'plan'], 8);
  const [paymentInputs, setPaymentInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [savedMsg, setSavedMsg] = useState({});

  const totalDue = dueData.reduce((sum, m) => sum + Number(m.dueAmount || 0), 0);

  const handlePaymentChange = (id, value) => {
    setPaymentInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleRecordPayment = async (item) => {
    const amount = Number(paymentInputs[item.id] || 0);
    if (!amount || amount <= 0) return;
    if (amount > Number(item.dueAmount)) return;

    setSaving(prev => ({ ...prev, [item.id]: true }));
    try {
      // Direct Supabase update: add the payment amount to paid_amount
      const { supabase } = await import('../services/supabaseClient');
      const { data: membRow } = await supabase
        .from('memberships')
        .select('paid_amount, total_amount')
        .eq('id', item.id)
        .maybeSingle();

      if (membRow) {
        const newPaid = Number(membRow.paid_amount) + amount;
        const totalAmt = Number(membRow.total_amount);
        const newPaymentStatus = newPaid >= totalAmt ? 'Paid' : 'Partially_Paid';

        await supabase
          .from('memberships')
          .update({
            paid_amount: newPaid,
            payment_status: newPaymentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Also log into membership_payments table
        await supabase.from('membership_payments').insert([{
          membership_id: item.id,
          amount: amount,
          payment_date: new Date().toISOString(),
        }]);
      }

      setSavedMsg(prev => ({ ...prev, [item.id]: `₹${Number(amount).toLocaleString('en-IN')} recorded!` }));
      setPaymentInputs(prev => ({ ...prev, [item.id]: '' }));
      setTimeout(() => {
        setSavedMsg(prev => { const n = { ...prev }; delete n[item.id]; return n; });
        onPaymentRecorded && onPaymentRecorded();
      }, 1500);
    } catch (err) {
      console.error('Error recording due payment:', err);
      setSavedMsg(prev => ({ ...prev, [item.id]: 'Error! Try again.' }));
      setTimeout(() => setSavedMsg(prev => { const n = { ...prev }; delete n[item.id]; return n; }), 2000);
    } finally {
      setSaving(prev => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <DashModal
      title="Due Amount"
      subtitle={`${dueData.length} member${dueData.length !== 1 ? 's' : ''} with outstanding balance`}
      icon={IndianRupee}
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <IndianRupee size={28} className="text-white" />
        </div>
        <div>
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-[0.25em]">Total Outstanding Due</p>
          <p className="text-4xl font-black text-white mt-0.5">{fmtINR(totalDue)}</p>
          <p className="text-white/70 text-xs mt-0.5">Across {dueData.length} active membership{dueData.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {dueData.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="text-forest font-bold text-lg">All Dues Cleared!</p>
          <p className="text-muted text-sm mt-1">No members have outstanding balance.</p>
        </div>
      ) : (
        <>
          <SearchBar q={q} setQ={setQ} placeholder="Search by member name or plan…" />
          <DTable heads={['Member', 'Plan', 'Total', 'Paid', 'Due', 'Record Payment']}>
            {paged.map(item => (
              <TRow key={item.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                      {(item.customerName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-forest">{item.customerName}</p>
                      <p className="text-[9px] text-muted">{item.customerContact}</p>
                    </div>
                  </div>
                </TD>
                <TD><StatusBadge label={item.plan} color="purple" /></TD>
                <TD className="font-bold text-forest">{fmtINR(item.totalAmount)}</TD>
                <TD className="font-bold text-emerald-600">{fmtINR(item.advanceAmount || 0)}</TD>
                <TD>
                  <span className="font-black text-red-600 text-base">{fmtINR(item.dueAmount)}</span>
                </TD>
                <TD>
                  {savedMsg[item.id] ? (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${savedMsg[item.id].includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {savedMsg[item.id]}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min="1"
                          max={item.dueAmount}
                          value={paymentInputs[item.id] || ''}
                          onChange={e => handlePaymentChange(item.id, e.target.value)}
                          placeholder="Amount"
                          className="w-28 pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-forest focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                        />
                      </div>
                      <button
                        onClick={() => handleRecordPayment(item)}
                        disabled={saving[item.id] || !paymentInputs[item.id] || Number(paymentInputs[item.id]) <= 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving[item.id] ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                        {saving[item.id] ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </TD>
              </TRow>
            ))}
          </DTable>
          <Paginator page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} pageSize={8} />
        </>
      )}
    </DashModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  const {
    customers = [], attendance = [], memberships = [], visitors = [],
    memberActivityLogs = [], shakeLogs = [], paymentLogs = [],
    otherClubMembers = [], closings = [],
    getMembershipShakeStatus, dataLoading, fetchData
  } = useAppContext();

  const [activeModal, setActiveModal] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const id = setTimeout(() => setLayoutReady(true), 400);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayStr = getISTDateString();

  // ── Computed Metrics ────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    // 1. Total active members (exclude other-club-type members and visitors)
    const activeMembers = customers.filter(c =>
      c.status === 'Active' && c.member_type !== 'Other Club Member'
    );

    // 2. Attendance today (from DB-backed attendance state), enriched with customer names
    const todayAttendees = attendance
      .filter(a => (a.status === 'Present') && a.date === todayStr)
      .map(a => ({
        ...a,
        customerName: customers.find(c => c.id === a.customerId)?.name || a.customerId,
      }))

    // 3. Shake counts today (from database-backed shakeLogs, using source field directly)
    const memberShakesToday = shakeLogs.filter(s => s.source === 'member' && s.date === todayStr);
    const otherClubShakesToday = shakeLogs.filter(s => s.source === 'other_club' && s.date === todayStr);
    const visitorShakesToday = shakeLogs.filter(s => s.source === 'visitor' && s.date === todayStr);
    // Closing entries that are 'Closing' or 'Converted' today = contribute 1 shake each
    const closingShakesToday = closings.filter(c =>
      c.visit_date === todayStr && (c.status === 'Closing' || c.status === 'Converted')
    ).length;
    const totalShakes = memberShakesToday.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) + 
                        visitorShakesToday.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) + 
                        otherClubShakesToday.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) + 
                        closingShakesToday;


    // 4. Visitors today
    const todayVisitors = visitors.filter(v => v.visit_date === todayStr);

    // 5. Cash Revenue today — heavily deduplicate by logical key to prevent double-counting
    //    from existing DB duplicate rows. We ignore time completely to catch retries/duplicates 
    //    that happened hours apart.
    const seenPayKeys = new Set();
    const uniquePaymentLogs = paymentLogs.filter(l => {
      if (Number(l.amount) <= 0) return false; // Hide ₹0 transactions from Revenue
      const key = [l.memberId || l.memberName, l.amount, l.paymentPurpose, l.date].join('|');
      if (seenPayKeys.has(key)) return false;
      seenPayKeys.add(key);
      return true;
    });

    const cashLogs = uniquePaymentLogs.filter(l => l.date === todayStr && (l.paymentMode === 'Cash' || l.paymentMode === 'cash'));
    const cashRevenue = cashLogs.reduce((s, l) => s + (Number(l.amount) || 0), 0);

    // 6. Online Revenue today
    const onlineLogs = uniquePaymentLogs.filter(l => l.date === todayStr && (l.paymentMode === 'Online' || l.paymentMode === 'online' || l.paymentMode === 'UPI'));
    const onlineRevenue = onlineLogs.reduce((s, l) => s + (Number(l.amount) || 0), 0);

    // 7. Expired memberships (shake-based)
    const expiredMemberships = memberships
      .map(m => {
        const shakeStatus = getMembershipShakeStatus ? getMembershipShakeStatus(m) : { consumed: 0, allocated: 0, remaining: 0, isExpired: false };
        return { ...m, ...shakeStatus };
      })
      .filter(m => m.isExpired);

    // 8. Members with outstanding dues
    const membershipsWithDues = memberships
      .filter(m => Number(m.dueAmount) > 0)
      .map(m => {
        const customer = customers.find(c => c.id === m.customerId);
        return {
          ...m,
          customerName: customer?.name || 'Unknown',
          customerContact: customer?.mobile_number || customer?.contact || '—',
        };
      })
      .sort((a, b) => Number(b.dueAmount) - Number(a.dueAmount));

    return {
      activeMembers, todayAttendees,
      memberShakesToday, visitorShakesToday, otherClubShakesToday, closingShakesToday, totalShakes,
      todayVisitors, cashLogs, cashRevenue, onlineLogs, onlineRevenue, expiredMemberships,
      membershipsWithDues
    };
  }, [customers, attendance, memberships, visitors, memberActivityLogs, shakeLogs, paymentLogs, otherClubMembers, closings, todayStr, getMembershipShakeStatus, customers]);

  // ── Weekly Chart Data ────────────────────────────────────────────────────────
  const attendanceData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, present: 0, absent: 0, shake: 0 }));
    const startOfWeekStr = getStartOfWeekIST(todayStr);
    memberActivityLogs.forEach(log => {
      if (log.date >= startOfWeekStr && log.date <= todayStr) {
        const d = new Date(log.date + 'T00:00:00');
        const dayObj = data[d.getDay()];
        if (dayObj) {
          if (log.type === 'attendance') {
            if (log.status === 'Present') dayObj.present++;
            else dayObj.absent++;
          } else if (log.type === 'shake') {
            dayObj.shake++;
          }
        }
      }
    });
    return data;
  }, [memberActivityLogs, todayStr]);

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const data = months.map(m => ({ month: m, revenue: 0 }));
    paymentLogs.forEach(log => {
      const d = new Date(log.timestamp);
      if (d.getFullYear() === year) {
        data[d.getMonth()].revenue += Number(log.amount) || 0;
      }
    });
    const ci = new Date().getMonth();
    return data.slice(Math.max(0, ci - 5), ci + 1);
  }, [paymentLogs]);

  // ── Date/Time ─────────────────────────────────────────────────────────────────
  const displayDate = liveTime.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const displayTime = liveTime.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
  }).toUpperCase();

  const totalRevenue = metrics.cashRevenue + metrics.onlineRevenue;

  // ── KPI Card Definitions — hover turns RED ──
  const kpiCards = [
    {
      id: 'members',
      title: 'Active Members',
      value: metrics.activeMembers.length,
      sub: 'Current club only',
      icon: Users,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'Club members',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'attendance',
      title: 'Attendance Today',
      value: metrics.todayAttendees.length,
      sub: 'Checked in today',
      icon: CalendarCheck,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: todayStr,
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'shakes',
      title: 'Total Shakes',
      value: metrics.totalShakes,
      sub: 'All sources today',
      icon: Coffee,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'Members + Visitors',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'visitors',
      title: 'Visitors Today',
      value: metrics.todayVisitors.length,
      sub: 'New walk-ins today',
      icon: UserPlus,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'New visitors',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'cash',
      title: 'Cash Revenue',
      value: fmtINR(metrics.cashRevenue),
      sub: `${metrics.cashLogs.length} transaction${metrics.cashLogs.length !== 1 ? 's' : ''}`,
      icon: Banknote,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'Today',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'online',
      title: 'Online Revenue',
      value: fmtINR(metrics.onlineRevenue),
      sub: `${metrics.onlineLogs.length} transaction${metrics.onlineLogs.length !== 1 ? 's' : ''}`,
      icon: Wifi,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'UPI / Online',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'expired',
      title: 'Membership Expired',
      value: metrics.expiredMemberships.length,
      sub: 'Shake quota exhausted',
      icon: AlertTriangle,
      theme: 'bg-white text-black border border-beige hover:bg-forest hover:text-white',
      iconColor: 'text-forest group-hover:text-white',
      badge: 'Needs renewal',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
    {
      id: 'due',
      title: 'Due Amount',
      value: fmtINR(metrics.membershipsWithDues.reduce((sum, m) => sum + Number(m.dueAmount || 0), 0)),
      sub: `${metrics.membershipsWithDues.length} member${metrics.membershipsWithDues.length !== 1 ? 's' : ''} with dues`,
      icon: IndianRupee,
      theme: 'bg-white text-black border border-beige hover:bg-red-600 hover:text-white',
      iconColor: 'text-red-500 group-hover:text-white',
      badge: 'Outstanding',
      badgeStyle: 'bg-black/5 text-black group-hover:bg-white/10 group-hover:text-white',
    },
  ];

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-forest tracking-tight">Dashboard</h1>
          <p className="text-muted mt-1.5 font-medium text-sm">Real-time performance overview · {displayDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-2xl border border-beige shadow-md">
            <div className="w-2 h-2 bg-forest rounded-full animate-pulse" />
            <span className="text-xs font-bold text-forest uppercase tracking-widest">{displayTime}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-forest text-white border border-forest rounded-2xl shadow-lg shadow-forest/20">
            <TrendingUp size={14} className="text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">{fmtINR(totalRevenue)} Today</span>
          </div>
        </div>
      </div>

      {/* ── KPI Row 1 — 4 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.slice(0, 4).map(card => (
          <KPICard
            key={card.id}
            title={card.title}
            value={card.value}
            sub={card.sub}
            icon={card.icon}
            theme={card.theme}
            iconColor={card.iconColor}
            badge={card.badge}
            badgeStyle={card.badgeStyle}
            loading={dataLoading}
            onClick={() => setActiveModal(card.id)}
          />
        ))}
      </div>

      {/* ── KPI Row 2 — 4 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.slice(4).map(card => (
          <KPICard
            key={card.id}
            title={card.title}
            value={card.value}
            sub={card.sub}
            icon={card.icon}
            theme={card.theme}
            iconColor={card.iconColor}
            badge={card.badge}
            badgeStyle={card.badgeStyle}
            loading={dataLoading}
            onClick={() => setActiveModal(card.id)}
          />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Weekly Session Flow */}
        <div className="luxury-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-forest tracking-tight">Weekly Session Flow</h3>
              <p className="text-xs text-muted mt-1 font-medium">Current week attendance & shakes</p>
            </div>
            <div className="flex items-center gap-4">
              {[['Present', '#14532D'], ['Shake', '#F59E0B'], ['Absent', '#E5E7EB']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#F9FAFB', radius: 8 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.12)', fontSize: '12px' }} />
                  <Bar dataKey="present" fill="#14532D" radius={[5, 5, 0, 0]} barSize={20} />
                  <Bar dataKey="shake" fill="#F59E0B" radius={[5, 5, 0, 0]} barSize={20} />
                  <Bar dataKey="absent" fill="#E5E7EB" radius={[5, 5, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Trajectory */}
        <div className="luxury-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-forest tracking-tight">Revenue Trajectory</h3>
              <p className="text-xs text-muted mt-1 font-medium">Cash + Online combined</p>
            </div>
            <div className="px-4 py-2 bg-offwhite border border-beige rounded-xl text-[10px] font-bold text-forest uppercase tracking-widest">
              {new Date().getFullYear()}
            </div>
          </div>
          <div className="h-[260px]">
            {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14532D" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14532D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.12)', fontSize: '12px' }} formatter={v => [fmtINR(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#14532D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev2)" dot={{ r: 4, fill: '#14532D', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Active Memberships', value: memberships.filter(m => {
              const s = getMembershipShakeStatus?.(m);
              return !s?.isExpired;
            }).length, color: 'text-emerald-600' },
          { label: 'Expired (Shake)', value: metrics.expiredMemberships.length, color: 'text-red-600' },
          { label: 'Member Shakes Today', value: metrics.memberShakesToday.length, color: 'text-amber-600' },
          { label: 'Total Revenue Today', value: fmtINR(totalRevenue), color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="luxury-card p-5 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">{label}</p>
            <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Enrollments */}
        <div className="luxury-card overflow-hidden">
          <div className="px-7 py-6 border-b border-beige flex items-center justify-between">
            <h3 className="text-base font-bold text-forest tracking-tight">Recent Enrollments</h3>
            <button onClick={() => setActiveModal('members')} className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] hover:text-forest transition-colors flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-beige/40">
            {customers.length === 0 ? (
              <div className="px-7 py-10 text-center text-muted font-medium">No enrollments yet.</div>
            ) : (
              customers.slice(0, 5).map(c => (
                <div key={c.id} className="px-7 py-4 flex items-center justify-between hover:bg-offwhite transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-offwhite border border-beige text-forest flex items-center justify-center font-bold text-sm group-hover:bg-forest group-hover:text-white transition-all shadow-sm shrink-0">
                      {c?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-forest">{c?.name}</p>
                      <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{c?.member_type || 'Member'}</p>
                    </div>
                  </div>
                  <StatusBadge label={c.status} color={c.status === 'Active' ? 'green' : 'red'} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visitors Today */}
        <div className="luxury-card overflow-hidden">
          <div className="px-7 py-6 border-b border-beige flex items-center justify-between">
            <h3 className="text-base font-bold text-forest tracking-tight">Visitors Today</h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-orange-200">
              {metrics.todayVisitors.length} visitors
            </span>
          </div>
          <div className="divide-y divide-beige/40">
            {metrics.todayVisitors.length === 0 ? (
              <div className="px-7 py-12 text-center">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
                  <UserPlus size={22} className="text-orange-300" />
                </div>
                <p className="text-forest font-bold">No Visitors Today</p>
                <p className="text-muted text-xs mt-1">Walk-in visitors will appear here.</p>
              </div>
            ) : (
              metrics.todayVisitors.slice(0, 5).map(v => (
                <div key={v.id} className="px-7 py-4 flex items-center justify-between hover:bg-offwhite transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {(v.visitor_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-forest">{v.visitor_name || 'Unknown'}</p>
                      <p className="text-[9px] font-bold text-muted flex items-center gap-1">
                        <Clock size={9} /> {v.visit_time || '—'}
                        {v.mobile_number && <><Phone size={9} className="ml-2" /> {v.mobile_number}</>}
                      </p>
                    </div>
                  </div>
                  {v.purpose && <StatusBadge label={v.purpose} color="amber" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Active Modal ────────────────────────────────────────────────────── */}

      {activeModal === 'members' && (
        <MembersPopup
          members={metrics.activeMembers}
          memberships={memberships}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'attendance' && (
        <AttendancePopup
          attendees={metrics.todayAttendees}
          shakeLogs={shakeLogs}
          memberships={memberships}
          customers={customers}
          todayStr={todayStr}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'shakes' && (
        <ShakePopup
          memberShakes={metrics.memberShakesToday}
          visitorShakes={metrics.visitorShakesToday}
          otherClubShakes={metrics.otherClubShakesToday}
          closingShakes={metrics.closingShakesToday}
          todayStr={todayStr}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'visitors' && (
        <VisitorsPopup
          visitors={metrics.todayVisitors}
          memberActivityLogs={memberActivityLogs}
          todayStr={todayStr}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'cash' && (
        <RevenuePopup
          mode="Cash"
          logs={metrics.cashLogs}
          total={metrics.cashRevenue}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'online' && (
        <RevenuePopup
          mode="Online"
          logs={metrics.onlineLogs}
          total={metrics.onlineRevenue}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'expired' && (
        <ExpiredMembershipsPopup
          expiredData={metrics.expiredMemberships}
          customers={customers}
          onRenew={(item) => {
            setActiveModal(null);
            // Could open membership modal here in future
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'due' && (
        <DueAmountPopup
          dueData={metrics.membershipsWithDues}
          onClose={() => setActiveModal(null)}
          onPaymentRecorded={() => fetchData && fetchData()}
        />
      )}
    </div>
  );
}
