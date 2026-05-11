import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import CryptoJS from 'crypto-js'; // static import — dynamic import was crashing on some bundlers
import { auth } from '../firebase';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

// ── Icons ─────────────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeClosed = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L4.512 4.512M19.488 19.488L14.121 14.121M21.542 12a9.967 9.967 0 01-1.21 2.304M17.657 17.657a9.956 9.956 0 01-3.536 1.168" />
  </svg>
);

// ── Password requirement indicator ────────────────────────────────────────────
const Req = ({ label, met }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
    <span className={`text-[10px] font-bold transition-colors ${met ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const PROVINCES = [
  'Bulawayo','Harare','Manicaland','Mashonaland Central',
  'Mashonaland East','Mashonaland West','Masvingo',
  'Matabeleland North','Matabeleland South','Midlands',
];

// ─────────────────────────────────────────────────────────────────────────────
export default function NewUsers() {
  // ── Safe reCAPTCHA hook — won't crash if provider is missing ────────────
  let executeRecaptcha = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const recaptcha = useGoogleReCaptcha();
    executeRecaptcha = recaptcha?.executeRecaptcha ?? null;
  } catch {
    // GoogleReCaptchaProvider not mounted — silently skip
  }

  const navigate = useNavigate();
  const location = useLocation();

  // Context from CheckRate (guest application)
  const fromCheckRate   = !!location.state?.applicationId;
  const redirectMessage = location.state?.message      ?? null;
  const prefillEmail    = location.state?.prefillEmail ?? '';

  // ── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    province:        '',
    email:           prefillEmail,
    password:        '',
    confirmPassword: '',
    agreed:          false,
    isHuman:         false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone]             = useState(false);
  const [error, setError]               = useState('');

  // ── Derived validation ─────────────────────────────────────────────────
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const matchOk = form.password.length > 0 && form.password === form.confirmPassword;
  const pw = {
    length:  form.password.length >= 8,
    number:  /[0-9]/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  };
  const pwOk    = pw.length && pw.number && pw.special;
  const canSubmit = pwOk && matchOk && emailOk
                    && form.firstName.trim()
                    && form.lastName.trim()
                    && form.province
                    && form.agreed
                    && form.isHuman;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError('');
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Pwned-password check ───────────────────────────────────────────────
  const isPwned = async (password) => {
    try {
      const hash   = CryptoJS.SHA1(password).toString().toUpperCase();
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const res    = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text   = await res.text();
      return text.includes(suffix);
    } catch {
      return false; // don't block if API unreachable
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please complete all fields, meet password requirements, and confirm you are human.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1 — Breached password check
      const pwned = await isPwned(form.password);
      if (pwned) {
        setIsSubmitting(false);
        setError('This password appeared in a known data breach. Please choose a different password.');
        return;
      }

      // 2 — reCAPTCHA (only if provider is available — never crash without it)
      if (executeRecaptcha) {
        try { await executeRecaptcha('signup'); } catch { /* ignore */ }
      }

      // 3 — Create Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);

      // 4 — Send verification email
      await sendEmailVerification(user);

      // 5 — Save to Supabase (upsert so retries don't 409)
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
          [{
            id:                     user.uid,
            first_name:             form.firstName.trim(),
            last_name:              form.lastName.trim(),
            email:                  form.email.trim().toLowerCase(),
            province:               form.province,
            loan_application_count: 0,
          }],
          { onConflict: 'id' }
        );

      if (upsertErr) console.error('Supabase upsert failed:', upsertErr.message);

      // 6 — Welcome notification (skip if already sent)
      const { data: existingWelcome } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.uid)
        .ilike('message', '%Welcome%')
        .maybeSingle();

      if (!existingWelcome) {
        await supabase.from('notifications').insert([{
          user_id: user.uid,
          message: `Welcome to Nexus, ${form.firstName.trim()}! Your account is ready.`,
          type:    'general',
          is_read: false,
        }]);
      }

      // 7 — Link guest loan application if came from CheckRate
      if (fromCheckRate && location.state?.applicationId) {
        await supabase
          .from('loan_applications')
          .update({ user_id: user.uid })
          .eq('id', location.state.applicationId)
          .is('user_id', null);
      }

      setIsSubmitting(false);
      setIsDone(true);

    } catch (err) {
      setIsSubmitting(false);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Try logging in instead.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger one.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address. Please check and try again.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your connection and try again.');
          break;
        default:
          setError(err.message || 'Signup failed. Please try again.');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#0B1E3D] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-cyan-400 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">
            Creating your secure account...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION SCREEN (shown after successful signup)
  // ─────────────────────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#0B1E3D] mb-3">Account Created!</h2>
          <h3 className="text-lg font-bold text-gray-600 mb-3">Now verify your email</h3>
          <p className="text-gray-500 text-sm mb-1">
            We sent a verification link to
          </p>
          <p className="font-bold text-[#0B1E3D] text-sm mb-4">{form.email}</p>
          <p className="text-gray-400 text-xs mb-2">
            Click the link in the email to activate your account.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Can't find it? Check your <strong>spam or junk</strong> folder.
          </p>

          {fromCheckRate && (
            <div className="mb-6 p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-700 font-bold">
              ✅ Your loan application has been linked. Log in after verifying to track it.
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-green-600 uppercase">Account Created</span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[9px] font-black text-white">2</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Verify Email</span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-[9px] font-black text-white">3</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Login</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-[#0B1E3D] text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors mb-3"
          >
            Go to Login
          </button>
          <button
            onClick={() => setIsDone(false)}
            className="text-cyan-600 font-bold hover:underline text-sm"
          >
            Didn't receive it? Go back
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN SIGNUP FORM
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FBFB] flex flex-col font-sans">
      <div className="flex-grow flex flex-col items-center py-12 px-4">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/">
            <img src={logo} alt="Nexus Logo" className="w-12 h-12 object-contain mx-auto" />
          </Link>
          <div className="mt-2 text-[#0B1E3D]">
            <span className="font-bold text-xl uppercase tracking-tight">Nexus</span>
            <span className="text-cyan-500 text-[10px] block font-bold tracking-[0.3em] uppercase -mt-1">Lending</span>
          </div>
        </div>

        <div className="w-full max-w-[460px] bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-12">

          {/* Banner from CheckRate */}
          {redirectMessage && (
            <div className="mb-6 p-4 bg-cyan-50 border-l-4 border-cyan-500 rounded-xl">
              <p className="text-xs font-black text-cyan-800 mb-1">
                {fromCheckRate ? '🎉 Application submitted!' : 'One more step'}
              </p>
              <p className="text-xs text-cyan-700">{redirectMessage}</p>
            </div>
          )}

          <h1 className="text-2xl font-bold text-[#0B1E3D] mb-1">
            {fromCheckRate ? 'Create account to track your loan' : 'Create Account'}
          </h1>
          <p className="text-xs text-gray-400 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-600 font-bold hover:underline">Sign in</Link>
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${form.firstName ? 'border-green-400' : 'border-gray-200'}`}>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name</label>
                <input name="firstName" required value={form.firstName} onChange={handleChange}
                  className="w-full bg-transparent outline-none text-sm font-bold text-[#0B1E3D]" placeholder="John" />
              </div>
              <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${form.lastName ? 'border-green-400' : 'border-gray-200'}`}>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name</label>
                <input name="lastName" required value={form.lastName} onChange={handleChange}
                  className="w-full bg-transparent outline-none text-sm font-bold text-[#0B1E3D]" placeholder="Doe" />
              </div>
            </div>

            {/* Province */}
            <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${form.province ? 'border-green-400' : 'border-gray-200'}`}>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Province (Zimbabwe)</label>
              <select name="province" required value={form.province} onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm font-bold text-[#0B1E3D]">
                <option value="">Select your province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Email */}
            <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${emailOk ? 'border-green-400' : 'border-gray-200'}`}>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm font-bold text-[#0B1E3D]" placeholder="you@email.com" />
            </div>

            {/* Password */}
            <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${pwOk ? 'border-green-400' : 'border-gray-200'}`}>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
              <div className="flex items-center gap-2">
                <input type={showPassword ? 'text' : 'password'} name="password" required
                  value={form.password} onChange={handleChange}
                  className="flex-1 bg-transparent outline-none text-sm font-bold text-[#0B1E3D]" placeholder="Strong password" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="text-gray-400 hover:text-cyan-600 transition-colors flex-shrink-0">
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className={`border-2 rounded-xl p-3 bg-gray-50 transition-colors ${matchOk ? 'border-green-400' : 'border-gray-200'}`}>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" required
                value={form.confirmPassword} onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm font-bold text-[#0B1E3D]" placeholder="Repeat password" />
            </div>

            {/* Password requirements */}
            <div className="grid grid-cols-3 gap-2 px-1 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <Req label="8+ chars" met={pw.length} />
              <Req label="Number"   met={pw.number} />
              <Req label="Symbol"   met={pw.special} />
            </div>

            {/* Human check */}
            <div className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${form.isHuman ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
              <input type="checkbox" id="humanCheck" name="isHuman" checked={form.isHuman} onChange={handleChange}
                className="h-5 w-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 cursor-pointer flex-shrink-0" />
              <label htmlFor="humanCheck" className="flex-1 text-xs font-bold text-gray-600 cursor-pointer select-none">
                {form.isHuman ? '✅ Verified as human' : 'I am not a robot'}
              </label>
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/RecaptchaLogo.svg" alt="reCAPTCHA"
                className={`w-5 h-5 flex-shrink-0 transition-opacity ${form.isHuman ? 'opacity-100' : 'opacity-30'}`} />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <input type="checkbox" name="agreed" required checked={form.agreed} onChange={handleChange}
                className="mt-0.5 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed text-gray-500">
                I agree to the{' '}
                <Link to="/terms" className="text-cyan-600 font-bold underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-cyan-600 font-bold underline">Privacy Policy</Link>.
              </p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg mt-2 ${
                canSubmit
                  ? 'bg-[#008199] text-white hover:bg-[#0B1E3D] active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {fromCheckRate ? 'Create Account & Track My Loan' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      <footer className="bg-[#0097B2] pt-8 pb-12">
        <div className="flex flex-wrap items-center justify-center gap-5 text-white text-sm font-bold px-6">
          <Link to="/help"    className="hover:opacity-80 transition-opacity">Help</Link>
          <span className="text-white/30">•</span>
          <Link to="/terms"   className="hover:opacity-80 transition-opacity">Terms of Use</Link>
          <span className="text-white/30">•</span>
          <Link to="/privacy" className="hover:opacity-80 transition-opacity">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
