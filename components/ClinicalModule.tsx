
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope, Image as ImageIcon, Pill, FlaskConical, ChevronRight,
  User, ShieldAlert, Sparkles, ClipboardList, PlusCircle, Trash2, Check,
  AlertCircle, Search, Save, Info, ArrowLeft, Camera, CheckCircle2, X,
  Clock, History
} from 'lucide-react';
import DentalChart from './DentalChart';
import { MOCK_PATIENTS, PHARMACY_CATALOG } from '../constants.tsx';
import { useApp } from '../App';
import { ClinicalCase, Prescription, LabOrder, TreatmentItem, RvgImage } from '../types';

type TabType = 'CONSULT' | 'CHART' | 'RVG' | 'PRESCRIPTION' | 'LAB';

export default function ClinicalModule() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { patients, appointments, setAppointments, addInvoice, addClinicalCase, setLastClinicalPatientId } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('CONSULT');
  const [showSummary, setShowSummary] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Remember this patient for the Doctor
  useEffect(() => {
    if (patientId) {
      setLastClinicalPatientId(patientId);
    }
  }, [patientId, setLastClinicalPatientId]);

  // Real Patient state from CRM
  const patient = patients.find(p => p.id === patientId) || MOCK_PATIENTS[0];

  // Preset States with Persistence
  const [complaintPresets, setComplaintPresets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dc_complaint_presets');
    return saved ? JSON.parse(saved) : ['Pain', 'Swelling', 'Cleaning', 'Bleeding', 'Consultation'];
  });

  const [historyPresets, setHistoryPresets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dc_history_presets');
    return saved ? JSON.parse(saved) : ['Diabetes', 'Hypertension', 'Cardiac', 'Asthma', 'None'];
  });

  useEffect(() => {
    localStorage.setItem('dc_complaint_presets', JSON.stringify(complaintPresets));
  }, [complaintPresets]);

  useEffect(() => {
    localStorage.setItem('dc_history_presets', JSON.stringify(historyPresets));
  }, [historyPresets]);

  // Active Consultation State
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase>({
    id: `case-${Date.now()}`,
    patientId: patient.id,
    date: new Date().toISOString(),
    complaint: '',
    medicalHistory: patient.medicalHistory.join(', '),
    dentalHistory: '',
    examination: '',
    advice: '',
    treatments: [],
    prescriptions: [],
    labOrders: [],
    images: []
  });

  const tabs = [
    { id: 'CONSULT', label: 'Consultation', icon: ClipboardList },
    { id: 'CHART', label: 'Dental Chart', icon: Stethoscope },
    { id: 'RVG', label: 'Imaging (RVG)', icon: ImageIcon },
    { id: 'PRESCRIPTION', label: 'Prescriptions', icon: Pill },
    { id: 'LAB', label: 'Lab Orders', icon: FlaskConical },
  ];

  const updateCase = (updates: Partial<ClinicalCase>) => {
    // If updating complaint or history, check for new finalized words to add to presets
    if (updates.complaint !== undefined) {
      // Only process words that are followed by a comma (finalized)
      if (updates.complaint.includes(',')) {
        const parts = updates.complaint.split(',');
        // The last part is currently being typed, so we skip it
        const finalizedWords = parts.slice(0, -1).map(w => w.trim()).filter(w => w.length > 2);

        finalizedWords.forEach(word => {
          if (!complaintPresets.find(p => p.toLowerCase() === word.toLowerCase())) {
            setComplaintPresets(prev => [...prev, word]);
          }
        });
      }
    }

    if (updates.medicalHistory !== undefined) {
      if (updates.medicalHistory.includes(',')) {
        const parts = updates.medicalHistory.split(',');
        const finalizedWords = parts.slice(0, -1).map(w => w.trim()).filter(w => w.length > 2);

        finalizedWords.forEach(word => {
          if (!historyPresets.find(p => p.toLowerCase() === word.toLowerCase())) {
            setHistoryPresets(prev => [...prev, word]);
          }
        });
      }
    }

    setClinicalCase(prev => ({ ...prev, ...updates }));
  };

  const handleFinishConsult = () => {
    setValidationError('');
    setShowSummary(true);
  };

  const handleSyncAndClose = () => {
    // 1. Save Case to Global History
    const finalCase: ClinicalCase = {
      ...clinicalCase,
      date: new Date().toISOString()
    };
    addClinicalCase(finalCase);

    // 2. Generate Invoice if treatments exist
    const billableTreatments = finalCase.treatments.filter(t =>
      t.status === 'IN_PROGRESS' || t.status === 'COMPLETED'
    );

    if (billableTreatments.length > 0) {
      const totalAmount = billableTreatments.reduce((sum, t) => sum + t.cost, 0);
      addInvoice({
        id: `INV-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: 'd1',
        doctorName: 'Dr. Sarah Wilson',
        date: new Date().toISOString().split('T')[0],
        totalAmount,
        discount: 0,
        status: 'DUE',
        items: billableTreatments.map(t => ({
          description: `${t.procedure} (Tooth #${t.toothNumber})`,
          cost: t.cost
        })),
        payments: []
      });
    }

    // 3. Mark Appointment as Completed
    const appointment = appointments.find(a => a.patientId === patient.id && (a.status === 'IN_PROGRESS' || a.status === 'CHECKED_IN'));
    if (appointment) {
      setAppointments(prev => prev.map(a =>
        a.id === appointment.id ? { ...a, status: 'COMPLETED' } : a
      ));
    }

    // 4. Close modal and redirect
    setShowSummary(false);
    navigate('/clinical');
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments
    .filter(a => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!patientId) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Clinical Queue</h1>
            <p className="text-sm text-slate-500 font-medium">Daily patient workflow for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{todaysAppointments.length} Total Patients Today</span>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 italic-rows">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todaysAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No clinical sessions scheduled for today</p>
                  </td>
                </tr>
              ) : (
                todaysAppointments.map((apt, index) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-700 transition-all">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          {apt.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{apt.patientName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{apt.complaint}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-tight">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> {apt.time}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${apt.status === 'CHECKED_IN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        apt.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' :
                          apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                        {apt.status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                        {apt.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => navigate(`/clinical/${apt.patientId}`)}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-700 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-100"
                      >
                        Open Case
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/clinical')}
          className="p-3 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-indigo-100">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1">{patient.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">ID: {patient.id.split('-')[1] || '88492'}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider leading-none flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" /> MEDICAL ALERTS
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-6">
            <div className="text-right">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Last Visit</p>
              <p className="text-xs font-bold text-slate-700">{patient.lastVisit || 'First Visit'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Profile</p>
              <p className="text-xs font-bold text-slate-700">{patient.age || '28'}Y • {patient.gender || 'F'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleFinishConsult}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Finish Consult
        </button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 rounded-[32px] p-6 flex items-start gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-tight mb-1">Validation Required</h3>
            <p className="text-xs text-rose-700 font-medium">{validationError}</p>
          </div>
          <button onClick={() => setValidationError('')} className="text-rose-400 hover:text-rose-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Horizontal Workspace Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === tab.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Modules - Now Full Width */}
      <div className="min-h-[600px] animate-in fade-in duration-500">
        {activeTab === 'CONSULT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ConsultSection
              title="Chief Complaint"
              value={clinicalCase.complaint}
              onChange={(v) => updateCase({ complaint: v })}
              onDeletePreset={(tag: string) => setComplaintPresets(prev => prev.filter(p => p !== tag))}
              placeholder="Reason for visit..."
              icon={ClipboardList}
              presets={complaintPresets}
            />
            <ConsultSection
              title="Medical History"
              value={clinicalCase.medicalHistory}
              onChange={(v) => updateCase({ medicalHistory: v })}
              onDeletePreset={(tag: string) => setHistoryPresets(prev => prev.filter(p => p !== tag))}
              placeholder="Allergies, chronic illness..."
              icon={ShieldAlert}
              presets={historyPresets}
              color="rose"
            />
            <ConsultSection
              title="On-Examination"
              value={clinicalCase.examination}
              onChange={(v) => updateCase({ examination: v })}
              placeholder="Clinical findings (Gingivitis, mobility...)"
              icon={Stethoscope}
            />
            <ConsultSection
              title="Advice & Instructions"
              value={clinicalCase.advice}
              onChange={(v) => updateCase({ advice: v })}
              placeholder="Patient advice..."
              icon={Info}
            />
          </div>
        )}

        {activeTab === 'CHART' && (
          <div className="bg-white p-8 md:p-12 rounded-[56px] border border-slate-200 shadow-sm h-full overflow-y-auto">
            <DentalChart
              treatments={clinicalCase.treatments}
              onTreatmentsChange={(treatments) => updateCase({ treatments })}
            />
          </div>
        )}

        {activeTab === 'RVG' && <ImagingModule images={clinicalCase.images} onAdd={(img) => updateCase({ images: [...clinicalCase.images, img] })} />}

        {activeTab === 'PRESCRIPTION' && (
          <PrescriptionModule
            patientName={patient.name}
            prescriptions={clinicalCase.prescriptions}
            onPrescriptionsChange={(prescriptions) => updateCase({ prescriptions })}
          />
        )}

        {activeTab === 'LAB' && <LabModule patientId={patient.id} />}
      </div>

      {/* Bottom Integrated Case Metrics */}
      <div className="flex flex-col md:flex-row gap-6 mt-12">
        <div className="flex-1 bg-slate-900 px-10 py-10 rounded-[48px] text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                <h3 className="text-base font-black uppercase tracking-[0.2em]">Estimate Summary</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium max-w-md">Estimated billing based on planned dental procedures and active treatment pipeline.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 md:gap-16">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dental Work</p>
                <p className="text-2xl font-black text-white tracking-tight">₹{clinicalCase.treatments.reduce((acc, t) => acc + t.cost, 0)}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pharmacy</p>
                <p className="text-2xl font-black text-white tracking-tight">₹0</p>
              </div>
              <div className="bg-indigo-600/20 px-8 py-3 rounded-3xl border border-indigo-500/30 text-center md:text-right min-w-[200px]">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Estimation</p>
                <p className="text-3xl font-black text-indigo-400 tracking-tighter">₹{clinicalCase.treatments.reduce((acc, t) => acc + t.cost, 0)}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowSummary(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sync Consultation</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Review finalized consultation for {patient.name}</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Findings & Complaint</h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 mb-1">{clinicalCase.complaint || 'No complaint recorded'}</p>
                    <p className="text-xs text-slate-500">{clinicalCase.examination || 'No examination notes.'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Doctor's Advice</h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-medium text-slate-600">{clinicalCase.advice || 'Routine follow-up advised.'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-4">Planned Procedures</h4>
                <div className="space-y-3">
                  {clinicalCase.treatments.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400">No treatments added to this session.</p>
                  ) : (
                    clinicalCase.treatments.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-white rounded border border-slate-200">
                        <span className="font-semibold text-slate-700">{t.procedure}</span>
                        <span className="font-bold text-slate-900 text-xs">₹{t.cost}</span>
                      </div>
                    ))
                  )}
                  {clinicalCase.treatments.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total to Sync</span>
                      <span className="text-lg font-bold text-indigo-600">₹{clinicalCase.treatments.reduce((sum, t) => sum + t.cost, 0)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSyncAndClose}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sync & Close Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ConsultSection = ({ title, value, onChange, onDeletePreset, placeholder, icon: Icon, presets, color = 'indigo' }: any) => {
  const colorMap: any = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[0]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">{title}</h3>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 transition-all resize-none"
        placeholder={placeholder}
      />
      {presets && (
        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((tag: string) => (
            <div
              key={tag}
              className="flex items-center bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500 hover:border-indigo-400 transition-all overflow-hidden"
            >
              <button
                onClick={() => onChange(value ? `${value}, ${tag}` : tag)}
                className="px-2.5 py-1 hover:text-indigo-600 border-r border-slate-100"
              >
                + {tag}
              </button>
              <button
                onClick={() => onDeletePreset && onDeletePreset(tag)}
                className="px-2 py-1 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ImagingModule = ({ images, onAdd }: { images: RvgImage[], onAdd: (img: RvgImage) => void }) => {
  const handleAddImage = () => {
    onAdd({
      id: `img-${Date.now()}`,
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      notes: 'New RVG scan added.',
      date: 'Today',
      tooth: '#14'
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">RVG Diagnostics</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Patient clinical imaging history</p>
        </div>
        <button
          onClick={handleAddImage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <Camera className="w-4 h-4" /> Import Scan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
        <div
          onClick={handleAddImage}
          className="bg-slate-50/50 p-10 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
        >
          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform mb-4 shadow-sm">
            <PlusCircle className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Upload New Image</p>
        </div>
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
            <div className="aspect-video bg-slate-900 flex items-center justify-center overflow-hidden relative">
              <img src={img.url} className="opacity-80 group-hover:scale-105 transition-all duration-700 w-full h-full object-cover" alt="X-Ray" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-1 rounded text-[10px] font-bold shadow-sm">T {img.tooth}</div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{img.date}</span>
                <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Search className="w-4 h-4" /></button>
              </div>
              <p className="text-xs font-medium text-slate-600 line-clamp-2">{img.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrescriptionModule = ({
  patientName,
  prescriptions: externalPrescriptions = [],
  onPrescriptionsChange
}: {
  patientName: string;
  prescriptions?: any[];
  onPrescriptionsChange?: (prescriptions: any[]) => void;
}) => {
  const [meds, setMeds] = useState(externalPrescriptions.length > 0 ? externalPrescriptions : PHARMACY_CATALOG.slice(0, 2));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dose: '1-0-1', dur: '5 Days' });

  // Sync with external prescriptions
  React.useEffect(() => {
    if (externalPrescriptions && externalPrescriptions.length > 0) {
      setMeds(externalPrescriptions);
    }
  }, [externalPrescriptions]);

  // Notify parent when meds change
  const updateMeds = (newMeds: any[]) => {
    setMeds(newMeds);
    if (onPrescriptionsChange) {
      onPrescriptionsChange(newMeds);
    }
  };

  const addCustomMed = () => {
    if (!newMed.name) return;
    const newMedItem = { id: Date.now().toString(), name: newMed.name, dosage: newMed.dose, freq: newMed.dose, price: 15 };
    updateMeds([...meds, newMedItem]);
    setNewMed({ name: '', dose: '1-0-1', dur: '5 Days' });
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div>
          <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-sm">e-Prescription</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">Generating prescription for {patientName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Add Med
        </button>
      </div>

      {showAddForm && (
        <div className="p-6 bg-indigo-50/50 border-b border-indigo-100 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase mb-2 ml-1">Medication Name</p>
              <input
                placeholder="Medicine..."
                className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold shadow-sm outline-none"
                value={newMed.name}
                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase mb-2 ml-1">Dosage Flow</p>
              <select className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold shadow-sm outline-none">
                <option>1-0-1 (AM/PM)</option>
                <option>1-1-1 (TDS)</option>
                <option>1-0-0 (OD)</option>
                <option>0-0-1 (HS)</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase mb-2 ml-1">Duration</p>
              <input value={newMed.dur} onChange={e => setNewMed({ ...newMed, dur: e.target.value })} className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold shadow-sm outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={addCustomMed} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-100">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-3 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
              <th className="px-6 py-4">Medicine Detail</th>
              <th className="px-6 py-4">Frequency</th>
              <th className="px-6 py-4">Instruction</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {meds.map((med: any) => (
              <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-800">{med.name}</div>
                  <div className="text-[10px] font-medium text-slate-400 mt-0.5">Standard formulation</div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600 font-semibold">{med.freq || med.dosage}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> After Food
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => updateMeds(meds.filter(m => m.id !== med.id))}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition-all">
          Preview PDF
        </button>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Authorize & Send
        </button>
      </div>
    </div>
  );
};

const LabModule = ({ patientId }: { patientId: string }) => {
  const { labOrders, addLabOrder, currentUser, patients } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    workType: '',
    dueDate: '',
    notes: '',
    cost: 0
  });

  const patient = patients.find(p => p.id === patientId);

  const handleAddOrder = () => {
    if (!newOrder.workType || !newOrder.dueDate || !patient) return;

    const order: any = {
      id: `LO-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      workType: newOrder.workType,
      status: 'PENDING_ASSIGNMENT',
      dueDate: newOrder.dueDate,
      cost: Number(newOrder.cost),
      date: new Date().toISOString().split('T')[0],
      notes: newOrder.notes,
      paymentStatus: 'UNPAID'
    };

    addLabOrder(order);
    setShowAddForm(false);
    setNewOrder({ workType: '', dueDate: '', notes: '', cost: 0 });
  };

  const patientOrders = labOrders.filter(lo => lo.patientId === patientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Lab Requests</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">Manage external laboratory work for this patient</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> New Lab Order
        </button>
      </div>

      {showAddForm && (
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Work Type</label>
              <input
                type="text"
                placeholder="e.g., Zirconia Crown"
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newOrder.workType}
                onChange={e => setNewOrder({ ...newOrder, workType: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Expected Due Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newOrder.dueDate}
                onChange={e => setNewOrder({ ...newOrder, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Est. Cost (₹)</label>
              <input
                type="number"
                placeholder="500"
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newOrder.cost}
                onChange={e => setNewOrder({ ...newOrder, cost: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddOrder}
                className="flex-1 bg-indigo-600 text-white h-[38px] rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Create Order
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-colors h-[38px] w-[38px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Doctor Instructions</label>
            <textarea
              placeholder="Shade A2, specific measurements..."
              className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
              value={newOrder.notes}
              onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patientOrders.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
              <FlaskConical className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">No lab orders yet</p>
            <p className="text-[10px] font-medium text-slate-400 mt-2">Create a new lab request to start tracking</p>
          </div>
        ) : (
          patientOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    order.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                  {order.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due: {order.dueDate}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{order.workType}</h4>
              <p className="text-xs text-slate-500 font-medium mb-4">{order.notes || 'No specific instructions provided.'}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {order.vendorName?.charAt(0) || '?'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                    {order.vendorName || 'Not Assigned'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Est. Cost</p>
                  <p className="text-sm font-black text-slate-900 leading-none">₹{order.cost}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
