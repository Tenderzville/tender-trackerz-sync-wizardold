import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'sw';

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', sw: 'Dashibodi' },
  'nav.browse': { en: 'Browse Tenders', sw: 'Tafuta Zabuni' },
  'nav.saved': { en: 'Saved Tenders', sw: 'Zabuni Zilizohifadhiwa' },
  'nav.consortiums': { en: 'Consortiums', sw: 'Mashirika' },
  'nav.providers': { en: 'Service Providers', sw: 'Watoa Huduma' },
  'nav.marketplace': { en: 'Marketplace', sw: 'Soko' },
  'nav.rfq': { en: 'RFQ System', sw: 'Mfumo wa RFQ' },
  'nav.ai': { en: 'AI Analysis', sw: 'Uchambuzi wa AI' },
  'nav.performance': { en: 'Performance', sw: 'Utendaji' },
  'nav.analytics': { en: 'Analytics', sw: 'Takwimu' },
  'nav.refresh': { en: 'Refresh Tenders', sw: 'Sasisha Zabuni' },
  'nav.learning': { en: 'Learning Hub', sw: 'Kituo cha Kujifunza' },
  'nav.profile': { en: 'Profile', sw: 'Wasifu' },
  'nav.settings': { en: 'Settings', sw: 'Mipangilio' },
  'nav.subscription': { en: 'Subscription', sw: 'Usajili' },
  'nav.logout': { en: 'Sign Out', sw: 'Toka' },
  'nav.home': { en: 'Home', sw: 'Nyumbani' },
  'nav.smartMatches': { en: 'Smart Matches', sw: 'Mechi Bora' },
  'nav.more': { en: 'More', sw: 'Zaidi' },
  'nav.admin': { en: 'Admin', sw: 'Msimamizi' },
  'nav.transactions': { en: 'Transactions', sw: 'Miamala' },

  // Auth
  'common.signIn': { en: 'Sign In', sw: 'Ingia' },
  'common.signUp': { en: 'Sign Up', sw: 'Jisajili' },
  'auth.welcome': { en: 'Welcome back!', sw: 'Karibu tena!' },
  'auth.subtitle': { en: 'Discover new tender opportunities and grow your business', sw: 'Gundua fursa mpya za zabuni na kukuza biashara yako' },
  'auth.buyer': { en: 'Buyer', sw: 'Mnunuzi' },
  'auth.supplier': { en: 'Supplier', sw: 'Msambazaji' },
  'auth.role': { en: 'I am a', sw: 'Mimi ni' },

  // Dashboard
  'dash.activeTenders': { en: 'Active Tenders', sw: 'Zabuni Hai' },
  'dash.savedTenders': { en: 'Saved Tenders', sw: 'Zabuni Zilizohifadhiwa' },
  'dash.consortiums': { en: 'Consortiums', sw: 'Mashirika' },
  'dash.winRate': { en: 'Win Rate', sw: 'Kiwango cha Ushindi' },
  'dash.latestTenders': { en: 'Latest Tenders', sw: 'Zabuni za Hivi Karibuni' },
  'dash.viewAll': { en: 'View All', sw: 'Tazama Zote' },
  'dash.smartMatches': { en: 'Smart Matches', sw: 'Mechi Bora' },
  'dash.joinConsortium': { en: 'Join Consortium', sw: 'Jiunge na Shirika' },
  'dash.postRfq': { en: 'Post RFQ', sw: 'Tuma RFQ' },
  'dash.findSuppliers': { en: 'Find Suppliers', sw: 'Tafuta Wasambazaji' },
  'dash.browseTenders': { en: 'Browse Tenders', sw: 'Tafuta Zabuni' },
  'dash.aiInsights': { en: 'AI-Powered Tender Analysis', sw: 'Uchambuzi wa Zabuni kwa AI' },
  'dash.aiDescription': { en: 'Get personalized win probability and bid strategy recommendations for any tender.', sw: 'Pata uwezekano wa kushinda na mapendekezo ya mkakati wa zabuni.' },
  'dash.setupPreferences': { en: 'Set Up Your Tender Preferences', sw: 'Weka Mapendeleo Yako ya Zabuni' },
  'dash.configureNow': { en: 'Configure Now', sw: 'Sanidi Sasa' },

  // Tender Card
  'tender.viewDetails': { en: 'View Details', sw: 'Tazama Maelezo' },
  'tender.source': { en: 'Source', sw: 'Chanzo' },
  'tender.joinConsortium': { en: 'Join Consortium', sw: 'Jiunge na Shirika' },
  'tender.budgetEstimate': { en: 'Budget Estimate', sw: 'Makadirio ya Bajeti' },
  'tender.deadline': { en: 'Deadline', sw: 'Muda wa Mwisho' },
  'tender.expired': { en: 'Expired', sw: 'Imeisha' },
  'tender.urgent': { en: 'Urgent', sw: 'Dharura' },
  'tender.daysLeft': { en: 'days left', sw: 'siku zimebaki' },
  'tender.dueToday': { en: 'Due today', sw: 'Muda leo' },
  'tender.apply': { en: 'Apply', sw: 'Omba' },
  'tender.saved': { en: 'Tender saved', sw: 'Zabuni imehifadhiwa' },
  'tender.removed': { en: 'Tender removed', sw: 'Zabuni imeondolewa' },

  // Learning Hub
  'learn.title': { en: 'Learning Hub', sw: 'Kituo cha Kujifunza' },
  'learn.subtitle': { en: 'Master tendering in Kenya with free guides, templates, and courses', sw: 'Jifunze zabuni nchini Kenya na miongozo, violezo, na kozi bure' },
  'learn.guides': { en: 'Guides', sw: 'Miongozo' },
  'learn.templates': { en: 'Templates', sw: 'Violezo' },
  'learn.courses': { en: 'Courses', sw: 'Kozi' },
  'learn.achievements': { en: 'Achievements', sw: 'Mafanikio' },
  'learn.start': { en: 'Start Learning', sw: 'Anza Kujifunza' },
  'learn.download': { en: 'Download', sw: 'Pakua' },
  'learn.completed': { en: 'Completed', sw: 'Imekamilika' },
  'learn.progress': { en: 'Progress', sw: 'Maendeleo' },
  'learn.free': { en: 'Free', sw: 'Bure' },

  // Marketplace
  'market.title': { en: 'Service Marketplace', sw: 'Soko la Huduma' },
  'market.subtitle': { en: 'Advertise your services to tender seekers', sw: 'Tangaza huduma zako kwa watafuta zabuni' },
  'market.advertise': { en: 'Advertise (KSh 1,000/mo)', sw: 'Tangaza (KSh 1,000/mwezi)' },
  'market.featured': { en: 'Featured Providers', sw: 'Watoa Huduma Walioangaziwa' },
  'market.active': { en: 'Active', sw: 'Inatumika' },
  'market.expired': { en: 'Expired', sw: 'Imeisha' },
  'market.pending': { en: 'Pending Payment', sw: 'Inasubiri Malipo' },

  // Consortium
  'consortium.create': { en: 'Create Consortium', sw: 'Unda Shirika' },
  'consortium.join': { en: 'Join', sw: 'Jiunge' },
  'consortium.members': { en: 'Members', sw: 'Wanachama' },
  'consortium.skills': { en: 'Required Skills', sw: 'Ujuzi Unaohitajika' },
  'consortium.documents': { en: 'Documents', sw: 'Nyaraka' },
  'consortium.certificates': { en: 'Certificates', sw: 'Vyeti' },
  'consortium.expiry': { en: 'Expiry Date', sw: 'Tarehe ya Kumalizika' },
  'consortium.company': { en: 'Company Name', sw: 'Jina la Kampuni' },
  'consortium.contribution': { en: 'Contribution', sw: 'Mchango' },

  // RFQ
  'rfq.title': { en: 'Request for Quotation', sw: 'Ombi la Bei' },
  'rfq.create': { en: 'Create RFQ', sw: 'Unda RFQ' },
  'rfq.quotes': { en: 'Quotes Received', sw: 'Bei Zilizopokelewa' },
  'rfq.submit': { en: 'Submit Quote', sw: 'Wasilisha Bei' },

  // Subscription
  'sub.title': { en: 'Choose Your Plan', sw: 'Chagua Mpango Wako' },
  'sub.free': { en: 'Free', sw: 'Bure' },
  'sub.pro': { en: 'Pro', sw: 'Pro' },
  'sub.business': { en: 'Business', sw: 'Biashara' },
  'sub.monthly': { en: 'Monthly', sw: 'Kila Mwezi' },
  'sub.annually': { en: 'Annually', sw: 'Kila Mwaka' },
  'sub.subscribe': { en: 'Subscribe Now', sw: 'Jisajili Sasa' },

  // Profile
  'profile.title': { en: 'My Profile', sw: 'Wasifu Wangu' },
  'profile.edit': { en: 'Edit Profile', sw: 'Hariri Wasifu' },
  'profile.company': { en: 'Company', sw: 'Kampuni' },
  'profile.phone': { en: 'Phone', sw: 'Simu' },
  'profile.location': { en: 'Location', sw: 'Mahali' },
  'profile.verified': { en: 'Verified', sw: 'Imethibitishwa' },

  // Settings
  'settings.title': { en: 'Preferences', sw: 'Mapendeleo' },
  'settings.sectors': { en: 'Preferred Sectors', sw: 'Sekta Unazopenda' },
  'settings.counties': { en: 'Preferred Counties', sw: 'Kaunti Unazopenda' },
  'settings.keywords': { en: 'Keywords', sw: 'Maneno Muhimu' },
  'settings.notifications': { en: 'Notifications', sw: 'Arifa' },

  // Admin
  'admin.title': { en: 'Admin Dashboard', sw: 'Dashibodi ya Msimamizi' },
  'admin.adApproval': { en: 'Ad Approval', sw: 'Idhini ya Matangazo' },
  'admin.approve': { en: 'Approve', sw: 'Idhinisha' },
  'admin.reject': { en: 'Reject', sw: 'Kataa' },
  'admin.pending': { en: 'Pending', sw: 'Inasubiri' },
  'admin.runScraper': { en: 'Sync Tenders', sw: 'Sawazisha Zabuni' },
  'admin.importHistorical': { en: 'Import Historical', sw: 'Ingiza Kumbukumbu' },

  // Common
  'common.search': { en: 'Search', sw: 'Tafuta' },
  'common.filter': { en: 'Filter', sw: 'Chuja' },
  'common.save': { en: 'Save', sw: 'Hifadhi' },
  'common.cancel': { en: 'Cancel', sw: 'Ghairi' },
  'common.submit': { en: 'Submit', sw: 'Wasilisha' },
  'common.loading': { en: 'Loading...', sw: 'Inapakia...' },
  'common.noResults': { en: 'No results found', sw: 'Hakuna matokeo' },
  'common.viewDetails': { en: 'View Details', sw: 'Tazama Maelezo' },
  'common.apply': { en: 'Apply', sw: 'Omba' },
  'common.contact': { en: 'Contact', sw: 'Wasiliana' },
  'common.language': { en: 'Language', sw: 'Lugha' },
  'common.back': { en: 'Back', sw: 'Rudi' },
  'common.next': { en: 'Next', sw: 'Endelea' },
  'common.previous': { en: 'Previous', sw: 'Iliyopita' },
  'common.delete': { en: 'Delete', sw: 'Futa' },
  'common.edit': { en: 'Edit', sw: 'Hariri' },
  'common.close': { en: 'Close', sw: 'Funga' },
  'common.confirm': { en: 'Confirm', sw: 'Thibitisha' },
  'common.success': { en: 'Success', sw: 'Mafanikio' },
  'common.error': { en: 'Error', sw: 'Hitilafu' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'sw' ? 'sw' : 'en') as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[key]?.[language] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
      title={language === 'en' ? 'Badilisha kwa Kiswahili' : 'Switch to English'}
    >
      {language === 'en' ? '🇰🇪 KSW' : '🇬🇧 ENG'}
    </button>
  );
}
