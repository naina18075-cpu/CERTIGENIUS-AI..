import { DesignConfig, CertificateContent } from './types';

export const FONTS = [
  { name: 'Playfair Display (Serif)', value: 'font-playfair' },
  { name: 'Cinzel (Elegant)', value: 'font-cinzel' },
  { name: 'Inter (Modern)', value: 'font-inter' },
  { name: 'Roboto Slab (Bold)', value: 'font-roboto' },
  { name: 'Montserrat (Clean)', value: 'font-montserrat' },
  { name: 'Great Vibes (Script)', value: 'font-greatvibes' },
];

export const THEMES = [
  { id: 'classic', name: 'Classic Border', bgClass: 'bg-white border-[20px] border-double border-slate-800' },
  { id: 'modern', name: 'Modern Minimal', bgClass: 'bg-white border-b-8 border-blue-600' },
  { id: 'dark', name: 'Elegant Dark', bgClass: 'bg-slate-900 text-white border-[2px] border-gold-500' },
  { id: 'parchment', name: 'Old Parchment', bgClass: 'bg-[#fdf6e3] border-[10px] border-[#d4c5b0]' },
  { id: 'tech', name: 'Tech Future', bgClass: 'bg-slate-50 border-r-[30px] border-l-[30px] border-indigo-600' },
  { id: 'luxury', name: 'Luxury Gold', bgClass: 'bg-stone-50 border-[4px] border-gold-500 ring-4 ring-offset-4 ring-gold-300' },
  { id: 'nature', name: 'Organic Green', bgClass: 'bg-green-50 border-t-[20px] border-emerald-700' },
  { id: 'corporate', name: 'Corporate Blue', bgClass: 'bg-white border-4 border-blue-900 shadow-xl' },
  { id: 'artdeco', name: 'Art Deco', bgClass: 'bg-black border-[1px] border-gold-300 outline outline-4 outline-offset-8 outline-gold-500' },
  { id: 'clean', name: 'Super Clean', bgClass: 'bg-white shadow-lg' },
];

export const DEFAULT_DESIGN: DesignConfig = {
  theme: 'classic',
  fontFamily: 'font-playfair',
  titleColor: '#1e293b',
  bodyColor: '#334155',
  accentColor: '#D4AF37',
  isMetallicTitle: false,
  backgroundStyle: 'classic',
  fontSizeScale: 1,
};

export const DEFAULT_CONTENT: CertificateContent = {
  title: 'Certificate of Achievement',
  subtitle: 'This is proudly presented to',
  bodyTemplate: 'For outstanding performance and dedication in the Annual Tech Hackathon 2024. Your contribution has been invaluable to the success of the event.',
  signerName: 'John Doe',
  signerTitle: 'Director of Operations',
  date: new Date().toLocaleDateString(),
};
