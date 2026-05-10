import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import Hero1Image from '../assets/hero3.jpg';
import Hero2Image from '../assets/hero00.jpg';
import Hero3Image from '../assets/hero002.jpg';

const FastCounter = ({ target, duration = 1500, suffix = "M" }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseFloat(target);
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return <span>{count % 1 === 0 ? count : count.toFixed(1)}{suffix}</span>;
};

export default function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    const slides = [
        {
            id: 1,
            title: "Smart loans, right at your fingertips.",
            desc: "Check your eligibility, get instant offers, and stay in control anytime, anywhere.",
            image: Hero1Image,
            ctaText: isLoggedIn ? "View Dashboard" : "Get Started",
            link: isLoggedIn ? "/dashboard" : "/login",
            trust: "Ranked #1 in Consumer Satisfaction 2026"
        },
        {
            id: 2,
            title: "Track your loan. Stay ahead.",
            desc: "View balances, upcoming payments, and manage everything in one simple dashboard.",
            image: Hero2Image,
            ctaText: isLoggedIn ? "Portfolio" : "Sign In",
            link: isLoggedIn ? "/dashboard" : "/login",
            trust: "Trusted by over 2 Million Members"
        },
        {
            id: 3,
            title: "Approved in minutes. Faster funding.",
            desc: "Get the funds you need with quick decisions, zero hassle, and total peace of mind.",
            image: Hero3Image,
            ctaText: isLoggedIn ? "Apply Now" : "Join Nexus",
            link: isLoggedIn ? "/dashboard" : "/signup",
            trust: "Bank-Level Security & Encryption"
        }
    ];

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [isPaused, nextSlide]);

    return (
        <section className="relative min-h-screen bg-cyan-500 overflow-hidden font-sans flex flex-col pt-[100px] pb-12">
            
            {/* Decorative Geometry */}
            <div className="absolute top-10 -right-20 w-64 h-64 border-[32px] border-white/10 rounded-full hidden xl:block"></div>
            <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/5 rounded-3xl rotate-12 hidden lg:block"></div>
            
            <div className="max-w-[1440px] mx-auto px-6 w-full relative z-10 flex flex-col flex-grow">
                <div className="relative h-[850px] sm:h-[700px] lg:h-[550px] xl:h-[600px]">
                    {slides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        return (
                            <div
                                key={slide.id}
                                className={`absolute inset-0 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 transition-all duration-1000 ease-[cubic-bezier(0.4, 0, 0.2, 1)] 
                                ${isActive 
                                    ? "opacity-100 translate-x-0 z-20 pointer-events-auto" 
                                    : "opacity-0 translate-x-12 z-10 pointer-events-none"}`}
                            >
                                <div className="w-full lg:w-[60%] text-left">
                                    <span className="inline-block bg-[#0B1E3D] text-white font-bold text-xs lg:text-sm uppercase tracking-[0.3em] px-5 py-2 rounded-md mb-6">
                                        Nexus Lending®
                                    </span>

                                    <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-[#0B1E3D] leading-[1.1] lg:leading-[0.95] mb-6 tracking-tighter">
                                        {slide.title}
                                    </h1>
                                    <p className="text-[#0B1E3D]/90 text-lg lg:text-2xl font-semibold mb-8 max-w-2xl leading-relaxed">
                                        {slide.desc}
                                    </p>

                                    {/* BUTTON GROUP */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <Link 
                                            to={slide.link}
                                            className="w-full sm:w-auto text-center px-8 lg:px-12 py-5 bg-[#0B1E3D] hover:bg-[#162a4d] text-white font-bold text-lg lg:text-xl rounded-2xl shadow-xl transition-all transform active:scale-95"
                                        >
                                            {slide.ctaText}
                                        </Link>

                                        {/* CONNECTED: Check Rate Button */}
                                        <Link 
                                            to="/check-rate"
                                            className="w-full sm:w-auto text-center px-8 lg:px-12 py-5 border-2 border-[#0B1E3D] text-[#0B1E3D] font-bold text-lg lg:text-xl rounded-2xl hover:bg-[#0B1E3D] hover:text-white transition-all transform active:scale-95 shadow-sm"
                                        >
                                            Check Rate
                                        </Link>
                                    </div>
                                </div>

                                <div className="w-full lg:w-[40%] flex flex-col items-center">
                                    <div className="relative group w-full max-w-[480px]">
                                        <div className="absolute -inset-4 lg:-inset-8 bg-white/30 rounded-[3rem] lg:rounded-[5rem] -rotate-3 lg:-rotate-6 transition-transform duration-1000 -z-10 blur-sm"></div>
                                        <div className="relative z-10 bg-white p-3 lg:p-6 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl">
                                            <img 
                                                src={slide.image} 
                                                alt="Nexus App" 
                                                className="w-full aspect-[4/3] lg:h-[450px] object-cover rounded-[2rem] lg:rounded-[2.8rem]" 
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 lg:mt-8 text-center">
                                        <p className="text-[#0B1E3D] font-black text-[10px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] uppercase opacity-80">
                                            {slide.trust}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-12 relative z-30">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsPaused(!isPaused)} 
                            className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-2xl border-2 border-[#0B1E3D]/20 text-[#0B1E3D] hover:bg-white/20 transition-all shadow-sm"
                        >
                            {isPaused ? 
                                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> : 
                                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            }
                        </button>
                        <div className="flex bg-[#0B1E3D]/5 p-1 rounded-2xl backdrop-blur-sm shadow-inner">
                            <button onClick={prevSlide} className="px-4 py-3 text-[#0B1E3D] hover:bg-white rounded-xl transition-all font-bold">←</button>
                            <button onClick={nextSlide} className="px-4 py-3 text-[#0B1E3D] hover:bg-white rounded-xl transition-all font-bold">→</button>
                        </div>
                        <div className="flex gap-1.5 ml-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`h-1 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-6 bg-[#0B1E3D]' : 'w-1.5 bg-[#0B1E3D]/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* STATS BAR */}
                <div className="mt-16 lg:mt-20 pt-10 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-4 text-center">
                    <div className="flex flex-col items-center lg:items-start">
                        <h2 className="text-5xl lg:text-7xl font-black text-[#0B1E3D]">
                            <FastCounter target="2.0" suffix="M" />
                        </h2>
                        <p className="text-[#0B1E3D] font-bold uppercase tracking-widest text-xs mt-2 opacity-70">Active Members</p>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                        <h2 className="text-5xl lg:text-7xl font-black text-[#0B1E3D]">
                            <FastCounter target="850" suffix="k+" />
                        </h2>
                        <p className="text-[#0B1E3D] font-bold uppercase tracking-widest text-xs mt-2 opacity-70">Funded Loans</p>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                        <h2 className="text-5xl lg:text-7xl font-black text-[#0B1E3D]">
                            <FastCounter target="12" suffix="+" />
                        </h2>
                        <p className="text-[#0B1E3D] font-bold uppercase tracking-widest text-xs mt-2 opacity-70">Regions Covered</p>
                    </div>
                </div>
            </div>
        </section>
    );
}