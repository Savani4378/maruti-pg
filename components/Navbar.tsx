
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface NavbarProps {
  user: any;
  role: UserRole | null;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  logo: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ 
  user, role, onLogout, theme, onThemeChange, logo 
}) => {
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeIcons = {
    light: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
      </svg>
    ),
    dark: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
      </svg>
    ),
    system: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    )
  };

  const renderLogo = () => {
    if (!logo) return <div className="relative w-11 h-11 bg-orange-600 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl">M</div>;
    
    if (logo.includes('<svg')) {
      return <div className="relative h-11 w-11 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logo }} />;
    }
    
    return <img src={logo} alt="PG Logo" className="relative h-11 w-auto object-contain rounded-xl bg-white/50 p-1" />;
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50 transition-all duration-300 no-print">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-orange-500/20 blur-lg rounded-full group-hover:opacity-100 opacity-0 transition-all"></div>
              {renderLogo()}
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Maruti PG <span className="text-orange-600/50 text-xs uppercase tracking-widest font-bold ml-1">Pro</span></span>
            </div>
          </Link>
          
          {role === 'ADMIN' && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {[
                { to: '/admin', label: 'Suite' },
                { to: '/admin/new-entry', label: 'Registrar' },
                { to: '/admin/expenses', label: 'Ledger' }
              ].map(link => (
                <Link key={link.to} to={link.to} className="px-6 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowThemeMenu(!showThemeMenu)} 
              className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
              title="Change Appearance"
            >
              {themeIcons[theme]}
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                {theme === 'system' ? 'Default' : theme}
              </span>
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-3 w-44 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-2 mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Appearance</p>
                </div>
                {[
                  { id: 'light', label: 'Light Mode' },
                  { id: 'dark', label: 'Dark Mode' },
                  { id: 'system', label: 'Default' }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { onThemeChange(t.id as any); setShowThemeMenu(false); }} 
                    className={`w-full px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${theme === t.id ? 'text-orange-600 bg-orange-50/50 dark:bg-orange-900/20' : 'text-slate-500'}`}
                  >
                    {t.label}
                    {theme === t.id && <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {role && (
            <button onClick={() => { onLogout(); navigate('/login'); }} className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95">Exit</button>
          )}
        </div>
      </div>
      {showThemeMenu && <div className="fixed inset-0 z-[55]" onClick={() => setShowThemeMenu(false)}></div>}
    </nav>
  );
};

export default Navbar;
