
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
      alert("Please select both Hostel and Room.");
      return;
    }

    const roomInfo = availableRooms.find(r => r.roomNumber === formData.roomNumber);
    if (roomInfo?.isFull) {
      alert("This room is already full! Please select another unit.");
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

      const message = `Welcome to Maruti PG! Credentials:\nUsername: ${username}\nPassword: ${newPassword}\nRoom: ${formData.roomNumber}\nHostel: ${formData.hostelNumber}`;
      const waUrl = `https://wa.me/91${formData.contactNumber}?text=${encodeURIComponent(message)}`;
      
      alert(`Entry Successful! Credentials sent to WhatsApp.`);
      window.open(waUrl, '_blank');
      navigate('/admin');
    } catch (err) {
      alert("Error saving data: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange-600 text-white p-3 rounded-2xl shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Cloud Registration</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">First Name</label>
            <input required className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Enter first name" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
            <input required className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Enter last name" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
            <input required className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="9999999999" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Rent Amount</label>
            <input required type="number" className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-black" value={formData.rent} onChange={e => setFormData({...formData, rent: e.target.value})} placeholder="₹ Monthly" />
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Select Hostel Block</label>
            <select 
              required 
              className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" 
              value={formData.hostelNumber} 
              onChange={e => setFormData({...formData, hostelNumber: e.target.value, roomNumber: ''})}
            >
              <option value="">Choose Block...</option>
              {hostels.map(h => <option key={h.id} value={h.hostelNumber}>{h.hostelNumber}</option>)}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Select Room (Occupancy)</label>
            <select 
              required 
              disabled={!formData.hostelNumber}
              className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold disabled:opacity-50" 
              value={formData.roomNumber} 
              onChange={e => setFormData({...formData, roomNumber: e.target.value})}
            >
              <option value="">Select Unit...</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.roomNumber} disabled={room.isFull}>
                  Room {room.roomNumber} ({room.isFull ? 'FULL' : `${room.spacesLeft} space(s) left`})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Unit Type</label>
            <select required className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none font-bold" value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value as 'AC' | 'NON_AC'})}>
              <option value="NON_AC">Standard (NON-AC)</option>
              <option value="AC">Premium (AC)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Joining Date</label>
            <input required type="date" className="w-full px-4 py-3 border rounded-2xl dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Member Photo</label>
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPhotoBase64)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-700" />
               </div>
               <div className="space-y-1">
                 <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">ID Card Copy</label>
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIdDocBase64)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-700" />
               </div>
             </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-orange-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
            <input type="checkbox" id="autoRenew" checked={formData.autoRenew} onChange={e => setFormData({...formData, autoRenew: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-orange-600" />
            <label htmlFor="autoRenew" className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Auto-Renew Billing</label>
          </div>

          <div className="md:col-span-2 pt-8">
            <button type="submit" disabled={isUploading} className={`w-full ${isUploading ? 'bg-slate-400' : 'bg-orange-600 hover:bg-orange-700'} text-white font-black py-4 rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95`}>
              {isUploading ? 'Processing...' : 'Verify & Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEntry;
