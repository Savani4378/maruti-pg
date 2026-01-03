
import React, { useState, useMemo, useRef } from 'react';
import { Resident, Expense, MenuDay, ReminderConfig, PaymentEntry, PaymentRequest, Announcement, Hostel, Room } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import { generateSqlDump, downloadSqlFile } from '../services/sqlService.ts';
import { uploadToCloudinary } from '../services/cloudinaryService.ts';

interface AdminDashboardProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  expenses: Expense[];
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  adminPassword: string;
  logo: string | null;
  setLogo: (logo: string | null) => void;
  menu: MenuDay[];
  setMenu: React.Dispatch<React.SetStateAction<MenuDay[]>>;
  reminderConfig: ReminderConfig;
  setReminderConfig: React.Dispatch<React.SetStateAction<ReminderConfig>>;
  hostels: Hostel[];
  setHostels: React.Dispatch<React.SetStateAction<Hostel[]>>;
}

type TabType = 'RESIDENTS' | 'PROFILES' | 'OCCUPANCY' | 'MANAGEMENT' | 'REPORTS' | 'MENU' | 'COMMUNICATIONS' | 'SETTINGS';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  residents, 
  setResidents,
  expenses, 
  paymentRequests,
  setPaymentRequests,
  announcements,
  setAnnouncements,
  adminPassword,
  logo, 
  setLogo, 
  menu, 
  setMenu,
  reminderConfig,
  setReminderConfig,
  hostels,
  setHostels
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('RESIDENTS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  
  const [viewingResident, setViewingResident] = useState<Resident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Broadcasting State
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'WARNING' | 'ALERT'>('INFO');
  const [targetResidentId, setTargetResidentId] = useState<string>('ALL');

  // Management State
  const [newHostelName, setNewHostelName] = useState('');
  const [selectedHostelForRoom, setSelectedHostelForRoom] = useState<string>('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('4');
  const [newRoomType, setNewRoomType] = useState<'AC' | 'NON_AC'>('NON_AC');

  const reportRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const totalCollected = residents.filter(r => r.paymentStatus === 'PAID').reduce((sum, r) => sum + r.rent, 0);
    const totalPending = residents.filter(r => r.paymentStatus !== 'PAID').reduce((sum, r) => sum + r.rent, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      occupancy: residents.length,
      collected: totalCollected,
      pending: totalPending,
      expenses: totalExpenses,
      profit: totalCollected - totalExpenses
    };
  }, [residents, expenses]);

  const profileResidents = useMemo(() => {
    if (!searchQuery) return residents;
    const q = searchQuery.toLowerCase();
    return residents.filter(r => 
      r.firstName.toLowerCase().includes(q) || 
      r.lastName.toLowerCase().includes(q) || 
      r.roomNumber.toLowerCase().includes(q)
    );
  }, [residents, searchQuery]);

  const monthlyReport = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const data = residents.map(r => {
      const paymentsInMonth = (r.paymentHistory || []).filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === year && pDate.getMonth() === (month - 1);
      });
      const hasPaid = paymentsInMonth.length > 0;
      const amountPaid = paymentsInMonth.reduce((sum, p) => sum + p.amount, 0);
      return { ...r, hasPaid, amountPaid };
    });
    const collected = data.reduce((sum, r) => sum + r.amountPaid, 0);
    const pending = data.filter(r => !r.hasPaid).reduce((sum, r) => sum + r.rent, 0);
    return { paid: data.filter(r => r.hasPaid), unpaid: data.filter(r => !r.hasPaid), collected, pending, total: collected + pending, all: data };
  }, [residents, selectedMonth]);

  const pendingRequests = useMemo(() => paymentRequests.filter(pr => pr.status === 'PENDING'), [paymentRequests]);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      if (statusFilter === 'PAID' && r.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'UNPAID' && r.paymentStatus === 'PAID') return false;
      if (roomTypeFilter !== 'ALL' && r.roomType !== roomTypeFilter) return false;
      return true;
    });
  }, [residents, statusFilter, roomTypeFilter]);

  const handlePushBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      text: targetResidentId === 'ALL' ? broadcastText : `[Direct Message] ${broadcastText}`,
      timestamp: new Date().toISOString(),
      type: broadcastType
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);
    
    if (targetResidentId !== 'ALL') {
      const target = residents.find(r => r.id === targetResidentId);
      if (target) {
        const waMsg = encodeURIComponent(`*PG ${broadcastType} Notification:*\n${broadcastText}`);
        window.open(`https://wa.me/91${target.contactNumber}?text=${waMsg}`, '_blank');
      }
    }

    setBroadcastText('');
    alert("Broadcast dispatched successfully!");
  };

  const handleAddHostel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostelName.trim()) return;
    const newHostel: Hostel = {
      id: 'HST-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      hostelNumber: newHostelName.trim(),
      rooms: [],
      totalCapacity: 0
    };
    setHostels(prev => [...prev, newHostel]);
    setNewHostelName('');
    alert("New Block registered!");
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostelForRoom || !newRoomNumber.trim()) return;
    setHostels(prev => prev.map(h => {
      if (h.id === selectedHostelForRoom) {
        const newRoom: Room = {
          id: 'RM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          roomNumber: newRoomNumber.trim(),
          capacity: parseInt(newRoomCapacity) || 4,
          type: newRoomType
        };
        return { ...h, rooms: [...h.rooms, newRoom], totalCapacity: h.totalCapacity + (parseInt(newRoomCapacity) || 4) };
      }
      return h;
    }));
    setNewRoomNumber('');
    alert("Unit added to block!");
  };

  const handleVerifyRequest = (requestId: string, approve: boolean) => {
    const request = paymentRequests.find(pr => pr.id === requestId);
    if (!request) return;
    if (approve) {
      setResidents(prev => prev.map(r => {
        if (r.id === request.residentId) {
          const newEntry: PaymentEntry = { id: Date.now().toString() + Math.random(), date: new Date().toISOString(), amount: request.amount };
          return { ...r, paymentStatus: 'PAID', paymentHistory: [newEntry, ...(r.paymentHistory || [])] };
        }
        return r;
      }));
    }
    setPaymentRequests(prev => prev.filter(pr => pr.id !== requestId));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLogoUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const url = await uploadToCloudinary(reader.result as string);
          setLogo(url);
          alert("Logo updated!");
        } catch (err) { alert("Upload failed."); }
        finally { setIsLogoUploading(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadReportPDF = () => {
    if (!reportRef.current) return;
    const opt = { margin: 10, filename: `Report_${selectedMonth}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    // @ts-ignore
    html2pdf().from(reportRef.current).set(opt).save();
  };

  const renderLogo = () => {
    if (!logo) return <div className="text-white font-black">M</div>;
    if (logo.includes('<svg')) return <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: logo }} />;
    return <img src={logo} className="w-12 h-12 object-contain rounded-lg" alt="Logo" />;
  };

  const tabs: TabType[] = ['RESIDENTS', 'PROFILES', 'OCCUPANCY', 'MANAGEMENT', 'REPORTS', 'MENU', 'COMMUNICATIONS', 'SETTINGS'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2 rounded-2xl shadow-lg">{renderLogo()}</div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Admin Hub</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control Panel</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadSqlFile(generateSqlDump(residents, expenses, announcements))} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Backup SQL</button>
          <button onClick={() => navigate('/admin/new-entry')} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 shadow-lg transition-all active:scale-95">Add Resident</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Occupancy', val: stats.occupancy, color: 'text-blue-600' },
          { label: 'Collected', val: `₹${stats.collected.toLocaleString()}`, color: 'text-emerald-600' },
          { label: 'Pending', val: `₹${stats.pending.toLocaleString()}`, color: 'text-rose-600' },
          { label: 'Expenses', val: `₹${stats.expenses.toLocaleString()}`, color: 'text-amber-600' },
          { label: 'Profit', val: `₹${stats.profit.toLocaleString()}`, color: 'text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:-translate-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-orange-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conditional Tab Rendering */}
      
      {activeTab === 'RESIDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border dark:border-slate-700 overflow-hidden">
               <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                 <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-widest">Resident Ledger</h3>
                 <div className="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                    {(['ALL', 'PAID', 'UNPAID'] as const).map(f => (
                      <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === f ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500'}`}>{f}</button>
                    ))}
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                     <tr>
                       <th className="px-6 py-4">Resident</th>
                       <th className="px-6 py-4">Unit</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y dark:divide-slate-700">
                     {filteredResidents.map(r => (
                       <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                         <td className="px-6 py-4">
                            <p className="font-black text-slate-800 dark:text-white text-sm">{r.firstName} {r.lastName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{r.contactNumber}</p>
                         </td>
                         <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">{r.hostelNumber}</p>
                            <p className="text-[10px] font-bold text-slate-400">Room {r.roomNumber}</p>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${r.paymentStatus === 'PAID' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                              {r.paymentStatus}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button onClick={() => setViewingResident(r)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/></svg></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700">
               <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Verifications</h3>
               {pendingRequests.length === 0 ? <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">Queue Empty</p> : (
                 <div className="space-y-3">
                   {pendingRequests.map(req => (
                     <div key={req.id} className="p-4 bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-2xl">
                       <p className="font-black text-xs text-slate-800 dark:text-white">{req.residentName}</p>
                       <p className="text-[10px] font-bold text-orange-600 mb-3">₹{req.amount.toLocaleString()}</p>
                       <div className="flex gap-2">
                         <button onClick={() => handleVerifyRequest(req.id, true)} className="flex-1 bg-emerald-600 text-white text-[9px] font-black uppercase py-2 rounded-lg">Approve</button>
                         <button onClick={() => handleVerifyRequest(req.id, false)} className="flex-1 bg-rose-100 text-rose-600 text-[9px] font-black uppercase py-2 rounded-lg">Reject</button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PROFILES' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Resident Profiles</h3>
             <div className="relative w-full md:w-80"><input type="text" placeholder="Search name or room..." className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-12 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {profileResidents.map(r => (
               <div key={r.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group text-center">
                  <div className="relative mb-6">
                    <img src={r.photo} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-slate-100 dark:border-slate-700 mx-auto group-hover:scale-105 transition-transform" alt="Avatar" />
                    <div className={`absolute top-0 right-1/2 translate-x-12 px-2 py-1 rounded-lg text-[8px] font-black uppercase border shadow-sm ${r.paymentStatus === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{r.paymentStatus}</div>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{r.firstName} {r.lastName}</h4>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Room {r.roomNumber}</p>
                  <button onClick={() => setViewingResident(r)} className="mt-6 w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-orange-600 hover:text-white text-slate-400 transition-all border dark:border-slate-700 uppercase font-black text-[9px] tracking-widest">Full Dossier</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'MANAGEMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Create Block</h3>
                <form onSubmit={handleAddHostel} className="flex gap-3">
                  <input type="text" required placeholder="Block Name..." className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold" value={newHostelName} onChange={e => setNewHostelName(e.target.value)} />
                  <button type="submit" className="bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Add Block</button>
                </form>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Register Room</h3>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <select required className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold" value={selectedHostelForRoom} onChange={e => setSelectedHostelForRoom(e.target.value)}>
                    <option value="">Select Block...</option>
                    {hostels.map(h => <option key={h.id} value={h.id}>{h.hostelNumber}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required placeholder="Room #" className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold" value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} />
                    <input type="number" required placeholder="Capacity" className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold" value={newRoomCapacity} onChange={e => setNewRoomCapacity(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95">Commit Unit</button>
                </form>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Infrastructure Hub</h3>
             <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
               {hostels.length > 0 ? hostels.map(h => (
                 <div key={h.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border dark:border-slate-700">
                   <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{h.hostelNumber}</h4>
                   <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Block UID: {h.id}</p>
                   <div className="flex flex-wrap gap-2">
                     {h.rooms.map(r => (
                       <div key={r.id} className="px-3 py-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-[9px] font-black uppercase text-slate-500">Room {r.roomNumber} ({r.capacity})</div>
                     ))}
                   </div>
                 </div>
               )) : (
                 <p className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No infrastructure registered. Add a block to start.</p>
               )}
             </div>
           </div>
        </div>
      )}

      {activeTab === 'REPORTS' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div><h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Audit Portal</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Financials</p></div>
            <div className="flex gap-4 w-full md:w-auto"><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 px-6 py-3 rounded-2xl font-black text-sm outline-none" /><button onClick={downloadReportPDF} className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Export PDF</button></div>
          </div>
          <div ref={reportRef} className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-black">
             <div className="flex justify-between items-center mb-12 border-b-4 border-black pb-8"><div><h1 className="text-4xl font-black uppercase tracking-tighter">Maruti PG Hub</h1><p className="text-sm font-bold text-orange-600 uppercase tracking-widest">Collection Statement</p></div><div className="text-right"><h2 className="text-2xl font-black uppercase text-slate-300">Statement</h2><p className="text-lg font-black">{new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div></div>
             <div className="grid grid-cols-3 gap-8 mb-12"><div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Revenue</p><p className="text-4xl font-black tracking-tighter">₹{monthlyReport.collected.toLocaleString()}</p></div><div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 text-center"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Dues</p><p className="text-4xl font-black tracking-tighter">₹{monthlyReport.pending.toLocaleString()}</p></div><div className="bg-slate-900 p-8 rounded-[2rem] text-center text-white"><p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Efficiency</p><p className="text-4xl font-black tracking-tighter">{Math.round((monthlyReport.collected / (monthlyReport.total || 1)) * 100)}%</p></div></div>
             <h4 className="text-xs font-black uppercase tracking-widest mb-6 border-l-4 border-orange-600 pl-4">Member Settlement Log</h4>
             <table className="w-full text-left"><thead className="border-b-2 border-black"><tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest"><th className="py-4">Member</th><th className="py-4">Unit</th><th className="py-4">Status</th><th className="py-4 text-right">Settled</th></tr></thead><tbody className="divide-y divide-slate-100">
                   {monthlyReport.all.map(r => (<tr key={r.id}><td className="py-5 font-black uppercase text-sm">{r.firstName} {r.lastName}</td><td className="py-5 text-xs font-bold text-slate-400">Room {r.roomNumber}</td><td className="py-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.hasPaid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{r.hasPaid ? 'Cleared' : 'Due'}</span></td><td className="py-5 text-right font-black text-lg">₹{r.hasPaid ? r.amountPaid.toLocaleString() : r.rent.toLocaleString()}</td></tr>))}
             </tbody></table>
          </div>
        </div>
      )}

      {activeTab === 'MENU' && (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border dark:border-slate-700 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Boarding Menu Management</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menu.map((day, idx) => (
                <div key={day.day} className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700 shadow-inner">
                   <h4 className="text-orange-600 font-black text-sm uppercase tracking-widest mb-6">{day.day}</h4>
                   <div className="space-y-6">
                      {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                        <div key={meal}><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{meal}</label><input className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" value={day[meal]} onChange={e => { const nextMenu = [...menu]; nextMenu[idx] = { ...day, [meal]: e.target.value }; setMenu(nextMenu); }} /></div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'COMMUNICATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Broadcast Center</h3>
            <form onSubmit={handlePushBroadcast} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Audience</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold" value={targetResidentId} onChange={e => setTargetResidentId(e.target.value)}>
                  <option value="ALL">Everyone (Global Announcement)</option>
                  {residents.map(r => <option key={r.id} value={r.id}>{r.firstName} {r.lastName} (Room {r.roomNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(['INFO', 'WARNING', 'ALERT'] as const).map(type => (
                  <button key={type} type="button" onClick={() => setBroadcastType(type)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${broadcastType === type ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:border-slate-700'}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Message Content</label>
                <textarea required className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold min-h-[150px]" placeholder="Type message..." value={broadcastText} onChange={e => setBroadcastText(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-slate-900 dark:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">Push Broadcast</button>
            </form>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Recent Activity</h3>
            <div className="space-y-4 overflow-y-auto no-scrollbar max-h-[500px]">
              {announcements.map(notice => (
                <div key={notice.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${notice.type === 'ALERT' ? 'bg-rose-500 text-white' : notice.type === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-orange-600 text-white'}`}>{notice.type}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(notice.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{notice.text}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Broadcast queue clear.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OCCUPANCY' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Live Occupancy Map</h3>
           {hostels.length > 0 ? hostels.map(h => {
             const blockResidents = residents.filter(r => r.hostelNumber === h.hostelNumber);
             const blockCapacity = h.rooms.reduce((acc, curr) => acc + curr.capacity, 0);
             const blockSpacesLeft = blockCapacity - blockResidents.length;
             return (
               <div key={h.id} className="mb-10 last:mb-0 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border dark:border-slate-700">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b dark:border-slate-700 pb-4">
                   <div><h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{h.hostelNumber}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure Block</p></div>
                   <div className="flex gap-4"><div className="text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border dark:border-slate-700"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pop.</p><p className="font-black text-slate-900 dark:text-white">{blockResidents.length} / {blockCapacity}</p></div><div className={`text-center px-4 py-2 rounded-xl shadow-sm border ${blockSpacesLeft > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><p className="text-[9px] font-black uppercase tracking-widest mb-1">Vacancy</p><p className="font-black">{blockSpacesLeft}</p></div></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {h.rooms.map(room => {
                     const roomOccupants = residents.filter(r => r.hostelNumber === h.hostelNumber && r.roomNumber === room.roomNumber);
                     const roomSpacesLeft = room.capacity - roomOccupants.length;
                     return (<div key={room.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 shadow-sm"><div className="flex justify-between items-start mb-4"><div><p className="text-xs font-black text-orange-600 uppercase tracking-widest">Room {room.roomNumber}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{roomOccupants.length} / {room.capacity}</p></div><div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${roomSpacesLeft > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{roomSpacesLeft} Open</div></div><div className="space-y-2">{roomOccupants.map(res => (<div key={res.id} className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl"><img src={res.photo} className="w-6 h-6 rounded-lg object-cover" alt="p" /><p className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate">{res.firstName}</p></div>))}{Array.from({ length: Math.max(0, roomSpacesLeft) }).map((_, i) => (<div key={i} className="h-9 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center"><span className="text-[8px] font-bold text-slate-300 uppercase">Available</span></div>))}</div></div>);
                   })}
                 </div>
               </div>
             );
           }) : (
             <p className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No infrastructure detected. Please add blocks in the Management tab.</p>
           )}
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border dark:border-slate-700 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Portal Branding</h3>
              <div className="flex flex-col sm:flex-row items-center gap-10">
                 <div className="w-40 h-40 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center border-4 border-orange-100 dark:border-slate-700 shadow-2xl overflow-hidden p-4">{logo && logo.includes('<svg') ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: logo }} /> : <img src={logo || ''} className="w-full h-full object-contain" alt="Current Logo" />}</div>
                 <div className="flex-1 space-y-6 text-center sm:text-left"><p className="text-slate-500 font-bold leading-relaxed">Customize your PG branding. This logo will appear on all resident interfaces and receipts.</p><label className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all cursor-pointer ${isLogoUploading ? 'bg-slate-400' : 'bg-orange-600 hover:bg-orange-700 text-white active:scale-95'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4 4m4-4v12" strokeWidth="2.5"/></svg>{isLogoUploading ? 'Uploading...' : 'Upload Branding'}<input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isLogoUploading} /></label></div>
              </div>
           </div>
        </div>
      )}

      {/* Resident Profile Modal */}
      {viewingResident && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setViewingResident(null)}><div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border dark:border-slate-700 animate-in zoom-in-95" onClick={e => e.stopPropagation()}><div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50"><div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Resident Dossier</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">UID: {viewingResident.id}</p></div><button onClick={() => setViewingResident(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg></button></div><div className="p-10 text-center"><img src={viewingResident.photo} className="w-40 h-40 rounded-[2.5rem] object-cover mx-auto border-4 border-white dark:border-slate-700 shadow-2xl mb-6" /><h4 className="text-3xl font-black text-slate-800 dark:text-white leading-tight uppercase">{viewingResident.firstName} {viewingResident.lastName}</h4><p className="text-orange-600 font-bold uppercase tracking-[0.2em] text-sm mt-1">Room {viewingResident.roomNumber} • {viewingResident.hostelNumber}</p><div className="mt-10 grid grid-cols-2 gap-4 text-left">
                  {[ { label: 'WhatsApp', val: viewingResident.contactNumber }, { label: 'Rent', val: `₹${viewingResident.rent.toLocaleString()}` }, { label: 'Joined', val: viewingResident.joiningDate }, { label: 'Username', val: viewingResident.username } ].map((item, i) => (<div key={i} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700/50 shadow-inner"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p><p className="font-black text-sm text-slate-800 dark:text-white truncate">{item.val}</p></div>))}
                </div><div className="mt-6 p-5 bg-orange-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Key</p><p className="font-mono text-xs text-orange-600 dark:text-orange-400">{viewingResident.password}</p></div></div></div></div>
      )}
    </div>
  );
};

export default AdminDashboard;
