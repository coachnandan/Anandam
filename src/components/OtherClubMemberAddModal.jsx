import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import { getISTDateString } from '../utils/dateUtils';

export default function OtherClubMemberAddModal({ onClose, onSave }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      sameAsMobile: false,
      visit_date: getISTDateString()
    }
  });
  
  const sameAsMobile = watch('sameAsMobile');
  const mobile = watch('mobile');

  useEffect(() => {
    if (sameAsMobile && mobile) {
      setValue('whatsapp', mobile);
    }
  }, [sameAsMobile, mobile, setValue]);

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      mobile: data.mobile,
      whatsapp: data.sameAsMobile ? data.mobile : data.whatsapp,
      club_name: data.club_name,
      referred_by: data.referred_by || '-',
      reason: data.reason,
      remarks: data.remarks || '-',
      visit_date: data.visit_date
    };
    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="text-[#006c49]" size={20} />
            Add Other Club Member
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name *</label>
              <input 
                placeholder="e.g. John Doe"
                {...register("name", { required: "Name is required" })} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
              {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number *</label>
              <input 
                placeholder="e.g. +91 98765 43210"
                {...register("mobile", { required: "Mobile number is required" })} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
              {errors.mobile && <span className="text-red-500 text-xs">{errors.mobile.message}</span>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Number</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" {...register("sameAsMobile")} className="rounded text-[#006c49] focus:ring-[#006c49]" />
                  <span className="text-xs text-gray-600 font-medium select-none">Same as Mobile Number</span>
                </label>
              </div>
              <input 
                type="text" 
                placeholder="e.g. +91 98765 43210"
                {...register("whatsapp")} 
                disabled={sameAsMobile}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Club Name *</label>
              <input 
                placeholder="e.g. Healthify Club"
                {...register("club_name", { required: "Club Name is required" })} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
              {errors.club_name && <span className="text-red-500 text-xs">{errors.club_name.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Referred By</label>
              <input 
                placeholder="e.g. Coach Aditi"
                {...register("referred_by")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason *</label>
              <select 
                {...register("reason", { required: "Reason is required" })} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] bg-white"
              >
                <option value="">Select Reason</option>
                <option value="Workout">Workout</option>
                <option value="Consultation">Consultation</option>
                <option value="Guest">Guest</option>
                <option value="Tour">Tour</option>
                <option value="Training">Training</option>
              </select>
              {errors.reason && <span className="text-red-500 text-xs">{errors.reason.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Date *</label>
              <input 
                type="date"
                {...register("visit_date", { required: "Visit date is required" })} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
              {errors.visit_date && <span className="text-red-500 text-xs">{errors.visit_date.message}</span>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks / Query Details</label>
              <textarea 
                rows="2"
                {...register("remarks")} 
                placeholder="e.g. Body Stats checked, wants weekly plans"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-[#006c49] hover:bg-[#005236] text-white rounded-lg font-medium transition-colors text-sm"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
