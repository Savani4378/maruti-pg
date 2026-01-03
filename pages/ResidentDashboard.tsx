
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Resident, MenuDay, PaymentEntry, PaymentRequest, Announcement } from '../types.ts';
import { ADMIN_QR_PLACEHOLDER, ADMIN_UPI_ID } from '../constants.ts';

const jsQRImport = import('https://esm.sh/jsqr@1.4.0');

interface ResidentDashboardProps {
  resident: Resident;
  menu: MenuDay[];
  onUpdateResident: (updated: Resident) => void;
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  announcements: Announcement[];
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ 
  resident, 
  menu, 
  onUpdateResident,
  paymentRequests,
  setPaymentRequests,
  announcements
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<PaymentEntry | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  const today = new Date();
  const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMenu = menu.find(m => m.day === currentDayName) || menu[0];

  // Get the latest announcement
  const latestNotice = useMemo(() => announcements[0], [announcements]);

  // Check if there's a pending cash request for this resident
  const myPendingRequest = useMemo(() => 
    paymentRequests.find(pr => pr.residentId === resident.id && pr.status === 'PENDING'),
  [paymentRequests, resident.id]);

  // --- Mobile Back Button Handling for Modals ---
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activeInvoice) {
        setActiveInvoice(null);
      } else if (showPaymentModal) {
        stopScanner();
        setShowPaymentModal(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeInvoice, showPaymentModal]);

  const openPaymentModal = () => {
    window.history.pushState({ modal: 'payment' }, "");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    stopScanner();
    setShowPaymentModal(false);
    if (window.history.state?.modal === 'payment') window.history.back();
  };

  const openInvoice = (pay: PaymentEntry) => {
    window.history.pushState({ modal: 'invoice' }, "");
    setActiveInvoice(pay);
  };

  const closeInvoice = () => {
    setActiveInvoice(null);
    if (window.history.state?.modal === 'invoice') window.history.back();
  };

  const handleCashPaymentRequest = () => {
    const newRequest: PaymentRequest = {
      id: Date.now().toString(),
      residentId: resident.id,
      residentName: `${resident.firstName} ${resident.lastName}`,
      amount: resident.rent,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    setPaymentRequests(prev => [...prev, newRequest]);
    alert("Cash payment request sent! Please hand over the cash to the Admin for verification.");
    closePaymentModal();
  };

  // --- Fixed PDF Generation & Download ---
  const downloadInvoicePDF = () => {
    if (!invoiceRef.current || !activeInvoice) return;
    
    const opt = {
      margin: 0.5,
      filename: `MarutiPG_Receipt_${activeInvoice.id.slice(-6)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().from(invoiceRef.current).set(opt).save().catch(err => {
      console.error("PDF Generation failed:", err);
      alert("Error generating PDF. Please try again.");
    });
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      const newEntry: PaymentEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount: resident.rent
      };

      const updated: Resident = {
        ...resident,
        paymentStatus: 'PAID',
        lastPaymentDate: new Date().toISOString(),
        paymentHistory: [newEntry, ...(resident.paymentHistory || [])]
      };
      
      setTimeout(() => {
        onUpdateResident(updated);
        closePaymentModal();
        setPaymentSuccess(false);
      }, 2000);
    }, 2500);
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      console.error("Scanner Error:", err);
      alert("System Error: Camera hardware unavailable.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    const ctx = canvasRef.current.getContext("2d");
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.width = videoRef.current.videoWidth;
      ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imgData = ctx?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (imgData) {
        const jsQRModule = await jsQRImport;
        const jsQR = jsQRModule.default;
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          stopScanner();
          handleSimulatePayment();
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => () => stopScanner(), []);

  // Construct UPI URI for standard app intent
  const upiUri = `upi://pay?pa=${ADMIN_UPI_ID}&pn=Maruti%20PG&am=${resident.rent}&cu=INR`;

  return (
    <div className="space-y-6 sm:space-y-8 py-6 px-4 max-w-6xl mx-auto animate-in fade-in duration-700">
      
      {/* Dynamic Notice Board */}
      {latestNotice && (
        <div className={`p-5 rounded-[2rem] border shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
          latestNotice.type === 'ALERT' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' :
          latestNotice.type === 'WARNING' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' :
          'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30'
        }`}>
          <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
            latestNotice.type === 'ALERT' ? 'bg-rose-600 text-white animate-pulse' :
            latestNotice.type === 'WARNING' ? 'bg-amber-500 text-white' :
            'bg-orange-600 text-white'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2.5"/></svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Important Broadcast</p>
              <p className="text-[8px] font-bold opacity-40 uppercase">{new Date(latestNotice.timestamp).toLocaleDateString()}</p>
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{latestNotice.text}</p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 transition-all no-print">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative">
          <img src={resident.photo || 'https://picsum.photos/120/120'} className="w-40 h-40 rounded-[2rem] object-cover border-4 border-orange-50 dark:border-slate-700 shadow-2xl" />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="3"/></svg>
          </div>
        </div>
        <div className="text-center md:text-left relative z-10">
          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.3em] mb-2">Resident Member</p>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white leading-tight">Welcome Back, {resident.firstName}!</h1>
          <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Room {resident.roomNumber}</span>
            </div>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hostel</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{resident.hostelNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        {/* Financial Overview */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-700 relative overflow-hidden">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex justify-between items-center">
            Dues Summary
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${resident.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {resident.paymentStatus}
            </span>
          </h2>
          
          <div className={`p-10 rounded-[2rem] border-2 mb-8 text-center transition-all ${resident.paymentStatus === 'PAID' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-700'}`}>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Rent</p>
             <p className="text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">₹{resident.rent.toLocaleString()}</p>
             <p className="text-xs font-bold text-slate-500">Includes Room, High-Speed WiFi & Power</p>
          </div>

          <div className="space-y-4">
            {myPendingRequest ? (
              <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border-2 border-orange-200 dark:border-orange-800 text-center animate-pulse">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
                </div>
                <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Verification Pending</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Waiting for Admin to confirm cash receipt.</p>
              </div>
            ) : resident.paymentStatus !== 'PAID' && (
              <button onClick={openPaymentModal} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-orange-200 flex items-center justify-center gap-3 transition-all active:scale-95 text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                Settle Dues
              </button>
            )}
            
            {/* UPI ID Quick-Tap Section */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin UPI ID</p>
              <a 
                href={upiUri} 
                className="inline-block px-6 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-orange-600 dark:text-orange-400 shadow-sm active:scale-95 transition-all hover:border-orange-500"
              >
                {ADMIN_UPI_ID}
              </a>
              <p className="text-[9px] font-medium text-slate-500 mt-2">Tap to pay using GPay, PhonePe, or Paytm</p>
            </div>

            {resident.paymentStatus === 'PAID' && resident.paymentHistory && resident.paymentHistory.length > 0 && (
              <button onClick={() => openInvoice(resident.paymentHistory![0])} className="w-full bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border dark:border-slate-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5"/></svg>
                View Last Invoice
              </button>
            )}
          </div>
        </div>

        {/* Food Status */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Today's Menu</h2>
             <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest">{currentDayName}</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Morning Brew', val: todaysMenu.breakfast, icon: '🍳', color: 'orange' },
              { label: 'Afternoon Thali', val: todaysMenu.lunch, icon: '🍛', color: 'emerald' },
              { label: 'Evening Dinner', val: todaysMenu.dinner, icon: '🍲', color: 'amber' }
            ].map((meal, i) => (
              <div key={i} className={`flex gap-5 p-5 bg-${meal.color}-50/50 dark:bg-${meal.color}-900/10 rounded-[1.5rem] border border-${meal.color}-100/50 dark:border-${meal.color}-900/20`}>
                <div className={`bg-${meal.color}-500 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>{meal.icon}</div>
                <div>
                  <p className={`text-[10px] font-black text-${meal.color}-600 dark:text-${meal.color}-400 uppercase tracking-widest mb-1`}>{meal.label}</p>
                  <p className="text-slate-800 dark:text-slate-200 font-black text-lg">{meal.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History Vault */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-700 no-print">
         <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
            Payment Vault
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resident.paymentHistory && resident.paymentHistory.length > 0 ? (
               resident.paymentHistory.map(pay => (
                  <div key={pay.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700 flex justify-between items-center group hover:border-orange-500 transition-all">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(pay.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">₹{pay.amount.toLocaleString()}</p>
                     </div>
                     <button onClick={() => openInvoice(pay)} className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg hover:bg-orange-700 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3a10.003 10.003 0 016.112 2.139m-4.69 11.396a3.072 3.072 0 11-1.41-4.413m4.69 4.413a3.071 3.071 0 11-1.41-4.413" strokeWidth="3"/></svg>
                     </button>
                  </div>
               ))
            ) : (
               <div className="col-span-full py-12 text-center text-slate-400">
                  <p className="text-xs font-black uppercase tracking-widest italic">Vault Empty.</p>
               </div>
            )}
         </div>
      </div>

      {/* Modals & Invoice Logic */}
      {activeInvoice && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl no-print">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl h-[90vh] shadow-2xl overflow-hidden border flex flex-col animate-in zoom-in-95">
               <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Rent Receipt</h3>
                  <div className="flex gap-2">
                     <button onClick={downloadInvoicePDF} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Download PDF</button>
                     <button onClick={closeInvoice} className="p-2 bg-slate-200 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-12 bg-white text-black" ref={invoiceRef}>
                  <div className="flex justify-between mb-16">
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Maruti PG Hub</h2>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Digital Residency Receipt</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Serial ID</p>
                        <p className="font-black text-lg text-slate-900">#{activeInvoice.id.slice(-8).toUpperCase()}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-12 mb-16">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Member Details</p>
                        <p className="text-xl font-black uppercase text-slate-900">{resident.firstName} {resident.lastName}</p>
                        <p className="text-sm font-bold text-orange-600 mt-1">Room {resident.roomNumber} • {resident.hostelNumber}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transaction Info</p>
                        <p className="text-sm font-bold text-slate-900">Paid Date: {new Date(activeInvoice.date).toLocaleDateString('en-GB')}</p>
                        <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase rounded-lg mt-2">Verified Success</div>
                     </div>
                  </div>
                  <table className="w-full text-left mb-16 border-t-4 border-black">
                     <thead>
                        <tr className="border-b bg-slate-100">
                           <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900">Description</th>
                           <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Amount</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr className="border-b">
                           <td className="px-4 py-8">
                              <p className="font-black text-sm uppercase text-slate-900">Monthly Residency Rent</p>
                              <p className="text-[10px] text-slate-500 mt-1">Complete room allocation and utility settlement.</p>
                           </td>
                           <td className="px-4 py-8 text-right font-black text-lg text-slate-900">₹{activeInvoice.amount.toLocaleString()}</td>
                        </tr>
                        <tr>
                           <td className="px-4 py-8 text-right font-black uppercase text-xs text-slate-900">Total Settled</td>
                           <td className="px-4 py-8 text-right text-3xl font-black text-slate-900">₹{activeInvoice.amount.toLocaleString()}</td>
                        </tr>
                     </tbody>
                  </table>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-black/10 text-center">
                     <p className="text-[10px] text-slate-600 font-medium italic">Thank you for staying with Maruti PG. This digital receipt is proof of payment for the current cycle.</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Payment Interface Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl no-print">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border dark:border-slate-700 animate-in zoom-in-95">
            <div className="bg-slate-900 dark:bg-slate-950 p-8 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight">Digital Payment</h3>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">Authorized Gateway</p>
            </div>
            <div className="p-10 text-center">
              {paymentSuccess ? (
                <div className="py-10">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">Confirmed!</h4>
                  <p className="text-slate-500 mt-2 font-medium">System records updated.</p>
                </div>
              ) : isProcessing ? (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">Validating...</h4>
                </div>
              ) : isScanning ? (
                <div className="space-y-6">
                  <div className="relative aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-orange-600/20">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-8 border-2 border-orange-400/50 rounded-2xl animate-pulse"></div>
                  </div>
                  <button onClick={closePaymentModal} className="w-full bg-rose-100 text-rose-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Abort</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="pb-6 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Due Amount</p>
                    <p className="text-5xl font-black text-slate-800 dark:text-white">₹{resident.rent.toLocaleString()}</p>
                  </div>
                  
                  {/* Tap to Pay Link */}
                  <a 
                    href={upiUri}
                    className="w-full flex items-center gap-4 p-6 rounded-[2rem] bg-orange-50 dark:bg-slate-900 border-2 border-transparent hover:border-orange-600 transition-all text-left"
                  >
                    <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase text-xs">OPEN PAYMENT APP</p>
                      <p className="text-[10px] text-slate-500 font-bold">Select GPay, PhonePe, etc.</p>
                    </div>
                  </a>

                  <button onClick={handleCashPaymentRequest} className="w-full flex items-center gap-4 p-6 rounded-[2rem] bg-orange-50 dark:bg-slate-900 border-2 border-transparent hover:border-orange-600 transition-all text-left">
                    <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" strokeWidth="2.5"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white uppercase text-xs">PAY VIA CASH</p>
                      <p className="text-[10px] text-slate-500 font-bold">In-person Verification</p>
                    </div>
                  </button>

                  <button onClick={startScanner} className="w-full flex items-center gap-4 p-6 rounded-[2rem] bg-orange-50 dark:bg-slate-900 border-2 border-transparent hover:border-orange-600 transition-all text-left">
                    <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16M4 16h16M4 4h16v16H4V4z"></path></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white uppercase text-xs">SCAN QR LENS</p>
                      <p className="text-[10px] text-slate-500 font-bold">Manual Detection</p>
                    </div>
                  </button>

                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
                    <img src={ADMIN_QR_PLACEHOLDER} className="w-32 h-32 mx-auto mb-6" alt="QR" />
                    <div className="flex gap-2">
                       <button onClick={handleSimulatePayment} className="flex-1 bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Pay Manually</button>
                       <button onClick={closePaymentModal} className="px-6 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black active:scale-95 transition-all">Close</button>
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

export default ResidentDashboard;
