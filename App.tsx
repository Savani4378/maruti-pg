
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthState, Resident, Expense, MenuDay, ReminderConfig, PaymentRequest, Announcement, Hostel } from './types.ts';
import { DEFAULT_MENU, BRAND_LOGO_SVG } from './constants.ts';
import Navbar from './components/Navbar.tsx';
import LandingPage from './pages/LandingPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import ResidentDashboard from './pages/ResidentDashboard.tsx';
import ExpenseTracker from './pages/ExpenseTracker.tsx';
import CustomerEntry from './pages/CustomerEntry.tsx';

const App: React.FC = () => {
  const getStored = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [residents, setResidents] = useState<Resident[]>(() => getStored('maruti_residents', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => getStored('maruti_expenses', []));
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => getStored('maruti_payment_requests', []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStored('maruti_announcements', []));
  const [menu, setMenu] = useState<MenuDay[]>(() => getStored('maruti_menu', DEFAULT_MENU));
  const [hostels, setHostels] = useState<Hostel[]>(() => getStored('maruti_hostels', []));
  const [adminPassword, setAdminPassword] = useState<string>(() => getStored('maruti_admin_pass', 'MarutiPG@#$SS'));
  const [appLogo, setAppLogo] = useState<string | null>(() => getStored('maruti_logo', BRAND_LOGO_SVG));
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(() => getStored('maruti_reminder_config', {
    daysBefore: 3,
    messageTemplate: "Dear {name}, your rent of ₹{amount} for Room {room} is due on {date}. Thanks!"
  }));

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('hostel_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const [auth, setAuth] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('hostel_auth');
    return savedAuth ? JSON.parse(savedAuth) : { user: null, role: null };
  });

  useEffect(() => localStorage.setItem('maruti_residents', JSON.stringify(residents)), [residents]);
  useEffect(() => localStorage.setItem('maruti_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('maruti_payment_requests', JSON.stringify(paymentRequests)), [paymentRequests]);
  useEffect(() => localStorage.setItem('maruti_announcements', JSON.stringify(announcements)), [announcements]);
  useEffect(() => localStorage.setItem('maruti_menu', JSON.stringify(menu)), [menu]);
  useEffect(() => localStorage.setItem('maruti_hostels', JSON.stringify(hostels)), [hostels]);
  useEffect(() => localStorage.setItem('maruti_admin_pass', JSON.stringify(adminPassword)), [adminPassword]);
  useEffect(() => localStorage.setItem('maruti_logo', JSON.stringify(appLogo)), [appLogo]);
  useEffect(() => localStorage.setItem('maruti_reminder_config', JSON.stringify(reminderConfig)), [reminderConfig]);
  useEffect(() => localStorage.setItem('hostel_auth', JSON.stringify(auth)), [auth]);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(t);
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }
    localStorage.setItem('hostel_theme', theme);
  }, [theme]);

  const handleResidentUpdate = (updatedResident: Resident) => {
    setResidents(prev => prev.map(r => r.id === updatedResident.id ? updatedResident : r));
    if (auth.user && 'id' in auth.user && auth.user.id === updatedResident.id) {
      setAuth(prev => ({ ...prev, user: updatedResident }));
    }
  };

  const handleLogin = (user: any, role: 'ADMIN' | 'RESIDENT') => {
    setAuth({ user, role });
  };

  const handleLogout = () => {
    setAuth({ user: null, role: null });
    localStorage.removeItem('hostel_auth');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar 
          user={auth.user} 
          role={auth.role} 
          onLogout={handleLogout} 
          theme={theme}
          onThemeChange={setTheme}
          logo={appLogo}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              auth.user ? (
                auth.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/resident" replace />
              ) : <LandingPage logo={appLogo} />
            } />
            
            <Route path="/login" element={
              auth.user ? (
                auth.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/resident" replace />
              ) : (
                <LoginPage 
                  onLogin={handleLogin} 
                  residents={residents} 
                  adminPassword={adminPassword} 
                  onAdminPasswordReset={setAdminPassword}
                  logo={appLogo}
                />
              )
            } />
            
            <Route path="/admin" element={
              auth.role === 'ADMIN' ? 
              <div className="container mx-auto p-4 max-w-6xl">
                <AdminDashboard 
                  residents={residents} 
                  setResidents={setResidents} 
                  expenses={expenses}
                  paymentRequests={paymentRequests}
                  setPaymentRequests={setPaymentRequests}
                  announcements={announcements}
                  setAnnouncements={setAnnouncements}
                  adminPassword={adminPassword}
                  logo={appLogo}
                  setLogo={setAppLogo}
                  menu={menu}
                  setMenu={setMenu}
                  reminderConfig={reminderConfig}
                  setReminderConfig={setReminderConfig}
                  hostels={hostels}
                  setHostels={setHostels}
                />
              </div> : <Navigate to="/login" replace />
            } />

            <Route path="/admin/new-entry" element={
              auth.role === 'ADMIN' ? 
              <div className="container mx-auto p-4 max-w-6xl">
                <CustomerEntry setResidents={setResidents} hostels={hostels} residents={residents} />
              </div> : <Navigate to="/login" replace />
            } />

            <Route path="/admin/expenses" element={
              auth.role === 'ADMIN' ? 
              <div className="container mx-auto p-4 max-w-6xl">
                <ExpenseTracker expenses={expenses} setExpenses={setExpenses} />
              </div> : <Navigate to="/login" replace />
            } />

            <Route path="/resident" element={
              auth.role === 'RESIDENT' ? 
              <div className="container mx-auto p-4 max-w-6xl">
                <ResidentDashboard 
                  resident={auth.user as Resident} 
                  menu={menu} 
                  onUpdateResident={handleResidentUpdate}
                  paymentRequests={paymentRequests}
                  setPaymentRequests={setPaymentRequests}
                  announcements={announcements}
                />
              </div> : <Navigate to="/login" replace />
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
