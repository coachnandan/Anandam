import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Check, UserMinus, Clock, Heart, Sparkles, Droplets,
  ArrowLeft, User, ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDisplayDate } from '../utils/dateUtils';

export default function AttendanceCalendarModal({ isOpen, onClose, onDateSelect }) {
  const { customers = [], attendance: realtimeAttendance = [], fetchMonthlyAttendance } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // day number or null

  useEffect(() => {
    if (!isOpen) { setSelectedDay(null); return; }
    const load = async () => {
      setLoading(true);
      const data = await fetchMonthlyAttendance(currentMonth);
      setMonthlyData(data);
      setLoading(false);
    };
    load();
  }, [isOpen, currentMonth]);

  // Merge DB data with real-time local state for instant updates
  const mergedData = useMemo(() => {
    if (!isOpen) return [];
    const [year, month] = currentMonth.split('-').map(Number);
    const startDate = `${currentMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;
    // Local real-time records for this month
    const localRecords = realtimeAttendance
      .filter(a => a.date >= startDate && a.date <= endDate)
      .map(a => ({ 
        ...a, 
        customerId: a.customerId || a.client_id,
        markedBy: a.markedBy || a.marked_by_name
      }));
    // DB records not overridden by local
    const dbMap = new Map(monthlyData.map(a => [`${a.customerId}-${a.date}`, a]));
    const localMap = new Map(localRecords.map(a => [`${a.customerId}-${a.date}`, a]));
    // Merge: local overrides DB
    const merged = new Map([...dbMap, ...localMap]);
    return Array.from(merged.values());
  }, [isOpen, currentMonth, monthlyData, realtimeAttendance]);

  if (!isOpen) return null;

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDay(null);
  };

  const currentMonthData = mergedData.filter(a => {
    if (!selectedMember) return true;
    return a.customerId === selectedMember;
  });

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const getDayRecords = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    return currentMonthData.filter(a => a.date === dateStr);
  };

  const getDaySummary = (day) => {
    const records = getDayRecords(day);
    if (records.length === 0) return { present: 0, absent: 0, shake: 0, s: 0, sb: 0, sf: 0, total: 0 };
    return {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      shake: records.filter(r => r.status === 'Shake').length,
      s: records.filter(r => r.remark === 'S').length,
      sb: records.filter(r => r.remark === 'SB').length,
      sf: records.filter(r => r.remark === 'SF').length,
      total: records.length
    };
  };

  const memberIds = [...new Set(mergedData.map(a => a.customerId))];
  const memberList = memberIds.map(id => customers.find(c => c.id === id)).filter(Boolean);

  const todayMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const todayDate = new Date().getDate();

  // Detail view records for selected day
  const selectedDateStr = selectedDay ? `${currentMonth}-${String(selectedDay).padStart(2, '0')}` : '';
  const dayRecords = selectedDay ? getDayRecords(selectedDay) : [];

  const statusBadge = (status) => {
    if (status === 'Present') return { bg: 'bg-[#DDF5E5]', text: 'text-[#1F7A45]', icon: Check, label: 'Present' };
    if (status === 'Absent') return { bg: 'bg-[#FDE2E2]', text: 'text-[#B42318]', icon: X, label: 'Absent' };
    if (status === 'Shake') return { bg: 'bg-[#FEF9C3]', text: 'text-[#D97706]', icon: Droplets, label: 'Shake' };
    return { bg: 'bg-offwhite', text: 'text-muted', icon: Clock, label: status || 'Pending' };
  };

  const remarkBadge = (remark) => {
    if (remark === 'S') return { bg: 'bg-[#D97706]', text: 'text-white', label: 'S · Shake' };
    if (remark === 'SB') return { bg: 'bg-[#7C3AED]', text: 'text-white', label: 'SB · Shake+Beta' };
    if (remark === 'SF') return { bg: 'bg-[#0891B2]', text: 'text-white', label: 'SF · Shake+Fiber' };
    return null;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50  z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl sm:rounded-xl shadow-lg w-full max-w-4xl max-h-[92vh] overflow-hidden border border-gray-200 flex flex-col">

        {/* ── Header ────────────────────────────────────── */}
        <div className="px-5 sm:px-8 py-5 border-b border-beige flex items-center justify-between bg-offwhite/50 shrink-0">
          <div className="flex items-center gap-3">
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="p-2 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-beige mr-1">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="p-2.5 bg-gray-900/50 rounded-xl">
              <CalendarIcon size={20} className="text-forest" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-forest tracking-tight">
                {selectedDay ? getISTDisplayDate(selectedDateStr) : 'Monthly Attendance'}
              </h2>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                {selectedDay ? `${dayRecords.length} record${dayRecords.length !== 1 ? 's' : ''}` : 'Day-wise attendance history'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-beige">
            <X size={18} />
          </button>
        </div>

        {/* ── Controls ──────────────────────────────────── */}
        {!selectedDay && (
          <div className="px-5 sm:px-8 py-3 border-b border-beige flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 bg-white border border-beige rounded-lg hover:bg-offwhite transition-all">
                <ChevronLeft size={16} className="text-forest" />
              </button>
              <span className="text-xs font-semibold text-forest uppercase tracking-widest min-w-[130px] text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-2 bg-white border border-beige rounded-lg hover:bg-offwhite transition-all">
                <ChevronRight size={16} className="text-forest" />
              </button>
            </div>
            <select
              value={selectedMember || ''}
              onChange={(e) => setSelectedMember(e.target.value || null)}
              className="px-3 py-2 bg-white border border-beige rounded-lg text-forest font-bold text-xs outline-none appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Members</option>
              {memberList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Content ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-sage/20 border-t-sage rounded-full animate-spin" />
            </div>
          ) : selectedDay ? (
            /* ── DAY DETAIL VIEW ──────────────────────────── */
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-beige">
                <div>
                  <h3 className="text-sm font-bold text-forest">Detail Records</h3>
                  <p className="text-[10px] text-muted font-bold uppercase mt-0.5">Records recorded on this day</p>
                </div>
                <button
                  onClick={() => {
                    onDateSelect && onDateSelect(selectedDateStr);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <CalendarIcon size={12} /> Load on Attendance Sheet
                </button>
              </div>
              {dayRecords.length > 0 ? (
                <div className="space-y-2">
                  {dayRecords.map((record, idx) => {
                    const customer = customers.find(c => c.id === record.customerId);
                    const sb = statusBadge(record.status);
                    const rb = remarkBadge(record.remark);
                    const StatusIcon = sb.icon;
                    const displayTime = record.check_in && record.check_in !== '-' ? record.check_in :
                                        record.checkIn && record.checkIn !== '-' ? record.checkIn :
                                        (record.updated_at ? new Date(record.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '');
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3.5 bg-offwhite/40 rounded-xl border border-beige/50 hover:border-beige transition-all">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-offwhite border border-beige flex items-center justify-center text-forest font-semibold text-xs shrink-0">
                          {customer?.name?.charAt(0) || '?'}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-forest text-sm truncate">{customer?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">{customer?.contact || '—'}</span>
                            {record.markedBy && (
                              <span className="text-[8px] font-bold text-sage uppercase tracking-widest">by {record.markedBy}</span>
                            )}
                            {displayTime && (
                              <span className="text-[8px] font-bold text-muted/60 uppercase tracking-widest">{displayTime}</span>
                            )}
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {rb && (
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-semibold uppercase tracking-widest ${rb.bg} ${rb.text}`}>
                              {rb.label}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest ${sb.bg} ${sb.text}`}>
                            <StatusIcon size={11} />
                            {sb.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Clock size={28} className="text-beige mx-auto mb-3" />
                  <p className="text-forest font-bold">No records for this day</p>
                  <p className="text-muted text-sm mt-1">Attendance has not been marked yet.</p>
                </div>
              )}

              {/* Day summary strip */}
              {dayRecords.length > 0 && (
                <div className="mt-5 pt-4 border-t border-beige flex flex-wrap items-center justify-center gap-4">
                  {[
                    { label: 'Present', count: dayRecords.filter(r => r.status === 'Present').length, color: 'text-[#1F7A45]', icon: Check },
                    { label: 'Absent', count: dayRecords.filter(r => r.status === 'Absent').length, color: 'text-[#B42318]', icon: UserMinus },
                    { label: 'Shake', count: dayRecords.filter(r => r.status === 'Shake').length, color: 'text-[#D97706]', icon: Droplets },
                    { label: 'SB', count: dayRecords.filter(r => r.remark === 'SB').length, color: 'text-[#7C3AED]', icon: Heart },
                    { label: 'SF', count: dayRecords.filter(r => r.remark === 'SF').length, color: 'text-[#0891B2]', icon: Sparkles },
                  ].map(({ label, count, color, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={13} className={color} />
                      <span className={`text-xs font-bold ${color}`}>{count}</span>
                      <span className="text-[8px] font-semibold text-muted uppercase tracking-widest">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── MONTHLY GRID VIEW ───────────────────────── */
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-7 gap-1.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[8px] font-semibold text-muted uppercase tracking-widest py-1.5">{d}</div>
                ))}
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const summary = getDaySummary(day);
                  const isToday = day === todayDate && currentMonth === todayMonth;
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`rounded-xl p-1.5 min-h-[60px] sm:min-h-[72px] flex flex-col items-center justify-center border transition-all cursor-pointer hover:shadow-md hover:scale-[1.04] ${
                        isToday ? 'border-forest bg-gray-900/50' :
                        summary.total > 0 ? 'border-beige bg-offwhite/50 hover:border-forest/50' :
                        'border-transparent bg-offwhite/20 hover:border-beige'
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-semibold ${isToday ? 'text-forest' : 'text-muted'}`}>{day}</span>
                      {summary.total > 0 && (
                        <div className="flex flex-col items-center gap-0.5 mt-0.5">
                          <div className="flex items-center gap-1">
                            {summary.present > 0 && (
                              <span className="flex items-center text-[8px] font-semibold text-[#1F7A45]">
                                <Check size={9} className="mr-0.5" />{summary.present}
                              </span>
                            )}
                            {summary.absent > 0 && (
                              <span className="flex items-center text-[8px] font-semibold text-[#B42318]">
                                <UserMinus size={9} className="mr-0.5" />{summary.absent}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {summary.shake > 0 && (
                              <span className="text-[7px] font-semibold text-[#D97706]">{summary.shake}S</span>
                            )}
                            {summary.sb > 0 && (
                              <span className="flex items-center text-[7px] font-semibold text-[#7C3AED]">
                                <Heart size={7} className="mr-0.5" />{summary.sb}
                              </span>
                            )}
                            {summary.sf > 0 && (
                              <span className="flex items-center text-[7px] font-semibold text-[#0891B2]">
                                <Sparkles size={7} className="mr-0.5" />{summary.sf}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {summary.total === 0 && <Clock size={10} className="text-beige mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-beige">
                {[
                  { icon: Check, color: 'text-[#1F7A45]', label: 'Present' },
                  { icon: UserMinus, color: 'text-[#B42318]', label: 'Absent' },
                  { icon: Droplets, color: 'text-[#D97706]', label: 'Shake' },
                  { icon: Heart, color: 'text-[#7C3AED]', label: 'SB' },
                  { icon: Sparkles, color: 'text-[#0891B2]', label: 'SF' },
                  { icon: Clock, color: 'text-beige', label: 'No Record' },
                ].map(({ icon: Icon, color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={12} className={color} />
                    <span className="text-[9px] font-semibold text-muted uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
