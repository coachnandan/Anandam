import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, CreditCard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function ChangePlanModal({ membership, onClose }) {
  const { updateMembership } = useAppContext();
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  
  useEffect(() => {
    if (membership) {
      setValue('membership_plan', membership.membership_plan || membership.plan || '');
      setValue('start_date', membership.start_date || membership.startDate || '');
      setValue('expiry_date', membership.expiry_date || membership.expiryDate || '');
      setValue('duration_days', membership.duration_days || '');
      setValue('total_amount', membership.total_amount ?? membership.amount ?? 0);
      setValue('advance_amount', membership.advance_amount ?? membership.amount ?? 0);
      setValue('payment_status_detail', membership.payment_status_detail || membership.payment_status || 'Unpaid');
      setValue('status', membership.status || 'Active');
    }
  }, [membership, setValue]);

  const onSubmit = async (data) => {
    try {
      const remaining_amount = (Number(data.total_amount) || 0) - (Number(data.advance_amount) || 0);
      const payload = {
        membership_plan: data.membership_plan,
        start_date: data.start_date,
        expiry_date: data.expiry_date,
        duration_days: Number(data.duration_days),
        total_amount: Number(data.total_amount),
        advance_amount: Number(data.advance_amount),
        remaining_amount,
        payment_status_detail: data.payment_status_detail,
        status: data.status,
      };
      
      await updateMembership(membership.id, payload, 'PlanUpdated', `Updated membership plan details manually`);
      toast.success('Membership plan updated successfully.');
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(`Update failed: ${error.message || 'Please check the data.'}`);
    }
  };

  if (!membership) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50  z-[60] flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-xl sm:rounded-xl shadow-lg w-full max-w-2xl border border-gray-200 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
        <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest tracking-tight">Edit Active Plan</h2>
            <p className="text-sm font-medium text-muted mt-1">Modify plan details</p>
          </div>
          <button onClick={onClose} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-beige">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Plan Name *</label>
              <input {...register("membership_plan", { required: "Plan name is required" })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" />
              {errors.membership_plan && <span className="text-red-400 text-[10px] font-semibold uppercase tracking-widest px-1 mt-1 block">{errors.membership_plan.message}</span>}
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Duration (Days)</label>
              <input type="number" {...register("duration_days")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Start Date *</label>
              <input type="date" {...register("start_date", { required: true })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Expiry Date *</label>
              <input type="date" {...register("expiry_date", { required: true })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Total Amount (₹)</label>
              <input type="number" {...register("total_amount")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Advance Paid (₹)</label>
              <input type="number" {...register("advance_amount")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Status</label>
              <select {...register("payment_status_detail")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none cursor-pointer">
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Status</label>
              <select {...register("status")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none cursor-pointer">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-beige flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} className="h-14 px-8 rounded-xl font-semibold text-[10px] uppercase tracking-widest text-forest bg-offwhite border border-beige hover:bg-beige/50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="h-14 px-10 rounded-xl font-semibold text-[10px] uppercase tracking-widest text-white bg-forest hover:bg-gray-900/50 transition-all flex items-center space-x-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
