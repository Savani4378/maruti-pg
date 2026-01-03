
import React, { useState, useMemo, useRef } from 'react';
import { Resident, Expense, MenuDay, ReminderConfig, PaymentEntry, PaymentRequest, Announcement, Hostel, Room } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import { generateSqlDump, downloadSqlFile } from '../services/sqlService.ts';
import { BRAND_LOGO_SVG } from '../constants.ts';
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
  const [activeTab, setActiveTab] = useState<'RESIDENTS' | 'PROFILES' | 'OCCUPANCY' | 'MANAGEMENT' | 'REPORTS' | 'MENU' | 'SETTINGS'>('RESIDENTS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  
  const [viewingResident, setViewingResident] = useState<Resident | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Resident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

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
    alert("Hostel Block added successfully!");
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
        return {
          ...h,
          rooms: [...h.rooms, newRoom],
          totalCapacity: h.totalCapacity + (parseInt(newRoomCapacity) || 4)
        };
      }
      return h;
    }));
    setNewRoomNumber('');
    alert("Room added to hostel successfully!");
  };

  const occupancyMap = useMemo(() => {
    const map: Record<string, Record<string, Resident[]>> = {};
    residents.forEach(r => {
      if (!map[r.hostelNumber]) map[r.hostelNumber] = {};
      if (!map[r.hostelNumber][r.roomNumber]) map[r.hostelNumber][r.roomNumber] = [];
      map[r.hostelNumber][r.roomNumber].push(r);
    });
    return map;
  }, [residents]);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      if (statusFilter === 'PAID' && r.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'UNPAID' && r.paymentStatus === 'PAID') return false;
      if (roomTypeFilter !== 'ALL' && r.roomType !== roomTypeFilter) return false;
      return true;
    });
  }, [residents, statusFilter, roomTypeFilter]);

  const profileResidents = useMemo(() => {
    if (!searchQuery) return residents;
    const q = searchQuery.toLowerCase();
    return residents.filter(r => 
      r.firstName.toLowerCase().includes(q) || 
      r.lastName.toLowerCase().includes(q) || 
      r.roomNumber.toLowerCase().includes(q)
    );
  }, [residents, searchQuery]);

  // Fix: Added missing pendingRequests variable derived from paymentRequests
  const pendingRequests = useMemo(() => 
    paymentRequests.filter(pr => pr.status === 'PENDING'), 
  [paymentRequests]);

  const handleEditClick = (resident: Resident) => {
    setViewingResident(resident);
    setEditForm({ ...resident });
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setResidents(prev => prev.map(r => r.id === editForm.id ? editForm : r));
    setViewingResident(editForm);
    setIsEditing(false);
    setEditForm(null);
    alert("Resident profile updated successfully!");
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
          alert("Logo updated via Cloudinary!");
        } catch (err) {
          alert("Upload failed");
        } finally {
          setIsLogoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyRequest = (requestId: string, approve: boolean) => {
    const request = paymentRequests.find(pr => pr.id === requestId);
    if (!request) return;
    if (approve) {
      setResidents(prev => prev.map(r => {
        if (r.id === request.residentId) {
          const newEntry: PaymentEntry = {
            id: Date.now().toString() + Math.random(),
            date: new Date().toISOString(),
            amount: request.amount
          };
          return { ...r, paymentStatus: 'PAID', paymentHistory: [newEntry, ...(r.paymentHistory || [])] };
        }
        return r;
      }));
    }
    setPaymentRequests(prev => prev.filter(pr => pr.id !== requestId));
  };

  const downloadReportPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 0,
      filename: `MarutiPG_Collection_Report_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().from(reportRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Admin Hub</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Maruti PG Operations</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadSqlFile(generateSqlDump(residents, expenses, announcements))} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
            Backup SQL
          </button>
          <button onClick={() => navigate('/admin/new-entry')} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 shadow-lg transition-all active:scale-95 flex items-center gap-2">
            Add Resident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Occupancy', val: stats.occupancy, icon: '🏠', color: 'orange' },
          { label: 'Collected', val: `₹${stats.collected.toLocaleString()}`, icon: '💰', color: 'emerald' },
          { label: 'Pending', val: `₹${stats.pending.toLocaleString()}`, icon: '⏳', color: 'rose' },
          { label: 'Expenses', val: `₹${stats.expenses.toLocaleString()}`, icon: '🧾', color: 'blue' },
          { label: 'Profit', val: `₹${stats.profit.toLocaleString()}`, icon: '📈', color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center transition-all hover:-translate-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {(['RESIDENTS', 'PROFILES', 'OCCUPANCY', 'MANAGEMENT', 'REPORTS', 'MENU', 'SETTINGS'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-orange-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'RESIDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Status Overview</h3>
                <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border dark:border-slate-700">
                    {(['ALL', 'PAID', 'UNPAID'] as const).map(filter => (
                      <button key={filter} onClick={() => setStatusFilter(filter)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === filter ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500'}`}>
                        {filter}
                      </button>
                    ))}
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4">Resident</th>
                      <th className="px-6 py-4">Unit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {filteredResidents.map(r => (
                      <tr key={r.id} className={`transition-all group border-l-4 ${
                        r.paymentStatus === 'PAID' ? 'border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]' : 'border-rose-500 bg-rose-500/[0.03] dark:bg-rose-500/[0.02]'
                      }`}>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800 dark:text-white text-sm">{r.firstName} {r.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{r.contactNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">{r.hostelNumber}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Room {r.roomNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                            r.paymentStatus === 'PAID' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                          }`}>
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setViewingResident(r)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-4">Verification Requests</h3>
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="p-4 bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-2xl">
                      <p className="font-black text-sm text-slate-800 dark:text-white">{req.residentName}</p>
                      <p className="text-[10px] font-bold text-orange-600 mb-3">₹{req.amount.toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyRequest(req.id, true)} className="flex-1 bg-emerald-600 text-white text-[9px] font-black uppercase py-2 rounded-lg hover:bg-emerald-700 transition-colors">Approve</button>
                        <button onClick={() => handleVerifyRequest(req.id, false)} className="flex-1 bg-rose-100 text-rose-600 text-[9px] font-black uppercase py-2 rounded-lg hover:bg-rose-200 transition-colors">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-6">All clear!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MANAGEMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Create Hostel Block</h3>
              <form onSubmit={handleAddHostel} className="flex gap-3">
                <input 
                  type="text" 
                  required 
                  placeholder="Block Name (e.g. Maruti B)" 
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  value={newHostelName}
                  onChange={e => setNewHostelName(e.target.value)}
                />
                <button type="submit" className="bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-orange-700 transition-all active:scale-95">Add Block</button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Register Unit (Room)</h3>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <select 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none"
                  value={selectedHostelForRoom}
                  onChange={e => setSelectedHostelForRoom(e.target.value)}
                >
                  <option value="">Select Hostel Block</option>
                  {hostels.map(h => <option key={h.id} value={h.id}>{h.hostelNumber}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    required 
                    placeholder="Room #" 
                    className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none"
                    value={newRoomNumber}
                    onChange={e => setNewRoomNumber(e.target.value)}
                  />
                  <input 
                    type="number" 
                    required 
                    placeholder="Capacity" 
                    className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none"
                    value={newRoomCapacity}
                    onChange={e => setNewRoomCapacity(e.target.value)}
                  />
                </div>
                <select 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none"
                  value={newRoomType}
                  onChange={e => setNewRoomType(e.target.value as any)}
                >
                  <option value="NON_AC">NON-AC Room</option>
                  <option value="AC">AC Room</option>
                </select>
                <button type="submit" className="w-full bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95">Commit Unit</button>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tight">Architecture Hierarchy</h3>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              {hostels.map(h => {
                const hostelOccupantsCount = residents.filter(r => r.hostelNumber === h.hostelNumber).length;
                return (
                  <div key={h.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border dark:border-slate-700 relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Hostel Block</p>
                         <h4 className="text-lg font-black text-slate-800 dark:text-white">{h.hostelNumber}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Block Occupancy</p>
                         <p className="text-sm font-black text-slate-700 dark:text-slate-300">{hostelOccupantsCount} / {h.totalCapacity || '0'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {h.rooms.map(room => {
                         const roomOccupantsCount = residents.filter(r => r.hostelNumber === h.hostelNumber && r.roomNumber === room.roomNumber).length;
                         const isFull = roomOccupantsCount >= room.capacity;
                         return (
                           <div key={room.id} className={`p-3 rounded-2xl border text-center transition-all ${isFull ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900' : 'bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm'}`}>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Rm {room.roomNumber}</p>
                              <p className={`text-xs font-black ${isFull ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{roomOccupantsCount} / {room.capacity}</p>
                              <div className="mt-1 flex justify-center gap-0.5">
                                 {Array.from({ length: room.capacity }).map((_, idx) => (
                                   <div key={idx} className={`w-1 h-1 rounded-full ${idx < roomOccupantsCount ? (isFull ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                 ))}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OCCUPANCY' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 shadow-sm">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Live Distribution Map</h3>
             {Object.keys(occupancyMap).map(hostel => {
               const config = hostels.find(h => h.hostelNumber === hostel);
               const occupantsInHostel = Object.values(occupancyMap[hostel]).flat();
               const totalHostelCap = config?.totalCapacity || 100;

               return (
                 <div key={hostel} className="mb-10 last:mb-0 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
                       <div>
                          <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase">{hostel}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hostel Block Overview</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Block Capacity</p>
                          <p className="text-xl font-black text-slate-800 dark:text-white">{occupantsInHostel.length} / {totalHostelCap}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                       {Object.keys(occupancyMap[hostel]).sort().map(room => {
                          const roomRes = occupancyMap[hostel][room];
                          const roomConfig = config?.rooms.find(r => r.roomNumber === room);
                          const cap = roomConfig?.capacity || 4;
                          const spacesLeft = cap - roomRes.length;

                          return (
                            <div key={room} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <p className="text-xs font-black text-orange-600 uppercase">Room {room}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">{roomRes.length} / {cap} Occupants</p>
                                  </div>
                                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${spacesLeft > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                     {spacesLeft} Open
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  {roomRes.map(res => (
                                     <div key={res.id} className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                                        <img src={res.photo} className="w-6 h-6 rounded-lg object-cover" />
                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate">{res.firstName} {res.lastName}</p>
                                     </div>
                                  ))}
                                  {Array.from({ length: spacesLeft }).map((_, i) => (
                                     <div key={i} className="h-9 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-slate-300 uppercase">Available Slot</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}

      {/* Profile & Edit Modal stays here as before... */}
      {viewingResident && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl" onClick={() => { setViewingResident(null); setIsEditing(false); }}>
           <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border dark:border-slate-700 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Resident Details</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">UID: {viewingResident.id}</p>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false);
                        setEditForm(null);
                      } else {
                        setEditForm({ ...viewingResident });
                        setIsEditing(true);
                      }
                    }} 
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isEditing ? 'bg-slate-200 dark:bg-slate-700 text-slate-600' : 'bg-blue-600 text-white shadow-lg'}`}
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                  <button onClick={() => { setViewingResident(null); setIsEditing(false); }} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg></button>
               </div>
             </div>
             <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                {isEditing && editForm ? (
                  <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">First Name</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Last Name</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold" value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Rent (₹)</label>
                      <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold" value={editForm.rent} onChange={e => setEditForm({...editForm, rent: parseFloat(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2 pt-4">
                      <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 active:scale-95 transition-all uppercase tracking-widest text-[10px]">Commit Changes</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <img src={viewingResident.photo} className="w-40 h-40 rounded-[2.5rem] object-cover mx-auto border-4 border-slate-100 dark:border-slate-700 mb-6 shadow-xl" />
                    <h4 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{viewingResident.firstName} {viewingResident.lastName}</h4>
                    <p className="text-orange-600 font-bold uppercase tracking-[0.2em] text-sm mt-1">Room {viewingResident.roomNumber} • {viewingResident.hostelNumber}</p>
                    <div className="mt-10 grid grid-cols-2 gap-4 text-left">
                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                         <p className="font-bold">{viewingResident.contactNumber}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                         <p className="font-bold">{viewingResident.roomType}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Rent</p>
                         <p className="font-bold">₹{viewingResident.rent.toLocaleString()}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Credentials</p>
                         <p className="font-bold text-[10px]">{viewingResident.username} / {viewingResident.password}</p>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
