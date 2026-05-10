import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { auth } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

// Component Imports
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductSection from './components/ProductSection';
import HowItWorks from './components/HowItWorks';
import TrustSection from './components/TrustSection';
import FAQ from './components/FAQ';
import LoanTerms from './components/LoanTerms';
import Footer from './components/Footer';
import ProductsLinks from './components/ProductsLinks';
import WhyNexusLinks from './components/WhyNexusLinks'; 
import HowLinks from './components/HowLinks';
import AboutUsLinks from './components/AboutUsLinks';
import LogIn from './components/LogIn';
import NewUsers from './components/NewUsers';
import CheckRate from './components/CheckRate'; 
import BotShield from './components/BotShield';
import ContactUs from './components/ContactUs';
import HelpCenter from './components/HelpCenter'; 
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookieSettings from './components/CookieSettings'; 
import Disclosures from './components/Disclosures';

import PersonalLoans from './components/navigation/PersonalLoans';
import CarLoans from './components/navigation/CarLoans';
import HealthLoans from './components/navigation/HealthLoans';
import MortgageLoans from './components/navigation/MortgageLoans';
import StudentLoans from './components/navigation/StudentsLoans';

// Dashboard Import
import Dashboard from './components/Userdashboard/Dashboard';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

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

const AppContent = ({ user }) => {
  const location = useLocation();
  
  const isCleanPage = 
    location.pathname === '/login' || 
    location.pathname === '/signup' || 
    location.pathname === '/check-rate' ||
    location.pathname === '/contact' ||
    location.pathname === '/help' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy' ||
    location.pathname === '/cookies' ||
    location.pathname === '/disclosures' ||
    location.pathname === '/dashboard'; // Dashboard has its own full-screen shell

  return (
    <div className="min-h-screen bg-white">
      {!isCleanPage && <Navbar />}
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsLinks />} />
          <Route path="/why-nexus" element={<WhyNexusLinks />} />
          <Route path="/how-it-works" element={<HowLinks />} />
          <Route path="/about-us" element={<AboutUsLinks />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/help" element={<HelpCenter />} /> 
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookieSettings />} /> 
          <Route path="/disclosures" element={<Disclosures />} />
          
          {/* Dedicated Routes for each Loan Type */}
          <Route path="/personal-loans" element={<PersonalLoans />} />
          <Route path="/car-loans" element={<CarLoans />} />
          <Route path="/health-insurance" element={<HealthLoans />} />
          <Route path="/mortgage" element={<MortgageLoans />} />
          <Route path="/student-loans" element={<StudentLoans />} />

          <Route path="/check-rate" element={<CheckRate />} />

          {/* Protected Auth Routes using BotShield */}
          <Route 
            path="/login" 
            element={
              <BotShield>
                {!user ? <LogIn /> : <Navigate to="/dashboard" />}
              </BotShield>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <BotShield>
                {!user ? <NewUsers /> : <Navigate to="/dashboard" />}
              </BotShield>
            } 
          />

          {/* Protected Dashboard Route — now uses the real Dashboard component */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>

      {!isCleanPage && <Footer />}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
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
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#0B1E3D] font-bold tracking-widest text-xs uppercase">Initializing Nexus AI...</p>
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
