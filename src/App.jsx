import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Component Imports
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

// ── ScrollToTop ──────────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// ── Home page ────────────────────────────────────────────────────────────────
const Home = () => (
  <>
    <Hero />
    <ProductSection />
    <HowItWorks />
    <TrustSection />
    <FAQ />
    <LoanTerms />
  </>
);

// ── Clean-page list (no Navbar / Footer) ─────────────────────────────────────
const CLEAN_PATHS = new Set([
  '/login', '/signup', '/check-rate', '/contact', '/help',
  '/terms', '/privacy', '/cookies', '/disclosures', '/dashboard',
]);

// ── App shell ────────────────────────────────────────────────────────────────
const AppContent = ({ user }) => {
  const location    = useLocation();
  const isCleanPage = CLEAN_PATHS.has(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      {!isCleanPage && <Navbar />}

      <main>
        <Routes>
          {/* ── Public routes ── */}
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

          {/* ── Loan-type landing pages ── */}
          <Route path="/personal-loans"   element={<PersonalLoans />} />
          <Route path="/car-loans"        element={<CarLoans />} />
          <Route path="/health-insurance" element={<HealthLoans />} />
          <Route path="/mortgage"         element={<MortgageLoans />} />
          <Route path="/student-loans"    element={<StudentLoans />} />

          {/* ── CheckRate — public, no BotShield wrapper here ──
              BotShield is already used *inside* CheckRate (step 0) ── */}
          <Route path="/check-rate" element={<CheckRate />} />

          {/* ── Auth routes ──
              FIX: Removed the outer <BotShield> wrapper that was double-wrapping.
              LogIn already uses BotShield internally after successful login.
              CheckRate already starts with BotShield as step 0.
              Wrapping the route AND the component caused the
              Cross-Origin-Opener-Policy errors on the Google popup. ── */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LogIn />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/dashboard" replace /> : <NewUsers />}
          />

          {/* ── Protected Dashboard ── */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isCleanPage && <Footer />}
    </div>
  );
};

// ── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
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
