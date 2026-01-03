
import React, { useState, useMemo } from 'react';
import { Resident, Hostel } from '../types';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '../services/cloudinaryService.ts';

interface CustomerEntryProps {
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  hostels: Hostel[];
  residents: Resident[];
}

const CustomerEntry: React.FC<CustomerEntryProps> = ({ setResidents, hostels, residents }) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    rent: '',
    roomNumber: '',
    hostelNumber: '',
    roomType: 'NON_AC' as 'AC' | 'NON_AC',
    joiningDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
  });
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [idDocBase64, setIdDocBase64] = useState<string>('');

  const selectedHostel = useMemo(() => 
    hostels.find(h => h.hostelNumber === formData.hostelNumber), 
  [hostels, formData.hostelNumber]);

  const availableRooms = useMemo(() => {
    if (!selectedHostel) return [];
    return selectedHostel.rooms.map(room => {
      const currentOccupants = residents.filter(r => r.hostelNumber === selectedHostel.hostelNumber && r.roomNumber === room.roomNumber).length;
      return {
        ...room,
        currentOccupants,
        spacesLeft: room.capacity - currentOccupants,
        isFull: currentOccupants >= room.capacity
      };
    });
  }, [selectedHostel, residents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generatePassword = (fName: string) => {
    const cleanFName = fName.trim().replace(/\s/g, '');
    const prefix = cleanFName.substring(0, 4);
    const chars = ['@', '#', '$'];
    return `${prefix}${chars[Math.floor(Math.random() * chars.length)]}MarutiPG`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostelNumber || !formData.roomNumber) {
      alert("Allocation error: Select valid Hostel Block and Unit.");
      return;
    }

    const roomInfo = availableRooms.find(r => r.roomNumber === formData.roomNumber);
    if (roomInfo?.isFull) {
      alert("Registration failed: This unit has reached its maximum resident limit!");
      return;
    }

    setIsUploading(true);
    try {
      const photoUrl = photoBase64 ? await uploadToCloudinary(photoBase64) : 'https://picsum.photos/120/120';
      const idDocUrl = idDocBase64 ? await uploadToCloudinary(idDocBase64) : '';

      const newPassword = generatePassword(formData.firstName);
      const username = formData.firstName.toLowerCase().trim() + formData.roomNumber.trim();
      
      const newResident: Resident = {
        id: Date.now().toString(),
        ...formData,
        rent: parseFloat(formData.rent),
        photo: photoUrl,
        idDocument: idDocUrl,
        password: newPassword,
        username,
        paymentStatus: 'PENDING',
        paymentHistory: [],
        lastRenewedMonth: new Date().toISOString().substring(0, 7)
      };

      setResidents(prev => [newResident, ...prev]);

      const message = `Welcome to Maruti PG! Residency Confirmed.\nCredentials:\nUser: ${username}\nKey: ${newPassword}\nRoom: ${formData.roomNumber}\nBlock: ${formData.hostelNumber}`;
      const waUrl = `https://wa.me/91${formData.contactNumber}?text=${encodeURIComponent(message)}`;
      
      alert(`Entry successful! Identity verification in progress. Shared details via WhatsApp.`);
      window.open(waUrl, '_blank');
      navigate('/admin');
    } catch (err) {
      alert("System Error: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex items-center gap-5 mb-10 relative z-10">
          <div className="bg-orange-600 text-white p-4 rounded-[1.5rem] shadow-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Member Registrar</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Allocation & Identity Verification</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal First Name</label>
            <input required className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Jay" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Last Name</label>
            <input required className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Savani" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified WhatsApp</label>
            <input required className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="9999999999" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Rental Commitment</label>
            <input required type="number" className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-black text-xl text-orange-600" value={formData.rent} onChange={e => setFormData({...formData, rent: e.target.value})} placeholder="₹ 7500" />
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Block (Hostel)</label>
            <select 
              required 
              className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold cursor-pointer" 
              value={formData.hostelNumber} 
              onChange={e => setFormData({...formData, hostelNumber: e.target.value, roomNumber: ''})}
            >
              <option value="">-- Choose Assigned Block --</option>
              {hostels.map(h => <option key={h.id} value={h.hostelNumber}>{h.hostelNumber}</option>)}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Number (Room)</label>
            <select 
              required 
              disabled={!formData.hostelNumber}
              className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold disabled:opacity-50 cursor-pointer" 
              value={formData.roomNumber} 
              onChange={e => setFormData({...formData, roomNumber: e.target.value})}
            >
              <option value="">-- Select Specific Unit --</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.roomNumber} disabled={room.isFull} className={room.isFull ? 'text-rose-400' : ''}>
                  Rm {room.roomNumber} ({room.isFull ? 'FULL' : `${room.spacesLeft} open slots`})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residency Type</label>
            <select required className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value as 'AC' | 'NON_AC'})}>
              <option value="NON_AC">Standard (NON-AC)</option>
              <option value="AC">Premium (AC)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contract Start Date</label>
            <input required type="date" className="w-full px-5 py-4 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resident Profile Capture</label>
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPhotoBase64)} className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-orange-50 file:text-orange-700 cursor-pointer" />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official ID Attachment</label>
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIdDocBase64)} className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-orange-50 file:text-orange-700 cursor-pointer" />
               </div>
             </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-4 p-6 bg-orange-50 dark:bg-slate-900/50 rounded-[1.5rem] border dark:border-slate-700">
            <input type="checkbox" id="autoRenew" checked={formData.autoRenew} onChange={e => setFormData({...formData, autoRenew: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-orange-600 focus:ring-orange-500" />
            <label htmlFor="autoRenew" className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Enable automated monthly residency billing</label>
          </div>

          <div className="md:col-span-2 pt-4">
            <button type="submit" disabled={isUploading} className={`w-full ${isUploading ? 'bg-slate-400' : 'bg-orange-600 hover:bg-orange-700'} text-white font-black py-5 rounded-[1.5rem] transition-all shadow-2xl active:scale-95 text-lg uppercase tracking-widest flex items-center justify-center gap-3`}>
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : 'Commit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEntry;
