
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Resident } from '../types.ts';

interface LoginPageProps {
  onLogin: (user: any, role: 'ADMIN' | 'RESIDENT') => void;
  residents: Resident[];
  adminPassword: string;
  onAdminPasswordReset: (newPass: string) => void;
  logo: string | null;
}

const MASTER_ADMIN_USERNAME = "MarutiPG";
const MASTER_ADMIN_PASSWORD = "MarutiPG@#$SS";

// Basic obfuscation for local storage
const encode = (str: string) => btoa(str);
const decode = (str: string) => {
  try { return atob(str); } catch { return ""; }
};

export default function LoginPage({ onLogin, residents, logo }: LoginPageProps) {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);

  // Load remembered credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('maruti_pg_remembered');
    if (saved) {
      try {
        const { u, p } = JSON.parse(saved);
        if (u && p) {
          setUsername(decode(u));
          setPassword(decode(p));
          setRememberMe(true);
        }
      } catch (e) {
        console.error("Failed to parse remembered credentials");
      }
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputUsername = username.trim();
    const inputPassword = password.trim();

    let authenticatedUser = null;
    let authenticatedRole: 'ADMIN' | 'RESIDENT' | null = null;

    // 1. Check for Admin Master Credentials
    if (inputUsername === MASTER_ADMIN_USERNAME && inputPassword === MASTER_ADMIN_PASSWORD) {
      authenticatedUser = { username: MASTER_ADMIN_USERNAME, role: 'ADMIN' };
      authenticatedRole = 'ADMIN';
    } else {
      // 2. Check for Resident Credentials
      const resident = residents.find(r => 
        r.username.toLowerCase() === inputUsername.toLowerCase() && 
        r.password === inputPassword
      );
      if (resident) {
        authenticatedUser = resident;
        authenticatedRole = 'RESIDENT';
      }
    }

    if (authenticatedUser && authenticatedRole) {
      // Handle "Remember Me" persistence
      if (rememberMe) {
        localStorage.setItem('maruti_pg_remembered', JSON.stringify({
          u: encode(inputUsername),
          p: encode(inputPassword)
        }));
      } else {
        localStorage.removeItem('maruti_pg_remembered');
      }

      onLogin(authenticatedUser, authenticatedRole);
      navigate(authenticatedRole === 'ADMIN' ? '/admin' : '/resident');
    } else {
      setError('Invalid credentials. Please verify your username and password.');
    }
  };

  const renderLoginLogo = () => {
    if (!logo) return <div className="w-12 h-12 bg-orange-600 rounded-[1.2rem] flex items-center justify-center text-white text-xl font-black">M</div>;
    
    if (logo.includes('<svg')) {
      return <div className="h-16 w-16 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logo }} />;
    }
    
    return <img src={logo} className="h-12 w-auto object-contain" />;
  };

  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-4 rounded-[1.5rem] shadow-2xl bg-slate-900 dark:bg-orange-600 text-white font-bold flex items-center justify-between border border-white/10 backdrop-blur-xl">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/20 rounded-lg">&times;</button>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/')} className="mb-10 flex items-center gap-2 text-slate-500 hover:text-orange-600 font-black uppercase text-xs tracking-widest transition-all group">
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Home
      </button>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white dark:border-slate-700 animate-in zoom-in-95 duration-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="inline-block p-4 bg-orange-50 dark:bg-slate-900 rounded-[2rem] mb-6 shadow-inner transform transition-transform hover:scale-105 duration-300">
            {renderLoginLogo()}
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Portal Entry</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Maruti PG Access</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-6 relative z-10">
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest group-focus-within:text-orange-600 transition-colors">Username</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 rounded-2xl border bg-white dark:bg-slate-900/50 dark:border-slate-600 text-slate-900 dark:text-white outline-none ring-0 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold placeholder:opacity-40 focus:-translate-y-0.5"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest group-focus-within:text-orange-600 transition-colors">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-5 py-4 rounded-2xl border bg-white dark:bg-slate-900/50 dark:border-slate-600 text-slate-900 dark:text-white outline-none ring-0 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold pr-14 placeholder:opacity-40 focus:-translate-y-0.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors p-2"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div 
            className="flex items-center gap-3 ml-2 group cursor-pointer select-none py-1" 
            onClick={() => setRememberMe(!rememberMe)}
          >
            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
              rememberMe 
                ? 'bg-orange-600 border-orange-600 shadow-lg shadow-orange-500/30 scale-110' 
                : 'border-slate-300 dark:border-slate-600 group-hover:border-orange-400'
            }`}>
              <div className={`transition-all duration-300 ${rememberMe ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
              rememberMe ? 'text-orange-600' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
            }`}>
              Remember Me
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-[10px] font-black text-center border border-rose-100 dark:border-rose-900/30 animate-in shake duration-500 uppercase tracking-widest">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="group/btn relative w-full bg-slate-900 dark:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              Verify & Enter
              <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </span>
          </button>
        </form>
      </div>

      <div className="mt-8 text-center max-w-xs animate-in fade-in duration-1000 delay-500">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
          Admin login: Use professional credentials.<br/>
          Residents: Use your assigned room credentials.
        </p>
      </div>
    </div>
  );
}
