import React, { useState } from 'react';
import {
  Settings, MapPin, Users, CreditCard, Stethoscope, Bell, User, FileText,
  Plus, ChevronRight, Phone, Mail, Lock, Save, Trash2, Edit, Download,
  Wallet, MessageSquare, DollarSign, Calendar, CheckCircle2, XCircle,
  Building2, Shield, ToggleLeft, ToggleRight, Filter, Search
} from 'lucide-react';
import { useApp } from '../App';
import { PROCEDURE_CATALOG } from '../constants.tsx';

type SettingsSection = 'CLINIC' | 'TEAM' | 'BILLING' | 'TREATMENTS' | 'NOTIFICATIONS' | 'ACCOUNT' | 'REPORTS';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'ADMIN' | 'DENTAL_ASSISTANT' | 'RECEPTION' | 'DENTAL_SUPPORT';
  clinicId: string;
  permissions: {
    createAppointments: boolean;
    editAppointments: boolean;
    deleteAppointments: boolean;
    viewBilling: boolean;
    viewReports: boolean;
  };
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  method?: 'UPI' | 'GPay' | 'PhonePe';
  date: string;
  description: string;
}

interface MessageLog {
  id: string;
  type: string;
  patientName: string;
  date: string;
  status: 'Sent' | 'Failed';
}

export default function SettingsModule() {
  const { clinics, addClinic, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState<SettingsSection>('CLINIC');

  // State for various sections
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [treatments, setTreatments] = useState(PROCEDURE_CATALOG);
  const [walletBalance, setWalletBalance] = useState(5000);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: '1', amount: 5000, type: 'credit', method: 'UPI', date: '2026-02-01', description: 'Initial wallet top-up' },
    { id: '2', amount: 150, type: 'debit', date: '2026-02-05', description: 'WhatsApp notifications (50 messages)' }
  ]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([
    { id: '1', type: 'Appointment Confirmation', patientName: 'John Doe', date: '2026-02-09', status: 'Sent' },
    { id: '2', type: 'Invoice Notification', patientName: 'Jane Smith', date: '2026-02-08', status: 'Sent' },
    { id: '3', type: 'Prescription Share', patientName: 'Bob Wilson', date: '2026-02-07', status: 'Failed' }
  ]);

  // Notification preferences
  const [notificationChannels, setNotificationChannels] = useState({
    whatsapp: true,
    sms: false,
    email: true
  });

  const [notificationTypes, setNotificationTypes] = useState({
    appointmentConfirmation: true,
    invoiceNotification: true,
    prescriptionSharing: true,
    appointmentReminders: true,
    googleReviewRequest: false
  });

  // Modals
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Handlers for Clinics
  const handleDeleteClinic = (id: string) => {
    if (confirm('Are you sure you want to delete this clinic branch?')) {
      // Note: In production, this would update the App context
      alert('Delete functionality ready - connect to App context to persist');
    }
  };

  const handleEditClinic = (clinic: any) => {
    alert(`Edit clinic: ${clinic.name}\nThis would open an edit modal in production`);
  };

  // Handlers for Treatments
  const handleDeleteTreatment = (id: string) => {
    if (confirm('Are you sure you want to delete this treatment?')) {
      setTreatments(treatments.filter(t => t.id !== id));
    }
  };

  const handleEditTreatment = (treatment: any) => {
    const newName = prompt('Enter new treatment name:', treatment.name);
    const newCost = prompt('Enter new cost:', treatment.cost.toString());

    if (newName && newCost) {
      setTreatments(treatments.map(t =>
        t.id === treatment.id
          ? { ...t, name: newName, cost: parseFloat(newCost) }
          : t
      ));
    }
  };

  // Handlers for Team Members
  const handleDeleteTeamMember = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  const sections = [
    { id: 'CLINIC' as SettingsSection, icon: Building2, label: 'Clinic & Branches' },
    { id: 'TEAM' as SettingsSection, icon: Users, label: 'Team Management' },
    { id: 'BILLING' as SettingsSection, icon: CreditCard, label: 'Billing & Plans' },
    { id: 'TREATMENTS' as SettingsSection, icon: Stethoscope, label: 'Treatments & Pricing' },
    { id: 'NOTIFICATIONS' as SettingsSection, icon: Bell, label: 'Notifications & Wallet' },
    { id: 'ACCOUNT' as SettingsSection, icon: User, label: 'Account Settings' },
    { id: 'REPORTS' as SettingsSection, icon: FileText, label: 'Reports & Exports' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Settings & Configuration</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your clinic operations, team, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 space-y-2">
          {sections.map(section => (
            <SidebarButton
              key={section.id}
              active={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
              icon={section.icon}
              label={section.label}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm min-h-[700px]">
          {activeSection === 'CLINIC' && (
            <ClinicSection
              clinics={clinics}
              onAddBranch={() => setShowAddBranchModal(true)}
              onEditClinic={handleEditClinic}
              onDeleteClinic={handleDeleteClinic}
            />
          )}

          {activeSection === 'TEAM' && (
            <TeamSection
              teamMembers={teamMembers}
              onAddMember={() => setShowAddMemberModal(true)}
              onDeleteMember={handleDeleteTeamMember}
            />
          )}

          {activeSection === 'BILLING' && <BillingSection />}

          {activeSection === 'TREATMENTS' && (
            <TreatmentsSection
              treatments={treatments}
              onAddTreatment={() => setShowAddTreatmentModal(true)}
              onEditTreatment={handleEditTreatment}
              onDeleteTreatment={handleDeleteTreatment}
            />
          )}

          {activeSection === 'NOTIFICATIONS' && (
            <NotificationsSection
              channels={notificationChannels}
              setChannels={setNotificationChannels}
              types={notificationTypes}
              setTypes={setNotificationTypes}
              walletBalance={walletBalance}
              transactions={walletTransactions}
              messageLogs={messageLogs}
              onTopUp={() => setShowTopUpModal(true)}
            />
          )}

          {activeSection === 'ACCOUNT' && <AccountSection />}

          {activeSection === 'REPORTS' && <ReportsSection />}
        </div>
      </div>

      {/* Modals */}
      {showAddBranchModal && (
        <AddBranchModal onClose={() => setShowAddBranchModal(false)} onAdd={addClinic} />
      )}

      {showTopUpModal && (
        <TopUpWalletModal
          onClose={() => setShowTopUpModal(false)}
          onTopUp={(amount, method) => {
            setWalletBalance(prev => prev + amount);
            setWalletTransactions(prev => [{
              id: Date.now().toString(),
              amount,
              type: 'credit',
              method,
              date: new Date().toISOString().split('T')[0],
              description: `Wallet top-up via ${method}`
            }, ...prev]);
            setShowTopUpModal(false);
          }}
        />
      )}
    </div>
  );
}

// Sidebar Button Component
const SidebarButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-[28px] transition-all ${active
      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
      : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
      }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
    </div>
    <ChevronRight className={`w-4 h-4 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
  </button>
);

// 1. CLINIC SECTION
const ClinicSection = ({ clinics, onAddBranch, onEditClinic, onDeleteClinic }: any) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinic Branches</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Manage multiple clinic locations</p>
      </div>
      <button
        onClick={onAddBranch}
        className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        <Plus className="w-4 h-4" /> Add Branch
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clinics.map((clinic: any) => (
        <div key={clinic.id} className="p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-[32px] relative group hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="text-base font-black text-slate-900">{clinic.name}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{clinic.location}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold">{clinic.phone}</span>
            </div>
            {clinic.identifier && (
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ID: {clinic.identifier}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEditClinic && onEditClinic(clinic)}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Edit className="w-3 h-3 inline mr-1" /> Edit
            </button>
            <button
              onClick={() => onDeleteClinic && onDeleteClinic(clinic.id)}
              className="px-3 bg-white border border-rose-200 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 2. TEAM SECTION
const TeamSection = ({ teamMembers, onAddMember, onDeleteMember }: any) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Team & Permissions</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Manage staff and role-based access</p>
      </div>
      <button
        onClick={onAddMember}
        className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        <Plus className="w-4 h-4" /> Add Member
      </button>
    </div>

    {teamMembers.length === 0 ? (
      <div className="text-center py-16 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">No team members added yet</p>
        <p className="text-xs text-slate-400 mt-1">Click "Add Member" to invite your team</p>
      </div>
    ) : (
      <div className="space-y-4">
        {teamMembers.map((member: TeamMember) => (
          <div key={member.id} className="flex items-center justify-between p-5 border border-slate-100 rounded-[24px] hover:bg-slate-50 transition-all group">
            <div className="flex items-center gap-4">
              <img
                src={`https://ui-avatars.com/api/?name=${member.name}&background=6366f1&color=fff&bold=true`}
                className="w-12 h-12 rounded-2xl shadow-sm"
                alt={member.name}
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{member.name}</p>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{member.role.replace('_', ' ')}</p>
                <p className="text-xs text-slate-400 font-medium">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <PermissionBadge active={member.permissions.createAppointments} label="Create" />
                <PermissionBadge active={member.permissions.editAppointments} label="Edit" />
                <PermissionBadge active={member.permissions.viewBilling} label="Billing" />
                <PermissionBadge active={member.permissions.viewReports} label="Reports" />
              </div>
              <button
                onClick={() => onDeleteMember && onDeleteMember(member.id)}
                className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PermissionBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${active
    ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
    : 'bg-slate-50 text-slate-300 border-slate-100'
    }`}>
    {label}
  </div>
);

// 3. BILLING SECTION
const BillingSection = () => {
  const currentPlan = {
    name: 'Professional Plan',
    price: 99,
    features: [
      '5 Clinic Branches',
      'Unlimited Appointments',
      'Advanced Reports & Analytics',
      'Team Management (up to 20 users)',
      'WhatsApp & SMS Notifications',
      'Priority Support'
    ]
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Billing & Subscription</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Current plan and feature access</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 rounded-[40px] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-black uppercase tracking-widest opacity-80">Current Plan</p>
              <h3 className="text-3xl font-black mt-2">{currentPlan.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black">₹{currentPlan.price}</p>
              <p className="text-xs font-bold opacity-70">/month</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {currentPlan.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span className="text-sm font-bold">{feature}</span>
              </div>
            ))}
          </div>

          <button className="w-full bg-white text-indigo-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all opacity-50 cursor-not-allowed">
            Upgrade Plan (Contact Sales)
          </button>
        </div>
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

// 4. TREATMENTS SECTION
const TreatmentsSection = ({ treatments, onAddTreatment, onEditTreatment, onDeleteTreatment }: any) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Treatment Catalog</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Manage procedures and pricing</p>
      </div>
      <button
        onClick={onAddTreatment}
        className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        <Plus className="w-4 h-4" /> Add Treatment
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {treatments.map((treatment: any) => (
        <div key={treatment.id} className="p-5 border border-slate-100 rounded-[24px] flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-bold text-slate-900">{treatment.name}</p>
            <p className="text-lg font-black text-emerald-600 mt-1">₹{treatment.cost.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditTreatment && onEditTreatment(treatment)}
              className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteTreatment && onDeleteTreatment(treatment.id)}
              className="p-2 bg-rose-100 rounded-xl text-rose-600 hover:bg-rose-200 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 5. NOTIFICATIONS SECTION
const NotificationsSection = ({ channels, setChannels, types, setTypes, walletBalance, transactions, messageLogs, onTopUp }: any) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notifications & Wallet</h2>
      <p className="text-xs text-slate-500 font-medium mt-1">Manage communication channels and wallet balance</p>
    </div>

    {/* Wallet Panel */}
    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[40px] text-white relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-black uppercase tracking-widest opacity-80">Wallet Balance</p>
            <h3 className="text-4xl font-black mt-2">₹{walletBalance.toFixed(2)}</h3>
          </div>
          <Wallet className="w-12 h-12 opacity-20" />
        </div>
        <button
          onClick={onTopUp}
          className="w-full bg-white text-emerald-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
        >
          <Plus className="w-4 h-4 inline mr-2" /> Top Up Wallet
        </button>
      </div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
    </div>

    {/* Notification Channels */}
    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Communication Channels</h3>
      <div className="space-y-3">
        <ToggleRow
          label="WhatsApp Notifications"
          active={channels.whatsapp}
          onChange={() => setChannels({ ...channels, whatsapp: !channels.whatsapp })}
        />
        <ToggleRow
          label="SMS Notifications"
          active={channels.sms}
          onChange={() => setChannels({ ...channels, sms: !channels.sms })}
        />
        <ToggleRow
          label="Email Notifications"
          active={channels.email}
          onChange={() => setChannels({ ...channels, email: !channels.email })}
        />
      </div>
    </div>

    {/* Notification Types */}
    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Notification Preferences</h3>
      <div className="space-y-3">
        <ToggleRow
          label="Appointment Confirmation"
          active={types.appointmentConfirmation}
          onChange={() => setTypes({ ...types, appointmentConfirmation: !types.appointmentConfirmation })}
        />
        <ToggleRow
          label="Invoice Notification"
          active={types.invoiceNotification}
          onChange={() => setTypes({ ...types, invoiceNotification: !types.invoiceNotification })}
        />
        <ToggleRow
          label="Prescription Sharing"
          active={types.prescriptionSharing}
          onChange={() => setTypes({ ...types, prescriptionSharing: !types.prescriptionSharing })}
        />
        <ToggleRow
          label="Appointment Reminders"
          active={types.appointmentReminders}
          onChange={() => setTypes({ ...types, appointmentReminders: !types.appointmentReminders })}
        />
        <ToggleRow
          label="Google Review Request"
          active={types.googleReviewRequest}
          onChange={() => setTypes({ ...types, googleReviewRequest: !types.googleReviewRequest })}
        />
      </div>
    </div>

    {/* Message Logs */}
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Recent Message Logs</h3>
      <div className="space-y-2">
        {messageLogs.map((log: MessageLog) => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-900">{log.type}</p>
                <p className="text-xs text-slate-500">{log.patientName} • {log.date}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${log.status === 'Sent'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600'
              }`}>
              {log.status}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Transaction History */}
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Wallet Transactions</h3>
      <div className="space-y-2">
        {transactions.map((txn: WalletTransaction) => (
          <div key={txn.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                <DollarSign className={`w-5 h-5 ${txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                  }`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{txn.description}</p>
                <p className="text-xs text-slate-500">{txn.date} {txn.method && `• ${txn.method}`}</p>
              </div>
            </div>
            <p className={`text-base font-black ${txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
              {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ToggleRow = ({ label, active, onChange }: any) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <button onClick={onChange} className="focus:outline-none">
      {active ? (
        <ToggleRight className="w-10 h-10 text-indigo-600" />
      ) : (
        <ToggleLeft className="w-10 h-10 text-slate-300" />
      )}
    </button>
  </div>
);

// 6. ACCOUNT SECTION
const AccountSection = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Account Settings</h2>
      <p className="text-xs text-slate-500 font-medium mt-1">Manage your account and security preferences</p>
    </div>

    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6">Change Password</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Current Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            placeholder="Confirm new password"
          />
        </div>
        <button className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all opacity-50 cursor-not-allowed">
          <Lock className="w-4 h-4 inline mr-2" /> Update Password (UI Only)
        </button>
      </div>
    </div>

    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6">Security Preferences</h3>
      <div className="space-y-3">
        <ToggleRow label="Two-Factor Authentication (Coming Soon)" active={false} onChange={() => { }} />
        <ToggleRow label="Session Timeout (30 minutes)" active={true} onChange={() => { }} />
      </div>
    </div>
  </div>
);

// 7. REPORTS SECTION
const ReportsSection = () => {
  const [dateRange, setDateRange] = useState({ start: '2026-02-01', end: '2026-02-09' });

  const mockStats = {
    totalRevenue: 45000,
    totalAppointments: 87,
    totalPatients: 65
  };

  const exportCSV = () => {
    const csvData = "Date,Revenue,Appointments\n2026-02-01,5000,12\n2026-02-02,6200,15\n2026-02-03,4800,10";
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-report.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reports & Analytics</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">View revenue reports and export data</p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Date Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[32px] text-white">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Total Revenue</p>
          <p className="text-3xl font-black mt-2">₹{mockStats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Appointments</p>
          <p className="text-3xl font-black mt-2">{mockStats.totalAppointments}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 rounded-[32px] text-white">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Patients</p>
          <p className="text-3xl font-black mt-2">{mockStats.totalPatients}</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Export Data</h3>
        <div className="flex gap-4">
          <button
            onClick={exportCSV}
            className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex-1 bg-slate-300 text-slate-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Export PDF (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

// MODALS

const AddBranchModal = ({ onClose, onAdd }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    identifier: '',
    notes: ''
  });

  const handleSubmit = () => {
    onAdd({
      id: `c${Date.now()}`,
      ...formData
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-md w-full">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Add New Branch</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Branch Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="e.g., Downtown Clinic"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="e.g., 123 Main St"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="e.g., +1 234 567 8900"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Identifier (Optional)</label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="e.g., BRANCH-001"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
          >
            Add Branch
          </button>
        </div>
      </div>
    </div>
  );
};

const TopUpWalletModal = ({ onClose, onTopUp }: any) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'GPay' | 'PhonePe'>('UPI');

  const handleTopUp = () => {
    if (amount && parseFloat(amount) > 0) {
      onTopUp(parseFloat(amount), method);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-md w-full">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Top Up Wallet</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            >
              <option value="UPI">UPI</option>
              <option value="GPay">Google Pay</option>
              <option value="PhonePe">PhonePe</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleTopUp}
            className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
          >
            Top Up
          </button>
        </div>
      </div>
    </div>
  );
};
