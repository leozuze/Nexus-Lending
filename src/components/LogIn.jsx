import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';
import BotShield from './BotShield';
import { SESSION_KEY } from '../App';

// ─────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const firebaseErrorMessage = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Login failed. Please check your credentials and try again.';
  }
};

// Returns true if uid row exists, false if not, throws only on real DB errors
const existsInDatabase = async (uid) => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw new Error('Unable to verify your account. Please try again.');
  }
  return !!data;
};

// Creates a Supabase user record from a Google Firebase user object.
// province is left empty — the user can fill it in Profile settings.
// Ignores duplicate-key (23505) in case of concurrent calls.
const createGoogleUserRecord = async (firebaseUser) => {
  const { uid, email, displayName, photoURL } = firebaseUser;
  const parts     = (displayName ?? '').trim().split(/\s+/);
  const firstName = parts[0] || email.split('@')[0];
  const lastName  = parts.slice(1).join(' ') || '';

  const { error } = await supabase.from('users').insert({
    id:                     uid,
    email,
    first_name:             firstName,
    last_name:              lastName,
    province:               '',           // user completes this in Profile
    loan_application_count: 0,
    created_at:             new Date().toISOString(),
    last_login:             new Date().toISOString(),
  });

  // 23505 = unique_violation — row already exists, that's fine
  if (error && error.code !== '23505') {
    throw new Error('Failed to create your account record. Please try again.');
  }
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function LogIn() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [showShield, setShowShield]     = useState(false);
  const [error, setError]               = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const redirectMessage = location.state?.message ?? null;

  // Prevents the redirect-result useEffect from running concurrently
  // with an active popup flow
  const popupInProgressRef = useRef(false);

  // ── Handle Google redirect result on page load ───────────────────────────
  // Only fires when returning from signInWithRedirect (COOP popup fallback).
  // getRedirectResult returns null in all other cases — safe no-op.
  useEffect(() => {
    let cancelled = false;

    const checkRedirectResult = async () => {
      if (popupInProgressRef.current) return;
      try {
        const result = await getRedirectResult(auth);
        if (!result || cancelled) return;

        setIsLoading(true);
        await processGoogleUser(result.user, cancelled);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Google sign-in failed. Please try again.');
          setIsLoading(false);
        }
      }
    };

    checkRedirectResult();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // Core Google user processor — used by both
  // popup and redirect flows.
  //
  // HOW GOOGLE SIGN-IN WORKS (no code needed from us):
  // Firebase opens a Google-hosted popup. Google shows the account picker,
  // password prompt, and 2-Step Verification if enabled — all on Google's
  // own servers. Your app never sees the password. Only after the user
  // passes Google's security does Firebase return a credential here.
  //
  // This function handles TWO cases:
  // 1. Existing Nexus user → update last_login, proceed to dashboard
  // 2. Brand new user      → auto-create their Supabase record from Google
  //    profile data (name, email), then proceed to dashboard
  //    (same as how Spotify, Airbnb, etc. handle "Continue with Google")
  // ─────────────────────────────────────────────
  const processGoogleUser = async (firebaseUser, cancelled = false) => {
    const registered = await existsInDatabase(firebaseUser.uid);

    if (!registered) {
      // New user — create their record. Google accounts are always email-verified
      // so no email verification step is needed.
      await createGoogleUserRecord(firebaseUser);

      // Send welcome notification (non-blocking)
      const parts     = (firebaseUser.displayName ?? '').trim().split(/\s+/);
      const firstName = parts[0] || firebaseUser.email.split('@')[0];
      supabase.from('notifications').insert([{
        user_id: firebaseUser.uid,
        message: `Welcome to Nexus, ${firstName}! Your account is ready.`,
        type:    'general',
        is_read: false,
      }]).then(() => {}).catch(() => {});

    } else {
      // Returning user — update last_login, non-blocking
      supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', firebaseUser.uid)
        .then(() => {}).catch((err) => console.warn('last_login update failed:', err.message));
    }

    if (!cancelled) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setShowShield(true);
    }
  };

  // ── Stamp session for email/password path ───────────────────────────────
  const handleAuthSuccess = async (uid) => {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', uid);
    } catch (err) {
      console.warn('last_login update failed (non-blocking):', err.message);
    }
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowShield(true);
  };

  // ── Email / password login ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();

    try {
      await setPersistence(
        auth,
        keepLoggedIn ? browserLocalPersistence : browserSessionPersistence
      );

      const { user } = await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // Email must be verified for email/password accounts
      if (!user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setIsLoading(false);
        return;
      }

      // Must have completed signup (Supabase record exists)
      const registered = await existsInDatabase(user.uid);
      if (!registered) {
        await signOut(auth);
        setError('No account found. Please sign up first before logging in.');
        setIsLoading(false);
        return;
      }

      await handleAuthSuccess(user.uid);

    } catch (err) {
      // Surface DB errors with their own message; Firebase errors use the map
      const msg = (err.message?.startsWith('Unable to verify') || err.message?.startsWith('Failed to create'))
        ? err.message
        : firebaseErrorMessage(err.code);
      setError(msg);
      setIsLoading(false);
    }
  };

  // ── Google login / sign-up ───────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    popupInProgressRef.current = true;

    try {
      // Firebase opens Google's popup — Google handles password + 2FA entirely
      const userCredential = await signInWithPopup(auth, googleProvider);
      popupInProgressRef.current = false;
      await processGoogleUser(userCredential.user);

    } catch (err) {
      popupInProgressRef.current = false;

      // User deliberately closed the popup — not an error
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }

      // Popup blocked by COOP header → fall back to full-page redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          // Page navigates away — result handled in useEffect on return
          return;
        } catch {
          setError('Failed to open Google sign-in. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Surface DB errors with their own message
      const msg = (err.message?.startsWith('Unable to verify') || err.message?.startsWith('Failed to create'))
        ? err.message
        : (firebaseErrorMessage(err.code) || 'Failed to sign in with Google. Please try again.');
      setError(msg);
      setIsLoading(false);
    }
  };

  // ── Apple — not yet enabled ──────────────────────────────────────────────
  const handleAppleLogin = () => {
    setError('Apple Sign-In requires an Apple Developer account and is not yet enabled.');
  };

  // ─────────────────────────────────────────────
  // BotShield gate after successful auth
  // ─────────────────────────────────────────────
  if (showShield) {
    return <BotShield onVerified={() => navigate('/dashboard')} />;
  }

  // ─────────────────────────────────────────────
  // UI — structure, fonts, and spacing unchanged
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans text-gray-900">
      <div className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">

        {/* ── Logo + heading ── */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src={logo} alt="Nexus Logo" className="w-12 h-12 object-contain" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[#0B1E3D] font-bold text-2xl tracking-tight uppercase">Nexus</span>
              <span className="text-cyan-500 text-xs font-bold tracking-[0.2em] uppercase">Lending</span>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[#0B1E3D]">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">Enter your credentials to access your secure portal.</p>
        </div>

        {/* ── Card ── */}
        <div className="mt-8 mx-auto w-full max-w-[400px]">
          <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 sm:px-10">

            {/* Redirect message */}
            {redirectMessage && (
              <div className="mb-4 p-3 bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 text-xs font-bold rounded">
                {redirectMessage}
              </div>
            )}

            {/* ── Social buttons ── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 active:scale-95 disabled:opacity-50"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-4 h-4"
                  alt="Google"
                />
                Google
              </button>
              <button
                onClick={handleAppleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 active:scale-95 disabled:opacity-50"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                  className="w-4 h-4 mb-1"
                  alt="Apple"
                />
                Apple
              </button>
            </div>

            {/* ── Divider ── */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="px-4 bg-white text-gray-400">Or email</span>
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded">
                {error}
                {(error.includes('sign up') || error.includes('create an account')) && (
                  <div className="mt-2">
                    <Link
                      to="/signup"
                      className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Create Account →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Form ── */}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-bold text-[#0B1E3D] ml-1 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="block w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-bold text-[#0B1E3D] ml-1 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-sm"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-500"
                  >
                    {showPassword ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* ── Keep logged in + forgot ── */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-xs text-gray-500 font-bold">Keep me logged in</span>
                </label>
                <Link to="/forgot-password" className="font-bold text-cyan-600 hover:text-cyan-500 text-xs">
                  Forgot?
                </Link>
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all active:scale-95 flex justify-center items-center gap-2 ${
                  isLoading
                    ? 'bg-[#0B1E3D] cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-[#0B1E3D] shadow-cyan-100'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* ── Sign up link ── */}
            <div className="mt-8 text-center border-t border-gray-50 pt-6">
              <p className="text-sm text-gray-500 font-medium">
                New to Nexus?{' '}
                <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-500">
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* ── Security badge ── */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Bank-grade security</p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
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
