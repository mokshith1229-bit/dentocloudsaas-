import React, { useState, useMemo } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Plus, Download, Filter,
  Search, CreditCard, Banknote, DollarSign, Calendar, MessageSquare,
  CheckCircle2, X, Info, TrendingUp, UserPlus, FileText, Smartphone,
  Activity, ArrowRightLeft, Shield, Printer, Share2, Lock
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants.tsx';
import { useApp } from '../App';
import { Expense, PaymentMode } from '../types';

type TransactionTab = 'LEDGER' | 'EOD_REPORT';

export default function TransactionModule() {
  const { invoices, expenses, addExpense, patients, appointments } = useApp();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>('LEDGER');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Form State
  const [newExpense, setNewExpense] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    mode: 'CASH' as PaymentMode,
    notes: ''
  });

  // Financial Calculations for selected date
  const financialData = useMemo(() => {
    const dailyExpenses = expenses.filter(e => e.date === selectedDate);

    // Aggregate all payments from invoices that occurred on selectedDate
    const dailyPayments = invoices.flatMap(invoice =>
      invoice.payments
        .filter(payment => payment.date.split('T')[0] === selectedDate)
        .map(payment => ({
          ...payment,
          patientName: invoice.patientName,
          patientId: invoice.patientId,
          invoiceId: invoice.id
        }))
    );

    const income = dailyPayments.reduce((acc, p) => acc + p.amount, 0);
    const expenseTotal = dailyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const net = income - expenseTotal;

    // Calculate total billed for the day (from invoices created on this date)
    const dailyInvoices = invoices.filter(inv => inv.date === selectedDate);
    const billed = dailyInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.discount), 0);
    const collected = income;

    // Mode-wise breakdown
    const cashIncome = dailyPayments.filter(p => p.mode === 'CASH').reduce((acc, p) => acc + p.amount, 0);
    const digitalIncome = income - cashIncome;

    const cashExpense = dailyExpenses.filter(e => e.mode === 'CASH').reduce((acc, e) => acc + e.amount, 0);
    const digitalExpense = expenseTotal - cashExpense;

    // New Patients Count based on registrationDate
    const newPatientsCount = patients.filter(p => p.registrationDate === selectedDate).length;

    // Total appointments for the day (for EOD summary)
    const dailyAppointments = appointments.filter(a => a.date === selectedDate);

    // Combined Ledger Logic - now using invoice payments
    const ledgerItems = [
      ...dailyPayments.map(p => ({
        id: p.id,
        type: 'INCOME' as const,
        source: p.patientName,
        category: `Payment for Invoice ${p.invoiceId}`,
        amount: p.amount,
        mode: p.mode,
        time: new Date(p.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: p.date.split('T')[0],
        original: p
      })),
      ...dailyExpenses.map(e => ({
        id: e.id,
        type: 'EXPENSE' as const,
        source: e.category === 'Vendor Payment' ? 'Vendor Payout' : 'Practice Expense',
        category: e.category,
        amount: e.amount,
        mode: e.mode,
        time: '12:00 PM', // Default time for expenses if not tracked
        date: e.date,
        notes: e.notes,
        original: e
      }))
    ].sort((a, b) => {
      // Sort by time
      return a.time.localeCompare(b.time);
    });

    return {
      income,
      expenseTotal,
      net,
      billed,
      collected,
      dailyAppointments,
      dailyExpenses,
      cashIncome,
      digitalIncome,
      cashExpense,
      digitalExpense,
      newPatientsCount,
      ledgerItems
    };
  }, [invoices, expenses, selectedDate, patients, appointments]);

  const handleAddExpense = () => {
    if (!newExpense.amount) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      mode: newExpense.mode,
      date: selectedDate,
      notes: newExpense.notes
    };
    addExpense(expense);
    setShowExpenseModal(false);
    setNewExpense({ category: EXPENSE_CATEGORIES[0], amount: '', mode: 'CASH', notes: '' });
  };

  const eodSummaryText = `
*EOD Summary - ${selectedDate}*
---------------------------
*Patients:* ${financialData.dailyAppointments.length} (New: ${financialData.newPatientsCount})
*Billed:* ₹${financialData.billed} | *Collected:* ₹${financialData.collected}
---------------------------
*Income Check:*
💵 Cash: ₹${financialData.cashIncome}
💳 Bank: ₹${financialData.digitalIncome}
---------------------------
*Expense Check:*
🔻 Total Out: ₹${financialData.expenseTotal}
(Cash Out: ₹${financialData.cashExpense})
---------------------------
*Closing Balances:*
💰 Net Cash Today: ₹${financialData.cashIncome - financialData.cashExpense}
🏦 Net Bank Today: ₹${financialData.digitalIncome - financialData.digitalExpense}
  `.trim();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Financial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Practice Ledger</h1>
            <p className="text-sm text-slate-500 font-medium">Single Source of Truth</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Daily Income"
          value={`₹${financialData.income.toFixed(2)}`}
          icon={ArrowUpRight}
          color="emerald"
          subtitle={`${financialData.newPatientsCount} New Patients Today`}
        />
        <SummaryCard
          title="Daily Expenses"
          value={`₹${financialData.expenseTotal.toFixed(2)}`}
          icon={ArrowDownRight}
          color="rose"
          subtitle="Vendor & Clinic Costs"
        />
        <SummaryCard
          title="Net Position"
          value={`₹${financialData.net.toFixed(2)}`}
          icon={financialData.net >= 0 ? TrendingUp : ArrowDownRight}
          color={financialData.net >= 0 ? "indigo" : "rose"}
          subtitle="Realized Profit This Day"
          profit={financialData.net >= 0}
        />
      </div>

      {/* Flow Analysis - Cash vs Bank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Physical Cash Flow</h3>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cash In</p>
                <p className="text-2xl font-black text-emerald-400">+₹{financialData.cashIncome}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cash Out</p>
                <p className="text-2xl font-black text-rose-400">-₹{financialData.cashExpense}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Cash Today</span>
              <span className={`text-3xl font-black ${financialData.cashIncome - financialData.cashExpense >= 0 ? 'text-white' : 'text-rose-400'}`}>
                ₹{financialData.cashIncome - financialData.cashExpense}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Digital / Bank Flow</h3>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank In</p>
                <p className="text-2xl font-black text-emerald-600">+₹{financialData.digitalIncome}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Out</p>
                <p className="text-2xl font-black text-rose-600">-₹{financialData.digitalExpense}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Bank Today</span>
              <span className={`text-3xl font-black ${financialData.digitalIncome - financialData.digitalExpense >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                ₹{financialData.digitalIncome - financialData.digitalExpense}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-[32px] w-fit border border-slate-200 shadow-inner">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LEDGER' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Unified Ledger
        </button>
        <button
          onClick={() => setActiveTab('EOD_REPORT')}
          className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'EOD_REPORT' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          End of Day Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'LEDGER' ? (
            <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Today's Transactions</h3>
                <span className="text-xs font-bold text-slate-400 uppercase">{financialData.ledgerItems.length} Entries</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Source / Entity</th>
                    <th className="px-8 py-5">Type / Category</th>
                    <th className="px-8 py-5">Mode</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialData.ledgerItems.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-16 text-center text-xs font-bold text-slate-300 uppercase italic">No transactions found for this date</td></tr>
                  ) : (
                    financialData.ledgerItems.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${item.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {item.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.source}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{item.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.category}</p>
                          {item.type === 'EXPENSE' && (item as any)?.notes && (
                            <p className="text-[9px] font-medium text-slate-400 italic truncate max-w-[200px]">{(item as any).notes}</p>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.mode === 'CASH' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            {item.mode === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                            {item.mode?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-8 py-5 text-right text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.type === 'INCOME' ? '+' : '-'}₹{item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* EOD Report View */
            <div className="space-y-8">
              <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-indigo-600" />
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Generated EOD Summary</h2>
                    </div>
                    <button className="text-indigo-600 text-xs font-bold uppercase hover:underline flex items-center gap-1">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner">
                    {eodSummaryText}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => navigator.clipboard.writeText(eodSummaryText)} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" /> Copy to Clipboard
                    </button>
                    <button className="flex-1 bg-emerald-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                      <Smartphone className="w-4 h-4" /> Send to WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">WhatsApp Automation</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">Daily Report</span>
                  <Toggle active={isSubscribed} onClick={() => setIsSubscribed(!isSubscribed)} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Automatically send this summary to the clinic owner at 9:00 PM.</p>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Close Day</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Verifying and locking the day prevents future edits to these transactions.</p>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Lock & Archive</button>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowExpenseModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Record Payout</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Practice expenditure logging</p>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Category</p>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mode</p>
                  <select
                    value={newExpense.mode}
                    onChange={e => setNewExpense({ ...newExpense, mode: e.target.value as PaymentMode })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK / UPI</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Payout Amount (₹)</p>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="0.00"
                    type="number"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[24px] text-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Notes (Optional)</p>
                <textarea
                  placeholder="What was this for? e.g., Electricity bill Oct"
                  value={newExpense.notes}
                  onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none h-32"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAddExpense}
                  disabled={!newExpense.amount}
                  className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, icon: Icon, color, subtitle, profit }: any) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <div className={`bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-${color}-200 transition-colors`}>
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className={`w-14 h-14 ${colorMap[color]} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110`}>
          <Icon className="w-8 h-8" />
        </div>
        {profit !== undefined && (
          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${profit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {profit ? 'Surplus' : 'Deficit'}
          </span>
        )}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</div>
      <div className={`text-4xl font-black ${profit === false ? 'text-rose-600' : 'text-slate-900'} tracking-tighter mb-1`}>{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</div>
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-${color}-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  );
};

const Toggle = ({ active, onClick, disabled }: { active: boolean, onClick: () => void, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-11 h-6 rounded-full relative transition-all ${active ? 'bg-emerald-500' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`}></div>
  </button>
);
