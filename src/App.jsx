import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Navbar          from './components/Navbar';
import Hero            from './components/Hero';
import ProductSection  from './components/ProductSection';
import HowItWorks      from './components/HowItWorks';
import TrustSection    from './components/TrustSection';
import FAQ             from './components/FAQ';
import LoanTerms       from './components/LoanTerms';
import Footer          from './components/Footer';
import ProductsLinks   from './components/ProductsLinks';
import WhyNexusLinks   from './components/WhyNexusLinks';
import HowLinks        from './components/HowLinks';
import AboutUsLinks    from './components/AboutUsLinks';
import LogIn           from './components/LogIn';
import NewUsers        from './components/NewUsers';
import CheckRate       from './components/CheckRate';
import ContactUs       from './components/ContactUs';
import HelpCenter      from './components/HelpCenter';
import TermsOfUse      from './components/TermsOfUse';
import PrivacyPolicy   from './components/PrivacyPolicy';
import CookieSettings  from './components/CookieSettings';
import Disclosures     from './components/Disclosures';
import PersonalLoans   from './components/navigation/PersonalLoans';
import CarLoans        from './components/navigation/CarLoans';
import HealthLoans     from './components/navigation/HealthLoans';
import MortgageLoans   from './components/navigation/MortgageLoans';
import StudentLoans    from './components/navigation/StudentsLoans';
import Dashboard       from './components/Userdashboard/Dashboard';

// ── Exported so LogIn.jsx can stamp the session after a successful login ─────
export const SESSION_KEY = 'nexus_session_active';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const Home = () => (
  <>
    <Hero /><ProductSection /><HowItWorks />
    <TrustSection /><FAQ /><LoanTerms />
  </>
);

const CLEAN_PATHS = new Set([
  '/login','/signup','/check-rate','/contact','/help',
  '/terms','/privacy','/cookies','/disclosures','/dashboard',
]);

// ── Email-not-verified screen ────────────────────────────────────────────────
const VerifyEmailWall = ({ onSignOut }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#0B1E3D] mb-3">Verify your email first</h2>
      <p className="text-gray-500 text-sm mb-8">
        We sent a verification link to your email. Click it, then come back and sign in.
        <br /><br />
        <span className="text-xs text-gray-400">Check your spam folder if you don't see it.</span>
      </p>
      <button
        onClick={onSignOut}
        className="w-full py-3 bg-[#0B1E3D] text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors"
      >
        Back to Login
      </button>
    </div>
  </div>
);

const AppContent = ({ user }) => {
  const location    = useLocation();
  const isCleanPage = CLEAN_PATHS.has(location.pathname);

  const handleSignOut = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await signOut(auth);
  };

  // ── Email verification gate ──────────────────────────────────────────────
  // If the user is logged in via Firebase but hasn't verified their email,
  // block the dashboard and show the verify wall instead.
  // Google users are always verified (emailVerified = true from Google).
  if (user && !user.emailVerified && location.pathname === '/dashboard') {
    return <VerifyEmailWall onSignOut={handleSignOut} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {!isCleanPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/products"       element={<ProductsLinks />} />
          <Route path="/why-nexus"      element={<WhyNexusLinks />} />
          <Route path="/how-it-works"   element={<HowLinks />} />
          <Route path="/about-us"       element={<AboutUsLinks />} />
          <Route path="/contact"        element={<ContactUs />} />
          <Route path="/help"           element={<HelpCenter />} />
          <Route path="/terms"          element={<TermsOfUse />} />
          <Route path="/privacy"        element={<PrivacyPolicy />} />
          <Route path="/cookies"        element={<CookieSettings />} />
          <Route path="/disclosures"    element={<Disclosures />} />
          <Route path="/personal-loans"   element={<PersonalLoans />} />
          <Route path="/car-loans"        element={<CarLoans />} />
          <Route path="/health-insurance" element={<HealthLoans />} />
          <Route path="/mortgage"         element={<MortgageLoans />} />
          <Route path="/student-loans"    element={<StudentLoans />} />

          {/* CheckRate is always public */}
          <Route path="/check-rate" element={<CheckRate />} />

          {/* Auth — if already logged in this session, go to dashboard */}
          <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <LogIn />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <NewUsers />} />

          {/* Dashboard — requires session login + verified email */}
          <Route
            path="/dashboard"
            element={
              user
                ? user.emailVerified
                  ? <Dashboard />
                  : <VerifyEmailWall onSignOut={handleSignOut} />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isCleanPage && <Footer />}
    </div>
  );
};

function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── FIX: Force sign-out on every fresh browser open ─────────────────
    // sessionStorage is cleared when the browser/tab is closed — unlike
    // localStorage which Firebase uses to persist auth. So if SESSION_KEY
    // isn't present, this is a new browser session and we sign the user out
    // so they always have to explicitly log in. Once they log in we set the
    // key in LogIn.jsx and it persists for the rest of that browser session.
    const isActiveSession = sessionStorage.getItem(SESSION_KEY);

    const setup = (skipSignOut = false) => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    };

    if (!isActiveSession) {
      // New tab/browser open → force sign out first
      signOut(auth).then(() => {
        setup();
      });
    } else {
      const unsub = setup();
      return () => unsub();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#0B1E3D] font-bold tracking-widest text-xs uppercase">
            Initializing Nexus AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <Router>
        <ScrollToTop />
        <AppContent user={user} />
      </Router>
    </GoogleReCaptchaProvider>
  );
}

export default App;
