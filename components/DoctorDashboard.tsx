
import React, { useMemo } from 'react';
import {
  Calendar, Clock, Activity, IndianRupee, Users, ArrowRight,
  Stethoscope, Zap, ChevronRight, UserCircle
} from 'lucide-react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';

import { MOCK_DOCTORS } from '../constants';

export default function DoctorDashboard() {
  const { appointments, currentUser, invoices, patients, updateAppointment } = useApp();
  const navigate = useNavigate();

  // State for Admin Doctor selection
  const [selectedDoctorId, setSelectedDoctorId] = React.useState(currentUser.id);

  // Update selected doctor if current user changes (and not admin overriding)
  React.useEffect(() => {
    if (currentUser.role !== 'ADMIN') {
      setSelectedDoctorId(currentUser.id);
    }
  }, [currentUser.id, currentUser.role]);

  const selectedDoctor = MOCK_DOCTORS.find(d => d.id === selectedDoctorId) || { name: 'Doctor' };

  // Filter data for the SELECTED doctor and today's date
  const today = new Date().toISOString().split('T')[0];
  const doctorAppointments = useMemo(() => {
    return appointments.filter(a =>
      a.doctorId === selectedDoctorId &&
      a.date === today
    );
  }, [appointments, selectedDoctorId, today]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const scheduled = doctorAppointments.length;
    const waiting = doctorAppointments.filter(a => a.status === 'CHECKED_IN').length;
    const consulting = doctorAppointments.filter(a => a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED').length;

    return { scheduled, waiting, consulting };
  }, [doctorAppointments]);

  // Financial Metrics (Doctor Specific)
  const financials = useMemo(() => {
    const doctorInvoices = invoices.filter(inv =>
      inv.doctorId === selectedDoctorId &&
      inv.date === today
    );

    const revenue = doctorInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.discount), 0);
    const collected = doctorInvoices.reduce((acc, inv) =>
      acc + inv.payments.reduce((pAcc, p) => pAcc + p.amount, 0), 0
    );

    return { revenue, collected };
  }, [invoices, selectedDoctorId, today]);

  // Active Stack (Checked In or In Progress)
  const activeStack = useMemo(() => {
    return doctorAppointments
      .filter(a => ['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED'].includes(a.status))
      .map(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        return {
          ...apt,
          age: patient?.age,
          gender: patient?.gender
        };
      })
      .sort((a, b) => {
        // Sort: IN_PROGRESS first, then CHECKED_IN, then time
        const aInProgress = a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED';
        const bInProgress = b.status === 'IN_PROGRESS' || b.status === 'CONFIRMED';

        if (aInProgress && !bInProgress) return -1;
        if (bInProgress && !aInProgress) return 1;
        return a.time.localeCompare(b.time);
      });
  }, [doctorAppointments, patients]);

  const handleOpenCase = (appointment: any) => {
    // Only allow starting if checked in or already in progress
    if (!['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED'].includes(appointment.status)) return;

    // Auto-update status to IN_PROGRESS if not already
    if (appointment.status === 'CHECKED_IN') {
      updateAppointment({
        ...appointment,
        status: 'IN_PROGRESS'
      });
    }
    navigate(`/clinical/${appointment.patientId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Welcome, {currentUser.role === 'ADMIN' && currentUser.id !== selectedDoctorId ? `(View as) ${selectedDoctor.name}` : `Dr. ${currentUser.name}`}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Viewing clinical performance for today</p>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest py-3 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 transition-all"
            >
              {MOCK_DOCTORS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Operational Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Scheduled"
              value={metrics.scheduled}
              subtitle="Total Today"
              icon={Calendar}
              color="indigo"
            />
            <MetricCard
              title="Waiting"
              value={metrics.waiting}
              subtitle="Checked-In"
              icon={Clock}
              color="amber"
            />
            <MetricCard
              title="Consulting"
              value={metrics.consulting}
              subtitle="Live Now"
              icon={Activity}
              color="emerald"
            />
          </div>

          {/* Active Consultation Stack */}
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Consultation Stack</h3>
                <p className="text-sm text-slate-500 font-medium">Real-time patient flow management</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" /> Consulting
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Waiting
                </span>
              </div>
            </div>

            <div className="p-0">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Token</th>
                    <th className="px-8 py-4">Patient Details</th>
                    <th className="px-8 py-4">Slot</th>
                    <th className="px-8 py-4">Workflow Status</th>
                    <th className="px-8 py-4 text-right">Action Hub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeStack.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No patient visits currently active</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeStack.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-8 py-6">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-700 transition-all shadow-sm">
                            {apt.tokenNumber || '-'}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {apt.patientName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{apt.patientName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{apt.complaint || 'General Visit'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                            {apt.time}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={apt.status} />
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => handleOpenCase(apt)}
                            disabled={!['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED'].includes(apt.status)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ml-auto ${['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED'].includes(apt.status)
                              ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200 hover:shadow-indigo-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                              }`}
                          >
                            Open Case <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
              <button className="text-indigo-600 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                Archived Cases <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Financials */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <IndianRupee className="w-32 h-32 text-emerald-900" />
            </div>

            <div className="relative z-10 space-y-12">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8">
                <IndianRupee className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue Generated</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">₹{financials.revenue.toLocaleString()}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Net Invoiced</p>
              </div>

              <div className="space-y-2 pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Collected</p>
                <h2 className="text-4xl font-black text-emerald-600 tracking-tighter">₹{financials.collected.toLocaleString()}</h2>
              </div>
            </div>

            <div className="relative z-10 pt-12 mt-auto">
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Efficiency</span>
                  <span className="text-lg font-black text-emerald-600">92%</span>
                </div>
                <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
  const colorStyles: Record<string, string> = {
    indigo: 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-200',
    amber: 'bg-white border-slate-200 text-amber-500 hover:border-amber-200',
    emerald: 'bg-white border-slate-200 text-emerald-500 hover:border-emerald-200',
  };

  const bgStyles: Record<string, string> = {
    indigo: 'bg-indigo-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50'
  }

  return (
    <div className={`p-8 rounded-[32px] border shadow-sm transition-all group ${colorStyles[color]} relative overflow-hidden`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgStyles[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 ${bgStyles[color]} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity`}></div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'CHECKED_IN': 'bg-amber-50 text-amber-600 border-amber-100',
    'IN_PROGRESS': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'CONFIRMED': 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels: Record<string, string> = {
    'CHECKED_IN': 'WAITING',
    'IN_PROGRESS': 'CONSULTING',
    'CONFIRMED': 'READY',
  };

  return (
    <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${styles[status] || styles['CONFIRMED']}`}>
      {labels[status] || status}
    </span>
  );
}
