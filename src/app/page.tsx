'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getPublicSubscriptionPlans, PublicSubscriptionPlan } from '@/app/landingActions';


const translations: any = {
  ar: {
    dir: 'rtl',
    nav: { features: 'المميزات', pricing: 'الأسعار', login: 'تسجيل الدخول', start: 'تواصل معنا' },
    hero: {
      badge: 'الجيل الجديد من التجارة الإلكترونية أصبح متاحاً',
      title: 'انطلق بمتجرك',
      titleHighlight: 'في دقائق',
      subtitle: 'المنصة الأذكى للتجار في العراق والعالم العربي. قم بإدارة وبيع منتجاتك بأدوات احترافية مصممة خصيصاً لنمو أعمالك.',
      primaryBtn: 'تواصل معنا',
      secondaryBtn: 'اكتشف المزايا',
      trusted: 'موثوق من قبل العلامات الصاعدة'
    },
    features: {
      header: 'أدوات ذكية',
      headerHighlight: 'لنمو أعمالك',
      subheader: 'كل ما تحتاجه لإدارة متجرك باحترافية وسهولة، في مكان واحد.',
      cards: [
        { title: 'رابط خاص لمتجرك', desc: 'احصل على رابط احترافي لمتجرك مثل saasplus.com/shop. ابدأ بناء هويتك التجارية اليوم.' },
        { title: 'طلبات فورية', desc: 'لا تفوت أي عملية بيع. تابع طلبات عملائك لحظة بلحظة مع نظام تنبيهات ذكي وسريع.' },
        { title: 'تحكم كامل من الموبايل', desc: 'قم بإدارة منتجاتك، وتواصل مع عملائك من أي مكان وفي أي وقت عبر واجهة موبايل سريعة.' }
      ]
    },
    cta: { title: 'جاهز لإحداث ثورة في', titleHighlight: 'تجارتك الرقمية؟', subtitle: 'انضم الآن إلى مئات التجار الذين اختاروا منصتنا لبداية قوية واحترافية.', btn: 'تواصل معنا الآن' },
    footer: { desc: 'تمكين التجار في العالم العربي بأحدث تقنيات التجارة الإلكترونية. صنع خصيصاً للتوسع والنمو.', platform: 'المنصة', support: 'الدعم', rights: '© 2026 SaaS-Plus Platform. جميع الحقوق محفوظة.' }
  },
  en: {
    dir: 'ltr',
    nav: { features: 'Features', pricing: 'Pricing', login: 'Login', start: 'Contact Us' },
    hero: {
      badge: 'Next generation e-commerce is here',
      title: 'Launch Your Store',
      titleHighlight: 'In Minutes',
      subtitle: 'The smartest platform for merchants in Iraq and the MENA. Manage and sell your products with professional tools built for growth.',
      primaryBtn: 'Contact Us',
      secondaryBtn: 'Explore Features',
      trusted: 'Trusted by rising brands'
    },
    features: {
      header: 'Smart Tools for',
      headerHighlight: 'Your Growth',
      subheader: 'Everything you need to run your store professionally and easily, all in one place.',
      cards: [
        { title: 'Custom URL', desc: 'Get a professional link like saasplus.com/shop. Start building your brand identity today.' },
        { title: 'Instant Orders', desc: 'Never miss a sale. Track your customer requests in real-time with our smart alert system.' },
        { title: 'Mobile Control', desc: 'Manage your products and connect with customers anytime, anywhere via a fast mobile interface.' }
      ]
    },
    cta: { title: 'Ready to Revolutionize', titleHighlight: 'Your Digital Trade?', subtitle: 'Join hundreds of merchants who chose our platform for a powerful and professional start.', btn: 'Contact Us Now' },
    footer: { desc: 'Empowering merchants across the Arab world with cutting-edge e-commerce tech. Built for scale.', platform: 'Platform', support: 'Support', rights: '© 2026 SaaS-Plus Platform. All Rights Reserved.' }
  },
  ku: {
    dir: 'rtl',
    nav: { features: 'تایبەتمەندییەکان', pricing: 'نرخەکان', login: 'چوونەژوورەوە', start: 'پەیوەندیمان پێوە بکە' },
    hero: {
      badge: 'نەوەی نوێی بازرگانی ئەلیکترۆنی ئێستا بەردەستە',
      title: 'فڕۆشگاکەت',
      titleHighlight: 'لە چەند خولەکێکدا',
      subtitle: 'ژیرترین پلاتفۆرم بۆ بازرگانان لە عێراق و جیهانی عەرەبی. بەرهەمەکانت بفرۆشە بە ئامرازی پرۆفیشناڵ.',
      primaryBtn: 'پەیوەندیمان پێوە بکە',
      secondaryBtn: 'تایبەتمەندییەکان ببینە',
      trusted: 'لەلایەن براندە پێشەنگەکانەوە متمانەی پێکراوە'
    },
    features: {
      header: 'ئامرازی زیرەک',
      headerHighlight: 'بۆ گەشەی بازرگانیت',
      subheader: 'هەموو ئەوەی پێویستتە بۆ بەڕێوەبردنی فڕۆشگاکەت بە پرۆفیشناڵی، لە یەک شوێندا.',
      cards: [
        { title: 'بەستەری تایبەت', desc: 'بەستەرێکی پرۆفیشناڵ وەربگرە وەک saasplus.com/shop. ئەمڕۆ دەست بکە بە دد.عتکردنی ناسنامەی براندەکەت.' },
        { title: 'داواکارییە دەستبەجێیەکان', desc: 'هیچ فرۆشتنێک لەدەست مەدە. بەدواداچوون بۆ داواکارییەکان بکە بە سیستەمێکی ئاگادارکردنەوەی ژیر.' },
        { title: 'کۆنترۆڵی تەواو بە مۆبایل', desc: 'بەرهەمەکانت بەڕێوەببەرە و پەیوەندی بە کڕیارانەوە بکە لە هەر کات و شوێنێکدا.' }
      ]
    },
    cta: { title: 'ئامادەی بۆ گۆڕانکاری لە', titleHighlight: 'بازرگانی دیجیتاڵیدا؟', subtitle: 'پەیوەندی بکە بە سەدان بازرگان کە پلاتفۆرمەکەمانیان هەڵبژاردووە بۆ سەرەتایەکی بەهێز.', btn: 'پەیوەندیمان پێوە بکە' },
    footer: { desc: 'بەهێزکردنی بازرگانان لە جیهانی عەرەبیدا بە نوێترین تەکنەلۆژیای بازرگانی ئەلیکترۆنی.', platform: 'پلاتفۆرم', support: 'پشتیوانی', rights: '© 2026 SaaS-Plus Platform. هەموو مافەکان پارێزراوە.' }
  }
};

export default function LandingPage() {
  const WHATSAPP_LINK = 'https://wa.me/9647703854913';
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en' | 'ku'>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PublicSubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const t = translations[language];

  useEffect(() => {
    setIsLoaded(true);
    const savedLang = localStorage.getItem('saas-plus-lang') as any;
    const savedTheme = localStorage.getItem('saas-plus-theme') as any;
    if (savedLang && translations[savedLang]) setLanguage(savedLang);
    if (savedTheme) setTheme(savedTheme);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const fetchPlans = async () => {
      const res = await getPublicSubscriptionPlans();
      if (res.success && res.data) {
        setPlans(res.data);
      }
      setIsLoadingPlans(false);
    };
    fetchPlans();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lang: 'ar' | 'en' | 'ku') => {
    setLanguage(lang);
    localStorage.setItem('saas-plus-lang', lang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('saas-plus-theme', newTheme);
  };

  if (!isLoaded) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/30 overflow-x-hidden font-sans`}
      dir={t.dir}
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-300/20'} blur-[120px] rounded-full animate-pulse transition-colors duration-1000`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${theme === 'dark' ? 'bg-violet-600/20' : 'bg-violet-300/20'} blur-[120px] rounded-full animate-pulse [animation-delay:2s] transition-colors duration-1000`}></div>
        {theme === 'light' && (
          <div className="absolute top-[20%] left-[20%] w-full h-full bg-white/20 backdrop-blur-[100px]"></div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled || isMobileMenuOpen ? (theme === 'dark' ? 'bg-[#020617]/80 backdrop-blur-2xl py-4 border-b border-white/5' : 'bg-white/80 backdrop-blur-2xl py-4 border-b border-slate-200 shadow-sm') : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">S</div>
            <span className={`text-xl md:text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              SaaS<span className="text-indigo-500 font-black">Plus</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <Link href="#features" className={`text-sm font-bold transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>{t.nav.features}</Link>
            <Link href="#pricing" className={`text-sm font-bold transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>{t.nav.pricing}</Link>

            <LangThemeSwitcher language={language} changeLanguage={changeLanguage} theme={theme} toggleTheme={toggleTheme} />

            <Link href="/login" className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-white hover:text-indigo-400 border-r border-white/10 pr-10' : 'text-slate-900 hover:text-indigo-600 border-r border-slate-200 pr-10'}`}>{t.nav.login}</Link>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative group px-8 py-3.5 text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 overflow-hidden ${theme === 'dark' ? 'bg-white text-slate-950 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-600/20'}`}
            >
              <span className="relative z-10 font-black">{t.nav.start}</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-indigo-600 shadow-sm'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-[500px] opacity-100 py-8 px-6 border-t border-white/5' : 'max-h-0 opacity-0 py-0 overflow-hidden'}`}>
          <div className="flex flex-col gap-6 text-center">
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-black transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.nav.features}</Link>
            <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-black transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.nav.pricing}</Link>

            <div className="flex justify-center">
              <LangThemeSwitcher language={language} changeLanguage={changeLanguage} theme={theme} toggleTheme={toggleTheme} isMobile />
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <Link href="/login" className={`text-lg font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.nav.login}</Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full py-5 font-black rounded-[2rem] shadow-xl text-lg transition-all active:scale-95 text-center block ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
              >
                {t.nav.start}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-48 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8 md:space-y-10">
            <div className={`inline-flex items-center gap-3 px-4 py-2 backdrop-blur-xl border rounded-full transition-colors mx-auto md:mx-0 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-indigo-50 border-indigo-100'}`}>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
              </span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{t.hero.badge}</span>
            </div>

            <h1 className={`text-4xl sm:text-5xl md:text-[5.5rem] lg:text-8xl font-black tracking-tight leading-[1] transition-colors text-center md:text-start ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.hero.title} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-l from-indigo-500 via-violet-500 to-blue-500 drop-shadow-sm">{t.hero.titleHighlight}</span>
            </h1>

            <p className={`max-w-xl text-lg md:text-xl font-medium leading-relaxed transition-colors text-center md:text-start mx-auto md:mx-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative w-full sm:w-auto px-10 md:px-12 py-5 font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 text-xl overflow-hidden text-center ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
              >
                <span className="relative z-10">{t.hero.primaryBtn}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              <Link href="#features" className={`w-full sm:w-auto px-10 md:px-12 py-5 backdrop-blur-xl font-black rounded-[2rem] border transition-all text-xl text-center ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'}`}>
                {t.hero.secondaryBtn}
              </Link>
            </div>

            {/* Trusted By */}
            <div className="pt-16 md:pt-20 space-y-8 text-center md:text-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.hero.trusted}</p>
              <div className={`flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 transition-all duration-700 ${theme === 'dark' ? 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}>
                {['Mosul Tech', 'Baghdad Fashion', 'Erbil Digital', 'Basra Logistics'].map((brand) => (
                  <span key={brand} className={`text-base md:text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{brand}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative hidden md:block select-none">
            <div className={`relative z-10 backdrop-blur-3xl border p-8 rounded-[3.5rem] shadow-2xl animate-float transition-all duration-700 ${theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-white/60 border-indigo-100 shadow-indigo-200/50'}`}>
              <div className={`h-[500px] w-full rounded-[2.5rem] overflow-hidden border relative group shadow-inner ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white/80 border-slate-100'}`}>
                <div className={`absolute inset-0 bg-gradient-to-br transition-colors ${theme === 'dark' ? 'from-indigo-500/10 to-transparent' : 'from-indigo-500/5 to-transparent'}`}></div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-40 h-6 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}></div>
                    <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className={`h-40 rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}></div>
                    <div className={`h-40 rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}></div>
                  </div>
                  <div className="space-y-3">
                    <div className={`w-full h-12 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}></div>
                    <div className={`w-[80%] h-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                  </div>
                </div>
                {/* Floating Notification */}
                <div className={`absolute top-1/2 -right-10 p-4 rounded-2xl shadow-2xl animate-bounce-slow border ${theme === 'dark' ? 'bg-[#020617] border-white/10' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 shadow-lg shadow-emerald-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div className={t.dir === 'rtl' ? 'pr-2' : 'pl-2'}>
                      <p className={`text-[10px] font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>طلب جديد!</p>
                      <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">SaaS Plus Engine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] -z-10 transition-colors ${theme === 'dark' ? 'bg-indigo-500/30' : 'bg-indigo-200/50'}`}></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`max-w-3xl mb-16 md:mb-20 space-y-6 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h2 className={`text-4xl md:text-6xl font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.features.header} <br />
              <span className={`bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500 underline decoration-8 underline-offset-[12px] ${theme === 'dark' ? 'decoration-indigo-400/20' : 'decoration-indigo-500/10'}`}>
                {t.features.headerHighlight}
              </span>
            </h2>
            <p className={`font-medium text-lg md:text-xl leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.features.subheader}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title={t.features.cards[0].title}
              description={t.features.cards[0].desc}
              icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
              color="indigo"
              theme={theme}
            />
            <FeatureCard
              title={t.features.cards[1].title}
              description={t.features.cards[1].desc}
              icon="M13 10V3L4 14h7v7l9-11h-7z"
              color="rose"
              theme={theme}
            />
            <FeatureCard
              title={t.features.cards[2].title}
              description={t.features.cards[2].desc}
              icon="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              color="emerald"
              theme={theme}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-24 md:py-32 relative ${theme === 'dark' ? 'bg-[#020617]/50' : 'bg-slate-50/50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className={`text-4xl md:text-5xl font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              اختر الباقة المناسبة لمتجرك
            </h2>
            <p className={`font-medium text-lg leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              خطط مرنة تناسب طموحاتك وحجم مبيعاتك
            </p>
          </div>

          <div className="flex justify-center mb-12 md:mb-16">
            <div className={`inline-flex items-center p-1 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${billingCycle === 'monthly' ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
              >
                الدفع السنوي
                {(() => {
                  const maxDiscount = plans.length > 0 ? Math.max(...plans.map(p => p.yearly_discount_percent || 0)) : 15;
                  return maxDiscount > 0 ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      وفر {maxDiscount}%
                    </span>
                  ) : null;
                })()}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-10">
            {isLoadingPlans ? (
              <div className="col-span-3 text-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className={`mt-4 font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>جاري تحميل الباقات...</p>
              </div>
            ) : (
              plans.map((plan, index) => {
                // Determine styles based on index mapping (0=Free, 1=Silver, 2=Gold in typical sorted setup)
                const isSilver = index === 1;
                const isGold = index === 2;

                let cardClasses = `rounded-3xl p-8 border flex flex-col pt-10 `;
                let titleClasses = `text-2xl font-black mb-2 `;
                let priceClasses = `text-4xl font-black `;
                let iconColorClass = '';
                let buttonClasses = `w-full py-3.5 text-center font-bold rounded-xl transition-all `;
                let featuresClasses = `space-y-4 mb-8 flex-1 text-sm font-bold mt-4 `;

                if (isGold) {
                  cardClasses += theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 ' : 'bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-xl shadow-amber-200/20 ';
                  titleClasses += theme === 'dark' ? 'text-amber-400' : 'text-amber-800';
                  priceClasses += theme === 'dark' ? 'text-amber-400' : 'text-amber-600';
                  iconColorClass = 'text-amber-500';
                  buttonClasses += theme === 'dark' ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30';
                  featuresClasses += theme === 'dark' ? 'text-amber-200/80' : 'text-amber-900/80';
                } else if (isSilver) {
                  cardClasses = `relative rounded-3xl p-8 border-2 shadow-2xl scale-105 flex flex-col ${theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500 shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-500 shadow-indigo-500/20'}`;
                  titleClasses += theme === 'dark' ? 'text-white pt-4' : 'text-indigo-950 pt-4';
                  priceClasses += theme === 'dark' ? 'text-white' : 'text-indigo-950';
                  iconColorClass = 'text-indigo-500';
                  buttonClasses += 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30';
                  featuresClasses += theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900/80';
                } else {
                  cardClasses += theme === 'dark' ? 'bg-white/5 border-white/10 ' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/20 ';
                  titleClasses += theme === 'dark' ? 'text-white' : 'text-slate-900';
                  priceClasses += theme === 'dark' ? 'text-white' : 'text-slate-900';
                  iconColorClass = 'text-emerald-500';
                  buttonClasses += theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800';
                  featuresClasses += theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
                }

                const displayName = language === 'ar' ? plan.name_ar : language === 'en' ? plan.name_en : plan.name_ku || plan.name_ar;
                const featuresList = language === 'ar' ? plan.features_ar : language === 'en' ? plan.features_en : plan.features_ku || plan.features_ar;
                const displayPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

                return (
                  <div key={plan.id} className={cardClasses}>
                    {isSilver && (
                      <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                        <span className="bg-indigo-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">الأكثر شعبية</span>
                      </div>
                    )}
                    <h3 className={titleClasses}>{displayName}</h3>
                    <p className={`mt-1 text-sm font-bold min-h-[40px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {language === 'ar' ? plan.description_ar : language === 'en' ? plan.description_en : plan.description_ku || plan.description_ar}
                    </p>
                    <div className="flex items-baseline gap-2 mb-6 mt-4">
                      <span className={priceClasses} dir="ltr">
                        {displayPrice > 0 ? `${displayPrice.toLocaleString()} د.ع` : 'مجانًا'}
                      </span>
                      <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {displayPrice > 0 ? (billingCycle === 'yearly' ? '/ سنوياً' : '/ شهرياً') : ''}
                      </span>
                    </div>
                    <ul className={featuresClasses}>
                      {(featuresList || []).map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-3">
                          <svg className={`w-5 h-5 flex-shrink-0 ${iconColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
                      {displayPrice === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6">
        <div className={`max-w-6xl mx-auto rounded-[3rem] md:rounded-[4rem] p-10 md:p-32 text-center space-y-10 md:space-y-12 relative overflow-hidden shadow-2xl border ${theme === 'dark' ? 'border-white/5 bg-gradient-to-br from-indigo-600 to-violet-700' : 'border-indigo-100 bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

          <h2 className="text-3xl sm:text-4xl md:text-7xl font-black text-white tracking-tight leading-none relative z-10">
            {t.cta.title} <br /> <span className="opacity-60">{t.cta.titleHighlight}</span>
          </h2>
          <p className="text-white/80 font-medium text-lg md:text-xl max-w-2xl mx-auto relative z-10">
            {t.cta.subtitle}
          </p>
          <div className="pt-6 relative z-10">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-4 px-10 md:px-14 py-5 md:py-6 bg-white text-indigo-600 font-black rounded-[2rem] md:rounded-[2.5rem] text-xl md:text-2xl shadow-2xl hover:bg-slate-900 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              {t.cta.btn}
              <svg
                className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${t.dir === 'rtl' ? 'group-hover:translate-x-[-10px]' : 'group-hover:translate-x-[10px]'} ${t.dir === 'rtl' ? 'rotate-0' : 'rotate-180'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`pt-24 md:pt-32 pb-16 relative z-10 border-t transition-colors ${theme === 'dark' ? 'bg-[#020617] border-white/5' : 'bg-white border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
                <span className={`text-2xl md:text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SaaS<span className="text-indigo-500">Plus</span></span>
              </div>
              <p className={`font-bold max-w-sm leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.footer.desc}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-10 md:gap-20">
              <FooterGroup title={t.footer.platform} items={language === 'ar' ? ['المميزات', 'الأسعار', 'التحديثات'] : language === 'en' ? ['Features', 'Pricing', 'Updates'] : ['تایبەتمەندییەکان', 'نرخەکان', 'نوێکارییەکان']} theme={theme} />
              <FooterGroup title={t.footer.support} items={language === 'ar' ? ['تواصل معنا', 'مركز المساعدة', 'الشروط'] : language === 'en' ? ['Contact', 'Help Center', 'Terms'] : ['پەیوەندی', 'سەنتەری یارمەتی', 'مەرجەکان']} theme={theme} />
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{t.footer.rights}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>SaaS+ Infrastructure Active</span>
            </div>
          </div>
        </div>
      </footer>



      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function LangThemeSwitcher({ language, changeLanguage, theme, toggleTheme, isMobile }: any) {
  return (
    <div className={`flex items-center gap-4 ${isMobile ? 'scale-125' : ''}`}>
      <div className={`flex items-center gap-2 lg:gap-3 px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
        <button onClick={() => changeLanguage('ar')} className={`text-[10px] font-black uppercase transition-all ${language === 'ar' ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-400'}`}>AR</button>
        <button onClick={() => changeLanguage('ku')} className={`text-[10px] font-black uppercase transition-all ${language === 'ku' ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-400'}`}>KU</button>
        <button onClick={() => changeLanguage('en')} className={`text-[10px] font-black uppercase transition-all ${language === 'en' ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-400'}`}>EN</button>
      </div>
      {!isMobile && (
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200 shadow-sm'}`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      )}
    </div>
  );
}

function FeatureCard({ title, description, icon, color, theme }: any) {
  const colors: any = {
    indigo: theme === 'dark' ? 'from-indigo-500/10 to-transparent text-indigo-400 group-hover:bg-indigo-600 border-indigo-500/20' : 'from-indigo-500/5 to-transparent text-indigo-600 group-hover:bg-indigo-600 border-indigo-100',
    rose: theme === 'dark' ? 'from-rose-500/10 to-transparent text-rose-400 group-hover:bg-rose-600 border-rose-500/20' : 'from-rose-500/5 to-transparent text-rose-600 group-hover:bg-rose-600 border-rose-100',
    emerald: theme === 'dark' ? 'from-emerald-500/10 to-transparent text-emerald-400 group-hover:bg-emerald-600 border-emerald-500/20' : 'from-emerald-500/5 to-transparent text-emerald-600 group-hover:bg-emerald-600 border-emerald-100',
  };

  return (
    <div className={`group relative p-8 md:p-10 backdrop-blur-xl border rounded-[2.5rem] md:rounded-[3.5rem] hover:border-indigo-500/30 transition-all duration-500 hover:shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:shadow-black/50' : 'bg-white border-slate-100 hover:shadow-indigo-200/40'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] md:rounded-[3.5rem]`}></div>
      <div className="relative z-10">
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-all duration-500 group-hover:rotate-12 group-hover:text-white ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
          <svg className={`w-7 h-7 md:w-8 md:h-8 ${theme === 'dark' ? colors[color].split(' ')[1] : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <h3 className={`text-xl md:text-2xl font-black mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`font-bold leading-relaxed text-sm md:text-base transition-colors ${theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-500'}`}>{description}</p>
      </div>
    </div>
  );
}

function FooterGroup({ title, items, theme }: any) {
  return (
    <div className="space-y-4 md:space-y-6">
      <h5 className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{title}</h5>
      <ul className="space-y-2 md:space-y-3">
        {items.map((item: any) => (
          <li key={item}>
            <Link href="#" className={`text-sm font-black transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}>
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
