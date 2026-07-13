import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Phone, Building } from 'lucide-react';

export default function CalendarSelectModal({ onClose, otherClubMembers = [] }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDayIndex = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${dayStr}`);
  };

  const isCurrentSelected = (day) => {
    if (!day) return false;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}` === selectedDate;
  };

  const hasVisits = (day) => {
    if (!day) return false;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;
    return otherClubMembers.some(m => m.visit_date === dateKey);
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Visitors on the active selected date
  const visitorsForDate = otherClubMembers.filter(m => m.visit_date === selectedDate);

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
        {/* Calendar Picker Panel (Left) */}
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 flex-1 bg-gray-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <CalendarIcon size={16} className="text-[#006c49]" />
                Select Date
              </h4>
              <div className="flex items-center gap-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded text-gray-700 text-xs font-bold transition-colors">
                  &lt;
                </button>
                <span className="text-xs font-semibold text-gray-900 min-w-[100px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded text-gray-700 text-xs font-bold transition-colors">
                  &gt;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span key={idx} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {day ? (
                    <button
                      onClick={() => selectDate(day)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all relative ${
                        isCurrentSelected(day)
                          ? 'bg-[#006c49] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                      {hasVisits(day) && !isCurrentSelected(day) && (
                        <span className="absolute bottom-1 w-1 h-1 bg-[#10b981] rounded-full" />
                      )}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">Selected Date</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Visitors List Panel (Right) */}
        <div className="flex-1 flex flex-col h-full bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">
              Check-ins ({visitorsForDate.length})
            </h3>
            <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {visitorsForDate.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <CalendarIcon size={32} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No visitors on this date</p>
                <p className="text-xs text-gray-400 mt-1">Select another date with a dot marker to view checked-in members.</p>
              </div>
            ) : (
              visitorsForDate.map((v) => (
                <div key={v.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#006c49]/10 text-[#006c49] border border-[#006c49]/20">
                      {v.reason}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {v.mobile}</p>
                    <p className="flex items-center gap-1"><Building size={12} className="text-gray-400" /> {v.club_name}</p>
                  </div>
                  {v.remarks && v.remarks !== '-' && (
                    <p className="text-[11px] text-gray-500 border-t border-gray-200/60 pt-1.5 italic">
                      "{v.remarks}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="hidden md:flex justify-end p-4 border-t border-gray-200">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
