import React, { useState, useEffect } from 'react';
import { PROCEDURE_CATALOG } from '../constants.tsx';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { TreatmentItem } from '../types';

// --- Realistic Tooth SVG Components ---
const MolarSVG = ({ isSelected }: { isSelected: boolean }) => (
  <svg viewBox="0 0 100 120" className={`w-full h-full transition-all duration-500 ${isSelected ? 'drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]' : ''}`}>
    <path
      d="M20,30 Q25,10 50,10 Q75,10 80,30 Q85,50 80,80 Q75,110 60,110 Q50,110 40,110 Q25,110 20,80 Q15,50 20,30"
      fill={isSelected ? '#14b8a6' : '#f8fafc'}
      stroke={isSelected ? '#0f766e' : '#e2e8f0'}
      strokeWidth="2.5"
    />
    <path d="M35,45 Q50,35 65,45" fill="none" stroke={isSelected ? '#fff' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,2" />
    <path d="M50,45 V85" fill="none" stroke={isSelected ? '#fff' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,2" />
  </svg>
);

const PremolarSVG = ({ isSelected }: { isSelected: boolean }) => (
  <svg viewBox="0 0 80 120" className={`w-full h-full transition-all duration-500 ${isSelected ? 'drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]' : ''}`}>
    <path
      d="M15,35 Q20,15 40,15 Q60,15 65,35 Q70,55 65,85 Q60,115 40,115 Q20,115 15,85 Q10,55 15,35"
      fill={isSelected ? '#14b8a6' : '#f8fafc'}
      stroke={isSelected ? '#0f766e' : '#e2e8f0'}
      strokeWidth="2.5"
    />
    <path d="M30,45 Q40,38 50,45" fill="none" stroke={isSelected ? '#fff' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,2" />
  </svg>
);

const CanineSVG = ({ isSelected }: { isSelected: boolean }) => (
  <svg viewBox="0 0 70 130" className={`w-full h-full transition-all duration-500 ${isSelected ? 'drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]' : ''}`}>
    <path
      d="M10,45 L35,10 L60,45 Q65,75 60,105 Q55,130 35,130 Q15,130 10,105 Q5,75 10,45"
      fill={isSelected ? '#14b8a6' : '#f8fafc'}
      stroke={isSelected ? '#0f766e' : '#e2e8f0'}
      strokeWidth="2.5"
    />
  </svg>
);

const IncisorSVG = ({ isSelected }: { isSelected: boolean }) => (
  <svg viewBox="0 0 70 130" className={`w-full h-full transition-all duration-500 ${isSelected ? 'drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]' : ''}`}>
    <path
      d="M10,15 L60,15 L60,50 Q60,90 45,115 Q35,130 35,130 Q35,130 25,115 Q10,90 10,50 Z"
      fill={isSelected ? '#14b8a6' : '#f8fafc'}
      stroke={isSelected ? '#0f766e' : '#e2e8f0'}
      strokeWidth="2.5"
    />
  </svg>
);

// --- FDI Numbering Sets ---
const ADULT_UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const ADULT_UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];
const ADULT_LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];
const ADULT_LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

const PEDO_UPPER_RIGHT = ['55', '54', '53', '52', '51'];
const PEDO_UPPER_LEFT = ['61', '62', '63', '64', '65'];
const PEDO_LOWER_LEFT = ['71', '72', '73', '74', '75'];
const PEDO_LOWER_RIGHT = ['85', '84', '83', '82', '81'];

const getToothType = (num: string) => {
  const n = parseInt(num);
  const lastDigit = n % 10;
  if (lastDigit >= 6) return 'MOLAR';
  if (lastDigit >= 4 && n < 50) return 'PREMOLAR'; // Pedo teeth 4-5 are molars but we keep simple
  if (lastDigit === 3) return 'CANINE';
  if (lastDigit >= 4 && n >= 50) return 'MOLAR'; // Pedo 54, 55 etc
  return 'INCISOR';
};

const ToothIcon = ({ num, isSelected }: { num: string; isSelected: boolean }) => {
  const type = getToothType(num);
  switch (type) {
    case 'MOLAR': return <MolarSVG isSelected={isSelected} />;
    case 'PREMOLAR': return <PremolarSVG isSelected={isSelected} />;
    case 'CANINE': return <CanineSVG isSelected={isSelected} />;
    default: return <IncisorSVG isSelected={isSelected} />;
  }
};

const ToothComponent = ({ num, isSelected, onClick, position, mode }: any) => {
  const isAdult = mode === 'ADULT' || mode === 'MIXED';
  return (
    <div className="flex flex-col items-center gap-2">
      {position === 'upper' && (
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] md:text-[11px] font-black transition-all ${isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-200 scale-110' : 'bg-slate-50 text-slate-400'
          }`}>
          {num}
        </div>
      )}
      <button
        onClick={onClick}
        className={`${isAdult ? 'w-10 h-20 md:w-12 md:h-24' : 'w-12 h-24 md:w-14 md:h-28'} p-1 md:p-2 transition-all duration-500 hover:scale-110 active:scale-95 ${isSelected ? '-translate-y-2' : ''
          }`}
      >
        <ToothIcon num={num} isSelected={isSelected} />
      </button>
      {position === 'lower' && (
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] md:text-[11px] font-black transition-all ${isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-200 scale-110' : 'bg-slate-50 text-slate-400'
          }`}>
          {num}
        </div>
      )}
    </div>
  );
};

const StageColumn = ({ title, items, onMove, nextStage, color, isFinal }: any) => {
  const isIndigo = color === 'indigo';
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className={`flex items-center justify-between px-6 py-4 rounded-3xl border transition-all ${isIndigo ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl shadow-indigo-100' : 'bg-white border-slate-200 text-slate-400 shadow-sm'
        }`}>
        <span className="text-[10px] font-black uppercase tracking-[0.25em]">{title}</span>
        <div className={`flex items-center justify-center min-w-[24px] h-6 rounded-lg px-1.5 text-[10px] font-black ${isIndigo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
          {items.length}
        </div>
      </div>
      <div className="flex-1 space-y-4 min-h-[150px]">
        {items.length === 0 ? (
          <div className="h-full border-2 border-dashed border-slate-100 rounded-[40px] flex items-center justify-center p-12 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">No items</p>
          </div>
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">TOOTH #{item.toothNumber}</div>
                <div className="text-sm font-black text-slate-900 tracking-tight">₹{item.cost}</div>
              </div>
              <div className="text-sm font-black text-slate-800 mb-1 relative z-10 uppercase tracking-tight">{item.procedure}</div>
              <div className="text-[10px] text-slate-400 font-bold mb-6 relative z-10 uppercase tracking-tighter">{item.notes || 'Routine care'}</div>
              {!isFinal && onMove && (
                <button
                  onClick={() => onMove(item.id)}
                  className="w-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-sm relative z-10"
                >
                  {nextStage} <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              )}
              {isFinal && (
                <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest relative z-10">
                  <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div> Validated
                </div>
              )}
              <div className={`absolute -bottom-10 -right-10 w-24 h-24 bg-${color}-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface DentalChartProps {
  treatments?: TreatmentItem[];
  onTreatmentsChange?: (treatments: TreatmentItem[]) => void;
}

export default function DentalChart({ treatments: externalTreatments, onTreatmentsChange }: DentalChartProps = {}) {
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<TreatmentItem[]>(externalTreatments || []);
  const [diagnosis, setDiagnosis] = useState('');
  const [chartMode, setChartMode] = useState<'ADULT' | 'PEDO' | 'MIXED'>('ADULT');
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  useEffect(() => {
    if (externalTreatments) {
      setTreatments(externalTreatments);
    }
  }, [externalTreatments]);

  const updateTreatments = (newTreatments: TreatmentItem[]) => {
    setTreatments(newTreatments);
    if (onTreatmentsChange) {
      onTreatmentsChange(newTreatments);
    }
  };

  const toggleTooth = (num: string) => {
    setSelectedTeeth(prev => {
      if (isMultiSelect) {
        return prev.includes(num) ? prev.filter(t => t !== num) : [...prev, num];
      }
      return prev.includes(num) ? [] : [num];
    });
  };

  const addProcedure = (procedureName: string) => {
    if (selectedTeeth.length === 0 || !procedureName) return;
    const catalogItem = PROCEDURE_CATALOG.find(p => p.name === procedureName) || PROCEDURE_CATALOG[0];
    const newItems = selectedTeeth.map(tooth => ({
      id: `t-${Date.now()}-${Math.random()}`,
      toothNumber: tooth,
      procedure: catalogItem.name,
      cost: catalogItem.cost,
      status: 'PLANNED' as const,
      date: new Date().toLocaleDateString(),
      notes: diagnosis
    }));
    updateTreatments([...treatments, ...newItems]);
    setDiagnosis('');
    setSelectedTeeth([]);
  };

  const updateStatus = (id: string, status: TreatmentItem['status']) => {
    updateTreatments(treatments.map(t => t.id === id ? { ...t, status } : t));
  };

  const getStageTreatments = (status: TreatmentItem['status']) => treatments.filter(t => t.status === status);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
        <div className="flex bg-slate-100 p-1.5 rounded-3xl gap-1">
          {(['ADULT', 'PEDO', 'MIXED'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setChartMode(mode); setSelectedTeeth([]); }}
              className={`px-10 py-3 rounded-2xl text-xs font-black transition-all ${chartMode === mode ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 bg-white border border-slate-200 px-8 py-3 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Multi-select</span>
          <button
            onClick={() => setIsMultiSelect(!isMultiSelect)}
            className={`w-14 h-7 rounded-full transition-all relative ${isMultiSelect ? 'bg-teal-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isMultiSelect ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[48px] border border-slate-100 shadow-sm overflow-x-auto relative">
        <div className="min-w-max space-y-16 md:space-y-24 py-8">
          {/* Upper Arch */}
          <div className="flex justify-center items-end gap-1 relative px-4">
            <div className={`flex ${chartMode === 'PEDO' ? 'gap-2 md:gap-4 mr-4 md:mr-10' : 'gap-1 md:gap-1.5 mr-2 md:mr-6'}`}>
              {(chartMode === 'PEDO' ? PEDO_UPPER_RIGHT : ADULT_UPPER_RIGHT).map(num => (
                <ToothComponent key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={() => toggleTooth(num)} position="upper" mode={chartMode} />
              ))}
            </div>
            <div className="w-[1px] h-32 md:h-48 bg-slate-100 dashed-border" />
            <div className={`flex ${chartMode === 'PEDO' ? 'gap-2 md:gap-4 ml-4 md:ml-10' : 'gap-1 md:gap-1.5 ml-2 md:mr-6'}`}>
              {(chartMode === 'PEDO' ? PEDO_UPPER_LEFT : ADULT_UPPER_LEFT).map(num => (
                <ToothComponent key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={() => toggleTooth(num)} position="upper" mode={chartMode} />
              ))}
            </div>
          </div>
          {/* Lower Arch */}
          <div className="flex justify-center items-start gap-1 relative px-4">
            <div className={`flex ${chartMode === 'PEDO' ? 'gap-2 md:gap-4 mr-4 md:mr-10' : 'gap-1 md:gap-1.5 mr-2 md:mr-6'}`}>
              {(chartMode === 'PEDO' ? PEDO_LOWER_RIGHT : ADULT_LOWER_RIGHT).map(num => (
                <ToothComponent key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={() => toggleTooth(num)} position="lower" mode={chartMode} />
              ))}
            </div>
            <div className="w-[1px] h-32 md:h-48 bg-slate-100 dashed-border" />
            <div className={`flex ${chartMode === 'PEDO' ? 'gap-2 md:gap-4 ml-4 md:ml-10' : 'gap-1 md:gap-1.5 ml-2 md:mr-6'}`}>
              {(chartMode === 'PEDO' ? PEDO_LOWER_LEFT : ADULT_LOWER_LEFT).map(num => (
                <ToothComponent key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={() => toggleTooth(num)} position="lower" mode={chartMode} />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.35em] shadow-2xl z-20 border-[4px] border-white">
          MIDLINE
        </div>
      </div>

      {selectedTeeth.length > 0 && (
        <div className="bg-white p-8 md:p-12 rounded-[48px] border border-indigo-100 shadow-2xl shadow-indigo-100/20 animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">Treatment Planning</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-3 py-1 bg-slate-50 inline-block rounded-full">Teeth: {selectedTeeth.sort().join(', ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observation / Diagnosis</label>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-300 shadow-sm" placeholder="e.g., Deep occlusal caries..." />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Planned Procedure</label>
              <select onChange={(e) => addProcedure(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer appearance-none shadow-sm capitalize">
                <option value="">Choose procedure...</option>
                {PROCEDURE_CATALOG.map(p => <option key={p.id} value={p.name}>{p.name} - ₹{p.cost}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setSelectedTeeth([])} className="w-full bg-slate-900 text-white py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-[0.2em]">Treatment Pipeline</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StageColumn title="Proposed" items={getStageTreatments('PLANNED')} onMove={(id) => updateStatus(id, 'IN_PROGRESS')} nextStage="Start" color="slate" />
          <StageColumn title="Active Work" items={getStageTreatments('IN_PROGRESS')} onMove={(id) => updateStatus(id, 'COMPLETED')} nextStage="Complete" color="indigo" />
          <StageColumn title="Finalized" items={getStageTreatments('COMPLETED')} onMove={null} nextStage="" color="emerald" isFinal />
        </div>
      </div>
    </div>
  );
}
