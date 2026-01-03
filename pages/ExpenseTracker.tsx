
import React, { useState } from 'react';
import { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface ExpenseTrackerProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ expenses, setExpenses }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'VEGETABLES' as any,
    amount: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
    };
    setExpenses(prev => [newExpense, ...prev]);
    setFormData({
      ...formData,
      amount: '',
      description: '',
    });
  };

  const deleteExpense = (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 animate-in fade-in duration-500">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 sticky top-24">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-orange-600 text-white p-2 rounded-xl">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Add Expense</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
              <input type="date" required className="w-full border dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <select className="w-full border dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
              <input type="number" required className="w-full border dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-black text-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
              <textarea className="w-full border dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all min-h-[100px] text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. 5kg Tomato, 2L Milk..." rows={3} />
            </div>
            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
              Save Expense
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center">
             <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-widest">Expense Ledger</h2>
             <div className="px-4 py-2 bg-orange-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly</p>
                <p className="font-black text-orange-600 dark:text-orange-400">₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">{expense.date}</td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full uppercase tracking-tighter border border-orange-100 dark:border-orange-900/20">{expense.category}</span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 dark:text-white">₹{expense.amount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 italic">"{expense.description}"</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id)} 
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
