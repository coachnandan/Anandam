import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Phone, Check, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user } = useAppContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Coach Aditi');

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast.success('Your professional profile was successfully updated!');
    }, 1500);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-forest tracking-tight">Lead Practitioner Profile</h1>
        <p className="text-muted mt-2 font-medium">Coordinate your personal details and system authorization credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Visual Profile Card */}
        <div className="lg:col-span-1 luxury-card bg-white p-8 sm:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-32 bg-forest"></div>
          
          <div className="relative z-10 w-full pt-16 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg mb-6 relative overflow-hidden">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Aditi'}&background=1F4D3A&color=F7F6F2&bold=true&size=256`} 
                alt="Avatar" 
                className="w-full h-full rounded-[1.5rem] object-cover" 
              />
            </div>

            <h2 className="text-2xl font-bold text-forest tracking-tight leading-tight">{user?.name || 'Coach Aditi'}</h2>
            <div className="flex items-center mt-3 space-x-2">
              <span className="px-3 py-1 bg-sage/10 text-sage text-[9px] font-semibold uppercase tracking-widest rounded-full border border-sage/10">
                {user?.role || 'Lead Coach'}
              </span>
            </div>
            
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-6">
              Unique ID: {user?.id || 'ELV-ADMIN-KEY'}
            </p>
          </div>

          <div className="w-full border-t border-beige/40 mt-10 pt-8 grid grid-cols-2 gap-4">
            <div className="bg-offwhite/50 border border-beige/30 p-4 rounded-xl text-center">
              <p className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-bold text-forest uppercase">ACTIVE</p>
            </div>
            <div className="bg-offwhite/50 border border-beige/30 p-4 rounded-xl text-center">
              <p className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Authority</p>
              <p className="text-sm font-bold text-forest uppercase">FULL CRUD</p>
            </div>
          </div>
        </div>

        {/* Right Column: Update Details */}
        <div className="lg:col-span-2 luxury-card p-8 sm:p-10 bg-white">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-forest tracking-tight">Account Parameters</h3>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Update credential metadata</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Display Legal Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-sage" />
                  </div>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-offwhite border border-beige rounded-xl text-forest font-bold focus:ring-4 focus:ring-sage/10 focus:border-forest transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Institutional Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-sage" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || 'coach@elevate.in'}
                    readOnly
                    className="w-full pl-14 pr-6 py-5 bg-offwhite border border-beige rounded-xl text-forest/40 font-bold outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Role Designation</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-sage" />
                  </div>
                  <input
                    type="text"
                    value={user?.role || 'admin'}
                    readOnly
                    className="w-full pl-14 pr-6 py-5 bg-offwhite border border-beige rounded-xl text-forest/40 font-bold uppercase tracking-wider outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Verification Status</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-emerald" />
                  </div>
                  <input
                    type="text"
                    value="Verified Sanctuary Coach"
                    readOnly
                    className="w-full pl-14 pr-6 py-5 bg-offwhite border border-beige rounded-xl text-emerald/60 font-bold outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-beige/40 pt-8 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center justify-center px-10 py-5 bg-forest text-white rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20 active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Commit Profile Parameters
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
