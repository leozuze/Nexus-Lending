import React, { useEffect, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ShieldCheck, Eye, Zap, ChevronLeft, ChevronRight } from 'lucide-react'; 
import Bridget from '../assets/student.jpg';
import Elena from '../assets/woman.jpg';
import Jordan from '../assets/father.jpg';

const socialFeed = [
    {
        name: "Bridget Kwenda",
        location: "MBA Borrower",
         
        title: "Simplified the MBA funding process entirely",
        comment: "Nexus made it happen when others couldn't. Found a rate 1.5% lower than my local bank using their advanced matching tools.",
        Image: Bridget
    },
    {
        name: "Elena Mutasa",
        location: "Parent Plus",
         
        title: "Clean transparency for my daughter's loans",
        comment: "Was worried about Parent Plus terms, but the Nexus transparency protocol made everything clear. Zero hidden fees, just pure honesty.",
        Image: Elena
    },
    {
        name: "Jordan Muzeza",
        location: "Debt Refinance",
         
        title: "Actually helped me save $100+ every month",
        comment: "Autonomous fraud protection and clear savings. Swapping my car loan was the best financial decision I made this year.",
        Image: Jordan
    }
];

export default function TrustSection() {
    const scrollRef = useRef(null);

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            easing: 'ease-out-cubic'
        });
    }, []);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            scrollRef.current.scrollTo({
                left: scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="max-w-[1440px] mx-auto px-6">
                
                {/* --- PART 1: THE PILLARS --- */}
                <div className="text-center mb-20" data-aos="fade-down">
                    <h2 className="text-4xl lg:text-6xl font-black text-[#0B1E3D] mb-6 tracking-tight">
                        The Nexus <span className="text-cyan-500">Difference.</span>
                    </h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        We’ve helped over 2 Million Members reach their goals. Discover why our combination of speed, transparency, and security sets us apart.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
                    <div data-aos="fade-right" data-aos-delay="100" className="p-10 rounded-[3rem] bg-cyan-50 border border-cyan-100 hover:shadow-xl transition-all group">
                        <div className="mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-12 h-12 text-cyan-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#0B1E3D] mb-4">Autonomous Defense</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">
                            Our proprietary tech identifies and blocks 99.9% of phishing attempts, keeping your financial data locked tight.
                        </p>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="300" className="p-10 rounded-[3rem] bg-[#0B1E3D] text-white hover:shadow-xl transition-all group">
                        <div className="mb-6 group-hover:scale-110 transition-transform">
                            <Eye className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Pure Transparency</h3>
                        <p className="text-white/80 leading-relaxed font-medium">
                            No hidden fees, no teaser rates. What you see is exactly what you pay. We believe in total financial honesty.
                        </p>
                    </div>

                    <div data-aos="fade-left" data-aos-delay="500" className="p-10 rounded-[3rem] bg-cyan-500 text-white hover:shadow-xl transition-all group">
                        <div className="mb-6 group-hover:scale-110 transition-transform">
                            <Zap className="w-12 h-12 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Instant Synergy</h3>
                        <p className="text-white/90 leading-relaxed font-medium">
                            Our modern tech stack allows for 5-minute rate checks with zero impact on your credit score.
                        </p>
                    </div>
                </div>

                {/* --- PART 2: THE REVIEWS --- */}
                <div className="bg-[#F8FAFC] rounded-[4rem] relative border border-gray-100 overflow-hidden group/slider" data-aos="zoom-in-up">
                    
                    {/* Aggregate Rating Bar */}
                    <div className="bg-[#0B1E3D] p-4 lg:p-6 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col lg:flex-row items-center gap-3">
                            <span className="text-white font-bold text-base opacity-70">Our members say</span>
                            <span className="text-white font-black text-2xl lg:text-3xl">Excellent</span>
                            <div className="flex bg-cyan-500 px-2 py-0.5 rounded gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 fill-white" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <div className="text-white/60 font-bold text-sm">
                            <span className="text-white font-black">4.7</span> out of 5 based on 32,580 reviews ● Verified Community
                        </div>
                    </div>

                    <div className="p-10 lg:p-20 relative">
                        <div className="text-center mb-16" data-aos="fade-up">
                            <h3 className="text-[#0B1E3D] text-3xl lg:text-5xl font-black tracking-tight mb-2">
                                Voices of <span className="text-cyan-500">Nexus.</span>
                            </h3>
                            <p className="text-gray-500 text-lg font-bold uppercase tracking-widest">Active Community Stories</p>
                        </div>

                        {/* Desktop Slider Controls */}
                        <div className="hidden lg:flex justify-between absolute top-[60%] -translate-y-1/2 w-full left-0 z-10 pointer-events-none px-8">
                            <button 
                                onClick={() => scroll('left')} 
                                className="p-4 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button 
                                onClick={() => scroll('right')} 
                                className="p-4 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </div>

                        <div 
                            ref={scrollRef}
                            className="flex overflow-x-auto lg:grid lg:grid-cols-3 gap-8 pb-8 md:pb-0 snap-x snap-mandatory no-scrollbar"
                        >
                            {socialFeed.map((post, index) => (
                                <div 
                                    key={index} 
                                    data-aos="fade-up"
                                    data-aos-delay={index * 200}
                                    className="min-w-[85%] lg:min-w-0 snap-center bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-cyan-400 transition-all duration-300 group shadow-sm hover:shadow-xl flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex gap-0.5 text-green-500">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-xs font-bold border border-gray-100">
                                            <svg className="w-3.5 h-3.5 fill-cyan-500" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Invited
                                        </div>
                                    </div>

                                    <h4 className="font-extrabold text-[#0B1E3D] text-lg mb-3 leading-tight">{post.title}</h4>
                                    <p className="text-[#0B1E3D]/80 text-base leading-relaxed font-semibold mb-10 flex-grow">
                                        "{post.comment}"
                                    </p>

                                    <div className="flex items-center gap-4 pt-6 border-t border-gray-50 mt-auto">
                                        <div className="w-14 h-14 rounded-full overflow-hidden group-hover:rotate-6 transition-transform">
                                            <img 
                                                src={post.Image} 
                                                alt={post.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-[#0B1E3D] text-lg leading-tight">{post.name}</h4>
                                            <p className="text-cyan-600 text-sm font-bold flex gap-2">
                                                <span>{post.location}</span>
                                                <span>{post.time}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}