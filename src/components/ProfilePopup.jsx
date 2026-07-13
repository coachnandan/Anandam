import React from 'react';
import { User, Mail, Calendar, Shield, LogOut, Settings, Phone, X, CreditCard, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePopup({ onClose }) {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const isMember = user?.role === 'member';

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="absolute top-20 right-0 w-80 sm:w-96 bg-white  border border-beige/50 rounded-[2.5rem] shadow-lg z-50 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
      {/* Header / Banner */}
      <div className="h-24 bg-forest relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-xl text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="px-8 pb-8 -mt-12 relative z-10">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-xl bg-white p-1 shadow-lg mb-4 group cursor-pointer relative overflow-hidden">
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || 'Aditi'}&background=1F4D3A&color=F7F6F2&bold=true&size=128`} 
            alt="Avatar" 
            className="w-full h-full rounded-xl object-cover group-hover:scale-110 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Settings className="text-white w-6 h-6" />
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-forest tracking-tight leading-tight">{user?.name || 'Coach Aditi'}</h2>
          <div className="flex items-center mt-1.5 space-x-2">
            <span className="px-3 py-1 bg-sage/10 text-sage text-[9px] font-semibold uppercase tracking-widest rounded-full border border-sage/10">{user?.role || 'Lead Coach'}</span>
            <span className="text-[10px] text-muted font-bold tracking-tight">UID: {user?.id?.slice(0, 8) || 'ELV-ADMIN'}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center p-4 bg-offwhite rounded-xl border border-beige/30 group hover:border-sage/30 transition-all">
            <Mail className="w-4 h-4 text-sage mr-3" />
            <div className="overflow-hidden">
              <p className="text-[9px] font-semibold text-muted/50 uppercase tracking-widest leading-none mb-1">Electronic Mail</p>
              <p className="text-xs font-bold text-forest truncate">{user?.email || 'coach@superway.in'}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-offwhite rounded-xl border border-beige/30 group hover:border-sage/30 transition-all">
            <Phone className="w-4 h-4 text-sage mr-3" />
            <div>
              <p className="text-[9px] font-semibold text-muted/50 uppercase tracking-widest leading-none mb-1">Secure Contact</p>
              <p className="text-xs font-bold text-forest">+91 99999 00000</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-offwhite rounded-xl border border-beige/30 group hover:border-sage/30 transition-all">
            <Calendar className="w-4 h-4 text-sage mr-3" />
            <div>
              <p className="text-[9px] font-semibold text-muted/50 uppercase tracking-widest leading-none mb-1">Journey Started</p>
              <p className="text-xs font-bold text-forest">May 12, 2026</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className={`flex items-center justify-center p-4 bg-white border border-beige text-[10px] font-semibold text-forest uppercase tracking-widest rounded-xl hover:bg-offwhite transition-all ${isMember ? 'col-span-2' : ''}`}>
            Edit Profile
          </button>
          {!isMember && (
            <button className="flex items-center justify-center p-4 bg-white border border-beige text-[10px] font-semibold text-forest uppercase tracking-widest rounded-xl hover:bg-offwhite transition-all">
              Settings
            </button>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all group"
        >
          <div className="flex items-center">
            <LogOut className="w-4 h-4 mr-3" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Terminate Session</span>
          </div>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="p-4 bg-offwhite/50 border-t border-beige/40 flex justify-center">
          <p className="text-[9px] font-semibold text-muted/30 uppercase tracking-[0.4em]">Super Way Wellness Console • v1.0.4</p>
      </div>
    </div>
  );
}
