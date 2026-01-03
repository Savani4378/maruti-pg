
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  logo: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ logo }) => {
  const navigate = useNavigate();

  const renderHeroLogo = () => {
    if (!logo) return <div className="relative bg-orange-600 text-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-2xl">M</div>;
    
    if (logo.includes('<svg')) {
      return (
        <div 
          className="relative h-48 w-48 flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
          dangerouslySetInnerHTML={{ __html: logo }} 
        />
      );
    }
    
    return <img src={logo} alt="Maruti PG" className="relative h-32 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="absolute top-8 right-8 flex items-center gap-3 p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl no-print">
        <p className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Jay Shree Ram</p>
      </div>

      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full animate-pulse"></div>
          {renderHeroLogo()}
        </div>
        
        <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
          Maruti<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">PG</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Jay Shree Ram, 
          Welcome to Maruti PG.
        </p>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <button 
          onClick={() => navigate('/login')}
          className="group relative w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-[3rem] p-12 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-3 border border-white dark:border-slate-700 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-orange-200 dark:shadow-none group-hover:scale-110 transition-all duration-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Access Portal</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium text-sm">
            Login as Admin or Resident to manage your account and services.
          </p>
          
          <div className="inline-flex items-center bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest group-hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 dark:shadow-none">
            Login!!
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </div>
        </button>
      </div>

      <div className="mt-20 flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-[0.4em]">
        <span>Maruti PG • Premium Residency • Made By Jay Savani</span>
      </div>
    </div>
  );
};

export default LandingPage;
