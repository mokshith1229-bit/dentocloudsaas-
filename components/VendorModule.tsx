
import React, { useState, useMemo } from 'react';
import {
  Truck, Plus, Search, MoreVertical, Phone, Code, FlaskConical,
  Package, Banknote, X, Receipt, Download, FileText, ArrowLeft,
  ChevronRight, ArrowUpRight, ArrowDownRight, Printer, MessageSquare,
  AlertCircle, CheckCircle2, DollarSign, Smartphone
} from 'lucide-react';
import { useApp } from '../App';
import { Vendor, VendorInvoice, VendorPayment, LabOrder, PaymentMode } from '../types';

type VendorView = 'LIST' | 'PROFILE';

export default function VendorModule() {
  const { vendors, addVendor, vendorInvoices, vendorPayments, labOrders, addVendorInvoice, addVendorPayment, updateLabOrder, confirmLabOrder } = useApp();
  const [view, setView] = useState<VendorView>('LIST');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Modals
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showLinkLab, setShowLinkLab] = useState(false);

  // Form States
  const [newVendor, setNewVendor] = useState({ name: '', category: 'LAB' as Vendor['category'], phone: '', code: '' });
  const [newInvoice, setNewInvoice] = useState({ amount: '', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [newPayment, setNewPayment] = useState({ amount: '', mode: 'CASH' as PaymentMode, notes: '' });

  const selectedVendor = useMemo(() => vendors.find(v => v.id === selectedVendorId), [vendors, selectedVendorId]);

  const stats = useMemo(() => {
    const totalDue = vendors.reduce((acc, v) => acc + v.balance, 0);
    const labsCount = vendors.filter(v => v.category === 'LAB').length;
    const pendingOrders = labOrders.filter(lo => !lo.vendorId).length;
    return { totalDue, labsCount, pendingOrders };
  }, [vendors, labOrders]);

  const handleCreateVendor = () => {
    if (!newVendor.name) return;
    addVendor({
      id: `v-${Date.now()}`,
      ...newVendor,
      balance: 0,
      totalDue: 0,
      totalPaid: 0
    });
    setShowAddVendor(false);
    setNewVendor({ name: '', category: 'LAB', phone: '', code: '' });
  };

  const handleRecordInvoice = () => {
    if (!selectedVendorId || !newInvoice.amount) return;
    const inv: VendorInvoice = {
      id: `vi-${Date.now()}`,
      vendorId: selectedVendorId,
      amount: parseFloat(newInvoice.amount),
      date: newInvoice.date,
      reference: newInvoice.reference,
      status: 'DUE',
      notes: newInvoice.notes
    };
    addVendorInvoice(inv);
    setShowAddInvoice(false);
    setNewInvoice({ amount: '', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  };

  const handleRecordPayment = () => {
    if (!selectedVendorId || !newPayment.amount) return;
    const pay: VendorPayment = {
      id: `vp-${Date.now()}`,
      vendorId: selectedVendorId,
      amount: parseFloat(newPayment.amount),
      date: new Date().toISOString().split('T')[0],
      mode: newPayment.mode,
      notes: newPayment.notes
    };
    addVendorPayment(pay);
    setShowAddPayment(false);
    setNewPayment({ amount: '', mode: 'CASH', notes: '' });
  };

  const handleLinkLabOrder = (labOrderId: string) => {
    if (!selectedVendorId || !selectedVendor) return;
    const order = labOrders.find(lo => lo.id === labOrderId);
    if (!order) return;

    // Update the lab order status and vendor info
    updateLabOrder({
      ...order,
      vendorId: selectedVendorId,
      vendorName: selectedVendor.name,
      status: 'ASSIGNED'
    });

    setShowLinkLab(false);
  };

  const handleConfirmLabOrder = (order: LabOrder) => {
    confirmLabOrder(order.id);
  };

  if (view === 'PROFILE' && selectedVendor) {
    return (
      <VendorProfile
        vendor={selectedVendor}
        onBack={() => setView('LIST')}
        invoices={vendorInvoices.filter(vi => vi.vendorId === selectedVendor.id)}
        payments={vendorPayments.filter(vp => vp.vendorId === selectedVendor.id)}
        labOrders={labOrders.filter(lo => lo.vendorId === selectedVendor.id)}
        onAddInvoice={() => setShowAddInvoice(true)}
        onAddPayment={() => setShowAddPayment(true)}
        onLinkLab={() => setShowLinkLab(true)}
        onConfirmLab={handleConfirmLabOrder}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vendor Management</h1>
            <p className="text-sm text-slate-500 font-medium">Coordinate labs, materials, and service logistics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddVendor(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Payables" value={`₹${stats.totalDue.toFixed(2)}`} icon={Banknote} color="rose" subtitle="Outstanding across all vendors" />
        <StatCard title="Active Labs" value={stats.labsCount} icon={FlaskConical} color="indigo" subtitle="Registered technicians" />
        <StatCard title="Unassigned Jobs" value={stats.pendingOrders} icon={AlertCircle} color="amber" subtitle="Lab orders needing assignment" />
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vendors.map(v => (
          <div
            key={v.id}
            onClick={() => { setSelectedVendorId(v.id); setView('PROFILE'); }}
            className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative group overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all group-hover:scale-110 ${v.category === 'LAB' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {v.category === 'LAB' ? <FlaskConical className="w-8 h-8" /> : <Package className="w-8 h-8" />}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${v.balance > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {v.balance > 0 ? 'Dues Pending' : 'Settled'}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{v.name}</h3>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10 relative z-10">
              <span className="flex items-center gap-1.5"><Code className="w-4 h-4" /> {v.code}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {v.phone}</span>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-[32px] border border-slate-100 flex items-center justify-between relative z-10 group-hover:bg-white transition-colors">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Balance Payable</p>
                <p className={`text-2xl font-black tracking-tight ${v.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>₹{v.balance.toFixed(2)}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
            </div>

            <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${v.category === 'LAB' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddVendor && (
        <Modal title="Onboard Vendor" onClose={() => setShowAddVendor(false)}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Vendor Name" value={newVendor.name} onChange={v => setNewVendor({ ...newVendor, name: v })} placeholder="e.g. Advanced Tech Lab" />
              <Input label="Category" type="select" value={newVendor.category} onChange={v => setNewVendor({ ...newVendor, category: v as any })} options={['LAB', 'SUPPLIER', 'UTILITIES', 'SERVICE']} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Internal Code" value={newVendor.code} onChange={v => setNewVendor({ ...newVendor, code: v })} placeholder="V-CODE-01" />
              <Input label="Phone Number" value={newVendor.phone} onChange={v => setNewVendor({ ...newVendor, phone: v })} placeholder="+1..." />
            </div>
            <button onClick={handleCreateVendor} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700">Save Vendor Profile</button>
          </div>
        </Modal>
      )}

      {showAddInvoice && (
        <Modal title="Record Invoice" onClose={() => setShowAddInvoice(false)}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Amount Payable (₹)" type="number" value={newInvoice.amount} onChange={v => setNewInvoice({ ...newInvoice, amount: v })} placeholder="0.00" />
              <Input label="Invoice Date" type="date" value={newInvoice.date} onChange={v => setNewInvoice({ ...newInvoice, date: v })} />
            </div>
            <Input label="Reference / Invoice #" value={newInvoice.reference} onChange={v => setNewInvoice({ ...newInvoice, reference: v })} placeholder="e.g. INV-2024-88" />
            <Input label="Notes" type="textarea" value={newInvoice.notes} onChange={v => setNewInvoice({ ...newInvoice, notes: v })} placeholder="Service details..." />
            <button onClick={handleRecordInvoice} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700">Add to Payables</button>
          </div>
        </Modal>
      )}

      {showAddPayment && (
        <Modal title="Record Payout" onClose={() => setShowAddPayment(false)}>
          <div className="space-y-6">
            <Input label="Payment Amount (₹)" type="number" value={newPayment.amount} onChange={v => setNewPayment({ ...newPayment, amount: v })} placeholder="0.00" />
            <Input label="Payout Mode" type="select" value={newPayment.mode} onChange={v => setNewPayment({ ...newPayment, mode: v as any })} options={['CASH', 'BANK_TRANSFER', 'UPI', 'CARD']} />
            <Input label="Notes / Transaction Ref" value={newPayment.notes} onChange={v => setNewPayment({ ...newPayment, notes: v })} placeholder="Ref ID..." />
            <button onClick={handleRecordPayment} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700">Confirm Transaction</button>
          </div>
        </Modal>
      )}

      {showLinkLab && (
        <Modal title="Assign Lab Order" onClose={() => setShowLinkLab(false)}>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {labOrders.filter(lo => !lo.vendorId).length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-bold uppercase text-[10px]">No pending unassigned lab orders</p>
            ) : (
              labOrders.filter(lo => !lo.vendorId).map(lo => (
                <div key={lo.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between group hover:bg-white hover:border-indigo-200 transition-all">
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{lo.workType}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{lo.patientName} • ₹{lo.price}</p>
                  </div>
                  <button
                    onClick={() => handleLinkLabOrder(lo.id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                  >
                    Assign
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

const VendorProfile = ({ vendor, onBack, invoices, payments, labOrders, onAddInvoice, onAddPayment, onLinkLab, onConfirmLab }: any) => {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS' | 'LABS'>('INVOICES');

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-3xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{vendor.name}</h1>
          <p className="text-sm text-slate-500 font-medium">Full financial history and job tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Due" value={`₹${vendor.totalDue.toFixed(2)}`} icon={ArrowUpRight} color="rose" />
        <MetricCard title="Total Paid" value={`₹${vendor.totalPaid.toFixed(2)}`} icon={ArrowDownRight} color="emerald" />
        <div className="md:col-span-2 bg-slate-900 p-10 rounded-[48px] text-white flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Balance Payable</p>
            <p className="text-5xl font-black tracking-tighter text-indigo-400">₹{vendor.balance.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 relative z-10">
            <button onClick={onAddPayment} className="bg-white text-slate-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Pay Vendor</button>
          </div>
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-[32px] w-fit border border-slate-200 shadow-inner">
            <button onClick={() => setActiveTab('INVOICES')} className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'INVOICES' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Invoices</button>
            <button onClick={() => setActiveTab('PAYMENTS')} className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PAYMENTS' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Payouts</button>
            <button onClick={() => setActiveTab('LABS')} className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LABS' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Lab Jobs</button>
          </div>

          <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {activeTab === 'INVOICES' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-10 py-5">Date / Reference</th>
                    <th className="px-10 py-5">Amount</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center text-xs font-bold text-slate-300 uppercase italic">No invoices recorded</td></tr>
                  ) : (
                    invoices.map((vi: VendorInvoice) => (
                      <tr key={vi.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{vi.reference}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{vi.date}</p>
                        </td>
                        <td className="px-10 py-6 text-sm font-black text-rose-600">-₹{vi.amount.toFixed(2)}</td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase">Pending</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl"><Download className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeTab === 'PAYMENTS' ? (
              <table className="w-full text-left">
                {/* ... existing payments table ... */}
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-10 py-5">Date / Method</th>
                    <th className="px-10 py-5">Amount</th>
                    <th className="px-10 py-5">Notes</th>
                    <th className="px-10 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center text-xs font-bold text-slate-300 uppercase italic">No payments recorded</td></tr>
                  ) : (
                    payments.map((vp: VendorPayment) => (
                      <tr key={vp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{vp.mode.replace('_', ' ')}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(vp.date).toLocaleDateString()}</p>
                        </td>
                        <td className="px-10 py-6 text-sm font-black text-emerald-600">+₹{vp.amount.toFixed(2)}</td>
                        <td className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase">{vp.notes || '--'}</td>
                        <td className="px-10 py-6 text-right">
                          <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl"><Printer className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-10 py-5">Work Details</th>
                    <th className="px-10 py-5">Est. Cost</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labOrders.length === 0 ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center text-xs font-bold text-slate-300 uppercase italic">No lab jobs assigned</td></tr>
                  ) : (
                    labOrders.map((lo: LabOrder) => (
                      <tr key={lo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{lo.workType}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Patient: {lo.patientName}</p>
                        </td>
                        <td className="px-10 py-6 text-sm font-black text-slate-700">₹{lo.cost}</td>
                        <td className="px-10 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${lo.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {lo.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          {lo.status === 'ASSIGNED' && (
                            <button
                              onClick={() => onConfirmLab(lo)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                            >
                              Confirm
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Provider Actions</h3>
            <div className="space-y-3">
              <ActionButton onClick={onAddInvoice} icon={FileText} label="Record Invoice" />
              <ActionButton onClick={onLinkLab} icon={FlaskConical} label="Assign Lab Order" />
              <ActionButton onClick={() => { }} icon={MessageSquare} label="Send Work Specs" disabled />
              <ActionButton onClick={() => { }} icon={Smartphone} label="Contact via WhatsApp" disabled badge="Coming Soon" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Printer className="w-6 h-6 text-indigo-300" />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight leading-none">Print Lab Packet</h4>
              <p className="text-[10px] font-bold text-indigo-100 uppercase leading-relaxed tracking-wide opacity-70">Generate clinical worksheets and pickup slips for your technician.</p>
              <button className="w-full bg-white text-indigo-900 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all opacity-50 cursor-not-allowed">Generate Slip</button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm group">
    <div className={`w-14 h-14 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:scale-110`}>
      <Icon className="w-8 h-8" />
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</div>
    <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</div>
  </div>
);

const MetricCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className="relative z-10">
      <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ onClick, icon: Icon, label, disabled, badge }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between p-5 rounded-[24px] border transition-all ${disabled ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'}`}
  >
    <div className="flex items-center gap-4">
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    {badge && <span className="text-[8px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={onClose} />
    <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Provider management lifecycle</p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
      </div>
      <div className="p-10">{children}</div>
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', options, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {type === 'select' ? (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
        {options.map((o: string) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
      </select>
    ) : type === 'textarea' ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none h-32 resize-none" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
    )}
  </div>
);
