
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Search, Filter, ChevronRight, MoreVertical, Phone, User,
  History, Calendar, Stethoscope, Pill, FlaskConical, CreditCard,
  ArrowLeft, Activity, Info, RefreshCcw
} from 'lucide-react';
import { useApp } from '../App';
import { Patient, Appointment } from '../types';

export default function PatientCRM() {
  return (
    <Routes>
      <Route path="/" element={<PatientList />} />
      <Route path="/:patientId" element={<PatientProfile />} />
    </Routes>
  );
}

const PatientList = () => {
  const { patients } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 leading-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and monitor patient history and clinical progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              placeholder="Search by name or mobile..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Patient Details</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Contact</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Last Visit</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-rows">
              {filteredPatients.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{p.age || '28'} Yrs • {p.gender || 'F'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {p.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{p.visitCount} Visits</p>
                      <p className="text-xs text-slate-500 font-medium">{p.lastVisit || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border shadow-sm ${p.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' :
                      p.status === 'IN_TREATMENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { patients, appointments, clinicalCases, invoices } = useApp();
  const [activeTab, setActiveTab] = useState('TIMELINE');

  const patient = patients.find(p => p.id === patientId);
  const patientAppointments = appointments.filter(a => a.patientId === patientId);
  const history = clinicalCases.filter(c => c.patientId === patientId);
  const patientInvoices = invoices.filter(i => i.patientId === patientId);

  // Financial Calculations
  const totalCollections = patientInvoices.reduce((sum, inv) =>
    sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0), 0
  );

  const totalOutstanding = patientInvoices.reduce((sum, inv) =>
    sum + (inv.status !== 'CANCELLED' ? (inv.totalAmount - inv.payments.reduce((pSum, p) => pSum + p.amount, 0)) : 0), 0
  );

  if (!patient) return <div className="p-20 text-center text-slate-500 font-medium">Patient not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Records
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-20 h-20 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-100">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{patient.name}</h2>
                <p className="text-xs font-medium text-slate-500">PID: {patient.id.split('-')[1] || '88492'}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <ProfileItem icon={Phone} label="Mobile" value={patient.phone} />
              <ProfileItem icon={Info} label="Medical Context" value={patient.medicalHistory.join(', ') || 'No Alerts'} color={patient.medicalHistory.length > 0 ? "rose" : "indigo"} />
              <ProfileItem icon={Calendar} label="Last Seen" value={patient.lastVisit || 'N/A'} />
              {patient.recallDate && (
                <ProfileItem icon={RefreshCcw} label="Scheduled Recall" value={new Date(patient.recallDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} color="rose" />
              )}
              <ProfileItem icon={Activity} label="Visit Frequency" value={`${patient.visitCount} Total Visits`} />
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex gap-1">
            <TabButton active={activeTab === 'TIMELINE'} onClick={() => setActiveTab('TIMELINE')} icon={History} label="Timeline" />
            <TabButton active={activeTab === 'CLINICAL'} onClick={() => setActiveTab('CLINICAL')} icon={Stethoscope} label="Clinical History" />
            <TabButton active={activeTab === 'BILLING'} onClick={() => setActiveTab('BILLING')} icon={CreditCard} label="Financials" />
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm min-h-[500px]">
            {activeTab === 'TIMELINE' && (
              <div className="space-y-8 relative">
                <div className="absolute left-[17px] top-2 bottom-2 w-px bg-slate-200"></div>
                {patient.recallDate && (
                  <TimelineEvent
                    title="Planned Recall Reminder"
                    subtitle="Patient due for follow-up visit"
                    date={new Date(patient.recallDate).toLocaleDateString()}
                    icon={RefreshCcw}
                    color="rose"
                  />
                )}
                {patientAppointments.map((apt) => (
                  <TimelineEvent
                    key={apt.id}
                    title={apt.status === 'COMPLETED' ? 'Hospital Visit / Consultation' : 'Future Appointment Reserved'}
                    subtitle={`${apt.doctorName} • Purpose: ${apt.complaint || 'Routine Check'}`}
                    date={apt.date ? new Date(apt.date).toLocaleDateString() : 'Upcoming'}
                    icon={apt.status === 'COMPLETED' ? Stethoscope : Calendar}
                    color={apt.status === 'COMPLETED' ? 'emerald' : 'indigo'}
                  />
                ))}
                {patientAppointments.length === 0 && (
                  <div className="text-center py-20 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold text-xs text-balance">No visit history recorded for this patient yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'CLINICAL' && (
              <div className="space-y-6">
                {history.length > 0 ? (
                  history.map((session) => (
                    <div key={session.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-3">
                          <Stethoscope className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Finalized Consultation</h4>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</p>
                          <p className="text-sm text-slate-700 font-medium">{session.complaint || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis/Examination</p>
                          <p className="text-sm text-slate-700 font-medium">{session.examination || 'Record finalized'}</p>
                        </div>
                      </div>
                      {session.treatments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Procedures Performed</p>
                          <div className="flex flex-wrap gap-2">
                            {session.treatments.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">#{t.toothNumber} {t.procedure}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold text-xs">Viewing complete clinical history. No sessions recorded yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'BILLING' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-rose-50/50 p-5 rounded-lg border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-rose-700">₹{totalOutstanding.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Collections</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{totalCollections.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Detailed Transactions</h4>
                  {patientInvoices.length > 0 ? (
                    patientInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inv => {
                      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                      const progress = (paid / inv.totalAmount) * 100;

                      return (
                        <div key={inv.id} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 transition-all group">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{inv.id}</p>
                                <p className="text-[10px] font-medium text-slate-400">{new Date(inv.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                {inv.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-500 font-medium">₹{paid.toLocaleString('en-IN')} paid of ₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                            <span className="font-bold text-slate-900">{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                      <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest">No transaction history</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 ${color === 'rose' ? 'text-rose-600' : 'text-slate-400'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold tracking-tight ${color === 'rose' ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const TimelineEvent = ({ title, subtitle, date, icon: Icon, color }: any) => (
  <div className="flex items-start gap-5 relative group">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center z-10 shadow-sm border-2 border-white transition-all group-hover:scale-105 ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
        color === 'rose' ? 'bg-rose-50 text-rose-600' :
          'bg-indigo-50 text-indigo-600'
      }`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 pt-1">
      <div className="flex items-center justify-between mb-0.5">
        <h4 className={`text-sm font-semibold transition-colors ${color === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{title}</h4>
        <span className="text-[10px] font-semibold text-slate-400 uppercase">{date}</span>
      </div>
      <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
    </div>
  </div>
);
