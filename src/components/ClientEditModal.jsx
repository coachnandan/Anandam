import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User as UserIcon, Phone, MapPin, Briefcase, Activity, Tag, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function ClientEditModal({ customer, onClose }) {
  const { updateCustomer, memberships = [] } = useAppContext();

  const getMembershipStatus = (customerId) => {
    const customerMemberships = memberships.filter(m => m.customerId === customerId);
    if (customerMemberships.length === 0) return 'Afresh';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAndNotExpired = customerMemberships.find(m => {
      const expiry = new Date(m.expiryDate);
      return expiry >= today;
    });

    return activeAndNotExpired ? 'Active' : 'Expired';
  };

  const memStatus = getMembershipStatus(customer.id);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (customer) {
      // Map all fields
      setValue('full_name', customer.full_name || customer.name || '');
      setValue('mobile_number', customer.mobile_number || customer.contact_number || customer.contact || '');
      setValue('whatsapp_number', customer.whatsapp_number || customer.whatsapp || '');
      setValue('email', customer.email || '');
      setValue('dob', customer.dob || '');
      setValue('gender', customer.gender || '');
      setValue('marital_status', customer.marital_status || '');
      setValue('profession', customer.profession || '');
      setValue('address', customer.address || '');
      setValue('joining_date', customer.joining_date || customer.joined || '');
      setValue('purpose', customer.purpose || '');
      setValue('member_type', customer.member_type || 'Member');
      setValue('referred_by', customer.referred_by || '');
    }
  }, [customer, setValue]);

  const onSubmit = async (data) => {
    if (!data.whatsapp_number) data.whatsapp_number = data.mobile_number;
    try {
      await updateCustomer(customer.id, data);
      toast.success('Profile updated successfully.');
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(`Update failed: ${error.message || 'Please check the data.'}`);
    }
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50  z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-xl sm:rounded-xl shadow-lg w-full max-w-2xl border border-gray-200 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
        <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest tracking-tight">Edit Member Profile</h2>
            <p className="text-sm font-medium text-muted mt-1">Update {customer.name}'s details</p>
          </div>
          <button onClick={onClose} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-xl shadow-sm border border-beige">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">
          {/* Personal Information */}
          <div>
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.3em] mb-5">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Full Name *</label>
                <input {...register("full_name", { required: "Full name is required" })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Full name" />
                {errors.full_name && <span className="text-red-400 text-[10px] font-semibold uppercase tracking-widest px-1 mt-1 block">{errors.full_name.message}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Mobile Number *</label>
                <input {...register("mobile_number", { required: "Mobile number is required" })} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="+91 98765 43210" />
                {errors.mobile_number && <span className="text-red-400 text-[10px] font-semibold uppercase tracking-widest px-1 mt-1 block">{errors.mobile_number.message}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">WhatsApp Number</label>
                <input {...register("whatsapp_number")} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Same as mobile if blank" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Email ID</label>
                <input {...register("email")} type="email" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. member@example.com" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Date of Birth</label>
                <input {...register("dob")} type="date" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Gender</label>
                <select {...register("gender")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Marital Status</label>
                <select {...register("marital_status")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Profession</label>
                <input {...register("profession")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Architect" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1 mb-2">Address</label>
                <textarea {...register("address")} rows={2} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20 resize-none" placeholder="Street, City, State" />
              </div>
            </div>
          </div>

          {/* Membership Information */}
          <div className="border-t border-beige pt-6">
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.3em] mb-5">Membership Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Joining Date</label>
                <input {...register("joining_date")} type="date" className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Purpose / Wellness Goal</label>
                <select {...register("purpose")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                  <option value="">Select Purpose</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Meditation">Meditation</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Health & Vitality">Health & Vitality</option>
                  <option value="Stress Management">Stress Management</option>
                  <option value="General Wellness">General Wellness</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Member Type *</label>
                <select {...register("member_type", { required: "Member type is required" })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                  <option value="">Select Member Type</option>
                  <option value="Coach">Coach</option>
                  <option value="Member">Member</option>
                  <option value="Other Club Member">Other Club Member</option>
                </select>
                {errors.member_type && <span className="text-red-400 text-[10px] font-semibold uppercase tracking-widest px-1">{errors.member_type.message}</span>}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Referred By</label>
                <input {...register("referred_by")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Name or Source" />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Current Membership Status</label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest border transition-all ${
                    memStatus === 'Active' ? 'bg-[#DDF5E5] text-[#1F7A45] border-[#DDF5E5]' :
                    memStatus === 'Afresh' ? 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]' :
                    'bg-[#FDE2E2] text-[#B42318] border-[#FDE2E2]'
                  }`}>
                    {memStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-white text-muted border border-beige rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-5 bg-forest text-white rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20 disabled:opacity-70">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
