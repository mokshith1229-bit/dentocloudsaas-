
import React, { useState, useMemo } from 'react';
import {
  CreditCard, DollarSign, Download, Plus, Search, MoreVertical,
  CheckCircle2, AlertCircle, X, Receipt, Banknote, Smartphone,
  ChevronRight, Printer, Trash2, Calendar, Ticket
} from 'lucide-react';
import { useApp } from '../App';
import { Invoice, PaymentRecord, PaymentMode } from '../types';

export default function BillingModule() {
  const { invoices, addPayment, coupons, updateInvoice, updateCoupon, patients } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionId, setTransactionId] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv =>
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.discount), 0);
    const totalCollected = invoices.reduce((acc, inv) =>
      acc + inv.payments.reduce((pa, p) => pa + p.amount, 0), 0
    );
    const outstanding = totalBilled - totalCollected;
    return { totalBilled, totalCollected, outstanding };
  }, [invoices]);

  const handleCollectPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: selectedInvoice.id,
      amount,
      mode: paymentMode,
      date: new Date().toISOString(),
      transactionId: transactionId || undefined
    };
    addPayment(selectedInvoice.id, payment);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setTransactionId('');
    // Refresh the local selected view
    const updatedInv = invoices.find(i => i.id === selectedInvoice.id);
    if (updatedInv) setSelectedInvoice(updatedInv);
  };

  const handleApplyCoupon = () => {
    if (!selectedInvoice) return;
    const coupon = coupons.find(c => c.code === couponCode.toUpperCase() && c.isActive);
    if (!coupon) {
      setCouponError('Invalid or inactive coupon');
      return;
    }

    // Condition 1: Expiry Date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      setCouponError('This coupon has expired');
      return;
    }

    // Condition 2: Min Bill Value
    if (coupon.minBillValue && selectedInvoice.totalAmount < coupon.minBillValue) {
      setCouponError(`Minimum bill value of ₹${coupon.minBillValue} required`);
      return;
    }

    // Condition 3: Loyalty / Min Visits
    if (coupon.minVisits) {
      const patient = patients.find(p => p.id === selectedInvoice.patientId);
      if (!patient || (patient.visitCount || 0) < coupon.minVisits) {
        setCouponError(`Requires at least ${coupon.minVisits} past visits (Current: ${patient?.visitCount || 0})`);
        return;
      }
    }

    // Condition 4: Target Service Requirement
    if (coupon.targetService) {
      const hasService = selectedInvoice.items.some(item =>
        item.description.toLowerCase().includes(coupon.targetService!.toLowerCase())
      );
      if (!hasService) {
        setCouponError(`Requires ${coupon.targetService} in billing items`);
        return;
      }
    }

    let discountVal = 0;
    let updatedItems = [...selectedInvoice.items];

    if (coupon.type === 'FREE_SERVICE' && coupon.freeService) {
      // Add free service as ₹0 item
      updatedItems.push({ description: `GIFT: ${coupon.freeService}`, cost: 0 });
      discountVal = selectedInvoice.discount; // Keep existing discount if any
    } else {
      if (coupon.type === 'PERCENTAGE') {
        discountVal = (selectedInvoice.totalAmount * coupon.value) / 100;
      } else {
        discountVal = coupon.value;
      }
    }

    const updatedInv: Invoice = {
      ...selectedInvoice,
      items: updatedItems,
      discount: discountVal
    };

    updateInvoice(updatedInv);
    setSelectedInvoice(updatedInv);

    // Increment usage
    updateCoupon({
      ...coupon,
      usageCount: coupon.usageCount + 1
    });

    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueStat title="Total Billed" value={`₹${stats.totalBilled.toLocaleString()}`} color="indigo" />
        <RevenueStat title="Total Collected" value={`₹${stats.totalCollected.toLocaleString()}`} color="emerald" />
        <RevenueStat title="Outstanding" value={`₹${stats.outstanding.toLocaleString()}`} color="rose" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col min-h-[500px] shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 leading-tight">Invoice Management</h2>
            <p className="text-sm text-slate-500 font-medium">Track billing lifecycle and collections</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                placeholder="Search invoices..."
              />
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Finalize Invoice
            </button>
          </div>
        </div>

        {/* List View */}
        <div className="flex-1 overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Invoice ID / Date</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Financial Summary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const totalPaid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
                const netPayable = inv.totalAmount - inv.discount;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 tracking-tight">{inv.id}</p>
                          <p className="text-xs text-slate-500 font-medium">{new Date(inv.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 tracking-tight">{inv.patientName}</p>
                      <p className="text-xs text-slate-400 font-medium">Dr. {inv.doctorName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 tracking-tight">₹{netPayable.toLocaleString()} <span className="text-[10px] text-slate-400 line-through ml-1">₹{inv.totalAmount.toLocaleString()}</span></p>
                        <p className="text-[10px] font-semibold text-emerald-600">Paid: ₹{totalPaid.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all"><Download className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Drawer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedInvoice.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/30">
              {/* Patient Profile Card */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                    {selectedInvoice.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Patient</p>
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">{selectedInvoice.patientName}</p>
                  </div>
                </div>
                <InvoiceStatusBadge status={selectedInvoice.status} />
              </div>

              {/* Coupon Section */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apply Discount Coupon</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                      placeholder="ENTER CODE"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] font-bold text-rose-500 ml-1">{couponError}</p>}
                {selectedInvoice.discount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Coupon Applied Successfully!</span>
                  </div>
                )}
              </div>

              {/* Billed Items Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Services Billed</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Service</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic-rows">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-slate-600">{item.description}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">₹{item.cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Financial Summary Area */}
                  <div className="p-4 bg-slate-900 text-white space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-xs text-rose-400">
                        <span>Discount</span>
                        <span>-₹{selectedInvoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/10 mt-1 flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-300">Total Due</span>
                      <span className="text-2xl font-bold">₹{(selectedInvoice.totalAmount - selectedInvoice.discount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Activity</h3>
                  <span className="text-xs font-medium text-emerald-600">Collected: ₹{selectedInvoice.payments.reduce((a, p) => a + p.amount, 0).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  {selectedInvoice.payments.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 border-dashed text-center">
                      <p className="text-xs text-slate-400 font-medium">No transactions recorded</p>
                    </div>
                  ) : (
                    selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center">
                            {p.mode === 'CASH' ? <Banknote className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">₹{p.amount.toLocaleString()} <span className="text-xs font-medium text-slate-400 ml-1">via {p.mode}</span></p>
                            <p className="text-[10px] text-slate-400 font-medium">{new Date(p.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-6 border-t border-slate-200 bg-white grid grid-cols-2 gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                <Printer className="w-4 h-4" />
                Print Bill
              </button>
              {selectedInvoice.status !== 'PAID' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  <DollarSign className="w-4 h-4" />
                  Collect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Post Payment</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Accepting funds for {selectedInvoice?.id}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ModeButton active={paymentMode === 'CASH'} onClick={() => setPaymentMode('CASH')} icon={Banknote} label="Cash" />
                  <ModeButton active={paymentMode === 'UPI'} onClick={() => setPaymentMode('UPI')} icon={Smartphone} label="UPI" />
                  <ModeButton active={paymentMode === 'CARD'} onClick={() => setPaymentMode('CARD')} icon={CreditCard} label="Card" />
                  <ModeButton active={paymentMode === 'BANK_TRANSFER'} onClick={() => setPaymentMode('BANK_TRANSFER')} icon={Receipt} label="Bank" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receive Amount ($)</label>
                <div className="relative">
                  <DollarSign className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-12 pr-6 py-6 bg-slate-50 border border-slate-200 rounded-[28px] text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    placeholder="0.00"
                  />
                  <button
                    onClick={() => setPaymentAmount(((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.discount || 0) - (selectedInvoice?.payments.reduce((a, p) => a + p.amount, 0) || 0)).toString())}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    Full Due
                  </button>
                </div>
              </div>

              {paymentMode !== 'CASH' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction ID / Ref</label>
                  <input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none shadow-sm"
                    placeholder="e.g. UPI-9843-X..."
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleCollectPayment}
                  disabled={!paymentAmount}
                  className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
                >
                  Process Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RevenueStat = ({ title, value, color }: any) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {title === 'Total Billed' ? <Receipt className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

const InvoiceStatusBadge = ({ status }: { status: Invoice['status'] }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-green-50 text-green-700 border-green-200',
    PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
    DUE: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border shadow-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

const ModeButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2 ${active
      ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
  </button>
);
