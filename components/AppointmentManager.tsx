
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, ChevronLeft, ChevronRight, MoreVertical,
  CheckCircle2, Clock, XCircle, MessageSquare, Phone, User, X, Check,
  Calendar as CalendarIcon, Bell, Smartphone, Mail, AlertCircle, RefreshCcw
} from 'lucide-react';
import { MOCK_DOCTORS } from '../constants.tsx';
import { Patient, Appointment } from '../types';
import { useApp } from '../App';

type ViewMode = 'UPCOMING' | 'WAITING' | 'COMPLETED' | 'RECALL' | 'CALENDAR';

export default function AppointmentManager() {
  const { patients, addPatient, appointments, setAppointments, createAppointmentWithSync, updateAppointment, isSettingsComplete, currentUser, setPatientRecall } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'CUSTOM' | 'ALL'>('ALL');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [foundPatients, setFoundPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [complaint, setComplaint] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(MOCK_DOCTORS[0].id);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [patientGender, setPatientGender] = useState<'M' | 'F' | 'O' | ''>('');

  const [notifPrefs, setNotifPrefs] = useState({ whatsapp: true, sms: true, email: false });
  const [showToast, setShowToast] = useState(false);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showRescheduleToast, setShowRescheduleToast] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Recall Modal state
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallAppointment, setRecallAppointment] = useState<Appointment | null>(null);
  const [recallDateValue, setRecallDateValue] = useState('');

  // Derived Data
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    // Global Search
    if (searchQuery) {
      list = list.filter(a =>
        a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patients.find(p => p.id === a.patientId)?.phone.includes(searchQuery)
      );
    }

    // Doctor Filter
    if (filterDoctorId !== 'ALL') {
      list = list.filter(a => a.doctorId === filterDoctorId);
    }

    // Date Range Filter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (dateRangeFilter === 'TODAY') {
      list = list.filter(a => a.date === todayStr);
    } else if (dateRangeFilter === 'YESTERDAY') {
      list = list.filter(a => a.date === yesterdayStr);
    } else if (dateRangeFilter === 'THIS_MONTH') {
      list = list.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateRangeFilter === 'CUSTOM') {
      list = list.filter(a => a.date === customDate);
    }

    // View specific logic
    switch (viewMode) {
      case 'UPCOMING':
        // If a specific date filter is active, show everything for that day (Daily Ledger View)
        if (dateRangeFilter !== 'ALL') {
          return list.filter(a => a.status !== 'CANCELLED');
        }
        return list.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
      case 'WAITING':
        return list.filter(a => a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS');
      case 'COMPLETED':
        return list.filter(a => a.status === 'COMPLETED');
      case 'RECALL':
        // Simplified recall logic: any pending appointment is a potential follow-up call
        return list.filter(a => a.status === 'PENDING' || a.called === false);
      default:
      // No change
    }

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, viewMode, searchQuery, patients, filterDoctorId, dateRangeFilter]);

  const handleSearchPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchPhone(val);
    if (val.length >= 3) {
      const matches = patients.filter(p => p.phone.includes(val));
      setFoundPatients(matches);
    } else {
      setFoundPatients([]);
    }
  };

  const handleSaveAppointment = () => {
    let finalPatient = selectedPatient;

    if (!finalPatient && newPatientName) {
      const newP: Patient = {
        id: `p-${Date.now()}`,
        name: newPatientName,
        phone: searchPhone,
        gender: patientGender as 'M' | 'F' | 'O' || 'O',
        medicalHistory: [],
        visitCount: 1,
        status: 'ACTIVE',
        lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      addPatient(newP);
      finalPatient = newP;
    }

    if (finalPatient) {
      const doc = MOCK_DOCTORS.find(d => d.id === selectedDoctorId);

      // Calculate Token Number for the specific date
      const appointmentsOnDate = appointments.filter(a => a.date === appointmentDate);
      const nextToken = appointmentsOnDate.length + 1;

      const newApt: Appointment = {
        id: `a-${Date.now()}`,
        tokenNumber: nextToken,
        patientId: finalPatient.id,
        patientName: finalPatient.name,
        doctorId: selectedDoctorId,
        doctorName: doc?.name || 'Unknown',
        time: appointmentTime,
        date: appointmentDate,
        duration: '30 min',
        status: 'PENDING',
        complaint: complaint || 'General Checkup',
        notifications: { ...notifPrefs },
        called: false
      };
      // Use workflow helper to sync with CRM automatically
      createAppointmentWithSync(newApt);

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        closeDrawer();
      }, 2000);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSearchPhone('');
    setFoundPatients([]);
    setSelectedPatient(null);
    setNewPatientName('');
    setPatientGender('');
    setComplaint('');
  };

  // Reschedule Functions
  const canReschedule = (appointment: Appointment) => {
    // Role check
    if (!['ADMIN', 'RECEPTIONIST'].includes(currentUser.role)) return false;

    // Status check - cannot reschedule completed, cancelled, or checked-in appointments
    if (['COMPLETED', 'CANCELLED', 'CHECKED_IN'].includes(appointment.status)) return false;

    return true;
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate(appointment.date);
    setRescheduleTime(appointment.time);
    setRescheduleReason('');
    setShowRescheduleModal(true);
    setActiveDropdown(null);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) return;

    const updatedAppointment: Appointment = {
      ...rescheduleAppointment,
      date: rescheduleDate,
      time: rescheduleTime,
      rescheduled: true,
      lastUpdated: new Date().toISOString(),
      rescheduleReason: rescheduleReason || undefined,
      // Keep status as CONFIRMED if it was PENDING or CONFIRMED
      status: ['PENDING', 'CONFIRMED'].includes(rescheduleAppointment.status) ? 'CONFIRMED' : rescheduleAppointment.status
    };

    updateAppointment(updatedAppointment);
    setShowRescheduleModal(false);
    setShowRescheduleToast(true);
    setTimeout(() => setShowRescheduleToast(false), 4000);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleAppointment(null);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleReason('');
  };

  // Existing functions
  const updateStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const toggleCalled = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, called: !a.called } : a));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-6 z-50 border border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest">Notification Sent!</p>
            <p className="text-[10px] text-slate-400 font-bold">Patient alerted via {notifPrefs.whatsapp ? 'WhatsApp' : ''} {notifPrefs.sms ? 'SMS' : ''}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your clinic schedule and patient flow</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor Filter */}
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="bg-white border border-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Doctors</option>
            {MOCK_DOCTORS.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>

          {/* Date Range Quick Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['ALL', 'TODAY', 'YESTERDAY', 'THIS_MONTH', 'CUSTOM'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateRangeFilter(mode)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${dateRangeFilter === mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
            {dateRangeFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="ml-2 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none text-indigo-600"
              />
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            disabled={!isSettingsComplete()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Settings Validation Warning */}
      {!isSettingsComplete() && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-900 mb-1">Setup Required</h3>
            <p className="text-sm text-amber-700">Please complete clinic setup in Settings before creating appointments.</p>
          </div>
        </div>
      )}

      {/* Main App Navigation */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 space-y-2">
          <TabButton active={viewMode === 'UPCOMING'} onClick={() => setViewMode('UPCOMING')} icon={Clock} label="Schedule" count={appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length} />
          <TabButton active={viewMode === 'WAITING'} onClick={() => setViewMode('WAITING')} icon={ActivityIcon} label="Check-In" count={appointments.filter(a => a.status === 'CHECKED_IN').length} color="amber" />
          <TabButton active={viewMode === 'COMPLETED'} onClick={() => setViewMode('COMPLETED')} icon={CheckCircle2} label="Completed" />
          <TabButton active={viewMode === 'RECALL'} onClick={() => setViewMode('RECALL')} icon={RefreshCcw} label="Recalls" count={appointments.filter(a => a.status === 'PENDING' && !a.called).length} color="rose" />
          <TabButton active={viewMode === 'CALENDAR'} onClick={() => setViewMode('CALENDAR')} icon={CalendarIcon} label="Calendar" />
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-4">
          {viewMode === 'CALENDAR' ? (
            <div className="bg-white p-6 md:p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
              <CalendarIcon className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Practice Calendar</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">Visual scheduler for monthly and weekly overview is being initialized...</p>
              <div className="mt-8 grid grid-cols-7 gap-2 max-w-lg mx-auto opacity-40">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-300">{i + 1}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 italic-rows">
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No matching records found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map(apt => (
                        <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-700 transition-all">
                              {(() => {
                                const dailyAppointments = appointments
                                  .filter(a => a.date === apt.date)
                                  .sort((a, b) => a.time.localeCompare(b.time));
                                return dailyAppointments.findIndex(a => a.id === apt.id) + 1 || '-';
                              })()}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {apt.patientName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{apt.patientName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{apt.complaint}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-tight">
                                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                                {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ {apt.time}
                                {apt.rescheduled && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[8px] font-black uppercase tracking-widest ml-2">
                                    Rescheduled
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{apt.doctorName}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={apt.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {viewMode === 'RECALL' && (
                                <button
                                  onClick={() => {
                                    toggleCalled(apt.id);
                                    setRecallAppointment(apt);
                                    setRecallDateValue(new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]);
                                    setShowRecallModal(true);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${apt.called ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
                                >
                                  {apt.called ? 'Called' : 'Mark as Called'}
                                </button>
                              )}

                              {apt.status === 'PENDING' && (
                                <button onClick={() => updateStatus(apt.id, 'CONFIRMED')} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {['CONFIRMED', 'PENDING'].includes(apt.status) && (
                                <button onClick={() => updateStatus(apt.id, 'CHECKED_IN')} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all" title="Check-in">
                                  <User className="w-4 h-4" />
                                </button>
                              )}

                              {/* Actions Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setActiveDropdown(activeDropdown === apt.id ? null : apt.id)}
                                  className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeDropdown === apt.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setActiveDropdown(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                      {canReschedule(apt) && (
                                        <button
                                          onClick={() => handleRescheduleClick(apt)}
                                          className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                                        >
                                          <RefreshCcw className="w-4 h-4" />
                                          Reschedule
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setRecallAppointment(apt);
                                          setRecallDateValue(new Date().toISOString().split('T')[0]);
                                          setShowRecallModal(true);
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-3"
                                      >
                                        <RefreshCcw className="w-4 h-4 text-rose-500" />
                                        Mark as Recall
                                      </button>
                                      <button
                                        onClick={() => {
                                          updateStatus(apt.id, 'CANCELLED');
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-3"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Cancel Appointment
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recall Scheduling Modal */}
      {showRecallModal && recallAppointment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowRecallModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Schedule Recall</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Patient: {recallAppointment.patientName}</p>
              </div>
              <button onClick={() => setShowRecallModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCcw className="w-3 h-3 text-rose-500" /> Quick Intervals
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'After 7 Days', days: 7 },
                    { label: 'After 15 Days', days: 15 },
                    { label: 'Next Month', days: 30 },
                    { label: '3 Months', days: 90 },
                    { label: '6 Months', days: 180 },
                    { label: '1 Year', days: 365 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + preset.days);
                        setRecallDateValue(d.toISOString().split('T')[0]);
                      }}
                      className="px-4 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all uppercase tracking-wide text-center"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Recall Date</label>
                <input
                  type="date"
                  value={recallDateValue}
                  onChange={(e) => setRecallDateValue(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                />
              </div>

              <button
                onClick={() => {
                  setPatientRecall(recallAppointment.patientId, recallDateValue);
                  setShowRecallModal(false);
                  setRecallAppointment(null);
                }}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
              >
                Set Recall Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Creation Drawer */}
      {
        isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeDrawer} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Book Appointment</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 1 of 2: Patient & Schedule</p>
                </div>
                <button onClick={closeDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Patient Finder */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Find or Register Patient</label>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number..."
                      value={searchPhone}
                      onChange={handleSearchPhone}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  {foundPatients.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-2 tracking-widest">Matching Patients ({foundPatients.length})</p>
                      {foundPatients.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setNewPatientName(''); }}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${selectedPatient?.id === p.id ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-300'}`}
                        >
                          <div>
                            <p className="text-sm font-black">{p.name}</p>
                            <p className={`text-[10px] font-bold ${selectedPatient?.id === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>Visits: {p.visitCount} • {p.phone}</p>
                          </div>
                          {selectedPatient?.id === p.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchPhone.length >= 10 && foundPatients.length === 0 && (
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 animate-in zoom-in-95">
                      <div className="flex items-center gap-2 mb-4 text-emerald-700">
                        <User className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">New Patient Detected</p>
                      </div>
                      <div className="space-y-4">
                        <input
                          placeholder="Patient Full Name..."
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="grid grid-cols-1 gap-2">
                          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 ml-1 tracking-widest">Select Gender</p>
                          <div className="flex gap-2">
                            {[
                              { id: 'M', label: 'Male' },
                              { id: 'F', label: 'Female' },
                              { id: 'O', label: 'Others' }
                            ].map((g) => (
                              <button
                                key={g.id}
                                onClick={() => setPatientGender(g.id as any)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${patientGender === g.id ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Schedule Details */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Schedule</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Assigned Doctor</p>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      >
                        {MOCK_DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Appointment Date</p>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Time Slot</p>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      >
                        {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '17:00', '18:00', '19:00'].map(t => (
                          <option key={t} value={t}>{t} AM/PM</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Visit Type</p>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                        <option>Consultation (30m)</option>
                        <option>Follow-up (15m)</option>
                        <option>Procedure (1h)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Primary Complaint</p>
                    <input
                      placeholder="e.g., Tooth Sensitivity, Scaling..."
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                    />
                  </div>
                </section>

                {/* Notification Simulations */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Automated Notifications</label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <NotifToggle active={notifPrefs.whatsapp} onClick={() => setNotifPrefs({ ...notifPrefs, whatsapp: !notifPrefs.whatsapp })} icon={MessageSquare} label="WhatsApp" color="emerald" />
                    <NotifToggle active={notifPrefs.sms} onClick={() => setNotifPrefs({ ...notifPrefs, sms: !notifPrefs.sms })} icon={Smartphone} label="SMS" color="indigo" />
                    <NotifToggle active={notifPrefs.email} onClick={() => setNotifPrefs({ ...notifPrefs, email: !notifPrefs.email })} icon={Mail} label="Email" color="slate" />
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-tight leading-normal">Creating an appointment will auto-sync with the Patient CRM for unified tracking.</p>
                </div>
                <button
                  disabled={!selectedPatient && !newPatientName}
                  onClick={handleSaveAppointment}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Confirm & Alert Patient
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeRescheduleModal} />
          <div className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reschedule Appointment</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Update date & time</p>
              </div>
              <button onClick={closeRescheduleModal} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Patient Info */}
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                    {rescheduleAppointment.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{rescheduleAppointment.patientName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dr. {rescheduleAppointment.doctorName}</p>
                  </div>
                </div>
              </div>

              {/* Current Appointment */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase">
                <span className="text-slate-400">Current:</span>
                <span className="text-slate-700">{rescheduleAppointment.date} @ {rescheduleAppointment.time}</span>
              </div>

              {/* New Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
              </div>

              {/* Duration (Read-only) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Duration</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500">
                  {rescheduleAppointment.duration || '30 min'}
                </div>
              </div>

              {/* Reason (Optional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Reason (Optional)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g., Patient requested different time"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none h-24"
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4 flex-shrink-0">
              <button
                onClick={closeRescheduleModal}
                className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!rescheduleDate || !rescheduleTime}
                className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Success Toast */}
      {showRescheduleToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-6 z-50 border border-white/10">
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
            <RefreshCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Appointment Rescheduled</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification sent via WhatsApp & SMS</p>
          </div>
        </div>
      )}
    </div >
  );
}

const TabButton = ({ label, icon: Icon, active, count, onClick, color = 'indigo' }: any) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
        : 'text-slate-600 hover:bg-slate-50'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
          {count}
        </span>
      )}
    </button>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    CHECKED_IN: 'bg-purple-50 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const NotifToggle = ({ active, onClick, icon: Icon, label, color }: any) => {
  const activeColorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-500 text-emerald-600',
    indigo: 'bg-indigo-50 border-indigo-500 text-indigo-600',
    slate: 'bg-slate-50 border-slate-900 text-slate-900'
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${active ? activeColorMap[color] : 'bg-white border-slate-100 text-slate-300'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};
