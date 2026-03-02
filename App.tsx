
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, CreditCard,
  Package, Settings, LogOut, Menu, Plus, Bell, Search, ChevronDown, Shield,
  Wallet, Truck, X, UserCircle, History, Ticket, FlaskConical
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AppointmentManager from './components/AppointmentManager';
import ClinicalModule from './components/ClinicalModule';
import BillingModule from './components/BillingModule';
import LabOrders from './components/LabOrders';
import SettingsModule from './components/SettingsModule';
import TransactionModule from './components/TransactionModule';
import VendorModule from './components/VendorModule';
import PatientCRM from './components/PatientCRM';
import DiscountModule from './components/DiscountModule';
import { Clinic, User, UserRole, Patient, Appointment, Expense, Invoice, PaymentRecord, Vendor, VendorInvoice, VendorPayment, LabOrder, ClinicalCase, Coupon } from './types';
import { MOCK_CLINICS, MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_VENDORS } from './constants.tsx';

interface AppContextType {
  activeClinic: Clinic;
  setActiveClinic: (c: Clinic) => void;
  currentUser: User;
  setRole: (r: UserRole) => void;
  clinics: Clinic[];
  addClinic: (c: Clinic) => void;
  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatient: (p: Patient) => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  invoices: Invoice[];
  addInvoice: (i: Invoice) => void;
  updateInvoice: (i: Invoice) => void;
  addPayment: (invoiceId: string, payment: PaymentRecord) => void;
  vendors: Vendor[];
  addVendor: (v: Vendor) => void;
  vendorInvoices: VendorInvoice[];
  addVendorInvoice: (vi: VendorInvoice) => void;
  vendorPayments: VendorPayment[];
  addVendorPayment: (vp: VendorPayment) => void;
  labOrders: LabOrder[];
  addLabOrder: (lo: LabOrder) => void;
  updateLabOrder: (lo: LabOrder) => void;
  confirmLabOrder: (orderId: string) => void;
  clinicalCases: ClinicalCase[];
  addClinicalCase: (cc: ClinicalCase) => void;
  // Workflow helpers
  isSettingsComplete: () => boolean;
  createAppointmentWithSync: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  setPatientRecall: (patientId: string, date: string) => void;
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;
  updateCoupon: (c: Coupon) => void;
  lastClinicalPatientId: string | null;
  setLastClinicalPatientId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const Sidebar = ({ isOpen, setOpen }: { isOpen: boolean; setOpen: (o: boolean) => void }) => {
  const location = useLocation();
  const { currentUser, lastClinicalPatientId } = useApp();

  const menuItems = [
    { name: 'Clinic Overview', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'RECEPTIONIST'] },
    { name: 'Doctor Dashboard', icon: UserCircle, path: '/doctor-dashboard', roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Appointments', icon: Calendar, path: '/appointments', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Patient CRM', icon: Users, path: '/patients', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Clinical', icon: Stethoscope, path: '/clinical', roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Lab Orders', icon: FlaskConical, path: '/lab-orders', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Transactions', icon: Wallet, path: '/transactions', roles: ['ADMIN', 'RECEPTIONIST'] },
    { name: 'Billing', icon: CreditCard, path: '/billing', roles: ['ADMIN', 'RECEPTIONIST'] },
    { name: 'Vendors', icon: Truck, path: '/vendors', roles: ['ADMIN'] },
    { name: 'Discounts', icon: Package, path: '/discounts', roles: ['ADMIN'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['ADMIN'] },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 transform transition-transform duration-300 ease-in-out z-30 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">D</div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">DentoCloud</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.filter(i => i.roles.includes(currentUser.role)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/') ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                <Shield className="w-3 h-3" /> Access Level
              </div>
              <p className="text-xs font-semibold text-slate-700 capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all font-medium">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) => {
  const { activeClinic, setActiveClinic, currentUser, setRole, clinics } = useApp();
  const [showClinicSwitcher, setShowClinicSwitcher] = useState(false);

  return (
    <header className="sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowClinicSwitcher(!showClinicSwitcher)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            {activeClinic.name}
            <ChevronDown className={`w-4 h-4 transition-transform ${showClinicSwitcher ? 'rotate-180' : ''}`} />
          </button>
          {showClinicSwitcher && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {clinics.map(clinic => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    setActiveClinic(clinic);
                    setShowClinicSwitcher(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm border-b border-slate-100 last:border-none transition-colors ${activeClinic.id === clinic.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="font-bold text-slate-800">{clinic.name}</div>
                  <div className="text-xs text-slate-500">{clinic.location}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="bg-indigo-50 border-none text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hidden md:block"
          value={currentUser.role}
        >
          <option value="ADMIN">Owner / Admin</option>
          <option value="DOCTOR">Doctor</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="ASSISTANT">Assistant</option>
        </select>
        <button className="p-2 text-slate-400 hover:text-indigo-600 relative transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider leading-none">{currentUser.role}</div>
          </div>
          <img src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=6366f1&color=fff`} alt="Profile" className="w-10 h-10 rounded-xl shadow-sm ring-2 ring-indigo-50" />
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>(MOCK_CLINICS);
  const [activeClinic, setActiveClinic] = useState<Clinic>(MOCK_CLINICS[0]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'd1', name: 'Dr. Sarah Wilson', email: 'sarah@elite.com', role: 'ADMIN', clinicId: 'c1', permissions: { appointments: true, billing: true, reports: true, clinical: true }
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('dc_patients');
    return saved ? JSON.parse(saved) : MOCK_PATIENTS.map(p => ({
      ...p,
      age: Math.floor(Math.random() * 40) + 10,
      gender: Math.random() > 0.5 ? 'M' : 'F',
      visitCount: 1,
      status: 'ACTIVE' as const,
      lastVisit: 'Oct 12, 2023'
    }));
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('dc_appointments');
    const seeded = saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
    return seeded.map((a: Appointment) => ({
      ...a,
      paymentMode: a.paymentMode || (Math.random() > 0.5 ? 'UPI' : 'CASH'),
      paidAmount: a.paidAmount || (a.status === 'COMPLETED' ? a.billedAmount : 0)
    }));
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('dc_expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', category: 'Electricity', amount: 150, date: new Date().toISOString().split('T')[0], mode: 'BANK_TRANSFER', notes: 'Monthly utility' },
    ];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('dc_invoices');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'INV-1001',
        patientId: 'p1',
        patientName: 'John Doe',
        doctorId: 'd1',
        doctorName: 'Dr. Sarah Wilson',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 1200,
        discount: 100,
        status: 'PARTIAL',
        items: [{ description: 'Root Canal Treatment', cost: 1200 }],
        payments: [{ id: 'pm-1', invoiceId: 'INV-1001', amount: 800, mode: 'UPI', date: new Date().toISOString() }]
      }
    ];
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('dc_vendors');
    return saved ? JSON.parse(saved) : MOCK_VENDORS.map(v => ({ ...v, totalDue: 0, totalPaid: 0 }));
  });

  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>(() => {
    const saved = localStorage.getItem('dc_vendor_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('dc_coupons');
    return saved ? JSON.parse(saved) : [
      { id: 'cp-1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true, usageCount: 0 }
    ];
  });

  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(() => {
    const saved = localStorage.getItem('dc_vendor_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => {
    const saved = localStorage.getItem('dc_lab_orders');
    return saved ? JSON.parse(saved) : [
      {
        id: 'LO-1', patientId: 'p1', patientName: 'John Doe', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson',
        workType: 'PFM Crown', status: 'PENDING_ASSIGNMENT', dueDate: '2023-11-05', cost: 450, date: '2023-10-25',
        paymentStatus: 'UNPAID'
      },
      {
        id: 'LO-2', patientId: 'p2', patientName: 'Jane Smith', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson',
        workType: 'Ceramic Bridge', status: 'COMPLETED', dueDate: '2023-11-02', cost: 1200, date: '2023-10-24',
        vendorId: 'v1', vendorName: 'Elite Dental Lab', paymentStatus: 'PAID'
      }
    ];
  });

  const [clinicalCases, setClinicalCases] = useState<ClinicalCase[]>(() => {
    const saved = localStorage.getItem('dc_clinical_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastClinicalPatientId, setLastClinicalPatientIdState] = useState<string | null>(() => {
    return localStorage.getItem('dc_last_clinical_id') || null;
  });

  useEffect(() => localStorage.setItem('dc_patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('dc_appointments', JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem('dc_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('dc_invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('dc_vendors', JSON.stringify(vendors)), [vendors]);
  useEffect(() => localStorage.setItem('dc_vendor_invoices', JSON.stringify(vendorInvoices)), [vendorInvoices]);
  useEffect(() => localStorage.setItem('dc_vendor_payments', JSON.stringify(vendorPayments)), [vendorPayments]);
  useEffect(() => localStorage.setItem('dc_lab_orders', JSON.stringify(labOrders)), [labOrders]);
  useEffect(() => localStorage.setItem('dc_clinical_cases', JSON.stringify(clinicalCases)), [clinicalCases]);
  useEffect(() => localStorage.setItem('dc_coupons', JSON.stringify(coupons)), [coupons]);
  useEffect(() => {
    if (lastClinicalPatientId) localStorage.setItem('dc_last_clinical_id', lastClinicalPatientId);
  }, [lastClinicalPatientId]);

  const addClinic = (c: Clinic) => setClinics(prev => [...prev, c]);
  const setRole = (role: UserRole) => setCurrentUser(prev => ({ ...prev, role }));
  const addPatient = (p: Patient) => setPatients(prev => [...prev, { ...p, registrationDate: p.registrationDate || new Date().toISOString().split('T')[0] }]);
  const updatePatient = (p: Patient) => setPatients(prev => prev.map(old => old.id === p.id ? p : old));
  const addExpense = (e: Expense) => setExpenses(prev => [e, ...prev]);
  const addInvoice = (i: Invoice) => setInvoices(prev => [i, ...prev]);
  const updateInvoice = (i: Invoice) => setInvoices(prev => prev.map(old => old.id === i.id ? i : old));

  const addPayment = (invoiceId: string, payment: PaymentRecord) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const newPayments = [...inv.payments, payment];
        const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
        const netPayable = inv.totalAmount - inv.discount;
        let status: Invoice['status'] = 'PARTIAL';
        if (totalPaid >= netPayable) status = 'PAID';
        if (totalPaid === 0) status = 'DUE';
        return { ...inv, payments: newPayments, status };
      }
      return inv;
    }));
  };

  const addVendor = (v: Vendor) => setVendors(prev => [...prev, v]);
  const addVendorInvoice = (vi: VendorInvoice) => {
    setVendorInvoices(prev => [...prev, vi]);
    setVendors(prev => prev.map(v => v.id === vi.vendorId ? { ...v, totalDue: v.totalDue + vi.amount, balance: v.balance + vi.amount } : v));
  };
  const addVendorPayment = (vp: VendorPayment) => {
    setVendorPayments(prev => [...prev, vp]);
    setVendors(prev => prev.map(v => v.id === vp.vendorId ? { ...v, totalPaid: v.totalPaid + vp.amount, balance: v.balance - vp.amount } : v));

    // Automation: Mark unpaid lab orders for this vendor as PAID based on payment amount
    setLabOrders(prev => {
      let remainingPayment = vp.amount;
      return prev.map(order => {
        if (order.vendorId === vp.vendorId && order.status === 'COMPLETED' && order.paymentStatus !== 'PAID' && remainingPayment >= order.cost) {
          remainingPayment -= order.cost;
          return { ...order, paymentStatus: 'PAID' };
        }
        return order;
      });
    });

    // Also add to global expenses
    const vendor = vendors.find(v => v.id === vp.vendorId);
    addExpense({
      id: `exp-${vp.id}`,
      category: 'Vendor Payment',
      amount: vp.amount,
      date: vp.date,
      mode: vp.mode,
      notes: `Payment to ${vendor?.name || 'Vendor'}: ${vp.notes}`
    });
  };

  const addLabOrder = (lo: LabOrder) => setLabOrders(prev => [lo, ...prev]);
  const updateLabOrder = (lo: LabOrder) => setLabOrders(prev => prev.map(old => old.id === lo.id ? lo : old));

  const confirmLabOrder = (orderId: string) => {
    const order = labOrders.find(lo => lo.id === orderId);
    if (!order || !order.vendorId) return;

    // 1. Update Lab Order status
    updateLabOrder({ ...order, status: 'CONFIRMED' });

    // 2. Automate Vendor Billing (Invoice)
    const vi: VendorInvoice = {
      id: `vi-lo-${Date.now()}`,
      vendorId: order.vendorId,
      amount: order.cost,
      date: new Date().toISOString().split('T')[0],
      reference: `Lab Bill: ${order.id}`,
      status: 'DUE',
      notes: `Automated bill for ${order.workType} (Patient: ${order.patientName})`
    };
    addVendorInvoice(vi);
  };
  const addClinicalCase = (cc: ClinicalCase) => setClinicalCases(prev => [cc, ...prev]);

  // Workflow Helper Functions
  const isSettingsComplete = () => {
    // Check if at least one clinic, one doctor (from constants), and treatments exist
    return clinics.length > 0;
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(a =>
      a.id === updatedAppointment.id ? updatedAppointment : a
    ));
  };

  const createAppointmentWithSync = (appointment: Appointment) => {
    // Add appointment
    setAppointments(prev => [appointment, ...prev]);

    // Update patient CRM - increment visit count and update last visit
    const patient = patients.find(p => p.id === appointment.patientId);
    if (patient) {
      updatePatient({
        ...patient,
        visitCount: patient.visitCount + 1,
        lastVisit: new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
  };

  const setPatientRecall = (patientId: string, date: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, recallDate: date } : p
    ));
  };

  const addCoupon = (c: Coupon) => setCoupons(prev => [c, ...prev]);
  const deleteCoupon = (id: string) => setCoupons(prev => prev.filter(c => c.id !== id));
  const updateCoupon = (c: Coupon) => setCoupons(prev => prev.map(old => old.id === c.id ? c : old));

  return (
    <AppContext.Provider value={{
      activeClinic, setActiveClinic, currentUser, setRole, clinics, addClinic,
      patients, addPatient, updatePatient, appointments, setAppointments,
      expenses, addExpense, invoices, addInvoice, updateInvoice, addPayment,
      vendors, addVendor, vendorInvoices, addVendorInvoice, vendorPayments, addVendorPayment,
      labOrders, addLabOrder, updateLabOrder, confirmLabOrder,
      clinicalCases, addClinicalCase,
      isSettingsComplete, createAppointmentWithSync, updateAppointment, setPatientRecall,
      coupons, addCoupon, deleteCoupon, updateCoupon,
      lastClinicalPatientId, setLastClinicalPatientId: setLastClinicalPatientIdState
    }}>
      <Router>
        <div className="min-h-screen flex bg-slate-50/50">
          <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="flex-1 lg:ml-64 transition-all duration-300 min-h-screen flex flex-col">
            <Header setSidebarOpen={setSidebarOpen} />
            <div className="p-4 md:p-8 w-full flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/appointments" element={<AppointmentManager />} />
                <Route path="/patients/*" element={<PatientCRM />} />
                <Route path="/clinical" element={<ClinicalModule />} />
                <Route path="/clinical/:patientId" element={<ClinicalModule />} />
                <Route path="/billing" element={<BillingModule />} />
                <Route path="/lab-orders" element={<LabOrders />} />
                <Route path="/transactions" element={<TransactionModule />} />
                <Route path="/discounts" element={currentUser.role === 'ADMIN' ? <DiscountModule /> : <Navigate to="/" />} />
                <Route path="/vendors" element={<VendorModule />} />
                <Route path="/settings" element={<SettingsModule />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
}
