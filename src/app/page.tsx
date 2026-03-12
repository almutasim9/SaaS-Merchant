'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getPublicSubscriptionPlans, PublicSubscriptionPlan } from '@/app/landingActions';


const translations: any = {
  ar: {
    dir: 'rtl',
    nav: { features: 'المميزات', pricing: 'الأسعار', login: 'تسجيل الدخول', start: 'تواصل معنا' },
    contact: { title: 'تواصل معنا', subtitle: 'نحن هنا لمساعدتك. تواصل معنا عبر القنوات التالية.', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', whatsapp: 'واتسآب', social: 'التواصل الاجتماعي' },
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
        { title: 'رابط خاص لمتجرك', desc: 'احصل على رابط احترافي لمتجرك مثل tajirzone.com/shop. ابدأ بناء هويتك التجارية اليوم.' },
        { title: 'طلبات فورية', desc: 'لا تفوت أي عملية بيع. تابع طلبات عملائك لحظة بلحظة مع نظام تنبيهات ذكي وسريع.' },
        { title: 'تحكم كامل من الموبايل', desc: 'قم بإدارة منتجاتك، وتواصل مع عملائك من أي مكان وفي أي وقت عبر واجهة موبايل سريعة.' }
      ]
    },
    cta: { title: 'جاهز لإحداث ثورة في', titleHighlight: 'تجارتك الرقمية؟', subtitle: 'انضم الآن إلى مئات التجار الذين اختاروا منصتنا لبداية قوية واحترافية.', btn: 'تواصل معنا الآن' },
    footer: { desc: 'تمكين التجار في العالم العربي بأحدث تقنيات التجارة الإلكترونية. صنع خصيصاً للتوسع والنمو.', platform: 'المنصة', support: 'الدعم', rights: '© 2026 TajirZone. جميع الحقوق محفوظة.' }
  },
  en: {
    dir: 'ltr',
    nav: { features: 'Features', pricing: 'Pricing', login: 'Login', start: 'Contact Us' },
    contact: { title: 'Contact Us', subtitle: 'We are here to help. Reach out through any of these channels.', email: 'Email', phone: 'Phone Number', whatsapp: 'WhatsApp', social: 'Social Media' },
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
        { title: 'Custom URL', desc: 'Get a professional link like tajirzone.com/shop. Start building your brand identity today.' },
        { title: 'Instant Orders', desc: 'Never miss a sale. Track your customer requests in real-time with our smart alert system.' },
        { title: 'Mobile Control', desc: 'Manage your products and connect with customers anytime, anywhere via a fast mobile interface.' }
      ]
    },
    cta: { title: 'Ready to Revolutionize', titleHighlight: 'Your Digital Trade?', subtitle: 'Join hundreds of merchants who chose our platform for a powerful and professional start.', btn: 'Contact Us Now' },
    footer: { desc: 'Empowering merchants across the Arab world with cutting-edge e-commerce tech. Built for scale.', platform: 'Platform', support: 'Support', rights: '© 2026 TajirZone. All Rights Reserved.' }
  },
  ku: {
    dir: 'rtl',
    nav: { features: 'تایبەتمەندییەکان', pricing: 'نرخەکان', login: 'چوونەژوورەوە', start: 'پەیوەندیمان پێوە بکە' },
    contact: { title: 'پەیوەندیمان پێوە بکە', subtitle: 'ئێمە لێرەین بۆ یارمەتیت. لە ڕێگەی ئەم کەناڵانەوە پەیوەندیمان پێوە بکە.', email: 'ئیمەیڵ', phone: 'ژمارەی تەلەفۆن', whatsapp: 'واتسئەپ', social: 'تۆڕە کۆمەڵایەتییەکان' },
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
        { title: 'بەستەری تایبەت', desc: 'بەستەرێکی پرۆفیشناڵ وەربگرە وەک tajirzone.com/shop. ئەمڕۆ دەست بکە بە دد.عتکردنی ناسنامەی براندەکەت.' },
        { title: 'داواکارییە دەستبەجێیەکان', desc: 'هیچ فرۆشتنێک لەدەست مەدە. بەدواداچوون بۆ داواکارییەکان بکە بە سیستەمێکی ئاگادارکردنەوەی ژیر.' },
        { title: 'کۆنترۆڵی تەواو بە مۆبایل', desc: 'بەرهەمەکانت بەڕێوەببەرە و پەیوەندی بە کڕیارانەوە بکە لە هەر کات و شوێنێکدا.' }
      ]
    },
    cta: { title: 'ئامادەی بۆ گۆڕانکاری لە', titleHighlight: 'بازرگانی دیجیتاڵیدا؟', subtitle: 'پەیوەندی بکە بە سەدان بازرگان کە پلاتفۆرمەکەمانیان هەڵبژاردووە بۆ سەرەتایەکی بەهێز.', btn: 'پەیوەندیمان پێوە بکە' },
    footer: { desc: 'بەهێزکردنی بازرگانان لە جیهانی عەرەبیدا بە نوێترین تەکنەلۆژیای بازرگانی ئەلیکترۆنی.', platform: 'پلاتفۆرم', support: 'پشتیوانی', rights: '© 2026 TajirZone. هەموو مافەکان پارێزراوە.' }
  }
};

export default function LandingPage() {
  const WHATSAPP_LINK = 'https://wa.me/9647703854913';
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en' | 'ku'>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PublicSubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const t = translations[language];

  useEffect(() => {
    setIsLoaded(true);
    const savedLang = localStorage.getItem('tajirzone-lang') as any;
    const savedTheme = localStorage.getItem('tajirzone-theme') as any;
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
    localStorage.setItem('tajirzone-lang', lang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('tajirzone-theme', newTheme);
  };

  if (!isLoaded) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/30 overflow-x-hidden font-sans`}
      dir={t.dir}
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#060818] transition-colors duration-1000 overflow-hidden">
        {/* Dynamic Light/Dark Orbs */}
        <div className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse transition-all duration-1000 ${theme === 'dark' ? 'bg-indigo-600/30' : 'bg-indigo-300/40'}`}></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-[140px] mix-blend-screen opacity-40 animate-pulse [animation-delay:2s] transition-all duration-1000 ${theme === 'dark' ? 'bg-violet-600/30' : 'bg-violet-300/40'}`}></div>
        
        {/* Subtle grid pattern overlay */}
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] ${theme === 'dark' ? 'invert' : ''}`}></div>
      </div>

      {/* Floating Language & Theme Switcher (Desktop) */}
      <div className="fixed bottom-6 left-6 z-[200] hidden md:block">
        <LangThemeSwitcher language={language} changeLanguage={changeLanguage} theme={theme} toggleTheme={toggleTheme} mode="vertical" />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled || isMobileMenuOpen ? (theme === 'dark' ? 'bg-[#020617]/80 backdrop-blur-2xl py-4 border-b border-white/5' : 'bg-white/80 backdrop-blur-2xl py-4 border-b border-slate-200 shadow-sm') : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">S</div>
            <span className={`text-xl md:text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Tajir<span className="text-indigo-500 font-black">Zone</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <Link href="#features" className={`text-sm font-bold transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>{t.nav.features}</Link>
            <Link href="#pricing" className={`text-sm font-bold transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>{t.nav.pricing}</Link>

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

            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <Link href="/login" className={`text-lg font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.nav.login}</Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full py-4 font-black rounded-2xl shadow-xl text-lg transition-all active:scale-95 text-center block mb-4 ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
              >
                {t.nav.start}
              </a>
              {/* Mobile Mobile Switcher */}
              <div className="flex justify-center w-full">
                <LangThemeSwitcher language={language} changeLanguage={changeLanguage} theme={theme} toggleTheme={toggleTheme} mode="horizontal" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-56 pb-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center z-10 relative">
          
          <div className="space-y-8 md:space-y-10 flex flex-col pt-10">
            {/* Badge */}
            <div className={`inline-flex items-center gap-3 px-5 py-2.5 backdrop-blur-2xl border rounded-full transition-all self-center md:self-start animate-fade-in-up ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-indigo-50/80 border-indigo-100/50 hover:bg-indigo-100/80 shadow-sm'}`}>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>{t.hero.badge}</span>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto text-center md:text-start">
              <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t.hero.title} <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_auto] animate-gradient">
                  {t.hero.titleHighlight}
                </span>
              </h1>

              <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto md:mx-0 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.hero.subtitle}
              </p>
            </div>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-5 w-full pt-4">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative w-full sm:w-auto px-12 py-5 font-bold rounded-[2rem] shadow-2xl transition-all active:scale-95 text-xl overflow-hidden text-center hover:shadow-indigo-500/50 ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-slate-900 text-white shadow-slate-900/40'}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.hero.primaryBtn}
                <svg className={`w-5 h-5 transition-transform ${t.dir === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.dir === 'rtl' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}/></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <Link href="#features" className={`w-full sm:w-auto px-12 py-5 backdrop-blur-xl font-bold rounded-[2rem] border transition-all text-xl text-center group ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' : 'bg-white/80 border-slate-200 text-slate-900 hover:bg-white shadow-sm hover:shadow-md'}`}>
              {t.hero.secondaryBtn}
            </Link>
          </div>

            <div className="pt-16 md:pt-20 space-y-8 text-center md:text-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.hero.trusted}</p>
              <div className={`flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 transition-all duration-700 ${theme === 'dark' ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}`}>
                {['شركة الموصل التقنية', 'أزياء بغداد', 'أربيل ديجيتال', 'بصرة لوجستكس'].map((brand) => (
                  <span key={brand} className={`text-base md:text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{brand}</span>
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
                      <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">TajirZone Engine</p>
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
          <div className={`max-w-3xl mb-16 md:mb-24 space-y-6 mx-auto text-center`}>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.features.header} <br />
              <span className={`bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500`}>
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
            <div className={`inline-flex items-center p-1.5 rounded-[2rem] backdrop-blur-md shadow-inner ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-slate-200'}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3.5 rounded-[1.5rem] font-bold text-sm transition-all duration-300 ${billingCycle === 'monthly' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30') : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3.5 rounded-[1.5rem] font-bold text-sm transition-all duration-300 flex items-center gap-2 ${billingCycle === 'yearly' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30') : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}`}
              >
                الدفع السنوي
                {(() => {
                  const maxDiscount = plans.length > 0 ? Math.max(...plans.map(p => p.yearly_discount_percent || 0)) : 15;
                  return maxDiscount > 0 ? (
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${billingCycle === 'yearly' ? 'bg-white/20 text-white shadow-inner' : 'bg-emerald-100 text-emerald-700'}`}>
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
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className={`mt-6 font-bold tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>جاري تحميل الباقات...</p>
              </div>
            ) : (
              plans.map((plan, index) => {
                const isSilver = index === 1;
                const isGold = index === 2;

                let cardClasses = `rounded-[2.5rem] p-8 md:p-10 border flex flex-col pt-12 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl backdrop-blur-xl group relative overflow-hidden `;
                let titleClasses = `text-2xl md:text-3xl font-black mb-2 transition-colors `;
                let priceClasses = `text-4xl md:text-5xl font-black transition-colors `;
                let iconColorClass = '';
                let buttonClasses = `w-full py-4 text-center font-bold rounded-2xl transition-all duration-300 overflow-hidden relative z-10 `;
                let featuresClasses = `space-y-4 mb-8 flex-1 text-sm md:text-base font-bold mt-6 `;

                if (isGold) {
                  cardClasses += theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 ' : 'bg-gradient-to-br from-amber-50/80 to-white/90 border-amber-200/50 hover:border-amber-300 shadow-xl shadow-amber-200/20 ';
                  titleClasses += theme === 'dark' ? 'text-amber-400' : 'text-amber-700';
                  priceClasses += theme === 'dark' ? 'text-amber-300' : 'text-amber-600';
                  iconColorClass = 'text-amber-500';
                  buttonClasses += theme === 'dark' ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30';
                  featuresClasses += theme === 'dark' ? 'text-amber-200/70' : 'text-amber-900/70';
                } else if (isSilver) {
                  cardClasses = `relative rounded-[2.5rem] p-8 md:p-10 border-2 shadow-2xl scale-105 flex flex-col pt-12 transition-all duration-500 hover:-translate-y-2 backdrop-blur-2xl group overflow-hidden ${theme === 'dark' ? 'bg-indigo-900/30 border-indigo-500/50 shadow-indigo-500/20 hover:border-indigo-400' : 'bg-indigo-50/90 border-indigo-500/40 shadow-indigo-500/20 hover:border-indigo-500'}`;
                  titleClasses += theme === 'dark' ? 'text-white' : 'text-indigo-950';
                  priceClasses += theme === 'dark' ? 'text-white' : 'text-indigo-950';
                  iconColorClass = theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600';
                  buttonClasses += 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30';
                  featuresClasses += theme === 'dark' ? 'text-indigo-200/80' : 'text-indigo-900/80';
                } else {
                  cardClasses += theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/20 ' : 'bg-white/80 border-slate-200/50 hover:border-slate-300 shadow-xl shadow-slate-200/20 ';
                  titleClasses += theme === 'dark' ? 'text-white' : 'text-slate-900';
                  priceClasses += theme === 'dark' ? 'text-white' : 'text-slate-900';
                  iconColorClass = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
                  buttonClasses += theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white border border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/50';
                  featuresClasses += theme === 'dark' ? 'text-slate-300/80' : 'text-slate-600';
                }

                const displayName = language === 'ar' ? plan.name_ar : language === 'en' ? plan.name_en : plan.name_ku || plan.name_ar;
                const featuresList = language === 'ar' ? plan.features_ar : language === 'en' ? plan.features_en : plan.features_ku || plan.features_ar;
                const displayPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

                return (
                  <div key={plan.id} className={cardClasses}>
                    {/* Decorative Background Blob */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[60px] rounded-full z-0 transition-opacity opacity-0 group-hover:opacity-100 ${isGold ? 'bg-amber-500/20' : isSilver ? 'bg-indigo-500/30' : 'bg-slate-500/20'}`}></div>

                    {isSilver && (
                      <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center z-20">
                        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] md:text-xs font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 border border-white/10">الأكثر شعبية</span>
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      <h3 className={titleClasses}>{displayName}</h3>
                      <p className={`mt-2 text-sm font-medium min-h-[48px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {language === 'ar' ? plan.description_ar : language === 'en' ? plan.description_en : plan.description_ku || plan.description_ar}
                      </p>
                      <div className="flex items-baseline gap-2 mb-8 mt-6">
                        <span className={priceClasses} dir="ltr">
                          {displayPrice > 0 ? `${displayPrice.toLocaleString()} د.ع` : 'مجانًا'}
                        </span>
                        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {displayPrice > 0 ? (billingCycle === 'yearly' ? '/ سنوياً' : '/ شهرياً') : ''}
                        </span>
                      </div>
                      <div className={`w-full h-px mb-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                      <ul className={featuresClasses}>
                        {(featuresList || []).map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                              <svg className={`w-4 h-4 ${iconColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
                        <span className="relative z-10">{displayPrice === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}</span>
                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                      </a>
                    </div>
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

      {/* Contact Section */}
      <section id="contact" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 md:mb-20 text-center space-y-6">
            <h2 className={`text-4xl md:text-5xl font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.contact.title}
            </h2>
            <p className={`font-medium text-lg md:text-xl leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.contact.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ContactCard 
                icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                title={t.contact.email}
                value="info@tajirzone.com"
                link="mailto:info@tajirzone.com"
                theme={theme}
            />
            <ContactCard 
                icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                title={t.contact.phone}
                value="+964 770 385 4913"
                link="tel:+9647703854913"
                theme={theme}
            />
            <ContactCard 
                icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 21.05C10.431 21.05 8.921 20.62 7.621 19.88L2 21.73L3.9 16.24C3.07 14.89 2.59 13.3 2.59 11.63C2.59 6.42 6.83 2.18 12.04 2.18C17.25 2.18 21.49 6.42 21.49 11.63C21.49 16.84 17.25 21.05 12.031 21.05ZM7.021 17.55C8.421 18.51 10.141 19.11 12.031 19.11C16.171 19.11 19.551 15.75 19.551 11.63C19.551 7.51 16.171 4.14 12.041 4.14C7.901 4.14 4.541 7.51 4.541 11.63C4.541 13.78 5.451 15.71 6.941 17.06L6.5 18.36L8.031 17.86C7.681 17.77 7.341 17.67 7.021 17.55Z M16.711 14.54C16.631 14.41 16.421 14.33 16.031 14.14C15.631 13.94 13.711 13.01 13.351 12.87C13.011 12.75 12.741 12.67 12.491 13.07C12.241 13.46 11.531 14.33 11.311 14.58C11.111 14.83 10.891 14.87 10.511 14.67C10.121 14.48 8.861 14.07 7.381 12.75C6.221 11.71 5.441 10.41 5.221 10.03C5.011 9.64 5.201 9.43 5.391 9.24C5.581 9.07 5.791 8.8 6.001 8.57C6.191 8.35 6.271 8.19 6.401 7.94C6.531 7.68 6.461 7.47 6.361 7.28C6.271 7.08 5.501 5.2 5.171 4.43C4.861 3.68 4.551 3.78 4.331 3.77H3.821C3.561 3.77 3.151 3.86 2.801 4.25C2.451 4.63 1.451 5.57 1.451 7.48C1.451 9.4 2.841 11.23 3.031 11.5C3.241 11.76 5.731 15.61 9.581 17.27C10.501 17.66 11.211 17.9 11.771 18.08C12.711 18.38 13.561 18.33 14.221 18.23C14.961 18.12 16.631 17.25 16.971 16.32C17.311 15.39 17.311 14.61 16.711 14.54Z" /></svg>}
                title={t.contact.whatsapp}
                value="+964 770 385 4913"
                link="https://wa.me/9647703854913"
                theme={theme}
            />
            <ContactCard 
                icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.09 3.75 9.31 8.64 9.94v-7H8.11V12h2.53v-2.1c0-2.49 1.48-3.87 3.75-3.87 1.09 0 2.22.19 2.22.19v2.44h-1.25c-1.23 0-1.61.76-1.61 1.54V12h2.75l-.44 2.94h-2.31v7C18.25 21.31 22 17.09 22 12c0-5.52-4.48-10-10-10z" /></svg>}
                title={t.contact.social}
                value="@TajirZone"
                link="https://facebook.com/TajirZone"
                theme={theme}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`pt-24 md:pt-32 pb-24 relative z-10 border-t transition-colors overflow-hidden ${theme === 'dark' ? 'bg-[#020617] border-white/5' : 'bg-white border-slate-100'}`}>
        {/* Subtle Background Glows */}
        <div className={`absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] mix-blend-screen opacity-20 pointer-events-none ${theme === 'dark' ? 'bg-indigo-600/30' : 'bg-indigo-300/40'}`}></div>
        <div className={`absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px] mix-blend-screen opacity-20 pointer-events-none ${theme === 'dark' ? 'bg-violet-600/30' : 'bg-violet-300/40'}`}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 text-center md:text-start">
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">T</div>
                <span className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tajir<span className="text-indigo-500">Zone</span></span>
              </div>
              <p className={`font-medium max-w-sm leading-relaxed text-sm md:text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.footer.desc}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-12 md:gap-24">
              <FooterGroup title={t.footer.platform} items={language === 'ar' ? ['المميزات', 'الأسعار', 'التحديثات'] : language === 'en' ? ['Features', 'Pricing', 'Updates'] : ['تایبەتمەندییەکان', 'نرخەکان', 'نوێکارییەکان']} theme={theme} />
              <FooterGroup title={t.footer.support} items={language === 'ar' ? ['تواصل معنا', 'مركز المساعدة', 'الشروط'] : language === 'en' ? ['Contact', 'Help Center', 'Terms'] : ['پەیوەندی', 'سەنتەری یارمەتی', 'مەرجەکان']} theme={theme} />
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{t.footer.rights}</p>
            <div className="flex items-center gap-2.5 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>TajirZone Infrastructure Active</span>
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

function LangThemeSwitcher({ language, changeLanguage, theme, toggleTheme, mode = "vertical" }: any) {
  const isHorizontal = mode === "horizontal";
  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center gap-3 px-4 py-2 rounded-2xl' : 'flex-col items-center gap-2 p-2 rounded-[2rem]'} border shadow-xl backdrop-blur-xl ${theme === 'dark' ? 'bg-[#020617]/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
      <div className={`flex ${isHorizontal ? 'flex-row gap-2' : 'flex-col gap-2'}`}>
        <button onClick={() => changeLanguage('ar')} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${language === 'ar' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30') : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>AR</button>
        <button onClick={() => changeLanguage('ku')} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${language === 'ku' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30') : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>KU</button>
        <button onClick={() => changeLanguage('en')} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${language === 'en' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30') : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>EN</button>
      </div>
      
      <div className={`${isHorizontal ? 'w-px h-6 mx-1' : 'w-6 h-px my-1'} ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>

      <button
        onClick={toggleTheme}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-yellow-400 justify-self-center hover:bg-white/10' : 'bg-slate-100 text-indigo-600 justify-self-center hover:bg-slate-200'}`}
      >
        {theme === 'dark' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>
    </div>
  );
}

function FeatureCard({ title, description, icon, color, theme }: any) {
  const colors: any = {
    indigo: theme === 'dark' ? 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 group-hover:border-indigo-500/50' : 'from-indigo-100 to-white text-indigo-600 group-hover:border-indigo-300',
    rose: theme === 'dark' ? 'from-rose-500/20 to-rose-500/5 text-rose-400 group-hover:border-rose-500/50' : 'from-rose-100 to-white text-rose-600 group-hover:border-rose-300',
    emerald: theme === 'dark' ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 group-hover:border-emerald-500/50' : 'from-emerald-100 to-white text-emerald-600 group-hover:border-emerald-300',
  };

  return (
    <div className={`group relative p-8 md:p-10 backdrop-blur-2xl border rounded-[2.5rem] transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:shadow-indigo-500/10' : 'bg-white/60 border-slate-200 hover:shadow-indigo-200/50'}`}>
      {/* Decorative Glow inside card */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}></div>

      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br border ${colors[color]} ${theme === 'dark' ? 'border-white/10 shadow-inner' : 'shadow-sm'}`}>
          <svg className={`w-8 h-8`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
          </svg>
        </div>
        <h3 className={`text-xl md:text-2xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`font-medium leading-relaxed text-sm md:text-base transition-colors ${theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500'}`}>{description}</p>
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

function ContactCard({ icon, title, value, link, theme }: any) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={`group relative p-8 backdrop-blur-xl border-2 rounded-[2rem] hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/20' : 'bg-white/80 border-slate-100 hover:border-indigo-200 hover:shadow-indigo-100/50'}`}>
      {/* Decorative Glow inside card */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-400/10'}`}></div>

      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-500/30'}`}>
        {icon}
      </div>
      <h3 className={`text-lg font-black mb-2 relative z-10 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900 group-hover:text-indigo-900'}`}>{title}</h3>
      <p className={`font-bold text-sm md:text-base relative z-10 transition-colors ${theme === 'dark' ? 'text-slate-400 group-hover:text-indigo-200' : 'text-slate-500 group-hover:text-indigo-700'}`} dir="ltr">{value}</p>
    </a>
  );
}
