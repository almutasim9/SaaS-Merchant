'use client';

import Link from 'next/link';
import { useState } from 'react';
import RegisterMerchantModal from '@/components/landing/RegisterMerchantModal';

export default function LandingPage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20">S</div>
            <span className="text-xl font-bold text-slate-900 tracking-tighter">SaaS<span className="text-indigo-600">Plus</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-10">Sign In</Link>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 rotate-12"></div>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-widest animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 is now live
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-slate-900 tracking-tighter leading-[0.9]">
            Start Your Online <br />
            <span className="text-indigo-600 relative">
              Store In Minutes
              <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 358 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17C118.333 5.66667 349.8 -6.2 355 17" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-500 text-xl font-medium leading-relaxed">
            The ultimate platform for modern merchants in Iraq and beyond.
            Launch, scale, and manage your business with professional tools designed for growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white font-bold rounded-[2rem] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 text-lg"
            >
              Launch My Store Free
            </button>
            <Link href="#features" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-bold rounded-[2rem] border-2 border-slate-100 hover:bg-slate-50 transition-all text-lg">
              Explore Features
            </Link>
          </div>

          {/* Social Proof Row */}
          <div className="pt-20">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Trusted by fast-growing brands</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
              {['Mosul Tech', 'Baghdad Fashion', 'Erbil Digital', 'Basra Logistics', 'Hilla Stores'].map((brand) => (
                <span key={brand} className="text-xl font-bold text-slate-900 tracking-tighter hover:text-indigo-600 cursor-default transition-colors">{brand}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Built for the <span className="text-indigo-600">Modern Merchant</span></h2>
            <p className="text-slate-500 font-medium text-lg">Everything you need to run a professional e-commerce business at your fingertips.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all group">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.101 1.101" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Custom Slugs</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Get a professional shop URL like <span className="text-indigo-600 font-bold">saasplus.com/yourname</span>. Build your brand identity with unique storefront links.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all group">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-8 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-time Orders</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Never miss a sale. Track every customer request the second it happens with our live order management dashboard and instant alerts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all group">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Mobile Ready</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Manage your inventory, check sales, and talk to customers from anywhere. Our platform is perfectly optimized for tablets and smartphones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Simple, <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-8">Transparent</span> Pricing</h2>
            <p className="text-slate-500 font-medium text-lg">No hidden fees. Choose the plan that fits your growth stage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50 flex flex-col items-center text-center space-y-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Starter</h4>
                <div className="text-4xl font-bold text-slate-900 mt-2 tracking-tighter">$0<span className="text-base text-slate-400 font-bold">/mo</span></div>
              </div>
              <ul className="space-y-4 text-sm font-bold text-slate-500 w-full">
                <li className="pb-4 border-b border-slate-200">Up to 10 Products</li>
                <li className="pb-4 border-b border-slate-200">Basic Analytics</li>
                <li className="pb-4 border-b border-slate-200">Community Support</li>
              </ul>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-10 rounded-[2.5rem] border-[3px] border-indigo-600 bg-white flex flex-col items-center text-center space-y-6 shadow-2xl shadow-indigo-600/10 relative -translate-y-4">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
              <div>
                <h4 className="text-lg font-bold text-indigo-600">Professional</h4>
                <div className="text-4xl font-bold text-slate-900 mt-2 tracking-tighter">$29<span className="text-base text-slate-400 font-bold">/mo</span></div>
              </div>
              <ul className="space-y-4 text-sm font-bold text-slate-600 w-full">
                <li className="pb-4 border-b border-slate-100">Unlimited Products</li>
                <li className="pb-4 border-b border-slate-100">Advanced Reports</li>
                <li className="pb-4 border-b border-slate-100">Priority Email Support</li>
                <li className="pb-4 border-b border-slate-100">Custom Domain Ready</li>
              </ul>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all outline-none"
              >
                Start Free Trial
              </button>
            </div>

            {/* Business Plan */}
            <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50 flex flex-col items-center text-center space-y-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Enterprise</h4>
                <div className="text-4xl font-bold text-slate-900 mt-2 tracking-tighter">$99<span className="text-base text-slate-400 font-bold">/mo</span></div>
              </div>
              <ul className="space-y-4 text-sm font-bold text-slate-500 w-full">
                <li className="pb-4 border-b border-slate-200">Everything in Pro</li>
                <li className="pb-4 border-b border-slate-200">dedicated Manager</li>
                <li className="pb-4 border-b border-slate-200">API Access & Hooks</li>
              </ul>
              <Link href="/login" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3.5rem] p-12 md:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 blur-[80px] -z-0"></div>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter leading-tight relative z-10">
            Ready to revolutionize <br /> your <span className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-8">online business?</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto relative z-10">
            Join hundreds of successful merchants who have launched their dream stores in record time.
          </p>
          <div className="pt-4 relative z-10">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="inline-block px-12 py-5 bg-white text-slate-900 font-bold rounded-2xl text-lg shadow-2xl hover:bg-indigo-50 hover:scale-105 transition-all"
            >
              Claim Your Store Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
                <span className="text-lg font-bold text-slate-900 tracking-tighter">SaaS<span className="text-indigo-600">Plus</span></span>
              </div>
              <p className="text-slate-400 font-medium max-w-xs leading-relaxed">
                Empowering merchants with cutting-edge e-commerce tools for a digital world. Made with passion for growth.
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</h5>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Integrations</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</h5>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Social</h5>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">LinkedIn</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Twitter X</Link></li>
                <li><Link href="#" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Instagram</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 SaaS-Plus Platform. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

      <RegisterMerchantModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
