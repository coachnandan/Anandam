import React from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function NotificationPopup({ onClose }) {
  const { notifications } = useAppContext();

  const getIcon = (type) => {
    switch (type) {
      case 'Renewal Reminder': return <Clock className="text-gold" size={16} />;
      case 'Renewal Confirmation': return <CheckCircle className="text-emerald" size={16} />;
      case 'System Alert': return <AlertTriangle className="text-amber-500" size={16} />;
      default: return <Info className="text-sage" size={16} />;
    }
  };

  return (
    <div className="absolute top-20 right-0 w-80 sm:w-96 bg-white  border border-beige/50 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
      <div className="p-6 border-b border-beige/40 flex items-center justify-between bg-offwhite/50">
        <div className="flex items-center space-x-2">
          <Bell size={18} className="text-forest" />
          <h3 className="text-sm font-semibold text-forest uppercase tracking-widest">Recent Alerts</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-beige/20 rounded-xl transition-colors">
          <X size={16} className="text-muted" />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto no-scrollbar p-2">
        {notifications.length > 0 ? (
          notifications.map((note) => (
            <div key={note.id} className="p-4 rounded-xl hover:bg-offwhite transition-all cursor-pointer group border border-transparent hover:border-beige/30 mb-1">
              <div className="flex items-start space-x-4">
                <div className="mt-1 w-8 h-8 rounded-xl bg-white border border-beige/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {getIcon(note.message_type)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-forest leading-tight mb-1">{note.message_type}</p>
                  <p className="text-[11px] font-medium text-muted leading-relaxed">
                    Notification sent to <span className="font-bold text-sage">{note.clients?.name}</span> via WhatsApp.
                  </p>
                  <p className="text-[9px] font-semibold text-muted/40 uppercase tracking-widest mt-2">
                    {new Date(note.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(note.sent_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-offwhite rounded-xl flex items-center justify-center mb-4 border border-beige/50">
              <Bell size={24} className="text-beige" />
            </div>
            <p className="text-xs font-semibold text-forest uppercase tracking-widest">Your zen is clear</p>
            <p className="text-[10px] text-muted font-medium mt-1">No recent notifications found.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-offwhite/50 border-t border-beige/40">
        <button className="w-full py-3 text-[10px] font-semibold text-forest uppercase tracking-[0.2em] hover:bg-white rounded-xl transition-all border border-transparent hover:border-beige/50">
          View All Notifications
        </button>
      </div>
    </div>
  );
}
