import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    ShieldCheck, Cpu, Zap, Lock, CheckCircle, BarChart3, 
    CreditCard, Users, Globe, ChevronLeft, ChevronRight, XCircle, Loader2 
} from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// Assets
import whyImage from '../assets/whynexus.jpg'; 

export default function WhyNexusLinks() {
    const location = useLocation();
    const { hash, pathname } = location;
    
    const advantageRef = useRef(null);
    const storiesRef = useRef(null);

    // Dynamic State for Reviews
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setStories(data);
            } catch (error) {
                console.error('Error loading stories:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, []);

    // Smooth Scroll Logic
    useEffect(() => {
        if (hash) {
            const timeoutId = setTimeout(() => {
                const id = hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [hash, pathname]);

    const scroll = (ref, direction) => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            const offset = direction === 'left' ? -clientWidth : clientWidth;
            ref.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
        }
    };

    const advantages = [
        { id: "ai-tech", title: "AI-Powered Precision", desc: "Our proprietary models analyze over 10,000 alternative data points to find your true potential.", icon: <Cpu className="w-8 h-8 text-cyan-500" /> },
        { id: "security", title: "Bank-Grade Security", desc: "AES-256 encryption and biometric MFA ensure your financial DNA is guarded by elite-level protocol.", icon: <Lock className="w-8 h-8 text-cyan-500" /> },
        { id: "efficiency", title: "Fair & Fast Decisions", desc: "Our machine learning gives you a firm offer in under 60 seconds. High-speed, bias-free lending.", icon: <Zap className="w-8 h-8 text-cyan-500" /> },
        { id: "fraud", title: "Fraud Prevention", desc: "Advanced neural networks monitor transactions to stop identity theft before it reaches your account.", icon: <ShieldCheck className="w-8 h-8 text-cyan-500" /> }
    ];

    const comparisonData = [
        { feature: "Approval Speed", nexus: "60 Seconds", banks: "3-5 Business Days" },
        { feature: "Data Points Used", nexus: "10,000+ (Alt Data)", banks: "1 (FICO Only)" },
        { feature: "Hidden Fees", nexus: "Zero Transparency", banks: "Origination Fees" },
        { feature: "Security", nexus: "Biometric & AES-256", banks: "Legacy Systems" },
    ];

    return (
        <div className="pt-32 pb-20 bg-slate-50 font-sans selection:bg-cyan-100 overflow-x-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="max-w-7xl mx-auto px-6">
                
                {/* HERO SECTION */}
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-cyan-600 uppercase bg-cyan-100 rounded-full">
                        The New Standard of Fintech
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-[#0B1E3D] mb-6 tracking-tight leading-[1.1]">
                        Finance for the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Next Generation.</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Nexus is a human-first financial ecosystem. We've replaced banking bureaucracy with AI to approve you based on your future.
                    </p>
                </div>

                {/* ADVANTAGE SLIDER */}
                <div className="relative mb-32 group/slider">
                    <div className="hidden md:flex justify-between absolute top-1/2 -translate-y-1/2 w-full z-10 pointer-events-none px-2">
                        <button onClick={() => scroll(advantageRef, 'left')} className="p-3 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto -ml-6 hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"><ChevronLeft /></button>
                        <button onClick={() => scroll(advantageRef, 'right')} className="p-3 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto -mr-6 hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"><ChevronRight /></button>
                    </div>

                    <div ref={advantageRef} className="flex overflow-x-auto snap-x snap-mandatory gap-6 no-scrollbar pb-6">
                        {advantages.map((item, idx) => (
                            <div key={idx} className="snap-center shrink-0 w-[85%] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] group p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-cyan-400 transition-all duration-500">
                                <div className="mb-6 p-3 bg-slate-50 w-fit rounded-2xl group-hover:bg-cyan-50 transition-colors">{item.icon}</div>
                                <h3 className="text-xl font-bold text-[#0B1E3D] mb-3">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI TECH SECTION */}
                <div id="ai-tech" className="grid lg:grid-cols-2 gap-16 items-center mb-32 scroll-mt-32">
                    <div className="relative">
                        <div className="absolute -top-10 -left-10 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl"></div>
                        <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-cyan-500 rounded-xl text-white shadow-lg shadow-cyan-200"><BarChart3 size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-[#0B1E3D]">Nexus AI Engine™</h4>
                                    <p className="text-xs text-slate-400">Alternative Credit Modeling</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {[{ label: "Predictive Success Rate", val: "94%" }, { label: "Institutional Trust Index", val: "99.2%" }, { label: "Processing Latency", val: "0.04s" }].map((stat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2"><span className="font-semibold text-slate-700">{stat.label}</span><span className="text-cyan-600 font-bold">{stat.val}</span></div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-cyan-500 h-full rounded-full" style={{ width: stat.val }}></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1E3D] mb-6">Intelligence that works for you.</h2>
                        <p className="text-slate-600 mb-8 leading-relaxed text-lg">We look at income stability and professional growth to offer lower rates to responsible borrowers.</p>
                        <div className="flex gap-8 md:gap-12 border-t border-slate-200 pt-8">
                            <div className="flex items-center gap-3"><Users className="text-cyan-500" /><div><p className="text-2xl font-black text-[#0B1E3D]">120k+</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Active Users</p></div></div>
                            <div className="flex items-center gap-3"><Globe className="text-cyan-500" /><div><p className="text-2xl font-black text-[#0B1E3D]">Global</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Network</p></div></div>
                        </div>
                    </div>
                </div>

                {/* SECURITY SECTION */}
                <div id="security" className="bg-[#0B1E3D] rounded-[3.5rem] p-8 md:p-20 text-white relative overflow-hidden mb-32 scroll-mt-32">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-8">Your data is yours. <br className="hidden md:block" /> We just guard it.</h2>
                            <div className="space-y-6">
                                {["AES-256 Encryption", "MFA Authentication", "Privacy First"].map((title, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="bg-cyan-500/20 p-1 h-fit rounded-full flex-shrink-0"><CheckCircle className="text-cyan-400" size={20} /></div>
                                        <p className="text-cyan-100/70 text-sm md:text-base"><strong className="text-white">{title}</strong>: Bank-grade infrastructure at every layer.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="relative p-8 md:p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl">
                                <Lock className="text-cyan-500 animate-pulse w-16 h-16 md:w-[120px] md:h-[120px]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COMPARISON TABLE */}
                <div id="comparison" className="mb-32 scroll-mt-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1E3D] mb-4">Nexus vs. The Rest</h2>
                        <p className="text-slate-500 px-4">Why thousands are switching from traditional banking.</p>
                    </div>
                    
                    <div className="hidden md:block overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-8 text-sm font-bold text-slate-400 uppercase tracking-widest">Feature</th>
                                    <th className="p-8 text-sm font-bold text-cyan-600 uppercase tracking-widest bg-cyan-50/50">Nexus Lending</th>
                                    <th className="p-8 text-sm font-bold text-slate-400 uppercase tracking-widest">Traditional Banks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {comparisonData.map((row, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-8 font-bold text-[#0B1E3D]">{row.feature}</td>
                                        <td className="p-8 bg-cyan-50/20 font-bold text-cyan-700">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={18} className="text-cyan-500" />
                                                {row.nexus}
                                            </div>
                                        </td>
                                        <td className="p-8 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <XCircle size={18} className="text-slate-300" />
                                                {row.banks}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE COMPARISON */}
                    <div className="md:hidden space-y-4 px-2">
                        {comparisonData.map((row, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{row.feature}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-cyan-600 uppercase mb-1">Nexus</p>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#0B1E3D]">
                                            <CheckCircle size={14} className="text-cyan-500 flex-shrink-0" />
                                            {row.nexus}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Banks</p>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <XCircle size={14} className="text-slate-300 flex-shrink-0" />
                                            {row.banks}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* STORIES SECTION */}
                <div id="stories" className="text-center mb-32 scroll-mt-32 group/stories">
                    <h2 className="text-3xl md:text-4xl font-black text-[#0B1E3D] mb-12">Built for Real Success.</h2>
                    <div className="relative min-h-[300px] flex items-center justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Community Stories...</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:flex justify-between absolute top-1/2 -translate-y-1/2 w-full z-10 pointer-events-none">
                                    <button onClick={() => scroll(storiesRef, 'left')} className="p-3 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto -ml-6 hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/stories:opacity-100"><ChevronLeft /></button>
                                    <button onClick={() => scroll(storiesRef, 'right')} className="p-3 rounded-full bg-white shadow-xl border border-slate-100 pointer-events-auto -mr-6 hover:bg-cyan-500 hover:text-white transition-all opacity-0 group-hover/stories:opacity-100"><ChevronRight /></button>
                                </div>
                                <div ref={storiesRef} className="flex overflow-x-auto snap-x snap-mandatory gap-8 no-scrollbar pb-6 w-full">
                                    {stories.map((story) => (
                                        <div key={story.id} className="snap-center shrink-0 w-[85%] md:w-[calc(50%-16px)] lg:w-[calc(33.33%-22px)] p-8 bg-white rounded-3xl border border-slate-200 text-left hover:shadow-xl transition-shadow flex flex-col justify-between">
                                            <div>
                                                <div className="w-12 h-12 rounded-full overflow-hidden mb-6 border-2 border-cyan-100 shadow-sm">
                                                    <img 
                                                        src={story.image_url || 'https://via.placeholder.com/150'} 
                                                        alt={story.name} 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                                                    />
                                                </div>
                                                <p className="text-slate-500 italic mb-6 text-sm md:text-base leading-relaxed">
                                                    "{story.review_text}"
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#0B1E3D]">{story.name}</h4>
                                                <p className="text-xs text-cyan-600 font-bold uppercase tracking-tighter">
                                                    {story.role}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FINAL CTA */}
                <div id="get-started" className="relative mt-20">
                    <div className="bg-gradient-to-br from-[#0B1E3D] to-blue-900 rounded-[3.5rem] p-8 md:p-24 text-white overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-full h-full opacity-10">
                            <img src={whyImage} alt="Nexus" className="w-full h-full object-cover" />
                        </div>
                        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                            <div className="text-center lg:text-left">
                                <h2 className="text-3xl md:text-6xl font-black mb-8 leading-tight">Ready to start your <br /> financial journey?</h2>
                                <p className="text-cyan-100/70 mb-10 text-lg md:text-xl max-w-lg">Experience the future of lending with Nexus. Check your rate in 60 seconds.</p>
                                <Link to="/signup" className="inline-block px-10 py-5 bg-cyan-500 text-white rounded-2xl font-black hover:bg-cyan-400 hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 uppercase tracking-widest text-sm md:text-base">
                                    Get Started Now
                                </Link>
                            </div>
                            <div className="hidden lg:block relative">
                                <div className="absolute inset-0 bg-cyan-400 blur-[100px] opacity-20"></div>
                                <div className="relative transform rotate-6 hover:rotate-0 transition-transform duration-700 bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl">
                                    <div className="flex justify-between items-start mb-12">
                                        <div className="p-4 bg-cyan-500 rounded-2xl shadow-lg"><CreditCard className="text-white" size={32} /></div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest mb-1">Nexus Limit</p>
                                            <p className="text-3xl font-black">$25,000</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 w-3/4"></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-cyan-200 uppercase tracking-tighter">
                                            <span>Instant Approval</span>
                                            <span>94% Score</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}