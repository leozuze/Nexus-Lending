import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase'; 
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import logo from '../assets/logo.png';
import BotShield from './BotShield'; // Ensure the path is correct

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

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showShield, setShowShield] = useState(false); // New state for verification
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    setShowShield(true);
    // The shield will handle the redirect after its internal 1.5s timeout via onVerified
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (err) {
      console.error("Auth Error:", err.code);
      switch (err.code) {
        case 'auth/invalid-credential':
          setError("Invalid email or password. Please try again.");
          break;
        case 'auth/user-not-found':
          setError("No account found with this email.");
          break;
        case 'auth/wrong-password':
          setError("Incorrect password. Please try again.");
          break;
        case 'auth/too-many-requests':
          setError("Too many failed attempts. Try again later.");
          break;
        default:
          setError("Login failed. Please check your credentials.");
      }
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    if (provider === 'Google') {
      try {
        setIsLoading(true);
        await signInWithPopup(auth, googleProvider);
        handleAuthSuccess();
      } catch (err) {
        console.error("Social Auth Error:", err.message);
        setError("Failed to sign in with Google. Please try again.");
        setIsLoading(false);
      }
    } else if (provider === 'Apple') {
      alert("Apple Login requires a paid developer account to configure.");
    }
  };

  // If credentials are valid, show the Nexus Security Shield
  if (showShield) {
    return (
      <BotShield onVerified={() => navigate('/dashboard')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans text-gray-900">
      <div className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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

        <div className="mt-8 mx-auto w-full max-w-[400px]">
          <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 sm:px-10">
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => handleSocialLogin('Google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 active:scale-95 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                Google
              </button>
              <button 
                onClick={() => handleSocialLogin('Apple')}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 active:scale-95"
              >
                
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="w-4 h-4 mb-1" alt="Apple" />
                Apple
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="px-4 bg-white text-gray-400">Or email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded animate-pulse">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-[#0B1E3D] ml-1 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="block w-full px-4 py-3.5 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B1E3D] ml-1 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="block w-full px-4 py-3.5 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-500"
                  >
                    {showPassword ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500" />
                  <span className="text-xs text-gray-500 font-bold">Keep me logged in</span>
                </label>
                <Link to="/forgot-password" size="sm" className="font-bold text-cyan-600 hover:text-cyan-500 text-xs">Forgot?</Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all active:scale-95 flex justify-center items-center gap-2 ${
                  isLoading ? 'bg-[#0B1E3D] cursor-not-allowed' : 'bg-cyan-500 hover:bg-[#0B1E3D] shadow-cyan-100'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Securing...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-50 pt-6">
              <p className="text-sm text-gray-500 font-medium">
                New to Nexus? <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-500">New Signup</Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Bank-grade security</p>
          </div>
        </div>
      </div>

      {/* Footer - Optimized spacing */}
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