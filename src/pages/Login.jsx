import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Leaf, Eye, EyeOff, Lock, Mail, AlertTriangle, CheckCircle, ArrowLeft, User, Phone, Calendar, MapPin, Tag } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
  const { login, signup, resetPassword, updatePassword, isAuthenticated, authLoading } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine current mode: 'login' | 'forgot' | 'recovery' | 'signup'
  const [mode, setMode] = useState('login');
  
  // Input fields (Sign In & password recovery)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Signup fields
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupWhatsapp, setSignupWhatsapp] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [signupDob, setSignupDob] = useState('');
  const [signupGender, setSignupGender] = useState('Male');
  const [signupProfession, setSignupProfession] = useState('Student');
  const [signupPurpose, setSignupPurpose] = useState('Better Health');
  const [signupMemberType, setSignupMemberType] = useState('Member');
  const [signupReferredBy, setSignupReferredBy] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check URL params for recovery mode trigger
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setMode('recovery');
    }
  }, [searchParams]);

  // Sync whatsapp field when sameAsMobile is checked
  useEffect(() => {
    if (sameAsMobile) {
      setSignupWhatsapp(signupMobile);
    }
  }, [sameAsMobile, signupMobile]);

  // Validators
  const validateEmail = (val) => {
    if (!val) {
      setEmailError('Email is required');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (val) => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Sign In submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);
    
    if (!isEmailValid || !isPassValid) return;

    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    
    if (error) {
      setErrorMsg(error.message || 'Invalid email or password');
      toast.error(error.message || 'Login failed');
    } else {
      toast.success('Successfully logged in!');
      navigate('/dashboard', { replace: true });
    }
  };

  // Sign Up submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword || !signupMobile || !signupDob || !signupReferredBy || !signupAddress) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (signupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const profileData = {
      first_name: signupFirstName,
      last_name: signupLastName,
      mobile_number: signupMobile,
      whatsapp_number: sameAsMobile ? signupMobile : signupWhatsapp,
      dob: signupDob,
      gender: signupGender,
      profession: signupProfession,
      purpose_of_joining: signupPurpose,
      membership_type: signupMemberType,
      referred_by: signupReferredBy,
      address: signupAddress
    };

    const { error } = await signup(signupEmail, signupPassword, profileData);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Signup failed. Please try again.');
      toast.error(error.message || 'Signup failed');
    } else {
      toast.success('Account successfully created!');
      navigate('/dashboard', { replace: true });
    }
  };

  // Forgot Password request submit
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateEmail(email)) return;

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to send reset link');
      toast.error(error.message || 'Failed to send reset link');
    } else {
      setSuccessMsg('Reset password link sent successfully! Please check your inbox.');
      toast.success('Reset email sent');
    }
  };

  // Recovery Password update submit
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to update password');
      toast.error(error.message || 'Password update failed');
    } else {
      setSuccessMsg('Password successfully updated! Redirecting to login...');
      toast.success('Password updated successfully');
      setTimeout(() => {
        setMode('login');
        navigate('/login', { replace: true });
      }, 2500);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-forest"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite p-4 sm:p-6 md:p-8">
      <div className={`w-full ${mode === 'signup' ? 'max-w-2xl' : 'max-w-md'} bg-white border border-beige/60 rounded-3xl shadow-xl overflow-hidden flex flex-col p-6 sm:p-8 space-y-6 transition-all duration-300 animate-in fade-in zoom-in-95`}>
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-forest rounded-2xl flex items-center justify-center shadow-md">
            <Leaf className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase mt-2">Super Way Wellness</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            {mode === 'login' && 'Wellness Coach Panel Login'}
            {mode === 'signup' && 'Create Your Wellness Profile'}
            {mode === 'forgot' && 'Reset Coach Password'}
            {mode === 'recovery' && 'Set New Password'}
          </p>
        </div>

        {/* Global Messages */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-700 animate-in slide-in-from-top-2 duration-150">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-xs font-semibold text-green-800 animate-in slide-in-from-top-2 duration-150">
            <CheckCircle size={15} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                    onBlur={() => validateEmail(email)}
                    placeholder="coach@superway.com"
                    autoFocus
                    required
                    disabled={loading}
                    className={`w-full pl-10 pr-4 py-3 bg-offwhite border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-forest/10 ${emailError ? 'border-red-400 ring-2 ring-red-100' : 'border-beige/50 focus:border-forest'}`}
                  />
                </div>
                {emailError && <p className="text-[10px] text-red-500 font-bold">{emailError}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value); }}
                    onBlur={() => validatePassword(password)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-3 bg-offwhite border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-forest/10 ${passwordError ? 'border-red-400 ring-2 ring-red-100' : 'border-beige/50 focus:border-forest'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && <p className="text-[10px] text-red-500 font-bold">{passwordError}</p>}
              </div>

              {/* Remember Me & Forgot Password link */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-650">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-beige text-forest focus:ring-forest"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  disabled={loading}
                  className="text-forest hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all hover:bg-forest/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 pt-2 border-t border-beige/40">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-forest hover:underline font-extrabold"
              >
                Sign Up
              </button>
            </div>
          </>
        )}

        {/* SIGN UP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Personal details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-forest tracking-widest border-b border-beige/40 pb-1">Personal Details</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">First Name *</label>
                    <input
                      type="text"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      placeholder="Priyanshu"
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Last Name *</label>
                    <input
                      type="text"
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      placeholder="Sahu"
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="priyanshu@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Choose Password *</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Mobile Number *</label>
                  <input
                    type="tel"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">WhatsApp Number *</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-gray-500">
                      <input
                        type="checkbox"
                        checked={sameAsMobile}
                        onChange={(e) => setSameAsMobile(e.target.checked)}
                        className="rounded border-beige text-forest focus:ring-forest w-3.5 h-3.5"
                      />
                      <span>Same as Mobile</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    value={sameAsMobile ? signupMobile : signupWhatsapp}
                    onChange={(e) => setSignupWhatsapp(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    required
                    disabled={sameAsMobile}
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Date of Birth *</label>
                    <input
                      type="date"
                      value={signupDob}
                      onChange={(e) => setSignupDob(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Gender *</label>
                    <select
                      value={signupGender}
                      onChange={(e) => setSignupGender(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none text-gray-700"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Profession & Purpose */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-forest tracking-widest border-b border-beige/40 pb-1">Profession & Purpose</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Profession *</label>
                  <select
                    value={signupProfession}
                    onChange={(e) => setSignupProfession(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none text-gray-700"
                  >
                    <option value="Student">Student</option>
                    <option value="Housewife">Housewife</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Business Owner">Business Owner</option>
                    <option value="Health Coach">Health Coach</option>
                    <option value="Gym Owner">Gym Owner</option>
                    <option value="Retired">Retired</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Purpose of Joining *</label>
                  <select
                    value={signupPurpose}
                    onChange={(e) => setSignupPurpose(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none text-gray-700"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Weight Gain">Weight Gain</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Better Health">Better Health</option>
                    <option value="Business Opportunity">Business Opportunity</option>
                    <option value="Wellness Coaching">Wellness Coaching</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Lifestyle Improvement">Lifestyle Improvement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Membership Type *</label>
                    <select
                      value={signupMemberType}
                      onChange={(e) => setSignupMemberType(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none text-gray-700"
                    >
                      <option value="Member">Member</option>
                      <option value="Coach">Coach</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Referred By *</label>
                    <input
                      type="text"
                      value={signupReferredBy}
                      onChange={(e) => setSignupReferredBy(e.target.value)}
                      placeholder="Coach / Recommendation Name"
                      required
                      className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Address *</label>
                  <textarea
                    rows={4}
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    placeholder="Enter full physical address details..."
                    required
                    className="w-full px-3.5 py-2.5 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-xs font-semibold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Signup Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all hover:bg-forest/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account & Sign Up'
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Enter your registered email below, and we'll send you a link to reset your wellness coach account password.
            </p>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                  onBlur={() => validateEmail(email)}
                  placeholder="coach@superway.com"
                  autoFocus
                  required
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 bg-offwhite border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-forest/10 ${emailError ? 'border-red-400 ring-2 ring-red-100' : 'border-beige/50 focus:border-forest'}`}
                />
              </div>
              {emailError && <p className="text-[10px] text-red-500 font-bold">{emailError}</p>}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all hover:bg-forest/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                disabled={loading}
                className="w-full bg-white text-gray-600 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border border-beige/60 hover:bg-offwhite transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} /> Back to Login
              </button>
            </div>
          </form>
        )}

        {/* RECOVERY/SET NEW PASSWORD MODE */}
        {mode === 'recovery' && (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Create a new secure password for your wellness account. Passwords must be at least 8 characters long.
            </p>
            {/* New Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-offwhite border border-beige/50 focus:border-forest rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Save Password Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all hover:bg-forest/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* Back to Login for signup, recovery, forgot */}
        {mode !== 'login' && mode !== 'forgot' && mode !== 'recovery' && (
          <div className="text-center text-xs text-gray-500 pt-2 border-t border-beige/40">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-forest hover:underline font-extrabold"
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
