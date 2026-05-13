import React, { useState, useEffect } from 'react'; 
import { Link, useLocation } from 'react-router-dom'; 
import { Target, Shield, Globe, Heart, ChevronDown, Rocket, Newspaper, Calendar, ArrowRight, Users, Briefcase, X, Tag } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// Assets
import companyImg from '../assets/company.jpg';
import founderImg from '../assets/founder.jpg';
import ceoImg from '../assets/ceo.jpg';
import managerImg from '../assets/manager.jpg';
import techImg from '../assets/tech.jpg';

export default function AboutUsLinks() {
    const [openFaq, setOpenFaq] = useState(null);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [newsBlogs, setNewsBlogs] = useState([]); 
    const [careerInnovation, setCareerInnovation] = useState(null); // State for Careers section
    const [categories, setCategories] = useState([]); 
    const { hash } = useLocation(); 

    // Fetch Content from Supabase
    useEffect(() => {
        async function fetchData() {
            // 1. Fetch Categories first to map names to IDs if necessary
            const { data: catData } = await supabase.from('categories').select('*');
            setCategories(catData || []);

            // 2. Fetch Blogs and Filter by Category
            const { data: blogData, error: blogError } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!blogError && blogData) {
                // Filter news for the top slider
                const news = blogData.filter(b => b.category?.toLowerCase() === 'news');
                setNewsBlogs(news);

                // Filter for Career Innovation (taking the latest one)
                const career = blogData.find(b => b.category?.toLowerCase() === 'career innovation');
                setCareerInnovation(career);
            }
        }
        fetchData();
    }, []);

    // Handle Hash Scrolling
    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [hash]);

    const team = [
        { name: "Marcus Darwins", role: "Founder & Visionary", img: founderImg },
        { name: "Sarah Moyo", role: "Chief Executive Officer", img: managerImg },
        { name: "David Mapfuudze", role: "Operations Manager", img: ceoImg }
    ];

    const aboutFaqs = [
        { q: "Why did you start in Harare?", a: "We saw that local brilliance was being held back by outdated paperwork. We wanted to build a solution from home, for home." },
        { q: "Are you a bank?", a: "We are an AI-first fintech partner. We work alongside the financial ecosystem to provide faster access to capital." },
        { q: "How do you protect my data?", a: "We use bank-grade AES-256 encryption. Your 'Financial DNA' is seen by our AI, but never sold to third parties." }
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="pt-32 pb-20 bg-white font-sans selection:bg-cyan-100 scroll-smooth">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Section 1: Hero */}
                <div id="mission" className="grid lg:grid-cols-2 gap-16 items-center mb-32 scroll-mt-32">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-600 rounded-full text-sm font-bold mb-6">
                            <Target size={16} /> OUR MISSION
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-[#0B1E3D] mb-8 tracking-tight leading-tight">
                            More than an engine. <br/>
                            <span className="text-cyan-500">A partner in growth.</span>
                        </h1>
                        <p className="text-xl text-slate-500 leading-relaxed mb-8">
                            Nexus is democratizing credit access. We started with a simple observation: the system wasn't built for the modern earner.
                        </p>
                        <div className="flex items-center gap-6 border-t border-slate-100 pt-8">
                            <div>
                                <p className="text-3xl font-black text-[#0B1E3D]">120k+</p>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Users</p>
                            </div>
                            <div className="w-px h-10 bg-slate-100"></div>
                            <div>
                                <p className="text-3xl font-black text-cyan-500">24h</p>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Avg. Funding</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <img src={companyImg} alt="Base" className="rounded-[2.5rem] shadow-2xl relative z-10 w-full h-[450px] object-cover" />
                    </div>
                </div>

                {/* Section 2: News / Blogs (FILTERED) */}
                <div id="press" className="mb-32 scroll-mt-32">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-full text-sm font-bold mb-4">
                                <Newspaper size={16} /> NEXUS BLOG
                            </div>
                            <h2 className="text-4xl font-black text-[#0B1E3D]">Latest from the Newsroom</h2>
                        </div>
                        <div className="text-slate-400 font-bold text-sm flex items-center gap-2">
                            Scroll to explore <ArrowRight size={16} className="animate-bounce-x" />
                        </div>
                    </div>
                    
                    <div className="flex overflow-x-auto pb-8 gap-8 no-scrollbar snap-x snap-mandatory">
                        {newsBlogs.length > 0 ? newsBlogs.map((blog) => (
                            <div key={blog.id} onClick={() => setSelectedBlog(blog)} className="min-w-[300px] md:min-w-[400px] snap-start group cursor-pointer">
                                <div className="overflow-hidden rounded-[2rem] mb-6 shadow-md border border-slate-100">
                                    <img src={blog.img_url} alt={blog.title} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="flex items-center gap-4 text-cyan-600 font-bold text-[10px] mb-3 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(blog.created_at)}</span>
                                    <span className="flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded text-cyan-500"><Tag size={10} /> {blog.category}</span>
                                </div>
                                <h3 className="text-xl font-bold text-[#0B1E3D] mb-3 group-hover:text-cyan-500 transition-colors leading-tight line-clamp-1">{blog.title}</h3>
                                <p className="text-slate-500 text-sm line-clamp-2">{blog.description}</p>
                            </div>
                        )) : (
                            <p className="text-slate-400 italic">No recent news available.</p>
                        )}
                    </div>
                </div>

                {/* News Modal */}
                {selectedBlog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
                            <button onClick={() => setSelectedBlog(null)} className="absolute top-6 right-6 p-3 bg-slate-100 hover:bg-cyan-500 hover:text-white text-slate-500 rounded-full transition-all z-20">
                                <X size={24} />
                            </button>
                            <div className="grid md:grid-cols-2">
                                <div className="h-[300px] md:h-full">
                                    <img src={selectedBlog.img_url} alt={selectedBlog.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-8 md:p-12">
                                    <div className="inline-flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-widest mb-4">
                                        <Calendar size={14} /> {formatDate(selectedBlog.created_at)}
                                        <span className="ml-2 text-slate-400">|</span>
                                        <span className="ml-2">{selectedBlog.category}</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-[#0B1E3D] mb-6 leading-tight">{selectedBlog.title}</h2>
                                    <div className="space-y-4">
                                        <p className="text-slate-600 font-bold leading-relaxed">{selectedBlog.description}</p>
                                        <p className="text-slate-500 leading-relaxed">{selectedBlog.full_info}</p>
                                    </div>
                                    <button onClick={() => setSelectedBlog(null)} className="mt-8 px-8 py-3 bg-[#0B1E3D] text-white rounded-full font-bold hover:bg-cyan-600 transition-colors">
                                        Close Story
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section: Careers (DYNAMICALLY FETCHED) */}
                <div id="careers" className="mb-32 scroll-mt-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <img src={careerInnovation?.img_url || techImg} alt="Career Innovation" className="rounded-[2.5rem] shadow-xl h-[400px] w-full object-cover" />
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-6">
                                <Briefcase size={16} /> CAREER & INNOVATION
                            </div>
                            <h2 className="text-4xl font-black text-[#0B1E3D] mb-6">
                                {careerInnovation?.title || "Bridging Academic Excellence with Professional AI"}
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed mb-6">
                                {careerInnovation?.description || "Our development philosophy stems from a deep foundation in Artificial Intelligence and Fullstack engineering."}
                            </p>
                            {careerInnovation?.full_info && (
                                <div className="p-4 bg-slate-50 rounded-2xl mb-6 text-slate-600 text-sm">
                                    {careerInnovation.full_info}
                                </div>
                            )}
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 bg-cyan-100 p-1 rounded-md text-cyan-600 font-bold">✓</div>
                                    <p className="text-slate-600"><span className="font-bold text-[#0B1E3D]">Fintech AI:</span> Designing security-first algorithms for fraud detection.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 bg-cyan-100 p-1 rounded-md text-cyan-600 font-bold">✓</div>
                                    <p className="text-slate-600"><span className="font-bold text-[#0B1E3D]">Responsive Architecture:</span> Crafting high-performance React and Tailwind interfaces.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 3: Growth Hub */}
                <div id="ecosystem" className="mb-32 scroll-mt-32">
                    <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-12 text-white">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-bold mb-6 border border-cyan-500/20">
                                <Users size={16} /> ECOSYSTEM
                            </div>
                            <h2 className="text-4xl font-black mb-6">Building the Future</h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                We aren't building in a vacuum. Nexus is actively collaborating with Harare's innovation hubs to ensure our AI models align with local standards.
                            </p>
                            <Link to="/contact" className="inline-block bg-white text-slate-900 px-8 py-3 rounded-2xl font-bold hover:bg-cyan-500 hover:text-white transition-all">Connect to Hub</Link>
                        </div>
                        <div className="lg:w-1/2 w-full grid grid-cols-1 gap-4">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition-colors">
                                <h4 className="font-bold text-xl mb-2 text-cyan-400">Impact Hub Harare x Nexus</h4>
                                <p className="text-slate-400 text-sm">Strategic alignment for monthly AI essentials and financial security workshops.</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition-colors">
                                <h4 className="font-bold text-xl mb-2 text-cyan-400">Regulatory Roadmap</h4>
                                <p className="text-slate-400 text-sm">Working within the framework of the RBZ Fintech Sandbox.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leadership and FAQ remain the same... */}
                <div id="leadership" className="mb-32 scroll-mt-32">
                    <div className="text-center md:text-left mb-16">
                        <h2 className="text-4xl font-black text-[#0B1E3D]">The People Behind the Code</h2>
                    </div>
                    <div className="flex overflow-x-auto md:grid md:grid-cols-3 pb-8 gap-12 no-scrollbar snap-x snap-mandatory">
                        {team.map((member, i) => (
                            <div key={i} className="min-w-[280px] md:min-w-0 snap-center group text-center">
                                <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-slate-50 shadow-xl mx-auto mb-6">
                                    <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h4 className="text-2xl font-bold text-[#0B1E3D]">{member.name}</h4>
                                <p className="text-cyan-600 font-medium">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 5: FAQ */}
                <div id="faq" className="mb-32 max-w-3xl mx-auto scroll-mt-32">
                    <h2 className="text-3xl font-black text-[#0B1E3D] text-center mb-12">Common Questions</h2>
                    <div className="space-y-4">
                        {aboutFaqs.map((faq, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-6 text-left flex justify-between items-center group transition-colors hover:bg-slate-100"
                                >
                                    <span className="font-bold text-[#0B1E3D] group-hover:text-cyan-600">{faq.q}</span>
                                    <ChevronDown className={`text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-cyan-500' : ''}`} />
                                </button>
                                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0B1E3D] rounded-[2.5rem] p-12 text-center relative overflow-hidden border border-white/10">
                    <h3 className="text-3xl font-black text-white mb-8 relative z-10">Let's build your future together.</h3>
                    <Link to="/signup" className="relative z-10 inline-block bg-cyan-500 text-white px-10 py-4 rounded-full font-bold hover:shadow-2xl transition-all">Get Started</Link>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(5px); }
                }
                .animate-bounce-x { animation: bounce-x 1s infinite; }
            `}} />
        </div>
    );
}