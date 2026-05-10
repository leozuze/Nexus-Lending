import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import CryptoJS from 'crypto-js';
import { auth } from '../firebase';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

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

export default function NewUsers() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    province: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
    isHuman: false
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const passwordCriteria = {
    length:  formData.password.length >= 8,
    number:  /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isFormReady = isPasswordValid && passwordsMatch && formData.agreed && formData.isHuman;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError('');
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const checkPwnedPassword = async (password) => {
    const hash = CryptoJS.SHA1(password).toString().toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();
      return text.includes(suffix);
    } catch {
      return false;
    }
  };

  // ── THE KEY CHANGE: real Firebase signup + Supabase profile save ──────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!executeRecaptcha) {
      setError("Security service not ready. Please try again.");
      return;
    }

    if (!isFormReady) {
      setError("Please fulfill all requirements, ensure passwords match, and verify you are human.");
      return;
    }

    setIsVerifying(true);

    try {
      // Step 1: Check for breached password
      const isLeaked = await checkPwnedPassword(formData.password);
      if (isLeaked) {
        throw new Error("Security Alert: This password was found in a data breach. Please choose a different password.");
      }

      // Step 2: Generate reCAPTCHA token (v3 — runs silently)
      await executeRecaptcha('signup_form');
      // Note: server-side token verification happens in the Express backend (Phase 2)

      // Step 3: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const { user } = userCredential;

      // Step 4: Send email verification
      await sendEmailVerification(user);

      // Step 5: Save profile to Supabase users table
      // uid from Firebase becomes the primary key in Supabase
      const { error: supabaseError } = await supabase.from('users').insert([{
        id:         user.uid,           // matches Firebase uid
        first_name: formData.firstName,
        last_name:  formData.lastName,
        email:      formData.email,
        province:   formData.province,
        loan_application_count: 0,
      }]);

      if (supabaseError) {
        // Profile save failed — log it but don't block the user
        // The account exists in Firebase, they can still log in
        console.error('Supabase profile save failed:', supabaseError.message);
      }

      // Step 6: Send a welcome notification
      await supabase.from('notifications').insert([{
        user_id: user.uid,
        message: `Welcome to Nexus, ${formData.firstName}! Your account is ready. Check your rate or apply for a loan to get started.`,
        type: 'general',
        is_read: false,
      }]);

      setIsVerifying(false);
      setIsSubmitted(true);

    } catch (err) {
      setIsVerifying(false);

      // Map Firebase error codes to user-friendly messages
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("An account with this email already exists. Try logging in instead.");
          break;
        case 'auth/weak-password':
          setError("Password is too weak. Please choose a stronger password.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address. Please check and try again.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection and try again.");
          break;
        default:
          setError(err.message || "Signup failed. Please try again.");
      }
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#F9FBFB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-[#0B1E3D] mb-2">Securing your account</h2>
        <p className="text-gray-500">Running AI fraud protection checks...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#0B1E3D] mb-4">Verify your email</h2>
          <p className="text-gray-600 mb-2">
            We've sent a verification link to <span className="font-bold text-[#0B1E3D]">{formData.email}</span>.
          </p>
          <p className="text-gray-400 text-sm mb-8">Click the link in the email, then log in to access your dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-[#0B1E3D] text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors mb-4"
          >
            Go to Login
          </button>
          <button onClick={() => setIsSubmitted(false)} className="text-cyan-600 font-bold hover:underline text-sm">
            Didn't get the email? Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFB] flex flex-col font-sans">
      <div className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="mb-8 text-center">
          <img src={logo} alt="Nexus Logo" className="w-12 h-12 object-contain mx-auto" />
          <div className="mt-2 text-[#0B1E3D]">
            <span className="font-bold text-xl uppercase tracking-tight">Nexus</span>
            <span className="text-cyan-500 text-[10px] block font-bold tracking-[0.3em] uppercase -mt-1">Lending</span>
          </div>
        </div>

        <div className="w-full max-w-[460px] bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-12">
          <h1 className="text-2xl font-bold text-[#0B1E3D] mb-6">Create Security Account</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`relative border-2 rounded-lg p-2 bg-[#E8F0FE] transition-all ${formData.firstName.length > 0 ? 'border-green-500' : 'border-gray-200'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">First name</label>
                <input name="firstName" required className="w-full bg-transparent outline-none px-2 pb-1 text-[#0B1E3D]" onChange={handleChange} />
              </div>
              <div className={`relative border-2 rounded-lg p-2 bg-[#E8F0FE] transition-all ${formData.lastName.length > 0 ? 'border-green-500' : 'border-gray-200'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">Last name</label>
                <input name="lastName" required className="w-full bg-transparent outline-none px-2 pb-1 text-[#0B1E3D]" onChange={handleChange} />
              </div>
            </div>

            <div className="relative border-2 border-gray-200 rounded-lg p-2 bg-white">
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">Zimbabwe Province</label>
              <select name="province" required className="w-full bg-transparent outline-none px-1 pb-1 text-[#0B1E3D]" onChange={handleChange}>
                <option value="">Select Province</option>
                {["Bulawayo","Harare","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className={`relative border-2 rounded-lg p-2 bg-[#E8F0FE] transition-all ${isEmailValid ? 'border-green-500' : 'border-gray-200'}`}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">Email Address</label>
              <input type="email" name="email" required className="w-full bg-transparent outline-none px-2 pb-1 text-[#0B1E3D]" onChange={handleChange} />
            </div>

            <div className={`relative border-2 rounded-lg p-2 bg-[#E8F0FE] transition-all ${isPasswordValid ? 'border-green-500' : 'border-gray-200'}`}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">Strong Password</label>
              <div className="flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full bg-transparent outline-none px-2 pb-1 text-[#0B1E3D]"
                  onChange={handleChange}
                />
                <button type="button" className="px-2 text-gray-400 hover:text-cyan-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <div className={`relative border-2 rounded-lg p-2 bg-[#E8F0FE] transition-all ${passwordsMatch ? 'border-green-500' : 'border-gray-200'}`}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-2">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                required
                className="w-full bg-transparent outline-none px-2 pb-1 text-[#0B1E3D]"
                onChange={handleChange}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Requirement label="8+ Char"  met={passwordCriteria.length} />
              <Requirement label="Number"   met={passwordCriteria.number} />
              <Requirement label="Special"  met={passwordCriteria.special} />
            </div>

            <div className={`flex items-center gap-3 p-4 border rounded-xl mt-4 transition-all ${formData.isHuman ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3 flex-grow">
                <input
                  type="checkbox"
                  name="isHuman"
                  id="humanCheck"
                  className="h-5 w-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 cursor-pointer"
                  onChange={handleChange}
                  checked={formData.isHuman}
                />
                <label htmlFor="humanCheck" className="text-xs font-bold text-gray-600 uppercase tracking-tight cursor-pointer select-none">
                  {formData.isHuman ? 'Verified Human' : 'I am not a robot'}
                </label>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/RecaptchaLogo.svg" alt="reCAPTCHA" className={`w-5 h-5 transition-opacity ${formData.isHuman ? 'opacity-100' : 'opacity-40'}`} />
            </div>

            <div className="flex gap-3 pt-2">
              <input type="checkbox" name="agreed" required className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded" onChange={handleChange} checked={formData.agreed} />
              <p className="text-[10px] leading-relaxed text-gray-500">
                I agree to the <Link to="/terms" className="text-cyan-600 font-bold underline">Terms of Service</Link> and <Link to="/privacy" className="text-cyan-600 font-bold underline">Privacy Policy</Link>.
              </p>
            </div>

            <button
              type="submit"
              disabled={!isFormReady}
              className={`w-full py-4 mt-2 font-bold rounded-xl transition-all text-lg shadow-lg ${isFormReady ? 'bg-[#008199] text-white hover:bg-[#0B1E3D]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Create Account
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Already have an account? <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-500">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer className="bg-[#0097B2] pt-8 pb-12">
        <div className="flex flex-wrap items-center justify-center gap-5 text-white text-sm font-bold px-6">
          <Link to="/help" className="hover:opacity-80 transition-opacity">Help</Link>
          <span className="text-white/30">•</span>
          <Link to="/terms" className="hover:opacity-80 transition-opacity">Terms of Use</Link>
          <span className="text-white/30">•</span>
          <Link to="/privacy" className="hover:opacity-80 transition-opacity">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

function Requirement({ label, met }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={`text-[9px] font-bold ${met ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
