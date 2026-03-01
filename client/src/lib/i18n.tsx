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
  'nav.logout': { en: 'Log Out', sw: 'Toka' },
  'nav.home': { en: 'Home', sw: 'Nyumbani' },

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
