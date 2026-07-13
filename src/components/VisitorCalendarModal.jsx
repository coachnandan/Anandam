import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, UserPlus, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function VisitorCalendarModal({ isOpen, onClose, onDateSelect }) {
  const { visitors = [] } = useAppContext();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  if (!isOpen) return null;

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

  const getDayVisitorCount = (day) => {
    if (!day) return 0;
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    return visitors.filter(v => v.visit_date === dateStr).length;
  };

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-gray-900/50  z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] sm:rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 sm:px-10 py-6 border-b border-beige flex items-center justify-between bg-offwhite/50 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gold/10 rounded-xl">
              <CalendarIcon size={22} className="text-gold" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-forest tracking-tight">Visitor Calendar</h2>
              <p className="text-xs font-medium text-muted mt-0.5">Day-wise visitor history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-beige">
            <X size={22} />
          </button>
        </div>

        {/* Month navigation */}
        <div className="px-6 sm:px-10 py-4 border-b border-beige flex items-center justify-between shrink-0">
          <button onClick={prevMonth} className="p-2 bg-white border border-beige rounded-xl hover:bg-offwhite transition-all">
            <ChevronLeft size={18} className="text-forest" />
          </button>
          <span className="text-sm font-semibold text-forest uppercase tracking-widest">{monthName}</span>
          <button onClick={nextMonth} className="p-2 bg-white border border-beige rounded-xl hover:bg-offwhite transition-all">
            <ChevronRight size={18} className="text-forest" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-muted uppercase tracking-widest py-2">{d}</div>
            ))}
            {calendarCells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const count = getDayVisitorCount(day);
              const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={day}
                  onClick={() => { onDateSelect && onDateSelect(dateStr); onClose(); }}
                  className={`rounded-xl p-2 min-h-[70px] flex flex-col items-center justify-center border transition-all cursor-pointer hover:shadow-md hover:scale-105 ${
                    isToday ? 'border-forest bg-gray-900/50' : count > 0 ? 'border-gold/40 bg-gold/5 hover:border-gold' : 'border-transparent bg-offwhite/20 hover:border-beige'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-forest' : 'text-muted'}`}>{day}</span>
                  {count > 0 ? (
                    <div className="flex items-center mt-1 bg-gold/20 px-2 py-0.5 rounded-full">
                      <UserPlus size={9} className="text-gold mr-1" />
                      <span className="text-[9px] font-semibold text-gold">{count}</span>
                    </div>
                  ) : (
                    <Clock size={12} className="text-beige mt-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-beige">
            <div className="flex items-center space-x-2">
              <UserPlus size={14} className="text-gold" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Visitors</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-beige" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">No Visitors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
